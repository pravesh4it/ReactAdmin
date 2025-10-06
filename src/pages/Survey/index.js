import { useEffect, useMemo, useState } from "react";
import {
  Breadcrumbs,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Alert,
  Hidden,
} from "@mui/material";
import { emphasize, styled } from "@mui/material/styles";
import HomeIcon from "@mui/icons-material/Home";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { DeleteSurvey, GetOptionsSurvey, GetSurveys } from "../../api/survey";
import 'ag-grid-community/styles/ag-theme-alpine.css';

const Surveys = () => {
  const [rowData, setRowData] = useState([]);
  const [options, setOptions] = useState({ status: [] });
  const [searchText, setSearchText] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [paginationPageSize] = useState(100);

  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      try {
        // const response = await GetOptionsSurvey();
        // setOptions({ status: response.result.data.status });

        const response = await GetSurveys();
        setRowData(response.result.data);
      } catch (error) {
        console.error(error);
        showSnackbar("Failed to load surveys", "error");
      }
    };
    fetchData();
  }, []);

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleAddSurvey = () => navigate("/survey/add");

  const handleSurveyClick = (id) => navigate(`/survey/details/${id}`);

  const handleEditSurvey = (id) => navigate(`/survey/edit/${id}`);

  const handleDeleteClick = (id) => {
    setSelectedSurveyId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await DeleteSurvey(selectedSurveyId);
      if (response.errors == null && response.result.status === 204) {
        showSnackbar("Survey deleted successfully", "success");
        const refreshedData = await GetSurveys();
        setRowData(refreshedData.result.data);
        setDeleteDialogOpen(false);
      }
    } catch (error) {
      console.error(error);
      showSnackbar("Failed to delete survey", "error");
    } finally {
      setSelectedSurveyId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handleStatusChange = (id, currentStatus) => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
    // Call an API here if backend supports status updates
    showSnackbar(`Survey status changed to ${newStatus}`, "success");
    setRowData((prev) =>
      prev.map((survey) =>
        survey.id === id ? { ...survey, status: newStatus } : survey
      )
    );
  };

  const columnDefs = [
    {
      headerName: "Sr No",
      valueGetter: "node.rowIndex + 1",
      flex: 0.5,
      minWidth: 80,
    },
    {
      headerName: "Name",
      field: "name",
      flex: 2,
      cellRenderer: (params) => (
        <Button color="primary" onClick={() => handleSurveyClick(params.data.id)}>
          {params.value}
        </Button>
      ),
    },
    { headerName: "Survey Id", field: "id", flex: 1, hide: true },
    { headerName: "Title", field: "title", flex: 2 },
    { headerName: "Client", field: "client", flex: 1 },
    { headerName: "Country", field: "country", flex: 1 },
    { headerName: "Language", field: "language", flex: 1, hide: true},
    { headerName: "Quota", field: "surveyQuota", flex: 1 },
    { headerName: "Completes", field: "currentComplete", flex: 1 },
    { headerName: "Drop Outs", field: "dropOuts", flex: 1 },
    { headerName: "Est IR/Cr IR", field: "ir", flex: 1 },
    { headerName: "Est LOI/Cr LOI", field: "loi", flex: 1 },
    { headerName: "Last Completed", field: "lastCompleted", flex: 1 },
    { headerName: "Status", field: "status", flex: 1 },
    { headerName: "CPI", field: "cpi", flex: 1 },
    {
      headerName: "Launched Date",
      field: "launchedDate",
      flex: 1,
      valueFormatter: (params) => dayjs(params.value).format("DD MMM, YYYY"),
      hide: true
    },
    { headerName: "Vendors", field: "vendorsCount", flex: 1 },
    { headerName: "Clones", field: "cloneCount", flex: 1 },
    {
      headerName: "Actions",
      field: "actions",
      flex: 1.5,
      cellRenderer: (params) => (
        <div style={{ display: "flex", gap: "10px" }}>
          <IconButton color="primary" onClick={() => handleEditSurvey(params.data.id)}>
            <EditIcon />
          </IconButton>
          <IconButton color="error" onClick={() => handleDeleteClick(params.data.id)}>
            <DeleteIcon />
          </IconButton>
        </div>
      ),
    },
  ];

  const filteredData = useMemo(
    () =>
      rowData.filter((row) =>
        Object.values(row).some((val) =>
          val?.toString().toLowerCase().includes(searchText.toLowerCase())
        )
      ),
    [rowData, searchText]
  );

  return (
    <>
      <div className="right-content w-100">
        <div className="card shadow border-0 w-100 flex-row p-4">
          <h5 className="mb-0">Surveys</h5>
        </div>

        <div className="card shadow border-0 p-3">
          <div style={{ display: "flex", justifyContent: "flex-end", paddingBottom: 8 }}>
            <TextField
              variant="outlined"
              placeholder="Search..."
              value={searchText}
              size="small"
              onChange={(e) => setSearchText(e.target.value)}
              style={{ marginRight: 16 }}
            />
            <Button variant="contained" color="primary" onClick={handleAddSurvey}>
              Add Survey
            </Button>
          </div>

          <div className="ag-theme-quartz">
            <AgGridReact
              domLayout="autoHeight"
              rowData={filteredData}
              columnDefs={columnDefs}
              pagination={true}
              paginationPageSize={paginationPageSize}
            />
          </div>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this survey?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Surveys;
