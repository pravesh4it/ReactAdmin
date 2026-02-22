import { useEffect, useState } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { useLocation, useParams } from "react-router-dom";
import { UpdateSurveyResponse } from "../../api/survey";
import SuccessImg from "../../assets/images/success.png";
import DisqualifyImg from "../../assets/images/disqualify.png";
import QuotaFullImg from "../../assets/images/quotafull.png";
import surveyresponse from "../../assets/images/surveyresponse.png";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import Logo from "../../assets/images/IconOnly_Transparent_NoBuffer.png";

const SurveyResponse = () => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [responseType, setResponseType] = useState("");
  const { type } = useParams();
  const location = useLocation();
  const [responseError, setResponseError] = useState("");
  const [surveyId, setSurveyId] = useState("");
  const [userId, setUserId] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const queryParams = new URLSearchParams(location.search);
        const uid = queryParams.get("uid");
        const createdById = localStorage.getItem("userid");

        //if (!createdById) {
        //  showSnackbar("User ID not found in local storage", "error");
        //  return;
        //}

        const json_data = {
          uid: uid,
          response_type: type,
          addedby: createdById,
        };

        const response = await UpdateSurveyResponse(json_data);
        console.log("UpdateSurveyResponse response:", response);
        setIpAddress(response?.result.data?.ipAddress || "N/A");
        setSurveyId(response?.result.data?.surveyId || "N/A");
        setUserId(response?.result.data?.userId || "N/A");
        setMessage(response?.result.data?.message || "");
        debugger;
        if (response?.errors == null) {
          const redirectLink = response.result.data?.redirectLink || null;
          showSnackbar("Survey response updated successfully", "success");
          setResponseType(response?.result.data?.status || "disqualify");
          if (redirectLink) {
            window.location.href = redirectLink;
          }

        } else {
          debugger;
          const message = response?.errors.response.data.message || "Failed to update survey response";
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
            <img src={surveyresponse} alt="Success" className="response-image mb-3" />
            <h1>Survey Completed Successfully!</h1>
            <p>Thank you for completing the survey. Your feedback is valuable to us.</p>
          </>
        );
      case "disqualify":
        return (
          <>
            <img src={surveyresponse} alt="Disqualified" className="response-image mb-3" />
            <h1>You have been disqualified</h1>
            <p>Sorry, you do not meet the criteria for this survey.</p>
          </>
        );
      case "quotafull":
        return (
          <>
            <img src={QuotaFullImg} alt="Quota Full" className="response-image mb-3" />
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
      <div className="header-content">
        <img src={Logo} alt="Pro Dynamic Research" className="company-logo" />
        <h2 className="company-name">Pro Dynamic Research</h2>
      </div>
    </header>


      <main className="response-wrapper">
        <div className="response-card">
          {renderResponseContent()}
        </div>
        

      </main>
      {1==2 && (
        
      
      <div className="response-details">
        <table className="response-table">
          <thead>
            <tr>
              <th>Survey ID</th>
              <th>User ID</th>
              <th>IP Address</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{surveyId}</td>
              <td>{userId}</td>
              <td>{ipAddress}</td>
              <td className={`status ${responseType}`}>
                {responseType}
                {message && <span className="status-message"> - {message}</span>}
              </td>
            </tr>
          </tbody>
        </table>
    </div>
)}
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
