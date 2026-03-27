import { useEffect, useState, useRef } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  TextField,
  Typography
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import {
  CreateQuiz,
  DeleteSurveyPreScreening,
  GetOptionsSurvey,
  GetSurvey,
  GetSurveyPreScreening,
  UpdateSurveyPreScreening
} from "../../api/survey";
import { Padding } from "@mui/icons-material";

const PreScreener = () => {
  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { question: "", quiztype: "", options: "" }
  });

  const navigate = useNavigate();
  const { sid } = useParams();
  const formRef = useRef(null);

  const [survey, setSurvey] = useState({});
  const [rowData, setRowData] = useState([]);
  const [options, setOptions] = useState({ quiztype: [] });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const surveyRes = await GetSurvey(sid);
    setSurvey(surveyRes.result.data);

    const optionRes = await GetOptionsSurvey();
    setOptions({ quiztype: optionRes.result.data.quiztype });

    refreshQuestions();
  };

  const refreshQuestions = async () => {
    const res = await GetSurveyPreScreening(sid);
    setRowData(res.result.data);
  };

  const showSnackbar = (message, severity) =>
    setSnackbar({ open: true, message, severity });

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this question?")) return;

    const res = await DeleteSurveyPreScreening(id);
    if (!res.errors) {
      showSnackbar("Deleted successfully", "success");
      refreshQuestions();
    }
  };

  const handleEdit = (item) => {
    setIsEditMode(true);
    setEditingId(item.id);

    reset({
      quiztype: item.questionType,
      question: item.question,
      options: item.option1
    });

    // Smooth scroll to form
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setEditingId(null);
    reset();
    clearForm();
  };
  const clearForm = () => {
    reset({
        quiztype: "",
        question: "",
        options: ""
    });

    setIsEditMode(false);
    setEditingId(null);
 };

  const onSubmit = async (data) => {
    const formattedOptions = data.options
      .split("\n")
      .map(o => o.trim())
      .filter(Boolean)
      .join("\n");

    const payload = {
      id: editingId,
      surveyId: sid,
      questionType: data.quiztype,
      question: data.question,
      option1: formattedOptions,
      addedBy: localStorage.getItem("userid")
    };

    const res = isEditMode
      ? await UpdateSurveyPreScreening(payload)
      : await CreateQuiz(payload);

    if (!res.errors) {
      showSnackbar(
        isEditMode ? "Updated successfully" : "Added successfully",
        "success"
      );
      refreshQuestions();
      handleCancel();
    }
  };

  return (
    
        <Container
                maxWidth={false}
                sx={{ mt: 4, mb: 6, pt: "80px" }}
                >
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Pre-Screener Setup
          </Typography>
          <Typography color="text.secondary">
            {survey?.surveyName} — {survey?.surveyTitle}
          </Typography>
        </Box>

        <Button
          variant="outlined"
          onClick={() => navigate(`/survey/details/${sid}`)}
        >
          Back
        </Button>
      </Box>

      {/* FORM */}
      <Paper
        ref={formRef}
        elevation={isEditMode ? 6 : 3}
        sx={{
          p: 4,
          borderRadius: 1,
          border: isEditMode ? "2px solid #1976d2" : "none",
          transition: "all 0.3s ease"
        }}
      >
        <Typography variant="h6" mb={2}>
          {isEditMode ? "Edit Question" : "Add New Question"}
        </Typography>

        {isEditMode && (
          <Alert severity="info" sx={{ mb: 3 }}>
            You are editing this question. Update and save changes.
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>

            <Grid item xs={12} md={3}>
              <Controller
                name="quiztype"
                control={control}
                rules={{ required: "Required" }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.quiztype}>
                    <InputLabel>Question Type</InputLabel>
                    <Select {...field} label="Question Type">
                      {options.quiztype.map(q => (
                        <MenuItem key={q.id} value={q.id}>
                          {q.name}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      {errors.quiztype?.message}
                    </FormHelperText>
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} md={5}>
              <Controller
                name="question"
                control={control}
                rules={{ required: "Required" }}
                render={({ field }) => (
                  <TextField {...field} label="Question" fullWidth />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="options"
                control={control}
                rules={{ required: "Required" }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Options (one per line)"
                    multiline
                    rows={4}
                    fullWidth
                  />
                )}
              />
            </Grid>

          </Grid>

          <Box mt={3}>
            <Button variant="contained" type="submit">
              {isEditMode ? "Update Question" : "Add Question"}
            </Button>

            {isEditMode && (
              <Button sx={{ ml: 2 }} variant="outlined" onClick={handleCancel}>
                Cancel
              </Button>
            )}
          </Box>
        </form>
      </Paper>

      {/* QUESTIONS */}
      <Box mt={5}>
        <Typography variant="h6" mb={2}>
          Questions
        </Typography>

        {rowData.length === 0 ? (
          <Typography color="text.secondary">
            No questions added yet.
          </Typography>
        ) : (
          rowData.map((item, index) => (
            <Card
              key={item.id}
              sx={{
                mb: 2,
                borderRadius: 1,
                border:
                  editingId === item.id
                    ? "2px solid #1976d2"
                    : "1px solid #eee",
                backgroundColor:
                  editingId === item.id ? "#f4f8ff" : "white",
                transition: "all 0.3s ease"
              }}
            >
              <CardContent>
                <Typography fontWeight={600}>
                  Q{index + 1}. {item.question}
                </Typography>

                <Divider sx={{ my: 1 }} />

                {item.option1?.split("\n").map((opt, i) => (
                  <Typography key={i} variant="body2" style={{lineHeight: 1.8}}>
                    • {opt}
                  </Typography>
                ))}

                <Box mt={2}>
                 <Button
  variant="outlined"
  size="small"
  sx={{ mr: 1 }}
  onClick={() => handleEdit(item)}
>
  Edit
</Button>

<Button
  variant="outlined"
  color="error"
  size="small"
  onClick={() => handleDelete(item.id)}
>
  Delete
</Button>
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PreScreener;