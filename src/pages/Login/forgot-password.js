import React, { useState, useEffect, useContext } from "react";
import { useForm } from "react-hook-form";
import {
  TextField,
  Button,
  Box,
  Typography,
  Container,
  Grid,
  CircularProgress,
  Link,
  Alert
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { MyContext } from "../../App";
import { ForgotPassword } from "../../api/auth";
import bgImage from "../../assets/images/Login-background.jpg";

const ForgotPasswordForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const { setIsLogin } = useContext(MyContext);

  useEffect(() => {
    setIsLogin(false);
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await ForgotPassword({ email: data.email });

      if (response.errors === null) {
        setSuccessMessage(
          "Password reset instructions have been sent to your email."
        );
      } else {
        setErrorMessage("Unable to process request. Please try again.");
      }
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container sx={{ height: "100vh", backgroundColor: "#fff" }}>
      
      {/* Left Side – Welcome Panel */}
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
          py: { xs: 8, md: 0 },
          textAlign: "center",
          minHeight: "50vh",
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(187, 206, 241, 0.76)",
            zIndex: 1
          }
        }}
      >
        <Box sx={{ zIndex: 2, maxWidth: 600 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Pro Dynamic Research
          </Typography>

          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Forgot Your Password?
          </Typography>

          <Typography variant="h2" sx={{ fontWeight: 900, mt: 1 }}>
            RESET ACCESS
          </Typography>

          <Typography variant="body1" sx={{ mt: 3 }}>
            Enter your registered email address and we will send you instructions
            to reset your password securely.
          </Typography>
        </Box>
      </Grid>

      {/* Right Side – Forgot Password Form */}
      <Grid
        item
        xs={12}
        md={5}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <Container maxWidth="xs">
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, textAlign: "center" }}
            >
              Forgot Password
            </Typography>

            <Typography
              variant="body2"
              sx={{
                textAlign: "center",
                color: "text.secondary",
                mb: 2
              }}
            >
              Enter your email to receive password reset instructions.
            </Typography>

            <TextField
              fullWidth
              label="Email Address"
              {...register("email", {
                required: "Email is required"
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
            />

            {errorMessage && (
              <Alert severity="error">{errorMessage}</Alert>
            )}

            {successMessage && (
              <Alert severity="success">{successMessage}</Alert>
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
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: "#fff" }} />
              ) : (
                "Send Reset Link"
              )}
            </Button>

            <Box sx={{ textAlign: "center", mt: 1 }}>
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate("/")}
              >
                Back to Login
              </Link>
            </Box>
          </Box>
        </Container>
      </Grid>
    </Grid>
  );
};

export default ForgotPasswordForm;