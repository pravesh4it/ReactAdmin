import { Card, Typography, Box } from "@mui/material";
import ReCAPTCHA from "react-google-recaptcha";

const CaptchaScreen = ({ onSuccess }) => {

  return (
    <Box height="100vh" display="flex" alignItems="center" justifyContent="center">
      <Card sx={{ p: 4, textAlign: "center" }}>

        <Typography variant="h6">
          Verify you are human
        </Typography>

        <ReCAPTCHA
          sitekey="6Lc4CIIsAAAAACRxb_ux9_5iJfdrFprLTNZFhL21"
          onChange={onSuccess}
        />

      </Card>
    </Box>
  );
};

export default CaptchaScreen;