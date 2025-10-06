import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";
import {
  MenuItem,
  Select,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  Grid,
  Typography,
  Button,
  FormHelperText,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Collapse,
  Box,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { GetSurveyById, UpdateSurvey, GetOptionsSurvey, GetRatesById, AddRates } from "../../api/survey";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";

const EditSurvey = () => {
  const { id } = useParams(); // Survey ID
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      country: "",
      language: "",
      completes: "",
      lengthOfSurvey: "",
      incidence: "",
      filledTime: "",
      status: "",
      client: "",
      projectManagers: [],
      salesManagers: [],
      currency: "",
      clientIR: "",
      launchDate: null,
      endDate: null,
      preScreener: false,
      uniqueLink: false,
      ClientLink: "",
      SurveyQuota: "",
    },
  });

  const watchedCurrency = watch("currency"); // this is currency id from the main form

  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState({
    salesManagers: [],
    projectManagers: [],
    countries: [],
    languages: [],
    clients: [],
    status: [],
    currencies: [],
  });

  // Rate related state
  const [rateData, setRateData] = useState(null); // { activeRate: {...}, history: [...] }
  const [historyOpen, setHistoryOpen] = useState(false);
  const [reviseOpen, setReviseOpen] = useState(false);

  // Revise form state (local)
  const [newRateValue, setNewRateValue] = useState("");
  const [newRateCurrency, setNewRateCurrency] = useState(""); // will hold currency id
  const [newRateStartDate, setNewRateStartDate] = useState(dayjs().startOf("day"));
  const [newRateNote, setNewRateNote] = useState("");

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [surveyname, setSurveyname] = useState();
  const [surveytitle, setSurveytitle] = useState();

  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // keep modal currency in sync with the survey's currency value
  useEffect(() => {
    if (watchedCurrency) {
      setNewRateCurrency(watchedCurrency);
    }
  }, [watchedCurrency]);

  // Fetch survey details
  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        const response = (await GetSurveyById(id)).result.data;
        if (response) {
          reset({
            title: response.title,
            country: response.country,
            language: response.language,
            completes: response.completes,
            lengthOfSurvey: response.lengthOfSurvey,
            incidence: response.incidence,
            filledTime: response.filledTime,
            client: response.client,
            ClientLink: response.clientLink,
            projectManagers: response.projectManagers || [],
            salesManagers: response.salesManagers || [],
            currency: response.currency, // should be currency id
            clientIR: response.clientIR,
            SurveyQuota: response.surveyQuota,
            preScreener: response.preScreener,
            uniqueLink: response.uniqueLink,
          });
          setSurveyname(response.name);
          setSurveytitle(response.title);
        }
      } catch (error) {
        console.error("Error fetching survey details:", error);
        showSnackbar("Failed to fetch survey", "error");
      } finally {
        setLoading(false);
      }
    };

    const fetchOptions = async () => {
      try {
        const response = await GetOptionsSurvey();
        setOptions({
          salesManagers: response.result.data.sales_managers,
          projectManagers: response.result.data.project_managers,
          countries: response.result.data.countries,
          languages: response.result.data.languages,
          clients: response.result.data.clients,
          status: response.result.data.status,
          currencies: response.result.data.currencies,
        });
      } catch (error) {
        console.error("Error fetching survey options:", error);
      }
    };

    // fetch survey and options
    fetchSurvey();
    fetchOptions();
    // also fetch rates
    fetchRates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, reset]);

  // Fetch rates for this survey
  const fetchRates = async () => {
    try {
      // Using your API wrapper
      const response = await GetRatesById("Survey", id);
      if (response.errors == null) {
        const json = response.result.data;
        setRateData(json);
      } else {
        setRateData(null);
      }
    } catch (err) {
      console.warn("Could not fetch rates", err);
      setRateData(null);
    }
  };

  const onSubmit = async (data) => {
    try {
      const updatedData = {
        ...data,
      };

      const response = await UpdateSurvey(id, updatedData);

      if (response.errors == null) {
        showSnackbar("Survey updated successfully", "success");
        setTimeout(() => navigate("/survey/edit/" + id), 2000);
      } else {
        showSnackbar("Failed to update survey", "error");
      }
    } catch (error) {
      console.error("Error updating survey:", error);
      showSnackbar("An unexpected error occurred", "error");
    }
  };

  // Revise rate submit
  const handleReviseRate = async () => {
    try {
      // Basic validation
      if (newRateValue === "" || isNaN(Number(newRateValue))) {
        showSnackbar("Please enter a valid rate", "error");
        return;
      }
      if (!newRateStartDate) {
        showSnackbar("Please select an effective date", "error");
        return;
      }

      // Use currency id (newRateCurrency) — it is synced from the main form
      const payload = {
        rate: Number(newRateValue),
        currency: newRateCurrency || watchedCurrency || "", // currency id
        startDate: dayjs(newRateStartDate).format("YYYY-MM-DD"),
        note: newRateNote,
      };

      const response = await AddRates("Survey", id, payload);

      if (response.errors == null) {
        // success: refresh rates
        await fetchRates();
        setReviseOpen(false);
        setNewRateValue("");
        setNewRateNote("");
        showSnackbar("Client rate revised successfully", "success");
      } else {
        showSnackbar("Failed to add new rate", "error");
      }
    } catch (err) {
      console.error("Revise rate error:", err);
      showSnackbar("Failed to revise rate", "error");
    }
  };

  // Helper to format date range
  const formatRange = (r) => {
    if (!r) return "-";
    const s = r.startDate ? dayjs(r.startDate).format("YYYY-MM-DD") : "-";
    const e = r.endDate ? dayjs(r.endDate).format("YYYY-MM-DD") : "Present";
    return `${s} — ${e}`;
  };

  // Helper to display currency name if we have only id in some places
  const getCurrencyName = (idOrName) => {
    if (!idOrName) return "";
    const found = options.currencies.find((c) => c.id === idOrName || c.name === idOrName);
    return found ? found.name : idOrName;
  };

  return (
    <>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="right-content w-100">
          <div className="card shadow border-0 w-100 flex-row p-4">
            <div style={{ display: "flex", alignItems: "flex-start" }}>
              <Button
                variant="text"
                onClick={() => navigate("/surveys")}
                sx={{ p: 2, pr: 2 }}
                style={{
                  border: "1px solid #ccc",
                  backgroundColor: "#f1f1f1",
                  color: "#0c2a66ff",
                  fontWeight: "bold",
                }}
              >
                ⬅️ Back
              </Button>
              <div style={{ paddingLeft: "12px", paddingTop: "4px" }}>
                <h5 className="mb-0 text-muted">#{surveyname}</h5>
                <p className="mb-0" style={{ color: "#ccc" }}>
                  {surveytitle}
                </p>
              </div>
            </div>
          </div>

          <div className="card shadow border-0 p-3">
            <form onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={2}>
                {/* Title */}
                <Grid item xs={12}>
                  <Controller
                    name="title"
                    control={control}
                    render={({ field }) => <TextField {...field} label="Title" fullWidth />}
                  />
                </Grid>

                {/* Country */}
                <Grid item xs={4}>
                  <Controller
                    name="country"
                    control={control}
                    rules={{ required: "Country is required" }}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.country}>
                        <InputLabel>Country</InputLabel>
                        <Select
                          {...field}
                          label="Country"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          disabled={true} // Country is not editable
                        >
                          {options?.countries?.map((country) => (
                            <MenuItem key={country.id} value={country.id}>
                              {country.name}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.country && <FormHelperText>{errors.country.message}</FormHelperText>}
                      </FormControl>
                    )}
                  />
                </Grid>

                {/* Language */}
                <Grid item xs={4}>
                  <Controller
                    name="language"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.language}>
                        <InputLabel>Language</InputLabel>
                        <Select
                          {...field}
                          label="Language"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          disabled={true} // Language is not editable
                        >
                          {options?.languages?.map((language) => (
                            <MenuItem key={language.id} value={language.id}>
                              {language.name}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.language && <FormHelperText>{errors.language.message}</FormHelperText>}
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={4}>
                  <Controller
                    name="filledTime"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Filled Time (days)" type="number" fullWidth />
                    )}
                  />
                </Grid>

                <Grid item xs={4}>
                  <Controller
                    name="lengthOfSurvey"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Length of Survey (min)" type="number" fullWidth />
                    )}
                  />
                </Grid>

                {/* Client Dropdown */}
                <Grid item xs={4}>
                  <Controller
                    name="client"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.client}>
                        <InputLabel>Client/Partner</InputLabel>
                        <Select
                          {...field}
                          label="Client/Partner"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                        >
                          {options?.clients?.map((client) => (
                            <MenuItem key={client.id} value={client.id}>
                              {client.name}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.client && <FormHelperText>{errors.client.message}</FormHelperText>}
                      </FormControl>
                    )}
                  />
                </Grid>

                {/* Currency */}
                <Grid item xs={4}>
                  <Controller
                    name="currency"
                    control={control}
                    rules={{ required: "Currency is required" }}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.currency}>
                        <InputLabel>Currency</InputLabel>
                        <Select
                          {...field}
                          label="Currency"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          disabled={true} // Currency not editable from main form here
                        >
                          {options?.currencies?.map((currency) => (
                            <MenuItem key={currency.id} value={currency.id}>
                              {currency.name}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.currency && <FormHelperText>{errors.currency.message}</FormHelperText>}
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={8}>
                  <Controller
                    name="ClientLink"
                    control={control}
                    render={({ field }) => <TextField {...field} label="Client Link" fullWidth />}
                  />
                </Grid>

                <Grid item xs={4}>
                  <Controller
                    name="clientIR"
                    control={control}
                    rules={{ required: "Client IR is required" }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Client IR"
                        type="number"
                        fullWidth
                        error={!!errors.clientIR}
                        helperText={errors.clientIR?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <Controller
                    name="SurveyQuota"
                    control={control}
                    rules={{ required: "Survey Quota is required" }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Survey Quota"
                        type="number"
                        fullWidth
                        error={!!errors.SurveyQuota}
                        helperText={errors.SurveyQuota?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}> 
                  
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  
                </Grid> 

                {/* Client Rate display + revise button */}
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2">Client Rate</Typography>

                  {/* Show active rate if available */}
                  {rateData?.activeRate ? (
                    <Box sx={{ border: "1px solid #eee", p: 1, borderRadius: 1 }}>
                      <Typography variant="h6" sx={{ mb: 0.5 }}>
                        {rateData.activeRate.rate} {getCurrencyName(rateData.activeRate.currency)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                        Effective: {formatRange(rateData.activeRate)}
                      </Typography>

                      <Button size="small" onClick={() => setHistoryOpen((s) => !s)} startIcon={<ExpandMoreIcon />}>
                        {historyOpen ? "Hide history" : "View history"}
                      </Button>
                      <Button sx={{ ml: 1 }} variant="outlined" size="small" onClick={() => setReviseOpen(true)}>
                        Revise rate
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ border: "1px solid #eee", p: 1, borderRadius: 1 }}>
                      <Typography>No rate set</Typography>
                      <Button sx={{ mt: 1 }} variant="outlined" size="small" onClick={() => setReviseOpen(true)}>
                        Add rate
                      </Button>
                    </Box>
                  )}
                </Grid>

                {/* History collapse */}
                <Grid item xs={12} sm={6} md={12}>
                  <Collapse in={historyOpen}>
                    <Box sx={{ border: "1px solid #f1f1f1", p: 2, borderRadius: 1, width: "33%", backgroundColor: "#f9f9f9" }}>
                      <Typography variant="subtitle2">Rate History</Typography>
                      {rateData?.history?.length ? (
                        rateData.history.map((r) => (
                          <Box key={r.id} sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}>
                            <div>
                              <Typography>
                                {r.rate} {getCurrencyName(r.currency)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                {formatRange(r)}
                              </Typography>
                              {r.note ? (
                                <Typography variant="caption" display="block">
                                  Note: {r.note}
                                </Typography>
                              ) : null}
                            </div>
                            <div>
                              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                {r.createdAt ? dayjs(r.createdAt).format("YYYY-MM-DD") : ""}
                              </Typography>
                            </div>
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No history available.
                        </Typography>
                      )}
                    </Box>
                  </Collapse>
                </Grid>

                <Grid item xs={4}>
                  <Controller
                    name="preScreener"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Checkbox {...field} checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                        label="PreScreener"
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="uniqueLink"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Checkbox {...field} checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                        label="Allow Unique Link"
                      />
                    )}
                  />
                </Grid>

                {/* Project Managers */}
                <Grid item xs={6}>
                  <Typography variant="h6" fontWeight="bold">
                    Project Managers
                  </Typography>
                  {options?.projectManagers?.map((manager) => (
                    <Controller
                      key={manager.id}
                      name="projectManagers"
                      control={control}
                      defaultValue={[]}
                      render={({ field }) => (
                        <FormControlLabel
                          control={
                            <Checkbox
                              {...field}
                              value={manager.id}
                              checked={field.value.includes(manager.id)}
                              onChange={(e) => {
                                const value = e.target.value;
                                const updated = field.value.includes(value)
                                  ? field.value.filter((v) => v !== value)
                                  : [...field.value, value];
                                field.onChange(updated);
                              }}
                            />
                          }
                          label={manager.name}
                        />
                      )}
                    />
                  ))}
                </Grid>

                {/* Sales Managers */}
                <Grid item xs={6}>
                  <Typography variant="h6" fontWeight="bold">
                    Sales Managers
                  </Typography>
                  {options?.salesManagers?.map((manager) => (
                    <Controller
                      key={manager.id}
                      name="salesManagers"
                      control={control}
                      defaultValue={[]}
                      render={({ field }) => (
                        <FormControlLabel
                          control={
                            <Checkbox
                              {...field}
                              value={manager.id}
                              checked={field.value.includes(manager.id)}
                              onChange={(e) => {
                                const value = e.target.value;
                                const updated = field.value.includes(value)
                                  ? field.value.filter((v) => v !== value)
                                  : [...field.value, value];
                                field.onChange(updated);
                              }}
                            />
                          }
                          label={manager.name}
                        />
                      )}
                    />
                  ))}
                </Grid>
              </Grid>

              <Button variant="contained" color="primary" type="submit" sx={{ mt: 2 }}>
                Update Survey
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Revise Rate Modal */}
      <Dialog open={reviseOpen} onClose={() => setReviseOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Revise Client Rate</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: "grid", gap: 2 }}>
            <TextField
              label="New Rate"
              value={newRateValue}
              onChange={(e) => setNewRateValue(e.target.value)}
              type="number"
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Currency</InputLabel>
              <Select
                value={newRateCurrency || ""}
                label="Currency"
                onChange={(e) => setNewRateCurrency(e.target.value)}
                disabled // read-only: filled from survey currency
              >
                {options?.currencies?.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <DatePicker
              label="Effective Date"
              value={newRateStartDate}
              onChange={(d) => setNewRateStartDate(d)}
              slotProps={{ textField: { fullWidth: true } }}
            />
            <TextField
              label="Note (optional)"
              value={newRateNote}
              onChange={(e) => setNewRateNote(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviseOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleReviseRate}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar (kept as Dialog for simplicity) */}
      <Dialog open={snackbarOpen} onClose={handleSnackbarClose}>
        <Box sx={{ p: 2 }}>
          <Typography>{snackbarMessage}</Typography>
          <Button onClick={handleSnackbarClose}>Close</Button>
        </Box>
      </Dialog>
    </>
  );
};

export default EditSurvey;
