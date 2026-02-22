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
import { DeleteSurvey, GetOptionsSurvey, GetSurveys, UpdateSurveyStatus } from "../../api/survey";

import { FormControl, InputLabel } from "@mui/material";
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Sort } from "@mui/icons-material";

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
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusRow, setStatusRow] = useState(null);            // the row being edited
  const [statusSelectionId, setStatusSelectionId] = useState(""); // selected status id

  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      try {
        const responseOptions = await GetOptionsSurvey();
        setOptions({ status: responseOptions.result.data.status });

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

  
const openStatusDialog = (row) => {
  setStatusRow(row);
  // if the row has a status NAME, map it to id from options; else assume it's already an id
  const found = options.status.find(s => s.name === row.status || s.id === row.status);
  setStatusSelectionId(found ? found.id : "");
  setStatusDialogOpen(true);
};

const handleStatusSave = async () => {
  if (!statusRow) return;
  const sel = options.status.find(s => s.id === statusSelectionId);
  const createdById = localStorage.getItem("userid");
  try {
    // Call backend to persist (if your API expects this signature)
    await UpdateSurveyStatus(statusRow.id, { StatusId: statusSelectionId, createdById });
    // Update grid locally with the *name/text*
    setRowData(prev =>
      prev.map(r => (r.id === statusRow.id ? { ...r, status: sel?.name ?? r.status } : r))
    );
    showSnackbar("Status updated", "success");
  } catch (e) {
    console.error(e);
    showSnackbar("Failed to update status", "error");
  } finally {
    setStatusDialogOpen(false);
    setStatusRow(null);
    setStatusSelectionId("");
  }
};


  const columnDefs = [
    {
      headerName: "Sr No",
      valueGetter: "node.rowIndex + 1",
      flex: 0.5,
      minWidth: 80,
      hide: true
    },
    {
      headerName: "Survey Id",
      field: "name",
      flex: 2,
      Sortable: false,
      cellRenderer: (params) => (
        <Button color="primary" onClick={() => handleSurveyClick(params.data.id)}>
          {params.value}
        </Button>
      ),
    },
    { headerName: "Id", field: "id", flex: 1, hide: true },
    { headerName: "Title", field: "title", flex: 2, Sortable: false },
    { headerName: "Client", field: "client", flex: 1 },
    { headerName: "Country", field: "country", flex: 1 },
    { headerName: "Language", field: "language", flex: 1, hide: true},
    { headerName: "Quota", field: "surveyQuota", flex: 1 },
    { headerName: "Completes", field: "currentComplete", flex: 1 },
    { headerName: "Drop Outs", field: "dropOuts", flex: 1 },
    { headerName: "Est IR/Cr IR", field: "ir", flex: 1 },
    { headerName: "Est LOI/Cr LOI", field: "loi", flex: 1 },
    { headerName: "Last Completed", field: "lastCompleted", flex: 1 },
    { headerName: "CPI", field: "cpi", flex: 1 },
    {
      headerName: "Launched Date",
      field: "launchedDate",
      flex: 1,
      valueFormatter: (params) => dayjs(params.value).format("DD MMM, YYYY"),
      hide: true
    },
    { headerName: "Vendors", field: "vendorsCount", flex: 0.5 },
    { headerName: "Clones", field: "cloneCount", flex: 0.5 },
    {
      headerName: "Status",
      field: "status",
      flex: 1,
      cellRenderer: (params) => (
        <Button
          color="primary"
          onClick={() => openStatusDialog(params.data)}
        >
          {params.value}
        </Button>
      ),
    },
    { headerName: "Statics", field: "statics", flex: 1 },
    {
      headerName: "Actions",
      field: "actions",
      flex: 1.5,
      cellRenderer: (params) => (
        <div style={{ display: "flex", gap: "10px" }}>
          {
            
            <IconButton color="primary" onClick={() => handleEditSurvey(params.data.id)}>
              <EditIcon />
            </IconButton>
          }
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
            
          </div>

          <div className="ag-theme-quartz">
            <AgGridReact
              domLayout="autoHeight"
              rowData={filteredData}
              columnDefs={columnDefs}
              pagination={true}
              defaultColDef={{
                sortable: false,     // ✅ disables sorting everywhere
                resizable: true,
                filter: false
              }}
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
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} fullWidth maxWidth="xs">
  <DialogTitle>Change Status</DialogTitle>
  <DialogContent>
    <DialogContentText sx={{ mb: 2 }}>
      Select a new status for <b>{statusRow?.name}</b>.
    </DialogContentText>
    <FormControl fullWidth>
      <InputLabel id="status-select-label">Status</InputLabel>
      <Select
        labelId="status-select-label"
        label="Status"
        value={statusSelectionId}
        onChange={(e) => setStatusSelectionId(e.target.value)}
      >
        {options.status.map((s) => (
          <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
        ))}
      </Select>
    </FormControl>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
    <Button variant="contained" onClick={handleStatusSave} disabled={!statusSelectionId}>
      Save
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
