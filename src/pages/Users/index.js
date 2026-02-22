import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Snackbar,
  Alert,
  IconButton,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

import {
  GetUsers,
  AddUser,
  UpdateUser,
  DeleteUser,
  GetOptions
} from "../../api/users";

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
      roleId: "",
      contactNo: "",
      email: ""
    }
  });

  // 🔄 LOAD USERS (REUSABLE)
  const loadUsers = async () => {
    try {
      const response = await GetUsers();
      setRowData(response.result.data);
    } catch (error) {
      console.error(error);
      showSnackbar("Failed to load users", "error");
    }
  };

  // INITIAL LOAD
  useEffect(() => {
    const fetchData = async () => {
      try {
        await loadUsers();

        const optionsResponse = await GetOptions();
        setDesignations(optionsResponse.result.data.designations);
        setRoles(optionsResponse.result.data.roles);
      } catch (error) {
        console.error(error);
        showSnackbar("Failed to load data", "error");
      }
    };

    fetchData();
  }, []);

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => setSnackbarOpen(false);

  const handleSearch = (e) => setSearchText(e.target.value);

  const handleEdit = (user) => {
    setSelectedUser(user);
    reset(
      user || {
        firstName: "",
        lastName: "",
        designationId: "",
        roleId: "",
        contactNo: "",
        email: ""
      }
    );
    setOpenEditDialog(true);
  };

  const handleDelete = (user) => {
    setSelectedUser(user);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await DeleteUser(selectedUser.id);
      await loadUsers(); // ✅ reload list
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
         // 🔴 UPDATE USER

      const selectedRole = roles.find(r => r.id === data.roleId);

      const updatePayload = {
        UserId: selectedUser.id,              // ✅ REQUIRED
        FirstName: data.firstName,
        LastName: data.lastName,
        Role: selectedRole?.name || data.role, // ✅ ROLE NAME
        DesignationId: data.designationId,     // ✅ GUID string
        ContactNo: data.contactNo || null      // ✅ nullable
      };

      console.log("Updating user with payload:", updatePayload);

      const response = await UpdateUser(updatePayload);

      if (!response.errors) {
        await loadUsers();
        showSnackbar("User updated successfully", "success");
      } else {
        showSnackbar("Failed to update user", "error");
      }
      } else {
        // ADD
        const role = roles.find(r => r.id === data.roleId);

        const jsonData = {
          username: data.email,
          role: role?.name,
          firstName: data.firstName,
          lastName: data.lastName,
          designationId: data.designationId,
          contactNo: data.contactNo
        };

        const response = await AddUser(jsonData);
        if (!response.errors) {
          await loadUsers(); // ✅ reload
          showSnackbar("User added successfully", "success");
        } else {
          showSnackbar("Failed to add user", "error");
        }
      }
    } catch (error) {
      console.error(error);
      showSnackbar("Error while saving user", "error");
    } finally {
      setOpenEditDialog(false);
      setSelectedUser(null);
      reset();
    }
  };

  const columnDefs = [
    { headerName: "First Name", field: "firstName", flex: 1 },
    { headerName: "Last Name", field: "lastName", flex: 1 },
    { headerName: "Designation", field: "designation", flex: 1.5 },
    { headerName: "Role", field: "role", flex: 1 },
    { headerName: "Contact No", field: "contactNo", flex: 1 },
    { headerName: "Email", field: "email", flex: 1.5 },
    {
      headerName: "Actions",
      flex: 0.7,
      cellRenderer: (params) => (
        <>
          <IconButton onClick={() => handleEdit(params.data)}>
            <EditIcon color="primary" />
          </IconButton>
          <IconButton onClick={() => handleDelete(params.data)}>
            <DeleteIcon color="error" />
          </IconButton>
        </>
      )
    }
  ];

  return (
    <>
      <div className="right-content w-100">
        <div className="card shadow border-0 p-4">
          <h5>Manage Users</h5>
        </div>

        <div className="card shadow border-0 p-3">
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
            <TextField
              placeholder="Search..."
              size="small"
              value={searchText}
              onChange={handleSearch}
              sx={{ mr: 1 }}
            />
            <Button variant="contained" onClick={() => handleEdit(null)}>
              Add User
            </Button>
          </div>

          <div className="ag-theme-quartz" style={{ height: 500 }}>
            <AgGridReact
              rowData={rowData.filter(row =>
                Object.values(row).some(v =>
                  String(v).toLowerCase().includes(searchText.toLowerCase())
                )
              )}
              columnDefs={columnDefs}
              pagination
              paginationPageSize={paginationPageSize}
            />
          </div>
        </div>
      </div>

      {/* DELETE DIALOG */}
      <Dialog open={openDeleteDialog} onClose={handleDialogClose}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this user?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button color="error" onClick={handleConfirmDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* ADD / EDIT DIALOG */}
      <Dialog open={openEditDialog} onClose={handleDialogClose} fullWidth maxWidth="sm">
        <DialogTitle>{selectedUser ? "Edit User" : "Add User"}</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit(handleSaveUser)}>
            <Controller
              name="firstName"
              control={control}
              rules={{ required: "First name required" }}
              render={({ field }) => (
                <TextField {...field} label="First Name *" fullWidth margin="dense" error={!!errors.firstName} helperText={errors.firstName?.message} />
              )}
            />

            <Controller
              name="lastName"
              control={control}
              rules={{ required: "Last name required" }}
              render={({ field }) => (
                <TextField {...field} label="Last Name *" fullWidth margin="dense" error={!!errors.lastName} helperText={errors.lastName?.message} />
              )}
            />

            <Controller
              name="designationId"
              control={control}
              rules={{ required: "Designation required" }}
              render={({ field }) => (
                <FormControl fullWidth margin="dense" error={!!errors.designationId}>
                  <InputLabel>Designation *</InputLabel>
                  <Select {...field} label="Designation *">
                    {designations.map(d => (
                      <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{errors.designationId?.message}</FormHelperText>
                </FormControl>
              )}
            />

            <Controller
              name="roleId"
              control={control}
              rules={{ required: "Role required" }}
              render={({ field }) => (
                <FormControl fullWidth margin="dense" error={!!errors.roleId}>
                  <InputLabel>Role *</InputLabel>
                  <Select {...field} label="Role *">
                    {roles.map(r => (
                      <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{errors.roleId?.message}</FormHelperText>
                </FormControl>
              )}
            />

            <Controller
              name="contactNo"
              control={control}
              render={({ field }) => (
                <PhoneInput country="in" value={field.value} onChange={field.onChange} />
              )}
            />

            <Controller
              name="email"
              control={control}
              rules={{ required: "Email required" }}
              render={({ field }) => (
                <TextField {...field} label="Email *" fullWidth margin="dense" error={!!errors.email} helperText={errors.email?.message} />
              )}
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleSubmit(handleSaveUser)} variant="contained">
            {selectedUser ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert severity={snackbarSeverity}>{snackbarMessage}</Alert>
      </Snackbar>
    </>
  );
};

export default ManageUsers;
