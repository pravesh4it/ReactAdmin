import { useEffect, useRef, useState } from "react";
import {
    Grid,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormLabel,
    Radio,
    RadioGroup,
    Checkbox,
    Button,
    Card,
    CardContent,
    Typography,
    Snackbar,
    Alert,
    CircularProgress,
    Box
} from "@mui/material";
import { useLocation } from "react-router-dom";
import {
    GetIsSurveyPreScreening,
    GetSurveyPreScreeningQuest,
    SurveyQuestionsResponse,
    VerifySurveyResponse
} from "../../api/survey";

const SurveyQuestions = () => {
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");

    const [surveyId, setSurveyId] = useState("");
    const [prescreenerQuestions, setPrescreenerQuestions] = useState([]);
    const [uid, setUid] = useState("");
    const [ipAddress, setIpAddress] = useState("Fetching...");
    const [responses, setResponses] = useState({});
    const [passcode, setPasscode] = useState("");
    const [loading, setLoading] = useState(true);
    const [surveyError, setSurveyError] = useState(false);
    const [surveyErrorMessage, setSurveyErrorMessage] = useState("");
    const [surveyName, setSurveyName] = useState("");
    const [surveyTitle, setSurveyTitle] = useState("");

    const location = useLocation();
    const hasFetched = useRef(false);

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;

        const fetchData = async () => {
            setLoading(true);
            try {
                const queryParams = new URLSearchParams(location.search);
                const uid = queryParams.get("uid");
                const survey_id = queryParams.get("survey_id");
                const passcode = queryParams.get("passcode");

                if (!survey_id || !uid || !passcode) {
                    showSnackbar("Missing URL parameters", "error");
                    setLoading(false);
                    return;
                }

                setSurveyId(survey_id);
                setUid(uid);
                setPasscode(passcode);

                let ip = "Unable to fetch IP";
                try {
                    const ipResponse = await fetch("https://api.ipify.org?format=json");
                    const ipData = await ipResponse.json();
                    ip = ipData.ip;
                    setIpAddress(ipData.ip);
                } catch {
                    setIpAddress(ip);
                }

                const prescreeningResponse = await GetIsSurveyPreScreening(survey_id);
                if (prescreeningResponse.result.data === false) {
                    const response = await VerifySurveyResponse({
                        surveyId: survey_id,
                        respondentId: uid,
                        respondentIP: ip,
                        passcode: passcode,
                    });

                    if (response?.errors == null) {
                        const redirect_link = response.result.data.response_link;
                        window.open(redirect_link, "_self", "noopener,noreferrer");
                    } else {
                        setSurveyError(true);
                        setSurveyErrorMessage(response.errors.response.data.message);
                        showSnackbar(response.errors.response.data.message, "error");
                        setLoading(false);
                    }
                } else {
                    const preScreenData = await GetSurveyPreScreeningQuest(survey_id);
                    setPrescreenerQuestions(preScreenData.result.data.surveyPreScreenerDtos);
                    setSurveyName(preScreenData.result.data.surveyName);
                    setSurveyTitle(preScreenData.result.data.surveyTitle);
                    setLoading(false);
                }
            } catch {
                showSnackbar("An unexpected error occurred", "error");
                setLoading(false);
            }
        };

        fetchData();
    }, [location.search]);

    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    const showSnackbar = (message, severity) => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    const handleSubmit = async () => {
        // Validate unanswered
        const unanswered = prescreenerQuestions.filter(q => {
            const answer = responses[q.id];
            return !answer || (Array.isArray(answer) && answer.length === 0);
        });

        if (unanswered.length > 0) {
            showSnackbar("Please answer all the questions before submitting.", "error");
            return;
        }

        const createdById = localStorage.getItem("userid");

        const payload = {
            surveyPartnerId: surveyId,
            respondentId: uid,
            respondentIP: ipAddress,
            addedby: createdById,
            responses: prescreenerQuestions.map(q => ({
                questionId: q.id,
                answer: Array.isArray(responses[q.id]) ? responses[q.id].join(", ") : responses[q.id],
            })),
        };

        try {
            const response = await SurveyQuestionsResponse(payload);
            if (response?.errors == null) {
                const verifyResponse = await VerifySurveyResponse({
                    surveyId: surveyId,
                    respondentId: uid,
                    respondentIP: ipAddress,
                    passcode: passcode,
                });

                if (verifyResponse?.errors == null) {
                    showSnackbar("Survey response verified successfully", "success");
                    const redirect_link = verifyResponse.result.data.response_link;
                    window.open(redirect_link, "_self", "noopener,noreferrer");
                } else {
                    setSurveyError(true);
                    setSurveyErrorMessage(verifyResponse.errors.response.data.message);
                    showSnackbar(verifyResponse.errors.response.data.message, "error");
                }
            } else {
                showSnackbar("Failed to submit survey", "error");
            }
        } catch (err) {
            console.error("Error submitting survey:", err);
            showSnackbar("Unexpected error during submission", "error");
        }
    };

    if (loading) {
        return (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="80vh">
                <CircularProgress color="primary" />
                <Typography variant="body1" sx={{ mt: 2 }}>
                    Loading survey...
                </Typography>
            </Box>
        );
    }

    return (
        <>
            <Box p={3}>
                {/* Survey Header */}
                <Card className="mb-4 shadow-sm">
                    <CardContent>
                        <Typography variant="h5" fontWeight="bold">
                            {surveyName}
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                            {surveyTitle}
                        </Typography>
                    </CardContent>
                </Card>

                {/* Survey Questions */}
                {prescreenerQuestions.length > 0 && (
                    <Card className="shadow-sm">
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Answer the following questions
                            </Typography>
                            <Grid container spacing={3}>
                                {prescreenerQuestions.map((q, index) => {
                                    const options = q.option1?.split("\n").filter(opt => opt.trim() !== "");
                                    const value = responses[q.id] || (q.questionType === "multiple" ? [] : "");

                                    const handleChange = (event) => {
                                        setResponses(prev => ({
                                            ...prev,
                                            [q.id]: event.target.value,
                                        }));
                                    };

                                    const handleCheckboxChange = (event) => {
                                        const { value, checked } = event.target;
                                        setResponses(prev => {
                                            const current = prev[q.id] || [];
                                            return {
                                                ...prev,
                                                [q.id]: checked
                                                    ? [...current, value]
                                                    : current.filter(v => v !== value),
                                            };
                                        });
                                    };

                                    return (
                                        <Grid item xs={12} key={q.id}>
                                            <FormControl component="fieldset" fullWidth>
                                                <FormLabel component="legend" sx={{ fontWeight: "bold", mb: 1 }}>
                                                    {index + 1}. {q.question} *
                                                </FormLabel>

                                                {q.questionType === "33008fb6-5035-4a28-aab1-5af0c52b31ce" ? (
                                                    <RadioGroup
                                                        name={`question-${q.id}`}
                                                        value={value}
                                                        onChange={handleChange}
                                                    >
                                                        {options.map((opt, idx) => (
                                                            <FormControlLabel
                                                                key={idx}
                                                                value={opt}
                                                                control={<Radio />}
                                                                label={opt.replace("[x]", "").trim()}
                                                            />
                                                        ))}
                                                    </RadioGroup>
                                                ) : (
                                                    <FormGroup>
                                                        {options.map((opt, idx) => (
                                                            <FormControlLabel
                                                                key={idx}
                                                                control={
                                                                    <Checkbox
                                                                        checked={value.includes(opt)}
                                                                        onChange={handleCheckboxChange}
                                                                        value={opt}
                                                                    />
                                                                }
                                                                label={opt.replace("[x]", "").trim()}
                                                            />
                                                        ))}
                                                    </FormGroup>
                                                )}
                                            </FormControl>
                                        </Grid>
                                    );
                                })}
                            </Grid>

                            <Box mt={4} textAlign="center">
                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    onClick={handleSubmit}
                                >
                                    Submit Responses
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                )}

                {surveyError && (
                    <Box mt={3}>
                        <Alert severity="error">{surveyErrorMessage}</Alert>
                    </Box>
                )}
            </Box>

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

export default SurveyQuestions;
