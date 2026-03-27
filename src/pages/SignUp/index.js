import React, { useEffect, useState, useContext } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  Container,
  Grid,
  CircularProgress
} from "@mui/material";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { MyContext } from "../../App";
import { GetEmailbyCode, ResetPasswordAdmin } from "../../api/auth";
import bgImage from "../../assets/images/Login-background.jpg";

const ResetPassword = () => {
  const { setIsLogin } = useContext(MyContext);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code  = useParams();

  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const password = watch("password");

  useEffect(() => {
    setIsLogin(false);
    debugger;
    //const code = searchParams.get("code");

    if (!code) {
      setErrorMessage("Invalid reset link.");
      setLoading(false);
      return;
    }

    fetchEmail();
  }, []);

  const fetchEmail = async () => {
    try {
        console.log("Fetching email with code:", code);
       const response = await GetEmailbyCode(code.code);

      // 🔹 IMPORTANT: adjust according to your API shape
      if (response?.result?.data?.email) {
        setEmail(response.result.data.email);
      } else if (response?.data?.email) {
        setEmail(response.data.email);
      } else {
        setErrorMessage("Invalid or expired reset link.");
      }
    } catch {
      setErrorMessage("Invalid or expired reset link.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setSubmitLoading(true);
    setErrorMessage("");
    debugger;
    const payload = {
      code: code.code,
      password: data.password
    };


    try {
      const response = await ResetPasswordAdmin(payload);
      if (response.errors === null || response.success) {
        navigate("/");
      } else {
        setErrorMessage("Password reset failed.");
      }
    } catch (err) {
      setErrorMessage("Password reset failed.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <Grid container sx={{ height: "100vh", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Grid>
    );
  }

  return (
    <Grid container sx={{ height: "100vh", backgroundColor: "#fff" }}>

      {/* LEFT PANEL (Same as Login) */}
      <Grid
        item
        xs={12}
        md={7}
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          px: 5,
          textAlign: "center",
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          '&::before': {
            content: '""',
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(187, 206, 241, 0.76)",
            zIndex: 1
          }
        }}
      >
        <Box sx={{ zIndex: 2, maxWidth: 600 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Reset Your Password
          </Typography>
          <Typography variant="body1" sx={{ mt: 3 }}>
            Please set a new secure password for your account.
          </Typography>
        </Box>
      </Grid>

      {/* RIGHT PANEL */}
      <Grid
        item
        xs={12}
        md={5}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Container maxWidth="xs">
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, textAlign: "center" }}>
              Set New Password
            </Typography>

            {email && (
              <TextField
                fullWidth
                label="Email"
                value={email}
                InputProps={{ readOnly: true }}
              />
            )}

            <TextField
              fullWidth
              label="New Password"
              type="password"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Minimum 8 characters required"
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/,
                  message:
                    "Must include uppercase, lowercase, number, special character"
                }
              })}
              error={!!errors.password}
              helperText={errors.password?.message}
            />

            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              {...register("confirmPassword", {
                required: "Confirm password is required",
                validate: value =>
                  value === password || "Passwords do not match"
              })}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
            />

            {errorMessage && (
              <Typography color="error" variant="body2">
                {errorMessage}
              </Typography>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{
                borderRadius: 2,
                py: 1.5,
                mt: 2,
                fontWeight: "bold",
                backgroundColor: "#007fff"
              }}
              disabled={submitLoading}
            >
              {submitLoading
                ? <CircularProgress size={24} sx={{ color: "#fff" }} />
                : "Reset Password"}
            </Button>

          </Box>
        </Container>
      </Grid>
    </Grid>
  );
};

export default ResetPassword;