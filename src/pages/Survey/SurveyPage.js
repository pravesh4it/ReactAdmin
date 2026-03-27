import { useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useLocation } from "react-router-dom";

import CaptchaScreen from "./capcha";
import InstructionScreen from "./instrction";
import QuestionScreen from "./QuestionScreens";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

import {
  GetSurveyPreScreeningQuest,
  GetIsSurveyPreScreening,
  AddSurveyResponse,
  SurveyQuestionsResponse
} from "../../api/survey";

const SurveyPage = () => {
  const location = useLocation();

  const [stage, setStage] = useState("captcha");

  const [surveyName, setSurveyName] = useState("");
  const [questions, setQuestions] = useState([]);

  const [instruction, setInstruction] = useState("");
  const [hasInstruction, setHasInstruction] = useState(false);
  const [hasPrescreener, setHasPrescreener] = useState(false);

  const [respondentId, setRespondentId] = useState("");
  const [surveyId, setSurveyId] = useState("");

  const [ip, setIp] = useState("");
  const [error, setError] = useState("");

  // ✅ Fetch IP only once
  useEffect(() => {
    const fetchIP = async () => {
      try {
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();
        setIp(data.ip);
      } catch {
        setIp("");
      }
    };
    fetchIP();
  }, []);

  // ✅ Load Survey
  useEffect(() => {
    if (stage !== "loading") return;

    const loadSurvey = async () => {
      try {
        const params = new URLSearchParams(location.search);

        const id = params.get("id");
        const uid = params.get("uid");

        if (!id || !uid) {
          setStage("error");
          setError("Invalid survey link");
          return;
        }

        // store for later usage
        setSurveyId(id);
        setRespondentId(uid);

        // 🔹 Check prescreener + instruction
        const prescreenCheck = await GetIsSurveyPreScreening(id);
        const data = prescreenCheck?.result?.data;

        const prescreener = data?.hasPreScreening;
        const instructionFlag = data?.hasInstruction;
        const instructionText = data?.instructionText;

        setHasPrescreener(prescreener);
        setHasInstruction(instructionFlag);
        setInstruction(instructionText || "");

        // 🔹 Load prescreener questions if exists
        if (prescreener) {
          const res = await GetSurveyPreScreeningQuest(id);
          const qData = res?.result?.data;

          setSurveyName(qData?.surveyName || "");
          setQuestions(qData?.surveyPreScreenerDtos || []);
        }

        // 🔹 Decide next step
        if (instructionFlag) {
          setStage("instruction");
        } else {
          await startSurvey(id, uid, prescreener);
        }
      } catch (err) {
        console.error(err);
        setStage("error");
        setError("Failed to load survey");
      }
    };

    loadSurvey();
  }, [stage, location.search]);

  // ✅ Start Survey (FIXED)
  const startSurvey = async (id, uid, prescreenerFlag = hasPrescreener) => {
    try {
      const createdById = localStorage.getItem("userid");

      const payload = {
        autoNumber: id,
        respondentId: uid,
        respondentIP: ip,
        addedby: createdById
      };

      const response = await AddSurveyResponse(payload);
      console.log("Start Survey Response:", response);

      if (response?.errors) {
        setStage("error");
        setError(response.errors.response?.data?.details || response.errors.message || "Failed to start survey");
        return;
      }

      const link = response?.result?.data?.responseLink;
      const status = response?.result?.data?.status;

      if (status === "1") {
        window.location.href = link;
        return;
      }

      // 🔹 If no prescreener → redirect directly
      if (!prescreenerFlag) {
        window.location.href = link;
        return;
      }

      // 🔹 Else show questions
      setStage("questions");
    } catch (err) {
      console.error(err);
      setStage("error");
      setError("Failed to start survey");
    }
  };

  // ✅ Instruction Continue
  const handleInstructionContinue = async () => {
    await startSurvey(surveyId, respondentId, hasPrescreener);
  };

  // ✅ Submit Prescreener
  const handleSubmitSurvey = async (responses) => {
    try {
      const createdById = localStorage.getItem("userid");

      const payload = {
        respondentId: respondentId,
        respondentIP: ip,
        addedby: createdById,

        responses: questions.map((q) => ({
          questionId: q.id,
          answer: Array.isArray(responses[q.id])
            ? responses[q.id].join(", ")
            : responses[q.id]
        })),

        surveyPartnerId: surveyId
      };

      const response = await SurveyQuestionsResponse(payload);

      if (!response?.errors) {
        window.open(response.result.data.responseLink, "_self");
      } else {
        setStage("error");
        setError(
          response.errors?.response?.data?.details ||
          response.errors.message
        );
      }
    } catch (err) {
      console.error(err);
      setStage("error");
      setError("Failed to submit survey");
    }
  };

  // ================= UI =================

  if (stage === "captcha")
    return <CaptchaScreen onSuccess={() => setStage("loading")} />;

  if (stage === "loading")
    return (
      <Box height="100vh" display="flex" alignItems="center" justifyContent="center">
        <CircularProgress />
      </Box>
    );

  if (stage === "instruction")
    return (
      <InstructionScreen
        instruction={instruction}
        onContinue={handleInstructionContinue}
      />
    );

  if (stage === "questions")
    return (
      <QuestionScreen
        surveyName={surveyName}
        questions={questions}
        surveyId={surveyId}
        respondentId={respondentId}
        onSubmit={handleSubmitSurvey}
      />
    );

  if (stage === "error")
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height="100vh"
        textAlign="center"
      >
        <ErrorOutlineIcon color="error" sx={{ fontSize: 50, mb: 2 }} />
        <Typography variant="h5" color="error">
          {error || "An unexpected error occurred"}
        </Typography>
      </Box>
    );

  return null;
};

export default SurveyPage;