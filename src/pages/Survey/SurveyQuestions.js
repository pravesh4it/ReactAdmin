import { useEffect, useRef, useState } from "react";
import {
  Grid,
  FormControlLabel,
  FormGroup,
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
  AddSurveyResponse,
  GetIsSurveyPreScreening,
  GetSurveyPreScreeningQuest,
  SurveyQuestionsResponse
} from "../../api/survey";
import Logo from "../../assets/images/IconOnly_Transparent_NoBuffer.png";

const SurveyQuestions = () => {
  const location = useLocation();
  const hasFetched = useRef(false);

  const [loading, setLoading] = useState(true);
  const [showHeader, setShowHeader] = useState(false);

  const [surveyError, setSurveyError] = useState(false);
  const [surveyErrorMessage, setSurveyErrorMessage] = useState("");

  const [surveyName, setSurveyName] = useState("");
  const [surveyTitle, setSurveyTitle] = useState("");

  const [prescreenerQuestions, setPrescreenerQuestions] = useState([]);
  const [responses, setResponses] = useState({});

  const [id, setId] = useState("");
  const [uid, setUid] = useState("");
  const [ipAddress, setIpAddress] = useState("");

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(location.search);
        const autoNumber = params.get("id");
        const uidParam = params.get("uid");

        if (!autoNumber || !uidParam) {
          showSnackbar("Missing URL parameters", "error");
          setLoading(false);
          return;
        }

        setId(autoNumber);
        setUid(uidParam);

        const ipRes = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipRes.json();
        setIpAddress(ipData.ip);

        const prescreenCheck = await GetIsSurveyPreScreening(autoNumber);

        // 🔴 NO PRESCREENER → DIRECT REDIRECT (NO HEADER)
        if (prescreenCheck.result.data === false) {
          setShowHeader(false);

          const createdById = localStorage.getItem("userid");
          const json = {
            autoNumber,
            respondentId: uidParam,
            respondentIP: ipData.ip,
            addedby: createdById
          };

          const response = await AddSurveyResponse(json);
          if (response.errors == null) {
            window.open(response.result.data.responseLink, "_self");
            return;
          } else {
            throw new Error(response.errors.response.data.details);
          }
        }

        // ✅ PRESCREENER EXISTS → SHOW HEADER
        setShowHeader(true);

        const preScreenData = await GetSurveyPreScreeningQuest(autoNumber);
        setPrescreenerQuestions(preScreenData.result.data.surveyPreScreenerDtos);
        setSurveyName(preScreenData.result.data.surveyName);
        setSurveyTitle(preScreenData.result.data.surveyTitle);

      } catch (err) {
        setSurveyError(true);
        setSurveyErrorMessage(err.message || "Unexpected error");
        showSnackbar(err.message || "Unexpected error", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location.search]);

  const showSnackbar = (msg, severity = "success") => {
    setSnackbarMessage(msg);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSubmit = async () => {
    const unanswered = prescreenerQuestions.filter(q => {
      const ans = responses[q.id];
      return !ans || (Array.isArray(ans) && ans.length === 0);
    });

    if (unanswered.length > 0) {
      showSnackbar("Please answer all questions", "error");
      return;
    }

    try {
      const createdById = localStorage.getItem("userid");

      const payload = {
        respondentId: uid,
        respondentIP: ipAddress,
        addedby: createdById,
        responses: prescreenerQuestions.map(q => ({
          questionId: q.id,
          answer: Array.isArray(responses[q.id])
            ? responses[q.id].join(", ")
            : responses[q.id]
        })),
        surveyPartnerId: id
      };

      const response = await SurveyQuestionsResponse(payload);
      if (response.errors == null) {
        window.open(response.result.data.responseLink, "_self");
      }
      else
        {throw new Error(response.errors.response.data.message);}
    } catch (err) {
      showSnackbar("Submission failed: " + err.message, "error");
    }
  };

  // ⏳ LOADING SCREEN
  if (loading) {
    return (
      <Box height="100vh" display="flex" flexDirection="column" alignItems="center" justifyContent="center">
        <CircularProgress />
        <Typography mt={2}>Loading survey…</Typography>
      </Box>
    );
  }

  return (
    <>
      {/* HEADER – SHOWN ONLY FOR PRESCREENER */}
      {showHeader && (<Box>
        <header className="company-header">
          <div className="header-content">
            <img src={Logo} alt="Pro Dynamic Research" className="company-logo" />
            <h2 className="company-name">Pro Dynamic Research</h2>
          </div>
        </header>
     

      <Box sx={{ bgcolor: "#f5f7fb", minHeight: "100vh", py: 4, mt: showHeader ? 6 : 0 }}>
        <Box maxWidth="900px" mx="auto">
          {surveyError && <Alert severity="error">{surveyErrorMessage}</Alert>}

          {/* SURVEY INFO */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" fontWeight="bold">
                {surveyName}
              </Typography>
              
            </CardContent>
          </Card>

          {/* QUESTIONS */}
          <Grid container spacing={3}>
            {prescreenerQuestions.map((q, index) => {
              const options = q.option1?.split("\n").filter(Boolean);
              const value =
                responses[q.id] ||
                (q.questionType !== "33008fb6-5035-4a28-aab1-5af0c52b31ce" ? [] : "");

              const handleChange = (e) => {
                setResponses(prev => ({ ...prev, [q.id]: e.target.value }));
              };

              const handleCheckboxChange = (e) => {
                const { value, checked } = e.target;
                setResponses(prev => {
                  const current = prev[q.id] || [];
                  return {
                    ...prev,
                    [q.id]: checked
                      ? [...current, value]
                      : current.filter(v => v !== value)
                  };
                });
              };

              return (
                <Grid item xs={12} key={q.id}>
                  <Card>
                    <CardContent>
                      <Typography fontWeight="bold" mb={2}>
                        {index + 1}. {q.question}
                      </Typography>

                      {q.questionType === "33008fb6-5035-4a28-aab1-5af0c52b31ce" ? (
                        <RadioGroup value={value} onChange={handleChange}>
                          {options.map((opt, i) => (
                            <FormControlLabel
                              key={i}
                              value={opt}
                              control={<Radio />}
                              label={opt}
                            />
                          ))}
                        </RadioGroup>
                      ) : (
                        <FormGroup>
                          {options.map((opt, i) => (
                            <FormControlLabel
                              key={i}
                              control={
                                <Checkbox
                                  checked={value.includes(opt)}
                                  onChange={handleCheckboxChange}
                                  value={opt}
                                />
                              }
                              label={opt}
                            />
                          ))}
                        </FormGroup>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* SUBMIT */}
          <Box mt={5} textAlign="center">
            <Button
              variant="contained"
              size="large"
              onClick={handleSubmit}
              sx={{ px: 6, py: 1.5 }}
            >
              Submit & Continue
            </Button>
          </Box>
        </Box>
      </Box>
      </Box>
       )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert severity={snackbarSeverity}>{snackbarMessage}</Alert>
      </Snackbar>
    </>
  );
};

export default SurveyQuestions;
