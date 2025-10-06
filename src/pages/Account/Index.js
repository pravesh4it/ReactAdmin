import * as React from "react";
import {
  Box, Grid, Card, CardHeader, CardContent, Divider, Stack, TextField, Button,
  Avatar, IconButton, Tooltip, Tabs, Tab, Snackbar, Alert, LinearProgress, Typography
} from "@mui/material";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import SaveIcon from "@mui/icons-material/Save";
import LockResetIcon from "@mui/icons-material/LockReset";
import PersonIcon from "@mui/icons-material/Person";
import SecurityIcon from "@mui/icons-material/Security";
import { useForm, Controller } from "react-hook-form";
import { ChangePassword, GetAdminProfile } from "../../api/users";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css'; // Import styles for the phone input


export default function MyAccount() {
  const [tab, setTab] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [savingPwd, setSavingPwd] = React.useState(false);
  const [snack, setSnack] = React.useState({ open: false, msg: "", severity: "success" });

  // Profile form
  const {
    control: profileControl,
    handleSubmit: submitProfile,
    reset: resetProfile,
    formState: { errors: profileErrors, isDirty: isProfileDirty }
  } = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      contactNo: "",
      designation: "",
      department: "",
      role: "",
    }
  });

  // Password form
  const {
    control: pwdControl,
    handleSubmit: submitPwd,
    reset: resetPwd,
    watch: watchPwd,
    formState: { errors: pwdErrors }
  } = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }
  });
  const newPasswordValue = watchPwd("newPassword");

  const openSnack = (msg, severity = "success") => setSnack({ open: true, msg, severity });

  const fetchProfile = React.useCallback(async () => {
    setLoading(true);
    try {
      const createdById = localStorage.getItem("userid");
      const res = await GetAdminProfile(createdById);
      const data = res?.result?.data ?? {};
      resetProfile({
        firstName: data.firstName ?? "",
        lastName: data.lastName ?? "",
        email: data.email ?? "",
        contactNo: data.contactNo ?? "",
        designation: data.designationName ?? "",
        department: data.departmentName ?? "",
        role: data.roles[0].name ?? "User",
      });
    } catch (e) {
      console.error(e);
      openSnack("Failed to load profile", "error");
    } finally {
      setLoading(false);
    }
  }, [resetProfile]);

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onSaveProfile = submitProfile(async (values) => {
    try {
      setSavingProfile(true);
      //await UpdateMyProfile({ ...values, avatarUrl });
      openSnack("Profile saved");
    } catch (e) {
      console.error(e);
      openSnack("Failed to save profile", "error");
    } finally {
      setSavingProfile(false);
    }
  });

  const onResetProfile = async () => {
    await fetchProfile();
  };

  const onChangePassword = submitPwd(async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      openSnack("New password and confirm password do not match", "warning");
      return;
    }
    try {
      setSavingPwd(true);
      console.log("Change password to:", values.newPassword);
      const createdById = localStorage.getItem("userid");
      const json_data={
        id: createdById,
        oldPassword: values.currentPassword,
        newPassword: values.newPassword
      }
      const result = await ChangePassword(json_data);
      console.log("Change password result:", result);
      if(result?.status === 200) resetPwd();
      openSnack("Password changed");
    } catch (e) {
      console.error(e);
      openSnack(e?.message || "Failed to change password", "error");
    } finally {
      setSavingPwd(false);
    }
  });

  
  return (
    <Box sx={{ pt: { xs: 1, md: 4 }, pl: { xs: 2, md: 2 }, pr: { xs: 2, md: 2 }, width: "100%", maxWidth: "100%", mx: "auto",mt: { xs: 2, md: 6 } }}>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
        My Account
      </Typography>

      <Card sx={{ mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<PersonIcon />} iconPosition="start" label="Profile" />
          <Tab icon={<SecurityIcon />} iconPosition="start" label="Security" />
        </Tabs>
      </Card>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Profile */}
      {tab === 0 && (
        <Card>
          <CardHeader title="Profile" titleTypographyProps={{ fontWeight: 800 }} />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Stack spacing={1.5} alignItems="center">
                    <Avatar
                        sx={{ width: 120, height: 120, fontSize: 40, bgcolor: "primary.main" }}
                    >
                        {'P'}
                       {/* {email?.firstName?.[0]?.toUpperCase() || "U"} */}
                    </Avatar>
                    </Stack>
              </Grid>

              <Grid item xs={12} md={9}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="firstName"
                      control={profileControl}
                      rules={{ required: "First name is required" }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="First Name"
                          fullWidth
                          error={!!profileErrors.firstName}
                          helperText={profileErrors.firstName?.message}
                          required
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="lastName"
                      rules={{ required: "Last name is required" }}
                      control={profileControl}
                      render={({ field }) => (
                        <TextField {...field} label="Last Name" fullWidth error={!!profileErrors.lastName} helperText={profileErrors.lastName?.message} required />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="email"
                      control={profileControl}
                      rules={{
                        required: "Email is required",
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: "Enter a valid email",
                        },
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Email"
                          type="email"
                          fullWidth
                          error={!!profileErrors.email}
                          helperText={profileErrors.email?.message}
                          required
                          disabled={true}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                            name="contactNo"
                            control={profileControl}
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
                                    {profileErrors.contactNo && (
                                        <div style={{ color: 'red', fontSize: '12px' }}>
                                            {profileErrors.contactNo.message}
                                        </div>
                                    )}
                                </div>
                            )}
                        />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="department"
                      control={profileControl}
                      render={({ field }) => (
                        <TextField {...field} label="Department" fullWidth />
                      )}
                      disabled={true}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="designation"
                      control={profileControl}
                      render={({ field }) => (
                        <TextField {...field} label="Designation" fullWidth />
                      )}
                      disabled={true}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="role"
                      control={profileControl}
                      render={({ field }) => (
                        <TextField {...field} label="Role" fullWidth />
                      )}
                      disabled={true}
                    />
                  </Grid>
                </Grid>

                <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={onSaveProfile}
                    disabled={savingProfile}
                  >
                    Save Profile
                  </Button>
                  <Button variant="outlined" onClick={onResetProfile} disabled={savingProfile || !isProfileDirty}>
                    Reset
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Security */}
      {tab === 1 && (
        <Card sx={{ mt: 2 }}>
          <CardHeader title="Security" titleTypographyProps={{ fontWeight: 800 }} />
          <Divider />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="currentPassword"
                  control={pwdControl}
                  rules={{ required: "Current password is required" }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Current Password"
                      type="password"
                      fullWidth
                      error={!!pwdErrors.currentPassword}
                      helperText={pwdErrors.currentPassword?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6} />
              <Grid item xs={12} sm={6}>
                <Controller
                  name="newPassword"
                  control={pwdControl}
                  rules={{
                    required: "New password is required",
                    minLength: { value: 8, message: "Minimum 8 characters" },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="New Password"
                      type="password"
                      fullWidth
                      error={!!pwdErrors.newPassword}
                      helperText={pwdErrors.newPassword?.message || "Minimum 8 characters"}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="confirmPassword"
                  control={pwdControl}
                  rules={{
                    required: "Confirm your password",
                    validate: (v) => v === newPasswordValue || "Passwords do not match",
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Confirm New Password"
                      type="password"
                      fullWidth
                      error={!!pwdErrors.confirmPassword}
                      helperText={pwdErrors.confirmPassword?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
              <Button
                variant="contained"
                startIcon={<LockResetIcon />}
                onClick={onChangePassword}
                disabled={savingPwd}
              >
                Change Password
              </Button>
              <Button variant="outlined" onClick={() => resetPwd()} disabled={savingPwd}>
                Reset
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
