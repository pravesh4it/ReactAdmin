import { useEffect, useState } from "react";
import { emphasize, styled } from '@mui/material/styles';
import { useForm, Controller } from "react-hook-form";
import Chip from '@mui/material/Chip';
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
import { GetUsers, AddUser, UpdateUser, DeleteUser, GetOptions } from "../../api/users";
import { FormControl, FormHelperText, Hidden, InputLabel, MenuItem, Select } from "@mui/material";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css'; // Import styles for the phone input


const ManageUsers = () => {
    const [rowData, setRowData] = useState([]);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");
    const [searchText, setSearchText] = useState("");
    const [paginationPageSize] = useState(10);
    const [designations, setDesignations] = useState([]);
    const [roles, setRoles] = useState([]);

    const { control, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            firstName: "",
            lastName: "",
            designationId: "",
            roleId:"",
            contactNo: "",
            email: ""
        }
    });

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await GetUsers();
                setRowData(response.result.data);
                const optionsResponse = await GetOptions();
                setDesignations(optionsResponse.result.data.designations);
                setRoles(optionsResponse.result.data.roles);
            } catch (error) {
                console.error(error);
                showSnackbar("Failed to load Users", "error");
            }
        }
        fetchData();
    }, []);

    const handleSearch = (e) => {
        setSearchText(e.target.value);
    };

    const handleDelete = (user) => {
        setSelectedUser(user);
        setOpenDeleteDialog(true);
    };

    const handleEdit = (user) => {
    setSelectedUser(user);
    if (user) {
        reset(user); // Edit Mode: populate form with existing data
    } else {
        // Add Mode: reset with empty/default values
        reset({
            firstName: "",
            lastName: "",
            designationId: "",
            roleId: "",
            contactNo: "",
            email: ""
        });
    }
    setOpenEditDialog(true);
};
    const handleConfirmDelete = async () => {
        try {
            await DeleteUser(selectedUser.id);
            setRowData(rowData.filter((item) => item.id !== selectedUser.id));
            showSnackbar("User deleted successfully", "success");
        } catch (error) {
            console.error(error);
            showSnackbar("Failed to delete user", "error");
        } finally {
            setOpenDeleteDialog(false);
            setSelectedUser(null);
        }
    };

    const handleDialogClose = () => {
        setOpenDeleteDialog(false);
        setOpenEditDialog(false);
        setSelectedUser(null);
        reset();
    };

    const handleSaveUser = async (data) => {
        try {
            if (selectedUser) {
                const updatedUser = { ...data, id: selectedUser.id };
                const response = await UpdateUser(selectedUser.id, updatedUser);
                if (!response.errors) {
                    setRowData((prev) =>
                        prev.map((item) => (item.id === selectedUser.id ? { ...item, ...data } : item))
                    );
                    showSnackbar("User updated successfully", "success");
                } else {
                    showSnackbar("Failed to save user", "error");
                }
            } else {
                const newUser = { ...data };
                const userRole = roles.find((role) => role.id === newUser.roleId);
                debugger
                const jsondata ={
                    "username": newUser.email,
                    "role": userRole.name,
                    "firstName": newUser.firstName,
                    "lastName": newUser.lastName,
                    "designationId": newUser.designationId,
                    "contactNo": newUser.contactNo
                  }

                const response = await AddUser(jsondata);
                if (!response.errors) {
                    setRowData((prev) => [...prev, response.result.data]);
                    showSnackbar("User added successfully", "success");
                } else {
                    showSnackbar("Failed to save user", "error");
                }
            }
        } catch (error) {
            console.error(error);
            showSnackbar("An error occurred while saving", "error");
        } finally {
            setOpenEditDialog(false);
            setSelectedUser(null);
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


    const defaultColDef = {
        resizable: true,
        sortable: true,
        minWidth: 80, // default minimum, override per-column when needed
    };

    const columnDefs = [
    { headerName: 'ID', field: 'id', hide: true }, // hidden - no flex needed
    { headerName: 'First Name', field: 'firstName', flex: 1, minWidth: 120 },
    { headerName: 'Last Name', field: 'lastName', flex: 1, minWidth: 120 },
    { headerName: 'Designation', field: 'designation', flex: 2, minWidth: 160 },
    { headerName: 'DesignationId', field: 'designationId', hide: true }, // hidden
    { headerName: 'Role', field: 'role', flex: 1.5, minWidth: 140 },
    { headerName: 'RoleId', field: 'roleId', hide: true }, // hidden
    { headerName: 'Contact No', field: 'contactNo', flex: 1, minWidth: 120 },
    { headerName: 'Email', field: 'email', flex: 2, minWidth: 160 },

    {
        headerName: 'Actions',
        field: 'actions',
        // small fixed minWidth so buttons don't collapse; flex gives it some share
        flex: 0.8,
        minWidth: 140,
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
                    <h5 className="mb-0">Manage Users</h5>
                    
                </div>

                <div className="card shadow border-0 p-3">
                    <div style={{ display: 'flex', justifyContent: 'right', paddingBottom: '5px' }}>
                        <TextField
                            variant="outlined"
                            placeholder="Search..."
                            value={searchText}
                            size="small"
                            onChange={handleSearch}
                            style={{ marginRight: '1rem' }}
                        />
                        <Button variant="contained" color="primary" onClick={() => handleEdit(null)}>
                            Add User
                        </Button>
                    </div>
                    <div className="ag-theme-quartz" style={{ height: 500 }}>
                        <AgGridReact 
                            rowData={rowData.filter((row) =>
                                Object.values(row).some(val =>
                                    val.toString().toLowerCase().includes(searchText.toLowerCase())
                                )
                            )} 
                            columnDefs={columnDefs}
                            pagination={true}
                            paginationPageSize={paginationPageSize}
                        />
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={openDeleteDialog} onClose={handleDialogClose}>
                <DialogTitle>Delete User</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this user?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogClose} color="primary">Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error">Delete</Button>
                </DialogActions>
            </Dialog>

            {/* Edit/Add User Dialog */}
            <Dialog open={openEditDialog} onClose={handleDialogClose}>
                <DialogTitle>{selectedUser ? "Edit User" : "Add User"}</DialogTitle>
                <DialogContent>
                    <form onSubmit={handleSubmit(handleSaveUser)}>
                    <Controller
                        name="firstName"
                        control={control}
                        rules={{ required: "First name is required" }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label={
                                <span>
                                Full Name <span style={{ color: 'red' }}>*</span>
                                </span>
                                }
                                fullWidth margin="dense"   
                                error={!!errors.firstName}
                                helperText={errors.firstName?.message}
                            />
                        )}
                    />
                        <Controller
                            name="lastName"
                            control={control}
                            rules={{ required: "Last name is required" }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label={
                                    <span>
                                    Last Name <span style={{ color: 'red' }}>*</span>
                                    </span>
                                }
                                    fullWidth
                                    margin="dense"
                                    error={!!errors.lastName}
                                    helperText={errors.lastName?.message}
                                />
                            )}
                        />
                        <Controller
                            name="designationId"
                            control={control}
                            rules={{ required: "Designation is required" }}
                            render={({ field }) => (
                                <FormControl fullWidth margin="dense" error={!!errors.designationId}>
                                    <InputLabel><span>
                                            Designation <span style={{ color: 'red' }}>*</span>
                                            </span></InputLabel>
                                    <Select
                                        {...field}
                                        label={
                                            <span>
                                            Designation <span style={{ color: 'red' }}>*</span>
                                            </span>
                                        }
                                        value={field.value || ""}
                                        //onChange={e => field.onChange(e)}  // Ensure the value is updated on change
                                    >
                                        {designations && designations.length > 0 && designations.map((designation) => (
                                            <MenuItem key={designation.id} value={designation.id}>
                                                {designation.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.designationId && <FormHelperText>{errors.designationId?.message}</FormHelperText>}
                                </FormControl>
                            )}
                        />
                        <Controller
                                name="roleId"
                                control={control}
                                rules={{ required: "Role is required" }}
                                render={({ field }) => (
                                    <FormControl fullWidth margin="dense" error={!!errors.roleId}>
                                        <InputLabel><span>
                                                    Role <span style={{ color: 'red' }}>*</span>
                                                    </span></InputLabel>
                                        <Select
                                            {...field}
                                            label={
                                                    <span>
                                                    Role <span style={{ color: 'red' }}>*</span>
                                                    </span>
                                                }
                                            value={field.value || ""}
                                        >
                                            {roles && roles.length > 0 && roles.map((role) => (
                                                <MenuItem key={role.id} value={role.id}>
                                                    {role.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {errors.roleId && <FormHelperText>{errors.roleId?.message}</FormHelperText>}
                                    </FormControl>
                                )}
                            />


                            
                        <Controller
                            name="contactNo"
                            control={control}
                            rules={{
                                pattern: {
                                    value: /^[0-9]{10,}$/,  // Adjust this regex for phone number validation
                                    message: "Invalid contact number"
                                }
                            }}
                            render={({ field }) => (
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
                                    {errors.contactNo && (
                                        <div style={{ color: 'red', fontSize: '12px' }}>
                                            {errors.contactNo.message}
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
                                pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" }
                            }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label={<span>
                                        Email <span style={{ color: 'red' }}>*</span>
                                        </span>}
                                    fullWidth
                                    margin="dense"
                                    error={!!errors.email}
                                    helperText={errors.email?.message}
                                />
                            )}
                        />
                    </form>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogClose} color="primary">Cancel</Button>
                    <Button onClick={handleSubmit(handleSaveUser)} color="primary">{selectedUser ? "Update" : "Save"}</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for Success/Error */}
            <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </>
    );
};

export default ManageUsers;
