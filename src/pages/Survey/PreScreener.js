import { useEffect, useRef, useState } from "react";
import { styled, emphasize } from "@mui/material/styles";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Chip from "@mui/material/Chip";
import HomeIcon from "@mui/icons-material/Home";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { AddSurveyResponse, CreateQuiz, CreateSurvey, GetOptionsSurvey, GetSurvey, GetSurveyPreScreening } from "../../api/survey";
import { Button, Checkbox, FormControl, FormControlLabel, FormHelperText, Grid, InputLabel, MenuItem, Select, TextField, Typography } from "@mui/material";
import { Controller, useForm } from "react-hook-form";


const PreScreener = () => {
    const { control, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            title: "",
            question: "",
            quiztype: "",
            options: "" // New field
          },
      });
    const navigate = useNavigate();
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");
    const [surveyId, setSurveyId] = useState("x");
    const [survey, setSurvey] = useState({});
    const { sid } = useParams(); // Get Survey ID from URL
    const [rowData, setRowData] = useState([]);
    const [options, setOptions] = useState({
        quiztype:[]
      });
    useEffect(() => {
        const fetchData = async () => {
            try {
                setSurveyId(sid);
                const survey = await GetSurvey(sid);
                setSurvey(survey.result.data);
                const response = await GetOptionsSurvey();
                            setOptions({
                                quiztype: response.result.data.quiztype
                              
                            });
                
                const questions = await GetSurveyPreScreening(sid);
                setRowData(questions.result.data);
                console.log(rowData);
                
                const createdById = localStorage.getItem("userid");
                if (!createdById) {
                    showSnackbar("User ID not found in local storage", "error");
                    return;
                }
            } catch (error) {
                console.error("Error in fetchData:", error);
                showSnackbar("An unexpected error occurred", "error");
            }
        };
        fetchData();
    }, []); // Trigger only on URL query changes


    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    const showSnackbar = (message, severity) => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };
    const onSubmit = async (data) => {
            try {
              debugger;
              console.log("Form Data:", data);
              const createdById = localStorage.getItem("userid");
                    // Sanitize options: trim each line and join with newline
              const formattedOptions = data.options
                    .split("\n")
                    .map(opt => opt.trim())
                    .filter(Boolean)
                    .join("\n");

              const json_data1 ={
                    "surveyId": surveyId,
                    "questionType": data.quiztype,
                    "question": data.question,
                    "option1": formattedOptions,
                    "addedBy": createdById
                  }
                  

                const response = await CreateQuiz(json_data1);
                console.log(response);
          
              if (response.errors == null) {
                // Show success message
                showSnackbar("Record added successfully", "success");
                
                // Reset the form to default values
                reset();
              } else {
                // Show error message
                showSnackbar("Failed to save record", "error");
              }
            } catch (error) {
              console.error("Error submitting quiz:", error);
              showSnackbar("An unexpected error occurred", "error");
            }
          };
          

    return (
        <>
            <div className="right-content w-100">
            <div className="card shadow border-0 w-100 flex-row p-4">
            <div style={{ display: "flex", alignItems: "flex-start" }}>
            <Button
                variant="text"
                onClick={() => navigate("/survey/details/" + surveyId)}
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

            <div className="card shadow border-0 p-3">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Typography variant="h5" gutterBottom>
                    
                    </Typography>
                    <Grid container spacing={2}>
                        {/* Title */}
                        {/* Country Dropdown */}
                        <Grid item xs={3}>
                        <Controller
                            name="quiztype"
                            control={control}
                            rules={{ required: "quiztype is required" }}
                            render={({ field }) => (
                            <FormControl fullWidth error={!!errors.quiztype}>
                                <InputLabel>Question Type</InputLabel>
                                <Select
                                {...field}
                                label="Question Type"
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value)}
                                >
                                {options?.quiztype?.map((quiztype) => (
                                    <MenuItem key={quiztype.id} value={quiztype.id}>
                                    {quiztype.name}
                                    </MenuItem>
                                ))}
                                </Select>
                                {errors.country && (
                                <FormHelperText>{errors.quiztype.message}</FormHelperText>
                                )}
                            </FormControl>
                            )}
                        />
                        </Grid>

                        <Grid item xs={6}>
                            <Controller
                                name="question"
                                control={control}
                                render={({ field }) => <TextField {...field} label="Question" fullWidth />}
                            />
                        </Grid>

                        
                        {/* Options */}
                        <Grid item xs={3}>
                            <Controller
                                name="options"
                                control={control}
                                rules={{ required: "Options are required" }}
                                render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Options (one per line)"
                                    multiline
                                    rows={4}
                                    fullWidth
                                    placeholder="Option 1\nOption 2\nOption 3"
                                    error={!!errors.options}
                                    helperText={errors.options?.message}
                                />
                                )}
                            />
                            </Grid>


                    </Grid>

    {/* Submit Button */}
    <Button variant="contained" color="primary" type="submit" sx={{ mt: 2 }}>
        Add
    </Button>
                </form>

            </div>
            <div className="card shadow border-0 p-3">
            <h5>Question / Answer</h5>
<Grid container spacing={2}>
    {rowData.length === 0 ? (
        <Grid item xs={12}>
            <Typography>No questions added yet.</Typography>
        </Grid>
    ) : (
        rowData.map((item, index) => (
            <Grid item xs={12} key={item.id || index}>
                <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                        Question Type: {options.quiztype.find(q => q.id === item.questionType)?.name || item.questionType}
                    </Typography>
                    <Typography variant="subtitle1" fontWeight="bold">
                        Q{index + 1}: {item.question}
                    </Typography>
                    <Typography sx={{ mt: 1 }}>
                        Options:
                        <ul style={{ margin: "8px 0", listStyleType: "none", paddingLeft: 0 }}>
                            {item.option1?.split("\n").map((opt, i) => (
                                <li key={i}>{opt}</li>
                            ))}
                        </ul>
                    </Typography>
                    <Button variant="outlined" color="error" size="small">
                        Delete
                    </Button>
                </div>
            </Grid>
        ))
    )}
</Grid>


            </div>
        </div>
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} variant="filled">
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </>
    );
};

export default PreScreener;
