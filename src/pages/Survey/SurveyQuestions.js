import { useEffect, useRef, useState } from "react";
import {
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
  Box,
  LinearProgress
} from "@mui/material";
import { useLocation } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";

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

  const [showCaptcha, setShowCaptcha] = useState(true);
  const [captchaVerified, setCaptchaVerified] = useState(false);

  const [loading, setLoading] = useState(true);
  const [showHeader, setShowHeader] = useState(false);

  const [surveyName, setSurveyName] = useState("");
  const [prescreenerQuestions, setPrescreenerQuestions] = useState([]);

  const [responses, setResponses] = useState({});
  const [questionIndex, setQuestionIndex] = useState(0);

  const [id, setId] = useState("");
  const [uid, setUid] = useState("");
  const [ipAddress, setIpAddress] = useState("");

  const [surveyError, setSurveyError] = useState(false);
  const [surveyErrorMessage, setSurveyErrorMessage] = useState("");

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const showSnackbar = (msg, severity = "success") => {
    setSnackbarMessage(msg);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCaptcha = (token) => {
    if (token) {
      setCaptchaVerified(true);
      setShowCaptcha(false);
    }
  };

  useEffect(() => {

    if (!captchaVerified) return;
    if (hasFetched.current) return;

    hasFetched.current = true;

    const fetchData = async () => {

      try {

        const params = new URLSearchParams(location.search);
        const autoNumber = params.get("id");
        const uidParam = params.get("uid");

        if (!autoNumber || !uidParam) {
          showSnackbar("Missing URL parameters", "error");
          return;
        }

        setId(autoNumber);
        setUid(uidParam);

        const ipRes = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipRes.json();
        setIpAddress(ipData.ip);

        const prescreenCheck = await GetIsSurveyPreScreening(autoNumber);

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
          }

          setSurveyError(true);
          setSurveyErrorMessage(response.errors.response.data.details);
          return;
        }

        setShowHeader(true);

        const preScreenData = await GetSurveyPreScreeningQuest(autoNumber);

        setPrescreenerQuestions(preScreenData.result.data.surveyPreScreenerDtos || []);
        setSurveyName(preScreenData.result.data.surveyName);

      } catch (err) {

        setSurveyError(true);
        setSurveyErrorMessage(err.message || "Unexpected error");

      } finally {

        setLoading(false);

      }

    };

    fetchData();

  }, [captchaVerified, location.search]);

  const currentQuestion = prescreenerQuestions[questionIndex] || null;

  const options = currentQuestion?.option1
    ? currentQuestion.option1.split("\n").filter(Boolean)
    : [];

  const value =
    responses[currentQuestion?.id] ||
    (currentQuestion?.questionType !== "33008fb6-5035-4a28-aab1-5af0c52b31ce" ? [] : "");

  const handleRadioChange = (e) => {
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: e.target.value
    }));
  };

  const handleCheckboxChange = (e) => {

    const { value, checked } = e.target;

    setResponses(prev => {

      const current = prev[currentQuestion.id] || [];

      return {
        ...prev,
        [currentQuestion.id]: checked
          ? [...current, value]
          : current.filter(v => v !== value)
      };

    });
  };

  const goNext = () => {

    if (!currentQuestion) return;

    const answer = responses[currentQuestion.id];

    if (!answer || (Array.isArray(answer) && answer.length === 0)) {
      showSnackbar("Please answer the question", "error");
      return;
    }

    setQuestionIndex(prev => {
      const next = prev + 1;
      return next >= prescreenerQuestions.length ? prev : next;
    });

  };

  const goPrevious = () => {

    setQuestionIndex(prev => {
      const previous = prev - 1;
      return previous < 0 ? 0 : previous;
    });

  };

  const handleSubmit = async () => {

    const q = prescreenerQuestions[questionIndex];

    if (!q) return;

    const ans = responses[q.id];

    if (!ans || (Array.isArray(ans) && ans.length === 0)) {
      showSnackbar("Please answer the question before submitting", "error");
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
      } else {
        throw new Error(response.errors.response.data.message);
      }

    } catch (err) {

      showSnackbar("Submission failed: " + err.message, "error");

    }
  };

  if (showCaptcha) {
    return (
      <Box height="100vh" display="flex" justifyContent="center" alignItems="center">
        <Card sx={{ p: 4, textAlign: "center", width: 400 }}>
          <Typography variant="h6" mb={2}>
            Verify you are human
          </Typography>
          <ReCAPTCHA
            sitekey="6Lc4CIIsAAAAACRxb_ux9_5iJfdrFprLTNZFhL21"
            onChange={handleCaptcha}
          />
        </Card>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box height="100vh" display="flex" flexDirection="column" alignItems="center" justifyContent="center">
        <CircularProgress />
        <Typography mt={2}>Loading survey…</Typography>
      </Box>
    );
  }

  if (surveyError) {
    return (
      <Box height="100vh" display="flex" justifyContent="center" alignItems="center" bgcolor="#f5f7fb">
        <Card sx={{ p: 6, textAlign: "center", maxWidth: 600 }}>
          <img src={Logo} width={60} style={{ marginBottom: 20 }} alt="Pro Dynamic Research" />
          <Typography variant="h4" fontWeight="bold" color="error">
            {surveyErrorMessage}
          </Typography>
        </Card>
      </Box>
    );
  }

  if (!currentQuestion) {
    return (
      <Box height="100vh" display="flex" justifyContent="center" alignItems="center">
        <Typography>loading.....</Typography>
      </Box>
    );
  }

  const progress =
    ((questionIndex + 1) / prescreenerQuestions.length) * 100;

  return (
    <>
      {showHeader && (
        <header className="company-header">
          <div className="header-content">
            <img src={Logo} alt="Pro Dynamic Research" className="company-logo" />
            <h2 className="company-name">Pro Dynamic Research</h2>
          </div>
        </header>
      )}

      <Box sx={{ bgcolor: "#f5f7fb", minHeight: "100vh", py: 4, mt: showHeader ? 6 : 0 }}>

        <Box maxWidth="900px" mx="auto">

          <Card sx={{ mb: 3 }}>
            <CardContent>

              <Typography variant="h5" fontWeight="bold">
                {surveyName}
              </Typography>

              <Typography>
                Question {questionIndex + 1} of {prescreenerQuestions.length}
              </Typography>

              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ mt: 2 }}
              />

            </CardContent>
          </Card>

          <Card>

            <CardContent>

              <Typography fontWeight="bold" mb={2}>
                {questionIndex + 1}. {currentQuestion.question}
              </Typography>

              {currentQuestion.questionType === "33008fb6-5035-4a28-aab1-5af0c52b31ce" ? (

                <RadioGroup value={value} onChange={handleRadioChange}>
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

          <Box mt={4} display="flex" justifyContent="space-between">

            <Button
              disabled={questionIndex === 0}
              variant="outlined"
              onClick={goPrevious}
            >
              Previous
            </Button>

            {questionIndex < prescreenerQuestions.length - 1 ? (

              <Button variant="contained" onClick={goNext}>
                Next
              </Button>

            ) : (

              <Button variant="contained" onClick={handleSubmit}>
                Continue
              </Button>

            )}

          </Box>

        </Box>

      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SurveyQuestions;