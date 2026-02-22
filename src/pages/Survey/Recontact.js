import { useEffect, useState } from "react";
import { emphasize, styled } from '@mui/material/styles';
import { useForm, Controller } from "react-hook-form";
import {
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Button,
  Snackbar,
  Alert,
  TextField,
  FormHelperText,
  Typography,
  Chip
} from "@mui/material";
import { AddRecontact, GetOptionsSurvey } from "../../api/survey";
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

// Styled Breadcrumb component
const StyledBreadcrumb = styled(Chip)(({ theme }) => {
  const backgroundColor = theme.palette.mode === 'light'
    ? theme.palette.grey[100]
    : theme.palette.grey[800];
  return {
    backgroundColor,
    height: theme.spacing(3),
    color: theme.palette.text.primary,
    fontWeight: theme.typography.fontWeightRegular,
    '&:hover, &:focus': {
      backgroundColor: emphasize(backgroundColor, 0.06),
    },
    '&:active': {
      boxShadow: theme.shadows[1],
      backgroundColor: emphasize(backgroundColor, 0.12),
    },
  };
});

const RecontactSurvey = () => {
  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      description: "",
      survey: ""
    },
  });

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState({ surveys: [] });
  const [csvFile, setCsvFile] = useState(null);

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await GetOptionsSurvey();
        setOptions({
          surveys: response.result.data.surveys
        });
      } catch (error) {
        console.error("Error fetching survey options:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  // --- New: download template function ---
  const downloadTemplate = () => {
    // Define CSV header and an example row. Adjust columns as per your backend requirements.
    const header = ["respondentId", "email", "firstName", "lastName", "phone", "notes"];
    const example = ["", "jane.doe@example.com", "Jane", "Doe", "1234567890", "optional notes"];

    // Build CSV content
    const rows = [header, example];
    const csvContent = rows.map(r => r.map(cell =>
      // escape double quotes and wrap in quotes if needed
      (`"${String(cell).replace(/"/g, '""')}"`)
    ).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "recontact_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const onSubmit = async (data) => {
    try {
      const createdById = localStorage.getItem("userid");
      const formData = new FormData();
      formData.append("description", data.description);
      formData.append("surveyId", data.survey);
      formData.append("createdById", createdById);
      if (csvFile) {
        formData.append("file", csvFile);
      }

      const response = await AddRecontact(formData);

      if (!response.errors) {
        showSnackbar("Recontact created successfully", "success");
        reset();
        setCsvFile(null);
      } else {
        showSnackbar("Failed to create recontact", "error");
      }
    } catch (error) {
      console.error("Error submitting survey:", error);
      showSnackbar("An unexpected error occurred", "error");
    }
  };

  return (
    <>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="right-content w-100">
          <div className="card shadow border-0 w-100 flex-row p-4">
            <h5 className="mb-0"> Recontact Survey</h5>
          </div>

          <div className="card shadow border-0 p-3 mt-4">
            <form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data">
              <Grid container spacing={2}>

                {/* Description */}
                <Grid item xs={12}>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => <TextField {...field} label="Description" fullWidth />}
                  />
                </Grid>

                {/* Survey Dropdown */}
                <Grid item xs={4}>
                  <Controller
                    name="survey"
                    control={control}
                    rules={{ required: "Survey is required" }}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.survey}>
                        <InputLabel>Survey</InputLabel>
                        <Select
                          {...field}
                          label="Survey"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                        >
                          {options?.surveys?.map((survey) => (
                            <MenuItem key={survey.id} value={survey.id}>
                              {survey.name}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.survey && (
                          <FormHelperText>{errors.survey.message}</FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>

                {/* File Upload + Download Template */}
                <Grid item xs={12}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    Upload CSV File (Optional)
                  </Typography>

                  {/* Download template button */}
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={downloadTemplate}
                    sx={{ mr: 2, mb: 1 }}
                  >
                    Download Template
                  </Button>

                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files[0])}
                  />
                </Grid>

              </Grid>

              {/* Submit Button */}
              <Button
                variant="contained"
                color="primary"
                type="submit"
                sx={{ mt: 2 }}
              >
                Submit
              </Button>
            </form>
          </div>
        </div>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={10000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} variant="filled">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default RecontactSurvey;
