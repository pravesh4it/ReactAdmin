import { useEffect, useState } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { useLocation, useParams } from "react-router-dom";
import { UpdateSurveyResponse } from "../../api/survey";
import SuccessImg from "../../assets/images/success.png";
import DisqualifyImg from "../../assets/images/disqualify.png";
import QuotaFullImg from "../../assets/images/quotafull.png";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

const SurveyResponse = () => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [responseType, setResponseType] = useState("");
  const { type } = useParams();
  const location = useLocation();
  const [responseError, setResponseError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const queryParams = new URLSearchParams(location.search);
        const uid = queryParams.get("uid");
        const createdById = localStorage.getItem("userid");

        if (!createdById) {
          showSnackbar("User ID not found in local storage", "error");
          return;
        }

        const json_data = {
          uid: uid,
          response_type: type,
          addedby: createdById,
        };

        const response = await UpdateSurveyResponse(json_data);

        if (response?.errors == null) {
          showSnackbar("Survey response updated successfully", "success");
          setResponseType(type);
        } else {
          const message = response?.errors.response.data;
          setResponseError(message);
          showSnackbar(message, "error");
          setResponseType("Error");
        }
      } catch (error) {
        console.error("Error in fetchData:", error);
        showSnackbar("An unexpected error occurred", "error");
      }
    };

    fetchData();
  }, [location.search, type]);

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const renderResponseContent = () => {
    switch (responseType) {
      case "success":
        return (
          <>
            <img src={SuccessImg} alt="Success" className="response-image mb-3" width={"200px"} />
            <h1>Survey Completed Successfully!</h1>
            <p>Thank you for completing the survey. Your feedback is valuable to us.</p>
          </>
        );
      case "disqualify":
        return (
          <>
            <img src={DisqualifyImg} alt="Disqualified" className="response-image mb-3" width={"200px"} />
            <h1>You Have Been Disqualified</h1>
            <p>Sorry, you do not meet the criteria for this survey.</p>
          </>
        );
      case "quotafull":
        return (
          <>
            <img src={QuotaFullImg} alt="Quota Full" className="response-image mb-3" width={"200px"} />
            <h1>Survey Quota Full</h1>
            <p>Thank you for your interest, but the survey quota has been reached.</p>
          </>
        );
      case "Error":
        return (
          <>
            <h1>{responseError}</h1>
            <p>Thank you for your interest.</p>
          </>
        );
      default:
        return <p className="info-text">Loading survey response...</p>;
    }
  };

  return (
    <div className="survey-response-page">
      <header className="company-header">
        <h2>Pro Dynamic Research</h2>
      </header>

      <main className="response-wrapper">
        <div className="response-card">
          {renderResponseContent()}
        </div>
      </main>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} variant="filled">
          {snackbarMessage}
        </Alert>
      </Snackbar>

      
    </div>
  );
};

export default SurveyResponse;
