import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GetSurvey, GetSurveyCSVList, UploadSurveyCSV } from "../../api/survey";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Grid,
  Snackbar,
  Alert
} from "@mui/material";
import dayjs from "dayjs";

const UploadUniqueLinks = () => {
  const navigate = useNavigate();
  const { sid } = useParams();
  const [survey, setSurvey] = useState({});
  const [file, setFile] = useState(null);
  const [csvList, setCsvList] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // ref to reset file input
  const fileInputRef = useRef();

  useEffect(() => {
    fetchSurveyDetails();
    fetchCsvList();
  }, []);

  const fetchSurveyDetails = async () => {
    try {
      const surveyData = await GetSurvey(sid);
      setSurvey(surveyData.result.data);
    } catch (err) {
      showSnackbar("Failed to fetch survey details", "error");
    }
  };

  const fetchCsvList = async () => {
    try {
      const list = await GetSurveyCSVList(sid);
      setCsvList(list.result.data || []);
    } catch (err) {
      showSnackbar("Failed to fetch CSV list", "error");
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      showSnackbar("Please select a CSV file to upload", "error");
      return;
    }
    if (file.type !== "text/csv") {
      showSnackbar("Only CSV files are allowed", "error");
      return;
    }
    try {
      const createdById = localStorage.getItem("userid");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("surveyId", sid);
      formData.append("uploadedBy", createdById);

      const res = await UploadSurveyCSV(formData);
      if (res.errors == null) {
        showSnackbar("File uploaded successfully", "success");
        setFile(null);
        // reset file input so user can upload again
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        fetchCsvList();
      } else {
        showSnackbar("Failed to upload file", "error");
      }
    } catch (err) {
      showSnackbar("Error uploading file", "error");
    }
  };

  const handleDownloadSample = () => {
    const link = document.createElement("a");
    link.href = "/sample.csv"; // replace with actual path
    link.download = "sample.csv";
    link.click();
  };

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <div className="right-content w-100">
      {/* Header */}
      <div className="card shadow border-0 w-100 flex-row p-4">
            <div style={{ display: "flex", alignItems: "flex-start" }}>
            <Button
                variant="text"
                onClick={() => navigate("/survey/details/" + sid)}
                sx={{ p: 2, pr: 2 }}
                style={{ border: "1px solid #ccc", backgroundColor: "#f1f1f1", color: "#0c2a66ff", fontWeight: "bold" }}
            >
                ⬅️ Back
            </Button>
            <div style={{ paddingLeft: "12px", paddingTop: "4px" }}>
                <h5 className="mb-0 text-muted">#{survey.surveyName}</h5>
                <p className="mb-0" style={{ color: "#ccc" }}>{survey.surveyTitle}</p>
            </div>
        </div>
                
            </div>

      {/* Upload Section */}
      <div className="card shadow border-0 p-4">
        <Typography
          variant="h6"
          style={{ fontWeight: "bold", color: "#0c2a66" }}
          gutterBottom
        >
          Upload New Unique Links
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Maximum 1000 links are allowed at one time *
        </Typography>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={6}>
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </Grid>
          <Grid item xs={6} style={{ display: "flex", gap: "12px" }}>
            <Button
              variant="contained"
              sx={{ backgroundColor: "#4969c8" }}
              onClick={handleUpload}
            >
              + Upload
            </Button>
            <Button
              variant="outlined"
              sx={{ borderColor: "#4969c8", color: "#4969c8" }}
              onClick={handleDownloadSample}
            >
              Download Sample
            </Button>
          </Grid>
        </Grid>
      </div>

      {/* CSV List */}
      <div className="card shadow border-0 p-4">
        <Typography
          variant="h6"
          gutterBottom
          sx={{ fontWeight: "bold", color: "#0c2a66" }}
        >
          Uploaded CSV Files
        </Typography>

        {csvList.length === 0 ? (
          <Typography>No files uploaded yet.</Typography>
        ) : (
          <TableContainer component={Paper} elevation={0}>
  <Table>
    {/* Table Header */}
    <TableHead>
      <TableRow sx={{ backgroundColor: "#f5f6fa" }}>
        <TableCell sx={{ fontWeight: "bold", p: "8px" }}>S. No</TableCell>
        <TableCell sx={{ fontWeight: "bold", p: "8px" }}>File Name</TableCell>
        <TableCell sx={{ fontWeight: "bold", p: "8px" }}>Total Links</TableCell>
        <TableCell sx={{ fontWeight: "bold", p: "8px" }}>Used Links</TableCell>
        <TableCell sx={{ fontWeight: "bold", p: "8px" }}>Remaining Links</TableCell>
        <TableCell sx={{ fontWeight: "bold", p: "8px" }}>Updated At</TableCell>
      </TableRow>
    </TableHead>

    {/* Table Body */}
    <TableBody>
      {csvList.map((file, index) => (
        <TableRow key={file.id}>
          <TableCell sx={{ p: "8px" }}>{index + 1}</TableCell>
          <TableCell sx={{ p: "8px" }}>
            <a href={file.fileUrl} target="_blank" rel="noreferrer">
              {file.fileName_show}
            </a>
          </TableCell>
          <TableCell sx={{ p: "8px" }}>{file.totalLinks}</TableCell>
          <TableCell sx={{ p: "8px" }}>{file.usedLinks}</TableCell>
          <TableCell sx={{ p: "8px" }}>{file.remainingLinks}</TableCell>
          <TableCell sx={{ p: "8px" }}>
            {dayjs(file.uploadedAt).format("MMM DD, YYYY hh:mmA")}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>

        )}
      </div>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default UploadUniqueLinks;
