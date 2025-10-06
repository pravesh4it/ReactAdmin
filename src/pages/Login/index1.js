import React, { useState, useEffect, useContext } from "react";
import { useForm } from "react-hook-form";
import {
  TextField,
  Button,
  Box,
  Typography,
  Container,
  Grid,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Link,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { MyContext } from '../../App';
import { Login } from "../../api/auth";
import bgImage from '../../assets/images/Login-background.jpg'


const LoginForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const { setIsLogin } = useContext(MyContext);

  useEffect(() => {
    //setisHideSidebarAndHeader(true);
    setIsLogin(false);
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await Login({ username: data.email, password: data.password });

      if (response.errors === null) {
        const { jwtToken, email, role, id } = response.result.data;

        localStorage.setItem("token", jwtToken);
        localStorage.setItem("email", email);
        localStorage.setItem("role", role);
        localStorage.setItem("loginState", true);
        localStorage.setItem("userid", id);

        setIsLogin(true);
        //setisHideSidebarAndHeader(false);
        navigate("/dashboard");
      } else {
        setErrorMessage("Invalid email or password.");
      }
    } catch {
      setErrorMessage("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container sx={{ height: '100vh', backgroundColor:'#fff' }}>
      {/* Left Side – Welcome Panel */}
      <Grid
          item
          xs={12}
          md={7}
          sx={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: "#fff",
            px: 5,
            py: { xs: 8, md: 0 },
            textAlign: "center",
            minHeight: '50vh',
            backgroundImage: `url(${bgImage})`, // Make sure this image is in your public/images folder
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(187, 206, 241, 0.76)',
              zIndex: 1,
            },
          }}
        >
          {/* Content with zIndex 2 to appear above overlay */}
          <Box sx={{ zIndex: 2, maxWidth: 600 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Pro Dynamic Research</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Nice to see you again</Typography>
            <Typography variant="h2" sx={{ fontWeight: 900, mt: 1 }}>WELCOME BACK</Typography>
            <Typography variant="body1" sx={{ mt: 3 }}>
              Pro Dynamic Research is a leading organization dedicated to delivering only authentic survey data. We ensure accuracy, reliability, and actionable insights to support informed decision-making across diverse industries and sectors.
            </Typography>
          </Box>
        </Grid>


      {/* Right Side – Login Form */}
      <Grid item xs={12} md={5}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Container maxWidth="xs">
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, textAlign: "center" }}>
              Login Account
            </Typography>
            <Typography variant="body2" sx={{ textAlign: "center", color: "text.secondary", mb: 2 }}>
              Access to Survey Research Portal .
            </Typography>

            <TextField
              fullWidth
              label="Email ID"
              {...register("email", { required: "Email is required" })}
              error={!!errors.email}
              helperText={errors.email?.message}
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              {...register("password", { required: "Password is required" })}
              error={!!errors.password}
              helperText={errors.password?.message}
            />

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
  <FormControlLabel
    control={<Checkbox defaultChecked sx={{ color: "#1976d2", p: 0, pr: 1 }} />}
    label="Keep me signed in"
    sx={{ m: 0 }}
  />
  <Link href="#" variant="body2" color="primary">
    Forgot Password?
  </Link>
</Box>

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
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Login"}
            </Button>
          </Box>
        </Container>
      </Grid>
    </Grid>
  );
};

export default LoginForm;
