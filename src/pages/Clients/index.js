import { useContext, useEffect, useState } from "react";
import { emphasize, styled } from '@mui/material/styles';
import { useForm, Controller } from "react-hook-form";
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Chip from '@mui/material/Chip';
import HomeIcon from '@mui/icons-material/Home';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { GetClents, AddClient, UpdateClient, DeleteClient } from "../../api/Client";
import PhoneInput from "react-phone-input-2";

const Clients = () => {
    const [rowData, setRowData] = useState([]);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    // Snackbar state for success/error messages
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");
    // Search state
    const [searchText, setSearchText] = useState("");

    // Pagination state
    const [paginationPageSize] = useState(10);

    const { control, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            name: "",
            contactPerson: "",
            address:"",
            contactNo1: "",
            email: "",
            c_Variable: ""
        }
    });

    useEffect(() => {
        window.scrollTo(0, 0);
        async function fetchData() {
            try {
                const response1 = await GetClents();
                setRowData(response1.result.data);
            } catch (error) {
                console.error(error);
                showSnackbar("Failed to load clients", "error");
            }
        }
        fetchData();
    }, []);
    const handleSearch = (e) => {
        setSearchText(e.target.value);
    };
    const handleDelete = (client) => {
        setSelectedClient(client);
        setOpenDeleteDialog(true);
    };

    const handleEdit = (client) => {
        setSelectedClient(client);
        reset(client); // Set form values when editing
        setOpenEditDialog(true);
    };

    const handleConfirmDelete = async () => {
        try {
            await DeleteClient(selectedClient.id);
            setRowData(rowData.filter((item) => item.id !== selectedClient.id));
            showSnackbar("Client deleted successfully", "success");
        } catch (error) {
            console.error(error);
            showSnackbar("Failed to delete client", "error");
        } finally {
            setOpenDeleteDialog(false);
            setSelectedClient(null);
        }
    };

    const handleDialogClose = () => {
        setOpenDeleteDialog(false);
        setOpenEditDialog(false);
        setSelectedClient(null);
        reset();
    };

    const handleSaveClient = async (data) => {
        try {
            if (selectedClient) {
                // Update client
                // Add client
                const jsondata= {
                    "id": selectedClient.id,
                    "name": data.name,
                    "contactPerson": data.contactPerson,
                    "address": data.address,
                    "contactNo1": data.contactNo1,
                    "email": data.email,
                    "c_Variable": data.c_Variable,
                    "createdById": localStorage.getItem("userid"),
                    "clientTypeId": ""
                  }
                const response= await UpdateClient(selectedClient.id, jsondata);
                if(response.errors==null)
                    {
                        setRowData((prev) =>
                            prev.map((item) => (item.id === selectedClient.id ? { ...item, ...data } : item))
                        );
                        showSnackbar("Client updated successfully", "success");
                    }
                    else{
                        // show error
                        showSnackbar("Failed to save client", "error");
    
                    }
            } else {
                // Add client
                const jsondata= {
                    "name": data.name,
                    "contactPerson": data.contactPerson,
                    "address": data.address,
                    "contactNo1": data.contactNo1,
                    "email": data.email,
                    "c_Variable": data.c_Variable,
                    "createdById": localStorage.getItem("userid"),
                    "clientTypeId": ""
                  }
                const response = await AddClient(jsondata);
                if(response.errors==null)
                {
                    setRowData((prev) => [...prev, response.result.data]);
                    // show message of saving success
                    showSnackbar("Client added successfully", "success");
                }
                else{
                    // show error
                    showSnackbar("Failed to save client", "error");

                }
                
            }
        } catch (error) {
            console.error(error);
        } finally {
            setOpenEditDialog(false);
            setSelectedClient(null);
            reset();
        }
    };
    const showSnackbar = (message, severity) => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    const columnDefs = [
    { headerName: 'ID', field: 'id', hide: true },
    { headerName: 'Name', field: 'name', flex: 2 },
    { headerName: 'Contact Person', field: 'contactPerson', flex: 3 },
    { headerName: 'Contact No', field: 'contactNo1', flex: 2 },
    { headerName: 'Email', field: 'email', flex: 2 },
    { headerName: 'Variable', field: 'c_Variable', flex: 1, hide: true },
    {
        headerName: 'Actions',
        field: 'actions',
        flex: 2,
        cellRenderer: (params) => (
            <>
                <IconButton onClick={() => handleEdit(params.data)}>
                    <EditIcon color="primary" />
                </IconButton>
                <IconButton onClick={() => handleDelete(params.data)}>
                    <DeleteIcon color="error" />
                </IconButton>
            </>
        ),
    },
];


    return (
        <>
            <div className="right-content w-100">
                <div className="card shadow border-0 w-100 flex-row p-4">
                    <h5 className="mb-0">Clients</h5>
                    
                </div>

                <div className="card shadow border-0 p-3">
                    <div style={{ display: 'flex', justifyContent: 'right', alignItems: 'right', paddingBottom: '5px' }}>
                        <TextField
                            variant="outlined"
                            placeholder="Search..."
                            value={searchText}
                            size="small"
                            onChange={handleSearch}
                            style={{ marginRight: '1rem' }}
                        />
                        <Button variant="contained" color="primary" onClick={() => handleEdit(null)} style={{ alignSelf: 'flex-end' }}>
                            Add Client
                        </Button>
                    </div>
                    <div className="ag-theme-quartz" style={{ height: 500 }}>
                        <AgGridReact rowData={rowData.filter((row) =>
                            Object.values(row).some(val =>
                                (val ?? '').toString().toLowerCase().includes(searchText.toLowerCase())
                            )
                            )} columnDefs={columnDefs}
                        pagination={true}
                        paginationPageSize={paginationPageSize}
                        />
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={openDeleteDialog} onClose={handleDialogClose}>
                <DialogTitle>Delete Client</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this client?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogClose} color="primary">Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error">Delete</Button>
                </DialogActions>
            </Dialog>

            {/* Edit/Add Client Dialog */}
            <Dialog open={openEditDialog} onClose={handleDialogClose}>
                <DialogTitle>{selectedClient ? "Edit Client" : "Add Client"}</DialogTitle>
                <DialogContent>
                    <form onSubmit={handleSubmit(handleSaveClient)}>
                        <Controller
                            name="name"
                            control={control}
                            rules={{ required: "Name is required" }}
                            render={({ field }) => (
                                <TextField {...field} label={
                                    <span>
                                    Name <span style={{ color: 'red' }}>*</span>
                                    </span>
                                } 
                                fullWidth margin="dense" error={!!errors.name} helperText={errors.name?.message} />
                            )}
                        />
                        <Controller
                            name="contactPerson"
                            control={control}
                            rules={{ required: "Contact Person is required" }}
                            render={({ field }) => (
                                <TextField {...field} label={
                                    <span>
                                    Contact Person <span style={{ color: 'red' }}>*</span>
                                    </span>
                                } fullWidth margin="dense" error={!!errors.contactPerson} helperText={errors.contactPerson?.message} />
                            )}
                        />
                        
                        <Controller
                            name="contactNo1"
                            control={control}
                            render={({ field, fieldState }) => (
                                <div style={{ width: '100%' }}>
                                <PhoneInput
                                    country="in"
                                    value={field.value || ""}
                                    onChange={field.onChange}
                                    inputProps={{
                                    name: field.name,
                                    }}
                                    inputStyle={{
                                    width: '100%',
                                    paddingLeft: '50px',
                                    paddingRight: '10px',
                                    fontSize: '14px',
                                    }}
                                    buttonStyle={{
                                    paddingRight: '12px',
                                    }}
                                />
                                {fieldState.error && (
                                    <div style={{ color: 'red', fontSize: '12px' }}>
                                    {fieldState.error.message}
                                    </div>
                                )}
                                </div>
                            )}
                            />

                        <Controller
                            name="email"
                            control={control}
                            rules={{
                                required: "Email is required",
                                pattern: { value: /^\S+@\S+$/i, message: "Invalid email" }
                            }}
                            render={({ field }) => (
                                <TextField {...field} label={
                                    <span>
                                    Email <span style={{ color: 'red' }}>*</span>
                                    </span>
                                } fullWidth margin="dense" error={!!errors.email} helperText={errors.email?.message} />
                            )}
                        />
                        <Controller
                            name="address"
                            control={control}
                            rules={{ }}
                            render={({ field }) => (
                                <TextField {...field} label="Address" fullWidth margin="dense" error={!!errors.address} helperText={errors.address?.message} />
                            )}
                        />
                        
                        <DialogActions>
                            <Button onClick={handleDialogClose} color="primary">Cancel</Button>
                            <Button type="submit" color="primary">Save</Button>
                        </DialogActions>
                    </form>
                </DialogContent>
            </Dialog>
            {/* Snackbar for success/error messages */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={10000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} variant="filled">
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </>
    );
};

export default Clients;
