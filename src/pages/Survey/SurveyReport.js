import { useEffect, useRef, useState } from "react";
import {
  TextField,
  Button,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
} from "@mui/material";
import { styled, emphasize } from "@mui/material/styles";
import Chip from "@mui/material/Chip";
import HomeIcon from "@mui/icons-material/Home";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { GetSurvey, GetSurveyReports, SurveyResponseChangeStatus } from "../../api/survey";
import dayjs from "dayjs";

// Breadcrumb styling (not used but retained)
const StyledBreadcrumb = styled(Chip)(({ theme }) => {
  const backgroundColor =
    theme.palette.mode === "light"
      ? theme.palette.grey[100]
      : theme.palette.grey[800];
  return {
    backgroundColor,
    height: theme.spacing(3),
    color: theme.palette.text.primary,
    fontWeight: theme.typography.fontWeightRegular,
    "&:hover, &:focus": {
      backgroundColor: emphasize(backgroundColor, 0.06),
    },
    "&:active": {
      boxShadow: theme.shadows[1],
      backgroundColor: emphasize(backgroundColor, 0.12),
    },
  };
});

const SurveyReport = () => {
  const [rowData, setRowData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [paginationPageSize] = useState(100);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [survey, setSurvey] = useState({});
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { sid } = useParams();
  const gridRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!sid) {
          showSnackbar("Missing URL parameters", "error");
          return;
        }

        const surveyResponse = await GetSurvey(sid);
        setSurvey(surveyResponse.result.data);

        const reportResponse = await GetSurveyReports(sid);
        if (!reportResponse?.errors) {
          setRowData(reportResponse.result.data);
        } else {
          showSnackbar("Error fetching survey reports", "error");
        }
      } catch (error) {
        console.error("Error in fetchData:", error);
        showSnackbar("An unexpected error occurred", "error");
      }
    };

    fetchData();
  }, [location.search, sid]);

  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleRecontact = (data) => {
    console.log("Recontact clicked for", data);
    showSnackbar("Recontact initiated", "info");
  };

  const handleOpenStatusModal = (data) => {
    setSelectedRow(data);
    setSelectedStatus(data.status || "");
    setStatusModalOpen(true);
  };

  const handleCloseStatusModal = () => {
    setStatusModalOpen(false);
    setSelectedRow(null);
    setSelectedStatus("");
  };

  const handleStatusChange = async () => {
    if (!selectedRow || !selectedRow.respondentId || !selectedStatus) {
      showSnackbar("Missing respondent ID or status", "error");
      return;
    }

    try {
      const jsondata= {
        id: selectedRow.id,
        status: selectedStatus,
        surveyId: selectedRow.surveyId
      };
      const response = await SurveyResponseChangeStatus(jsondata);
      if (response.errors === null && response.result?.status === 200 && response.result?.data === true) {
        // Update the local row data
        const updatedData = rowData.map((row) =>
          row.id === selectedRow.id
            ? { ...row, status: selectedStatus }
            : row
        );
        setRowData(updatedData);

        showSnackbar("Status updated successfully", "success");
        handleCloseStatusModal();
      } else {
        showSnackbar("Failed to update status", "error");
      }
    } catch (error) {
      console.error("Error updating status", error);
      showSnackbar("Failed to update status", "error");
    }
  };

  const handleExportCSV = () => {
    if (gridRef.current && gridRef.current.api) {
      gridRef.current.api.exportDataAsCsv();
    }
  };

  // Helper formatter for date columns
  const dateValueFormatter = (params) => {
    const val = params?.value;
    if (!val) return "";
    // dayjs can parse ISO strings, SQL datetime strings etc. Fallback safe formatting
    const d = dayjs(val);
    return d.isValid() ? d.format("MMM DD YYYY hh:mm A") : "";
  };

  const columnDefs = [
    {
      headerName: "Sr No",
      valueGetter: "node.rowIndex + 1",
      flex: 0.5,
      minWidth: 80,
    },
    { headerName: "ID", field: "id", hide: true, flex: 1 },
    { headerName: "Respondent Id", field: "respondentId", flex: 1 },
    { headerName: "Survey Name", field: "surveyName", flex: 1 },
    { headerName: "Survey Id", field: "surveyId", hide:true},
    {
      headerName: "Created Date",
      field: "createdDate",
      flex: 1,
      valueFormatter: dateValueFormatter,
      sortable: true,
      sort: "desc"
    },
    {
      headerName: "Completed Date",
      field: "completedDate",
      flex: 1,
      valueFormatter: dateValueFormatter,
      sortable: true
    },
    { headerName: "LOI(In Minutes)", field: "loi" },
    {
      headerName: "Status",
      field: "status",
      flex: 1,
      cellRenderer: (params) => (
        <Button
          variant="text"
          size="small"
          color="primary"
          onClick={() => handleOpenStatusModal(params.data)}
        >
          {params.value}
        </Button>
      ),
    },
    { headerName: "Partner Name", field: "partnerName", flex: 1 },
    { headerName: "IP Address", field: "respondentIP", flex: 1 },
    {
      headerName: "Recontact",
      field: "recontact",
      flex: 1,
      cellRenderer: (params) => (
        <Button
          variant="outlined"
          size="small"
          onClick={() => handleRecontact(params.data)}
        >
          Recontact
        </Button>
      ),
      cellStyle: { display: "flex", justifyContent: "center" },
    },
  ];

  const filteredData = rowData.filter((row) =>
    Object.values(row).some((val) =>
      val?.toString().toLowerCase().includes(searchText.toLowerCase())
    )
  );

  return (
    <>
      <div className="right-content w-100">
        <div className="card shadow border-0 w-100 flex-row p-4">
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            <Button
              variant="text"
              onClick={() => navigate("/survey/details/" + sid)}
              sx={{ p: 2, pr: 2 }}
              style={{ border: "1px solid #ccc", backgroundColor: "#f1f1f1", color: "#0c2a66ff", fontWeight: "bold" }}
            >
              ⬅️ Back
            </Button>
            <div style={{ paddingLeft: "12px", paddingTop: "4px" }}>
              <h5 className="mb-0 text-muted">#{survey.surveyName}</h5>
              <p className="mb-0" style={{ color: "#ccc" }}>{survey.surveyTitle}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow border-0 p-3 mt-4">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "1rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <TextField
            variant="outlined"
            placeholder="Search..."
            value={searchText}
            size="small"
            onChange={handleSearch}
            style={{ minWidth: "200px" }}
          />
          <Button variant="outlined" onClick={handleExportCSV}>
            Export CSV
          </Button>
        </div>

        <div className="ag-theme-quartz" style={{ width: "100%", height: "600px" }}>
          <AgGridReact
            ref={gridRef}
            rowData={filteredData}
            columnDefs={columnDefs}
            pagination={true}
            paginationPageSize={paginationPageSize}
            domLayout="autoHeight"
          />
        </div>
      </div>

      <Dialog open={statusModalOpen} onClose={handleCloseStatusModal}>
        <DialogTitle>Change Survey Status</DialogTitle>
        <DialogContent>
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            fullWidth
          >
            <MenuItem value="incomplete">Incomplete</MenuItem>
            <MenuItem value="Success">Success</MenuItem>
            <MenuItem value="Quotafull">Quotafull</MenuItem>
            <MenuItem value="Disqualified">Disqualified</MenuItem>
            <MenuItem value="Securityfail">Securityfail</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStatusModal}>Cancel</Button>
          <Button onClick={handleStatusChange} variant="contained">
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SurveyReport;
