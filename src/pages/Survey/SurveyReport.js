
import { useEffect, useRef, useState, useMemo } from "react";
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
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]); // NEW: selected rows state
  const [answerModalOpen, setAnswerModalOpen] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState("");
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

  // Single-row status modal opener (via double-click)
  const handleOpenStatusModal = (data) => {
    setSelectedRow(data);
    setSelectedStatus(data.status || "");
    setBulkMode(false);
    setStatusModalOpen(true);
  };

  // Bulk status modal opener (when clicking Change Status (Selected) button)
  const handleOpenBulkStatusModal = () => {
    if (!selectedRows.length) {
      showSnackbar("Please select at least one row", "warning");
      return;
    }
    setSelectedRow(selectedRows); // store array
    setSelectedStatus(""); // reset
    setBulkMode(true);
    setStatusModalOpen(true);
  };

  const handleCloseStatusModal = () => {
    setStatusModalOpen(false);
    setSelectedRow(null);
    setSelectedStatus("");
    setBulkMode(false);
  };

  const handleStatusChange = async () => {
    if (bulkMode) {
      // Bulk update
      const rowsToUpdate = Array.isArray(selectedRow) ? selectedRow : [];
      if (!rowsToUpdate.length || !selectedStatus) {
        showSnackbar("Select rows and a status", "error");
        return;
      }

      try {
        const promises = rowsToUpdate.map((row) => {
          const jsondata = {
            id: row.id,
            status: selectedStatus,
            surveyId: row.surveyId,
          };
          return SurveyResponseChangeStatus(jsondata);
        });

        const results = await Promise.all(promises);

        const failed = results.filter(r => r?.errors || (r.result && r.result.status !== 200));
        if (failed.length) {
          showSnackbar(`${failed.length} updates failed`, "error");
        } else {
          // Update local rowData
          const idsToUpdate = new Set(rowsToUpdate.map(r => r.id));
          const updated = rowData.map(row => idsToUpdate.has(row.id) ? { ...row, status: selectedStatus } : row);
          setRowData(updated);

          showSnackbar("Status updated for selected responses", "success");
          handleCloseStatusModal();
          gridRef.current?.api?.deselectAll();
          setSelectedRows([]);
        }
      } catch (err) {
        console.error("Bulk status error", err);
        showSnackbar("Failed to update status for selected rows", "error");
      }

    } else {
      // Single row update
      if (!selectedRow || !selectedRow.respondentId || !selectedStatus) {
        showSnackbar("Missing respondent ID or status", "error");
        return;
      }

      try {
        const jsondata = {
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
    }
  };

  const handleExportCSV = () => {
    if (gridRef.current && gridRef.current.api) {
      gridRef.current.api.exportDataAsCsv();
    }
  };

  // selection changed handler to sync selected rows to state
  const onSelectionChanged = (event) => {
    const selected = event.api.getSelectedRows() || [];
    setSelectedRows(selected);
  };

  // Helper formatter for date columns
  const dateValueFormatter = (params) => {
    const val = params?.value;
    if (!val) return "";
    const d = dayjs(val);
    return d.isValid() ? d.format("MMM DD YYYY hh:mm A") : "";
  };
  const HtmlRenderer = (props) => {
  return (
    <span
      dangerouslySetInnerHTML={{ __html: props.value }}
    />
  );
};
const handleOpenAnswerModal = (html) => {
  setSelectedAnswer(html);
  setAnswerModalOpen(true);
};

const handleCloseAnswerModal = () => {
  setAnswerModalOpen(false);
  setSelectedAnswer("");
};
  const columnDefs = [
    // Checkbox selection column - pinned left
    {
      headerName: "",
      field: "checkbox",
      checkboxSelection: true,
      headerCheckboxSelection: true,
      width: 40,
      pinned: "left",
      suppressSizeToFit: true,
      suppressMovable: true,
      sortable: false,
      filter: false,
      cellClass: "ag-checkbox-cell"
    },
    {
      headerName: "Sr No",
      valueGetter: "node.rowIndex + 1",
      flex: 0.5,
      minWidth: 80,
    },
    { headerName: "ID", field: "id", hide: true, flex: 1 },
    { headerName: "Respondent Id", field: "respondentId", flex: 1 },
    { headerName: "Internal Id", field: "internalId", flex: 1 },
    { headerName: "Survey Name", field: "surveyName", flex: 0.5 },
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
    { headerName: "LOI(In Minutes)", field: "loi", flex: 0.5 },
    // STATUS: show plain text only (no button)
    { headerName: "Status", field: "status", flex: 1 },
    { headerName: "Partner Name", field: "partnerName", flex: 1 },
    { headerName: "IP Address", field: "respondentIP", flex: 1 },
    {
      headerName: "Answer",
      field: "answers",
      flex: 1.5,
      autoHeight: true,
      cellRenderer: (params) => {
    const value = params.value;

    // ❌ If empty → show dash
    if (!value || value.trim() === "") {
      return <span style={{ color: "#999" }}>—</span>;
    }

    const preview = getPreviewText(value, 10);

    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span>{preview}</span>

        <Button
          size="small"
          variant="outlined"
          onClick={() => handleOpenAnswerModal(value)}
        >
          View
        </Button>
      </div>
    );
  },
},
    {
      headerName: "Recontact",
      field: "recontact",
      flex: 1,
      hide: true,
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
const getPreviewText = (html, limit = 50) => {
  if (!html) return "";

  const temp = document.createElement("div");
  temp.innerHTML = html;
  const text = temp.textContent || temp.innerText || "";

  return text.length > limit
    ? text.substring(0, limit) + "..."
    : text;
};
// Replace your existing filteredData useMemo with this:
const filteredData = useMemo(() => {
  if (!searchText) return rowData;

  // split on comma or any whitespace, remove empty tokens and lowercase them
  const tokens = searchText
    .toString()
    .split(/[,\s]+/)
    .map(t => t.trim().toLowerCase())
    .filter(Boolean);

  if (!tokens.length) return rowData;

  return rowData.filter(row => {
    // flatten row values to strings once per row to reduce repeated work
    const rowValues = Object.values(row)
      .map(v => (v === null || v === undefined) ? "" : String(v).toLowerCase());

    // If any token matches any field (partial match) -> include row (OR logic)
    return tokens.some(token =>
      rowValues.some(rv => rv.includes(token))
    );
  });
}, [rowData, searchText]);

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
              placeholder="Search... (paste multiple Respondent IDs here)"
              value={searchText}
              size="small"
              onChange={(e) => {
                // Auto-trim and clean input
                const cleaned = e.target.value
                  .replace(/\n+/g, " ")       // new lines → space
                  .replace(/\s+/g, " ")       // multiple spaces → single space
                  .replace(/,+/g, ",")        // multiple commas → single comma
                  .trim();
                setSearchText(cleaned);
              }}
              style={{ minWidth: "400px" }}
              multiline
              minRows={2}
              maxRows={6}
              InputProps={{
                endAdornment: (
                  <>
                    {searchText && (
                      <Button
                        size="small"
                        color="error"
                        onClick={() => setSearchText("")}
                        sx={{ minWidth: "20px", padding: "0 6px" }}
                      >
                        ✕
                      </Button>
                    )}
                  </>
                ),
              }}
            />

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <Button variant="outlined" onClick={handleExportCSV}>
              Export CSV
            </Button>
            <Button
              variant="contained"
              onClick={handleOpenBulkStatusModal}
              disabled={selectedRows.length === 0} // enabled when selection exists
            >
              Change Status (Selected)
            </Button>
          </div>
        </div>

        <div className="ag-theme-quartz" style={{ width: "100%", height: "600px" }}>
           <style>{`
    /* allow selecting text inside grid cells & headers */
    .ag-theme-quartz .ag-cell,
    .ag-theme-quartz .ag-header-cell {
      user-select: text !important;
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
    }
    /* keep pointer cursor for clickable elements if any */
    .ag-theme-quartz .ag-cell a,
    .ag-theme-quartz .ag-cell button {
      cursor: pointer;
    }
  `}</style>
          <AgGridReact
            ref={gridRef}
            rowData={filteredData}
            columnDefs={columnDefs}
            pagination={true}
            paginationPageSize={paginationPageSize}
            domLayout="autoHeight"
            rowSelection="multiple"
            suppressRowClickSelection={true}
            onSelectionChanged={onSelectionChanged}         // sync selection to state
            onRowDoubleClicked={(params) => handleOpenStatusModal(params.data)} // double-click for single row status change
          />
        </div>
      </div>

      <Dialog open={statusModalOpen} onClose={handleCloseStatusModal}>
        <DialogTitle>{bulkMode ? `Change status for ${Array.isArray(selectedRow) ? selectedRow.length : selectedRows.length} selected` : "Change Survey Status"}</DialogTitle>
        <DialogContent>
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            fullWidth
            displayEmpty
          >
            <MenuItem value="" disabled>Select status</MenuItem>
            <MenuItem value="incomplete">Incomplete</MenuItem>
            <MenuItem value="Success">Success</MenuItem>
            <MenuItem value="Quotafull">Quotafull</MenuItem>
            <MenuItem value="Disqualified">Disqualified</MenuItem>
            <MenuItem value="Securityfail">Securityfail</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStatusModal}>Cancel</Button>
          <Button onClick={handleStatusChange} variant="contained" disabled={!selectedStatus}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={answerModalOpen}
        onClose={handleCloseAnswerModal}
        maxWidth="md"
        fullWidth
      >
  <DialogTitle>Answers</DialogTitle>
  <DialogContent dividers>
    <div
      dangerouslySetInnerHTML={{ __html: selectedAnswer }}
    />
  </DialogContent>
  <DialogActions>
    <Button onClick={handleCloseAnswerModal}>Close</Button>
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
