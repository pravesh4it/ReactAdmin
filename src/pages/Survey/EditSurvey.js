// src/pages/EditSurvey.jsx
import React, { useEffect, useState } from "react";
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
  Autocomplete,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  GetSurveyById,
  UpdateSurvey,
  GetOptionsSurvey,
  GetRatesById,
  AddRates,
} from "../../api/survey";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { listCountryLanguages } from "../../api/CountryLanguage"; // fetch languages for selected country

// Helper: extract id from an object or return value if already primitive
const extractId = (val) => {
  if (val == null) return "";
  if (typeof val === "string" || typeof val === "number") return val;
  // common shapes: { id }, { _id }, { code }, { countryId }
  return val.id ?? val._id ?? val.countryId ?? val.code ?? val.name ?? "";
};

const EditSurvey = () => {
  const { id } = useParams(); // Survey ID
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
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

  const watchedCurrency = watch("currency"); // currency id from the main form
  const selectedCountry = watch("country");
  const currentLanguage = watch("language");

  const [loading, setLoading] = useState(true);
  const [countryLangLoading, setCountryLangLoading] = useState(false); // loading for country languages
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

  // available languages for the selected country (objects with id, name, displayName)
  // NOTE: when country has no languages backend returns [], we keep availableLanguages = []
  const [availableLanguages, setAvailableLanguages] = useState([]);

  // Revise form state (local)
  const [newRateValue, setNewRateValue] = useState("");
  const [newRateCurrency, setNewRateCurrency] = useState(""); // will hold currency id
  const [newRateStartDate, setNewRateStartDate] = useState(dayjs().startOf("day"));
  const [newRateNote, setNewRateNote] = useState("");
  const [initialSurveyLanguage, setInitialSurveyLanguage] = useState("");
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

  // small helper: is value present in list (robustly compares ids)
  const hasOption = (val, list) => {
    if (!val) return false;
    if (!Array.isArray(list) || list.length === 0) return false;
    const idToCheck = extractId(val);
    return list.some((item) => extractId(item) === idToCheck);
  };

  // keep modal currency in sync with the survey's currency value
  useEffect(() => {
    if (watchedCurrency) {
      setNewRateCurrency(watchedCurrency);
    }
  }, [watchedCurrency]);

  // Fetch survey details and options on mount
  useEffect(() => {
    let mounted = true;

    const fetchSurvey = async () => {
      try {
        const responseWrap = await GetSurveyById(id);
        const response = responseWrap?.result?.data ?? responseWrap?.data ?? responseWrap;
        if (response && mounted) {
          // extract country id robustly
          const countryId =
            extractId(response.country) || extractId(response.countryId) || extractId(response.country_id) || "";

          const languageId =
                typeof response.language === "object"
                  ? response.language.languageId // ✅ IMPORTANT
                  : response.languageId || response.language || "";

          const currencyId = extractId(response.currency) || extractId(response.currencyId) || "";

          // reset form values - ensure country & language are set as IDs (not objects)
          reset({
            title: response.title ?? response.name ?? "",
            country: countryId,
            language: languageId,
            completes: response.completes ?? "",
            lengthOfSurvey: response.lengthOfSurvey ?? "",
            incidence: response.incidence ?? "",
            filledTime: response.filledTime ?? "",
            client: extractId(response.client) || "",
            ClientLink: response.clientLink ?? response.ClientLink ?? "",
            projectManagers: response.projectManagers ?? [],
            salesManagers: response.salesManagers ?? [],
            currency: currencyId,
            clientIR: response.clientIR ?? "",
            SurveyQuota: response.surveyQuota ?? "",
            preScreener: !!response.preScreener,
            uniqueLink: !!response.uniqueLink,
            launchDate: response.launchDate ? dayjs(response.launchDate) : null,
            endDate: response.endDate ? dayjs(response.endDate) : null,
          });

          // defensive explicit setValue so later Selects have values set
          if (countryId) setValue("country", countryId);
          if (languageId) setValue("language", languageId);
          if (currencyId) setValue("currency", currencyId);
          setInitialSurveyLanguage(languageId);
          setValue("language", languageId);

          setSurveyname(response.name ?? response.surveyName ?? "");
          setSurveytitle(response.title ?? "");
        }
      } catch (error) {
        console.error("Error fetching survey details:", error);
        showSnackbar("Failed to fetch survey", "error");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const fetchOptions = async () => {
      try {
        const response = await GetOptionsSurvey();
        const data = response?.result?.data ?? response?.data ?? response ?? {};
        if (!mounted) return;
        setOptions({
          salesManagers: data.sales_managers ?? [],
          projectManagers: data.project_managers ?? [],
          countries: data.countries ?? [],
          languages: data.languages ?? [],
          clients: data.clients ?? [],
          status: data.status ?? [],
          currencies: data.currencies ?? [],
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

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, reset, setValue]);

  // Fetch rates for this survey
  const fetchRates = async () => {
    try {
      const response = await GetRatesById("Survey", id);
      if (response && response.errors == null) {
        const json = response.result?.data ?? response.data ?? response;
        setRateData(json);
      } else {
        setRateData(null);
      }
    } catch (err) {
      console.warn("Could not fetch rates", err);
      setRateData(null);
    }
  };

  // --- when country changes, fetch available languages (pass the id)
  // IMPORTANT: if backend returns no languages for the country we WILL show NO options.
  // We also clear the language value (set to "") to avoid "out-of-range value" warnings.
  useEffect(() => {
  let cancelled = false;
    debugger;
    const loadLanguages = async () => {
    const countryId = extractId(selectedCountry);

    if (!countryId) {
      setAvailableLanguages([]);
      setValue("language", "");
      return;
    }

    try {
      setCountryLangLoading(true);
debugger;
      const resp = await listCountryLanguages(countryId);
      console.log("Languages for country", countryId, resp);
      const langs =resp;
      if (cancelled) return;

      setAvailableLanguages(langs);

      const langIds = langs.map(l => l.languageId);

      // ✅ set language ONLY after languages are loaded
      if (initialSurveyLanguage && langIds.includes(initialSurveyLanguage)) {
        setValue("language", initialSurveyLanguage);
      } else if (langs.length > 0) {
        setValue("language", langs[0].languageId);
      } else {
        setValue("language", "");
      }
      console.log("Survey language:", initialSurveyLanguage);
      console.log("Available languageIds:", langs.map(l => l.languageId));

    } catch (e) {
      console.error(e);
      setAvailableLanguages([]);
      setValue("language", "");
    } finally {
      if (!cancelled) setCountryLangLoading(false);
    }
  };

  loadLanguages();

  return () => {
    cancelled = true;
  };
}, [selectedCountry, initialSurveyLanguage, setValue]);

  const onSubmit = async (data) => {
    try {
      debugger;
      // Data should already have country & language as IDs (or empty string)
      const updatedData = {
        ...data,
        country: extractId(data.country),
        language: extractId(data.language), // may be ""
        client: extractId(data.client),
        currency: extractId(data.currency),
      };

      debugger;
      const response = await UpdateSurvey(id, updatedData);

      if (response.errors == null) {
        showSnackbar("Survey updated successfully", "success");
        setTimeout(() => navigate("/survey/details/" + id), 2000);
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
      if (newRateValue === "" || isNaN(Number(newRateValue))) {
        showSnackbar("Please enter a valid rate", "error");
        return;
      }
      if (!newRateStartDate) {
        showSnackbar("Please select an effective date", "error");
        return;
      }

      const payload = {
        rate: Number(newRateValue),
        currency: newRateCurrency || watchedCurrency || "",
        startDate: dayjs(newRateStartDate).format("YYYY-MM-DD"),
        note: newRateNote,
      };

      const response = await AddRates("Survey", id, payload);

      if (response.errors == null) {
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
    const found = options.currencies.find((c) => extractId(c) === extractId(idOrName));
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
                onClick={() => navigate("/survey/details/" + id)}
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
                <p className="mb-0" style={{ color: "#000" }}>
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
                    rules={{ required: "Title is required" }}
                    render={({ field }) => <TextField {...field} label="Title" fullWidth error={!!errors.title} helperText={errors.title?.message} />}
                  />
                </Grid>

                {/* Country */}
                <Grid item xs={4}>
                  <Controller
                    name="country"
                    control={control}
                    rules={{ required: "Country is required" }}
                    render={({ field }) => {
                      // only use field.value when it's present among options to avoid MUI warnings
                      const countryValue = hasOption(field.value, options.countries) ? field.value : "";
                      return (
                        <FormControl fullWidth error={!!errors.country}>
                          <InputLabel>Country</InputLabel>
                          <Select
                            {...field}
                            label="Country"
                            value={countryValue}
                            onChange={(e) => {
                              // set value into form (id)
                              field.onChange(e.target.value);
                              // ensure setValue is also present (react-hook-form handles field.onChange)
                              setValue("country", e.target.value);
                            }}
                          >
                            {options?.countries?.map((country) => {
                              const cid = extractId(country);
                              const label = country.name ?? country.displayName ?? cid;
                              return (
                                <MenuItem key={cid} value={cid}>
                                  {label}
                                </MenuItem>
                              );
                            })}
                          </Select>
                          {errors.country && <FormHelperText>{errors.country.message}</FormHelperText>}
                        </FormControl>
                      );
                    }}
                  />
                </Grid>

                {/* Language (only country-specific languages; if none -> no items shown)
                    Language is required (always). When no languages are returned => no options shown and validation will fail. */}
                <Grid item xs={4}>
                  
                 <Controller
                      name="language"
                      control={control}
                      rules={{ required: "Language is required" }}
                      render={({ field }) => {
                        const languageValue =
                          availableLanguages.some(l => l.languageId === field.value)
                            ? field.value
                            : "";

                        return (
                          <FormControl fullWidth error={!!errors.language}>
                            <InputLabel>Language</InputLabel>
                            <Select
                              {...field}
                              label="Language"
                              value={languageValue}
                              onChange={(e) => field.onChange(e.target.value)}
                            >
                              {availableLanguages.map((lang) => (
                                <MenuItem key={lang.languageId} value={lang.languageId}>
                                  {lang.languageDisplayName ?? lang.languageName}
                                </MenuItem>
                              ))}
                            </Select>

                            {errors.language && (
                              <FormHelperText>{errors.language.message}</FormHelperText>
                            )}
                          </FormControl>
                        );
                      }}
                    />
                </Grid>

                <Grid item xs={4}>
                  <Controller
                    name="filledTime"
                    control={control}
                    rules={{ required: "Field Time is required" }}
                    render={({ field }) => (
                      <TextField {...field} label="Field Time (days)" type="number" fullWidth error={!!errors.filledTime} helperText={errors.filledTime?.message} />
                    )}
                  />
                </Grid>

                <Grid item xs={4}>
                  <Controller
                    name="lengthOfSurvey"
                    control={control}
                    rules={{ required: "Length of survey is required" }}
                    render={({ field }) => (
                      <TextField {...field} label="Length of Survey (min)" type="number" fullWidth error={!!errors.lengthOfSurvey} helperText={errors.lengthOfSurvey?.message} />
                    )}
                  />
                </Grid>

                {/* Client Dropdown */}
                <Grid item xs={4}>
                  <Controller
                    name="client"
                    control={control}
                    rules={{ required: "Client is required" }}
                    render={({ field }) => {
                      const clientValue = hasOption(field.value, options.clients) ? field.value : "";
                      return (
                        <FormControl fullWidth error={!!errors.client}>
                          <InputLabel>Client</InputLabel>
                          <Select
                            {...field}
                            label="Client"
                            value={clientValue}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              setValue("client", e.target.value);
                            }}
                          >
                            {options?.clients?.map((client) => {
                              const cid = extractId(client);
                              const label = client.name ?? client.displayName ?? cid;
                              return (
                                <MenuItem key={cid} value={cid}>
                                  {label}
                                </MenuItem>
                              );
                            })}
                          </Select>
                          {errors.client && <FormHelperText>{errors.client.message}</FormHelperText>}
                        </FormControl>
                      );
                    }}
                  />
                </Grid>

                {/* Currency */}
                <Grid item xs={4}>
                  <Controller
                    name="currency"
                    control={control}
                    rules={{ required: "Currency is required" }}
                    render={({ field }) => {
                      const currencyValue = hasOption(field.value, options.currencies) ? field.value : "";
                      return (
                        <FormControl fullWidth error={!!errors.currency}>
                          <InputLabel>Currency</InputLabel>
                          <Select
                            {...field}
                            label="Currency"
                            value={currencyValue}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              setValue("currency", e.target.value);
                            }}
                            disabled={true} // Currency not editable here
                          >
                            {options?.currencies?.map((currency) => {
                              const curId = extractId(currency);
                              return (
                                <MenuItem key={curId} value={curId}>
                                  {currency.name ?? curId}
                                </MenuItem>
                              );
                            })}
                          </Select>
                          {errors.currency && <FormHelperText>{errors.currency.message}</FormHelperText>}
                        </FormControl>
                      );
                    }}
                  />
                </Grid>

                <Grid item xs={8}>
                  <Controller
                    name="ClientLink"
                    control={control}
                    rules={{ required: "Client Link is required" }}
                    render={({ field }) => <TextField {...field} label="Client Link" fullWidth error={!!errors.ClientLink} helperText={errors.ClientLink?.message} />}
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

                <Grid item xs={4}>
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
                </Grid>
                <Grid container spacing={2} sx={{ mt: 1 }}>

                

                <Grid item xs={6}>
  <Controller
    name="projectManagers"
    control={control}
    rules={{
      validate: v => (v?.length > 0) || "Select at least one Project Manager"
    }}
    render={({ field }) => {
      const valueObjects = options.projectManagers.filter(pm =>
        field.value?.includes(extractId(pm))
      );

      return (
        <FormControl fullWidth error={!!errors.projectManagers}>
          <Autocomplete
            multiple
            options={options.projectManagers}
            getOptionLabel={(option) =>
              option.name ?? option.displayName ?? extractId(option)
            }
            value={valueObjects}
            disableCloseOnSelect
            onChange={(_, newValue) =>
              field.onChange(newValue.map(v => extractId(v)))
            }
            renderOption={(props, option, { selected }) => (
              <li {...props}>
                <Checkbox checked={selected} sx={{ mr: 1 }} />
                {option.name ?? option.displayName}
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Project Managers"
                placeholder="Select Project Managers"
              />
            )}
          />
          {errors.projectManagers && (
            <FormHelperText>
              {errors.projectManagers.message}
            </FormHelperText>
          )}
        </FormControl>
      );
    }}
  />
</Grid>

<Grid item xs={6}>
  <Controller
    name="salesManagers"
    control={control}
    rules={{
      validate: v => (v?.length > 0) || "Select at least one Sales Manager"
    }}
    render={({ field }) => {
      const valueObjects = options.salesManagers.filter(sm =>
        field.value?.includes(extractId(sm))
      );

      return (
        <FormControl fullWidth error={!!errors.salesManagers}>
          <Autocomplete
            multiple
            options={options.salesManagers}
            getOptionLabel={(option) =>
              option.name ?? option.displayName ?? extractId(option)
            }
            value={valueObjects}
            disableCloseOnSelect
            onChange={(_, newValue) =>
              field.onChange(newValue.map(v => extractId(v)))
            }
            renderOption={(props, option, { selected }) => (
              <li {...props}>
                <Checkbox checked={selected} sx={{ mr: 1 }} />
                {option.name ?? option.displayName}
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Sales Managers"
                placeholder="Select Sales Managers"
              />
            )}
          />
          {errors.salesManagers && (
            <FormHelperText>
              {errors.salesManagers.message}
            </FormHelperText>
          )}
        </FormControl>
      );
    }}
  />
</Grid>
<Grid item xs={4}>
                  <Controller
                    name="preScreener"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Checkbox {...field} checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} />}
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
                        control={<Checkbox {...field} checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                        label="Allow Unique Link"
                      />
                    )}
                  />
                </Grid>


                {/* Client Rate display + revise button */}
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2">Client Rate</Typography>

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
                          <Box key={r.id ?? r._id ?? r.startDate} sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}>
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
                  <MenuItem key={extractId(c)} value={extractId(c)}>
                    {c.name ?? extractId(c)}
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
