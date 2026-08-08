import { useEffect, useMemo, useState } from "react";
import {
  Typography,
  Button,
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
  Alert

} from "@mui/material";
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
import Pagination from "@mui/material/Pagination";
import Grid from "@mui/material/Grid";

const Surveys = () => {
  const [rowData, setRowData] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusRow, setStatusRow] = useState(null);            // the row being edited
  const [statusSelectionId, setStatusSelectionId] = useState(""); // selected status id
  // ADD STATE
  const [surveyFilter, setSurveyFilter] = useState("all"); // all | my
  const [options, setOptions] = useState({
  status: [],
  clients: [],
  countries: [],
  projectManagers: [],
  salesManagers: []
});

const [searchModel, setSearchModel] = useState({
    pageNumber: 1,
    pageSize: 20,
    surveyName: "",
    title: "",
    clientId: "",
    countryId: "",
    statusId: "",
    projectManagerId: "",
    salesManagerId: "",
    mySurveysOnly: false,
    userId: localStorage.getItem("userid")
});
const [totalRecords, setTotalRecords] = useState(0);
const navigate = useNavigate();

const loadSurveys = async (model = searchModel) => {

    try {

        setLoading(true);

        const response = await GetSurveys(model);

        setRowData(response.result.data.data || []);
        setTotalRecords(response.result.data.totalRecords || 0);

    }
    catch (err) {

        console.error(err);

        showSnackbar("Failed to load surveys", "error");

    }
    finally {

        setLoading(false);

    }

};
const handleSearch = () => {

    const model = {
        ...searchModel,
        pageNumber: 1
    };

    setSearchModel(model);

    loadSurveys(model);
};

const handleReset = () => {

    const model = {
        pageNumber: 1,
        pageSize: 20,
        surveyName: "",
        title: "",
        clientId: "",
        countryId: "",
        statusId: "",
        projectManagerId: "",
        salesManagerId: ""
    };

    setSearchModel(model);

    loadSurveys(model);
};

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      try {
        const responseOptions = await GetOptionsSurvey();

        setOptions({
            status: responseOptions.result.data.status || [],
            clients: responseOptions.result.data.clients || [],
            countries: responseOptions.result.data.countries || [],
            projectManagers: responseOptions.result.data.project_managers || [],
            salesManagers: responseOptions.result.data.sales_managers || []
        });

        await loadSurveys({
            ...searchModel,
            pageNumber: 1
        });
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

  const handleSurveyClick = (id) => {
  window.open(`/survey/details/${id}`, "_blank");
};

  const handleEditSurvey = (id) => navigate(`/survey/edit/${id}`);
  const handleSearchKeyPress = (e) => {

    if (e.key === "Enter") {

        handleSearch();

    }

};
  const handleDeleteClick = (id) => {
    setSelectedSurveyId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await DeleteSurvey(selectedSurveyId);
      if (response.errors == null && response.result.status === 204) {
        showSnackbar("Survey deleted successfully", "success");
        await loadSurveys(searchModel);
        setDeleteDialogOpen(false);
      }
      else{
        showSnackbar(response.errors.message, "error");
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
    showSnackbar("Status updated", "success");
    await loadSurveys(searchModel);
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
  cellRenderer: (params) => {
    return (
      <a
        href={`/survey/details/${params.data.id}`}
        target="_self"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()} // prevent row click conflict
        style={{
          color: "#1976d2",
          textDecoration: "none",
          cursor: "pointer",
          fontWeight: 500,
        }}
        onMouseOver={(e) => (e.target.style.textDecoration = "underline")}
        onMouseOut={(e) => (e.target.style.textDecoration = "none")}
      >
        {params.value}
      </a>
    );
  },
},
    { headerName: "Id", field: "id", flex: 1, hide: true },
    {
  headerName: "Title",
  field: "title",
  flex: 2,
  sortable: false,

  // Native browser tooltip
  //tooltipField: "title",

  // Optional: custom renderer with ellipsis + hover title
  cellRenderer: (params) => (
    <div
      title={params.value} // full text on hover
      style={{
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        width: "100%",
        cursor: "pointer",
      }}
    >
      {params.value}
    </div>
  ),
},
    { headerName: "Client", field: "client", flex: 1 },
    { headerName: "Country", field: "country", flex: 1 },
    { headerName: "Language", field: "language", flex: 1, hide: true},
   
    { headerName: "Completes", field: "currentComplete", flex: 1, hide: true },
    
    { headerName: "Est IR/Cr IR", field: "ir", flex: 1 },
    { headerName: "Est LOI/Cr LOI", field: "loi", flex: 1 },
    { headerName: "Drop Outs (%)", field: "dropOuts", flex: 1 },
    { headerName: "Quota", field: "surveyQuota", flex: 1 },
    { headerName: "Statistic", field: "statics", flex: 1 },
    { headerName: "CPI", field: "cpi", flex: 1 },
    { headerName: "Last Completed", field: "lastCompleted", flex: 1 },
    { headerName: "Clones", field: "cloneCount", flex: 0.5 },
    { headerName: "Vendors", field: "vendorsCount", flex: 0.5 },
    
    {
      headerName: "Launched Date",
      field: "launchedDate",
      flex: 1,
      valueFormatter: (params) => dayjs(params.value).format("DD MMM, YYYY"),
      hide: true
    },
    
    
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

  // UPDATE filteredData
  const displayedData = useMemo(() => {

    if (surveyFilter === "all")
        return rowData;

    const loggedInUserId = localStorage.getItem("userid");

    return rowData.filter(row => {

        if (!row.surveyUsers)
            return false;

        return row.surveyUsers
            .split(",")
            .map(x => x.trim().toLowerCase())
            .includes(loggedInUserId?.toLowerCase());

    });

}, [rowData, surveyFilter]);

  return (
    <>
      <div className="right-content w-100">
        <div className="card shadow border-0 w-100 flex-row p-4">
          <h5 className="mb-0">Surveys</h5>
        </div>

        <div className="card shadow border-0 p-3">
         
<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    gap: 12,
    flexWrap: "wrap",
  }}
>
  {/* Left Side Buttons */}
  <div style={{ display: "flex", gap: 8 }}>
    <Button
    variant={surveyFilter === "all" ? "contained" : "outlined"}
    onClick={() => {

        setSurveyFilter("all");

        const model = {
            ...searchModel,
            pageNumber: 1,
            mySurveysOnly: false,
            userId: localStorage.getItem("userid")
        };

        setSearchModel(model);
        loadSurveys(model);
    }}
>
    All Surveys
</Button>

    <Button
    variant={surveyFilter === "my" ? "contained" : "outlined"}
    onClick={() => {

        setSurveyFilter("my");

        const model = {
            ...searchModel,
            pageNumber: 1,
            mySurveysOnly: true,
            userId: localStorage.getItem("userid")
        };

        setSearchModel(model);
        loadSurveys(model);
    }}
>
    My Surveys
</Button>
  </div>

  
</div>
<div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
  <Grid container spacing={2} sx={{ mt: 2, mb: 2 }}>

  <Grid item xs={12} md={3}>
    <TextField
      fullWidth
      size="small"
      onKeyDown={handleSearchKeyPress}
      label="Survey Id"
      value={searchModel.surveyName}
      onChange={(e) =>
        setSearchModel({
          ...searchModel,
          surveyName: e.target.value,
        })
      }
    />
  </Grid>

  <Grid item xs={12} md={3}>
    <TextField
      fullWidth
      size="small"
      label="Title"
      value={searchModel.title}
      onChange={(e) =>
        setSearchModel({
          ...searchModel,
          title: e.target.value,
        })
      }
      onKeyDown={handleSearchKeyPress}
    />
  </Grid>

  <Grid item xs={12} md={3}>
    <FormControl fullWidth size="small">
      <InputLabel>Client</InputLabel>
      <Select
        label="Client"
        value={searchModel.clientId}
        onChange={(e) =>
          setSearchModel({
            ...searchModel,
            clientId: e.target.value,
          })
        }
        onKeyDown={handleSearchKeyPress}
      >
        <MenuItem value="">All</MenuItem>

        {options.clients.map((item) => (
          <MenuItem key={item.id} value={item.id}>
            {item.name}
          </MenuItem>

        ))}

      </Select>
    </FormControl>
  </Grid>

  <Grid item xs={12} md={3}>
    <FormControl fullWidth size="small">
      <InputLabel>Country</InputLabel>
      <Select
        label="Country"
        value={searchModel.countryId}
        onChange={(e) =>
          setSearchModel({
            ...searchModel,
            countryId: e.target.value,
          })
        }
        onKeyDown={handleSearchKeyPress}
      >
        <MenuItem value="">All</MenuItem>

        {options.countries.map((item) => (
          <MenuItem key={item.id} value={item.id}>
            {item.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </Grid>

  <Grid item xs={12} md={3}>
    <FormControl fullWidth size="small">
      <InputLabel>Status</InputLabel>
      <Select
        label="Status"
        value={searchModel.statusId}
        onChange={(e) =>
          setSearchModel({
            ...searchModel,
            statusId: e.target.value,
          })
        }
        onKeyDown={handleSearchKeyPress}  
      >
        <MenuItem value="">All</MenuItem>

        {options.status.map((item) => (
          <MenuItem key={item.id} value={item.id}>
            {item.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </Grid>

  <Grid item xs={12} md={3}>
    <FormControl fullWidth size="small">
      <InputLabel>Project Manager</InputLabel>
      <Select
        label="Project Manager"
        value={searchModel.projectManagerId}
        onChange={(e) =>
          setSearchModel({
            ...searchModel,
            projectManagerId: e.target.value,
          })
        }
        onKeyDown={handleSearchKeyPress}
      >
        <MenuItem value="">All</MenuItem>

        {options.projectManagers.map((item) => (
          <MenuItem key={item.id} value={item.id}>
            {item.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </Grid>

  <Grid item xs={12} md={3}>
    <FormControl fullWidth size="small">
      <InputLabel>Sales Manager</InputLabel>
      <Select
        label="Sales Manager"
        value={searchModel.salesManagerId}
        onChange={(e) =>
          setSearchModel({
            ...searchModel,
            salesManagerId: e.target.value,
          })
        }
        onKeyDown={handleSearchKeyPress}
      >
        <MenuItem value="">All</MenuItem>

        {options.salesManagers.map((item) => (
          <MenuItem key={item.id} value={item.id}>
            {item.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </Grid>

  <Grid
    item
    xs={12}
    md={3}
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1,
    }}
  >
    <Button
      variant="contained"
      onClick={handleSearch}
    >
      Search
    </Button>

    <Button
      variant="outlined"
      onClick={handleReset}
    >
      Reset
    </Button>
  </Grid>

</Grid>
</div>

<Typography variant="body2">

Showing

{" "}

<b>

{rowData.length === 0
? 0
: ((searchModel.pageNumber - 1) * searchModel.pageSize) + 1}

-

{((searchModel.pageNumber - 1) * searchModel.pageSize) + rowData.length}

</b> of <b> {totalRecords}</b> surveys

</Typography>
          <div className="ag-theme-quartz">
            <AgGridReact
                loading={loading}
                domLayout="autoHeight"
                rowData={displayedData}
                columnDefs={columnDefs}
                defaultColDef={{
                    sortable: false,
                    resizable: true,
                    filter: false
                }}
            />
            
          </div>
          <div
    style={{
        display: "flex",
        justifyContent: "flex-end",
        marginTop: 20
    }}
>

<Pagination

    color="primary"

    page={searchModel.pageNumber}

    count={Math.ceil(totalRecords / searchModel.pageSize)}

    onChange={(e, page) => {

        const model = {

            ...searchModel,

            pageNumber: page

        };

        setSearchModel(model);

        loadSurveys(model);

    }}

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
