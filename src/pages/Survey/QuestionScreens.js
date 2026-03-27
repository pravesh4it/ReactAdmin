import {
  Card,
  CardContent,
  Typography,
  Button,
  RadioGroup,
  Radio,
  Checkbox,
  FormGroup,
  FormControlLabel,
  LinearProgress,
  Box
} from "@mui/material";
import { useState } from "react";

const QuestionScreen = ({ surveyName, questions, onSubmit }) => {

  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState({});

  const q = questions[index];

  if (!q) {
    return (
      <Box display="flex" justifyContent="center" mt={10}>
        <Typography>Loading questions...</Typography>
      </Box>
    );
  }

  const options = q.option1?.split("\n").filter(Boolean) || [];

  const handleAnswer = (value) => {
    setResponses((prev) => ({
      ...prev,
      [q.id]: value
    }));
  };

  const handleCheckboxChange = (option, checked) => {

    const current = responses[q.id] || [];

    const updated = checked
      ? [...current, option]
      : current.filter((v) => v !== option);

    setResponses((prev) => ({
      ...prev,
      [q.id]: updated
    }));

  };

  const next = () => {
    if (index < questions.length - 1) {
      setIndex((prev) => prev + 1);
    } else {
      console.log("Submit responses:", responses);
      onSubmit(responses);   // send data to parent

      return;
    }
  };

  const prev = () => {
    if (index > 0) {
      setIndex((prev) => prev - 1);
    }
  };

  const progress = ((index + 1) / questions.length) * 100;

  const isAnswered = () => {

    const ans = responses[q.id];

    if (!ans) return false;

    if (Array.isArray(ans)) {
      return ans.length > 0;
    }

    return true;
  };

  return (
    <Box maxWidth="900px" mx="auto" mt={5}>

      {/* Survey Header */}
      <Card sx={{ mb: 2 }}>
        <CardContent>

          <Typography variant="h5" fontWeight="bold">
            {surveyName}
          </Typography>

          <Typography mt={1}>
            Question {index + 1} of {questions.length}
          </Typography>

          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ mt: 2 }}
          />

        </CardContent>
      </Card>

      {/* Question Card */}
      <Card>

        <CardContent>

          <Typography fontWeight="bold" mb={2}>
            {index + 1}. {q.question}
          </Typography>

          {q.questionType === "33008fb6-5035-4a28-aab1-5af0c52b31ce" ? (

            <RadioGroup
              value={responses[q.id] || ""}
              onChange={(e) => handleAnswer(e.target.value)}
            >
              {options.map((o, i) => (
                <FormControlLabel
                  key={i}
                  value={o}
                  control={<Radio />}
                  label={o}
                />
              ))}
            </RadioGroup>

          ) : (

            <FormGroup>
              {options.map((o, i) => (
                <FormControlLabel
                  key={i}
                  control={
                    <Checkbox
                      checked={(responses[q.id] || []).includes(o)}
                      onChange={(e) =>
                        handleCheckboxChange(o, e.target.checked)
                      }
                    />
                  }
                  label={o}
                />
              ))}
            </FormGroup>

          )}

        </CardContent>

      </Card>

      {/* Navigation Buttons */}
      <Box mt={4} display="flex" justifyContent="space-between">

        <Button
          disabled={index === 0}
          variant="outlined"
          onClick={prev}
        >
          Previous
        </Button>

        <Button
          disabled={!isAnswered()}
          variant="contained"
          onClick={next}
        >
          {index === questions.length - 1 ? "Submit" : "Next"}
        </Button>

      </Box>

    </Box>
  );
};

export default QuestionScreen;