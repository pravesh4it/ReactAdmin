// src/pages/AddSurvey.jsx  (or wherever your AddSurvey component lives)
import { useContext, useEffect, useState } from "react";
import { emphasize, styled } from '@mui/material/styles';
import { useForm, Controller } from "react-hook-form";
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
  Snackbar,
  Alert,
  Autocomplete,
  CircularProgress,
  Box
} from "@mui/material";
import { CreateSurvey, GetOptionsSurvey } from "../../api/survey";
import { listCountryLanguages } from "../../api/CountryLanguage"; // <-- new: fetch languages for selected country
import { useNavigate } from "react-router-dom";

const AddSurvey = () => {
  const navigate = useNavigate();
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      country: "",
      language: [],           // now an array of language ids
      completes: 0,
      lengthOfSurvey: "",
      incidence: 0,
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
      SurveyQuota: 0,
      ClientRate: 0
    },
  });

  const uniqueLink = watch("uniqueLink");
  const selectedCountry = watch("country");

  // If uniqueLink is true, clear ClientLink automatically
  useEffect(() => {
    if (uniqueLink) {
      setValue("ClientLink", "");
      clearErrors("ClientLink");
    }
  }, [uniqueLink, setValue, clearErrors]);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [loading, setLoading] = useState(true); // initial overall loading
  const [countryLangLoading, setCountryLangLoading] = useState(false); // loading for country languages
  const [options, setOptions] = useState({
    salesManagers: [],
    projectManagers: [],
    countries: [],
    languages: [], // global fallback if you need it
    clients: [],
    status: [],
    currencies: [],
  });

  // available languages for the selected country (objects with id, name, displayName)
  const [availableLanguages, setAvailableLanguages] = useState([]);
  //const [submitType, setSubmitType] = useState("submit");

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  const handleSnackbarClose = () => setSnackbarOpen(false);

  // initial lookups (sales managers, countries, clients etc.)
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);
        const response = await GetOptionsSurvey();
        setOptions({
          salesManagers: response.result.data.sales_managers ?? [],
          projectManagers: response.result.data.project_managers ?? [],
          countries: response.result.data.countries ?? [],
          languages: response.result.data.languages ?? [],
          clients: response.result.data.clients ?? [],
          status: response.result.data.status ?? [],
          currencies: response.result.data.currencies ?? [],
        });
      } catch (error) {
        console.error("Error fetching survey options:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  // Whenever selectedCountry changes, fetch languages for that country
  useEffect(() => {
    const loadCountryLanguages = async (countryId) => {
      if (!countryId) {
        setAvailableLanguages([]); // clear
        setValue("language", []);  // clear selected languages in form
        return;
      }

      try {
        setCountryLangLoading(true);
        // listCountryLanguages returns list of mapping DTOs (with languageId + languageName/display)
        const data = await listCountryLanguages(countryId);
        const mapped = (data ?? []).map(d => ({
          id: d.languageId ?? d.LanguageId ?? d.multiSelectId ?? d.MultiSelectId,
          name: d.languageName ?? d.LanguageName ?? (d.language?.name ?? ""),
          displayName: d.languageDisplayName ?? d.LanguageDisplayName ?? (d.language?.displayName ?? d.language?.DisplayName ?? "")
        }));
        setAvailableLanguages(mapped);

        // If current selected languages (form) are not in mapped, remove them
        const currentSelected = (watch("language") ?? []);
        const filteredSelected = currentSelected.filter(sid => mapped.some(m => m.id === sid));
        if (JSON.stringify(filteredSelected) !== JSON.stringify(currentSelected)) {
          setValue("language", filteredSelected);
        }
      } catch (err) {
        console.error("Error loading country languages:", err);
        setAvailableLanguages([]);
      } finally {
        setCountryLangLoading(false);
      }
    };

    loadCountryLanguages(selectedCountry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry]);

  const onSubmit = async (data, event) => {
    try {
      // console.log("Form Data:", data);
      const createdById = localStorage.getItem("userid");
      const submitType = event.nativeEvent.submitter.name; // "draft" or "submit"

      // data.language is an array of language ids
      const languageIds = Array.isArray(data.language) ? data.language : (data.language ? [data.language] : []);
      const json_data = {
        title: data.title,
        country: data.country,
        // preserve backward compatibility: send single language as first item and also languages array
        language: languageIds.length ? languageIds[0] : null,
        languages: languageIds,
        completes: data.completes,
        lengthOfSurvey: data.lengthOfSurvey,
        incidence: data.incidence,
        filledTime: data.filledTime,
        client: data.client,
        projectManagers: data.projectManagers,
        salesManagers: data.salesManagers,
        clientLink: data.ClientLink,
        createdById: createdById,
        //launchedDate: launch_date,
        //endDate: end_date,
        Currency: data.currency,
        ClientIR: data.clientIR,
        SurveyQuota: data.SurveyQuota,
        ClientRate: data.ClientRate,
        preScreener: data.preScreener,
        uniqueLink: data.uniqueLink,
        submitType: submitType // "draft" or "submit"
      };

      const response = await CreateSurvey(json_data);

      if (response?.errors == null) {
        const survey_id = response.result?.data?.["survey_id"];
        showSnackbar("Survey added successfully", "success");
        setTimeout(() => navigate("/survey/details/" + survey_id), 2000);
      } else {
        showSnackbar("Failed to save survey", "error");
      }
    } catch (error) {
      console.error("Error submitting survey:", error);
      showSnackbar("An unexpected error occurred", "error");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <div className="right-content w-100">
        <div className="card shadow border-0 w-100 flex-row p-4">
          <h5 className="mb-0">New Survey</h5>
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
                  render={({ field }) => (
                    <TextField {...field} label="Title" fullWidth error={!!errors.title} helperText={errors.title?.message} />
                  )}
                />
              </Grid>

              {/* Country Dropdown */}
              <Grid item xs={4}>
                <Controller
                  name="country"
                  control={control}
                  rules={{ required: "Country is required" }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.country}>
                      <InputLabel>Country</InputLabel>
                      <Select {...field} label="Country" value={field.value || ""} onChange={(e) => field.onChange(e.target.value)}>
                        <MenuItem value="">-- Select country --</MenuItem>
                        {options?.countries?.map((country) => (
                          <MenuItem key={country.id} value={country.id}>{country.name}</MenuItem>
                        ))}
                      </Select>
                      {errors.country && <FormHelperText>{errors.country.message}</FormHelperText>}
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Language Autocomplete (multiple) */}
              <Grid item xs={8}>
                <Controller
                  name="language"
                  control={control}
                  rules={{
                    validate: v => (Array.isArray(v) && v.length > 0) || "Language is required"
                  }}
                  render={({ field }) => {
                    // field.value is array of ids; convert to option objects for Autocomplete value
                    const valueObjects = Array.isArray(field.value)
                      ? availableLanguages.filter(opt => field.value.includes(opt.id))
                      : [];

                    return (
                      <FormControl fullWidth error={!!errors.language}>
                        <Autocomplete
                          multiple
                          options={availableLanguages}
                          getOptionLabel={(option) => option.displayName ?? option.name}
                          disableCloseOnSelect
                          value={valueObjects}
                          onChange={(_, newValue) => {
                            // map to ids for form value
                            const ids = newValue.map(v => v.id);
                            field.onChange(ids);
                          }}
                          renderOption={(props, option, { selected }) => (
                            <li {...props}>
                              <Checkbox style={{ marginRight: 8 }} checked={selected} />
                              {option.displayName ?? option.name}
                            </li>
                          )}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label={countryLangLoading ? "Loading languages..." : "Languages"}
                              placeholder={countryLangLoading ? "Loading..." : "Pick languages"}
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <>
                                    {countryLangLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                  </>
                                )
                              }}
                            />
                          )}
                        />
                        {errors.language && <FormHelperText>{errors.language.message}</FormHelperText>}
                      </FormControl>
                    );
                  }}
                />
              </Grid>

              {/* Filled Time */}
              <Grid item xs={4}>
                <Controller name="filledTime" control={control} rules={{ required: "Field Time is required" }} render={({ field, fieldState: { error } }) => (
                  <TextField {...field} label="Field Time (days)" type="number" fullWidth error={!!error} helperText={error ? error.message : ""} />
                )} />
              </Grid>

              {/* Length of Survey */}
              <Grid item xs={4}>
                <Controller name="lengthOfSurvey" control={control} rules={{ required: "Length of Survey is required" }} render={({ field, fieldState: { error } }) => (
                  <TextField {...field} label="Length of Survey (min)" type="number" fullWidth error={!!error} helperText={error ? error.message : ""} />
                )} />
              </Grid>

              {/* Client Dropdown */}
              <Grid item xs={4}>
                <Controller name="client" control={control} rules={{ required: "Client/Partner is required" }} render={({ field }) => (
                  <FormControl fullWidth error={!!errors.client}>
                    <InputLabel>Client/Partner</InputLabel>
                    <Select {...field} label="Client/Partner" value={field.value || ""} onChange={(e) => field.onChange(e.target.value)}>
                      {options?.clients?.map((client) => (<MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>))}
                    </Select>
                    {errors.client && <FormHelperText>{errors.client.message}</FormHelperText>}
                  </FormControl>
                )} />
              </Grid>

              {/* Currency */}
              <Grid item xs={4}>
                <Controller name="currency" control={control} rules={{ required: "Currency is required" }} render={({ field }) => (
                  <FormControl fullWidth error={!!errors.currency}>
                    <InputLabel>Currency</InputLabel>
                    <Select {...field} label="Currency" value={field.value || ""} onChange={(e) => field.onChange(e.target.value)}>
                      {options?.currencies?.map((currency) => (<MenuItem key={currency.id} value={currency.id}>{currency.name}</MenuItem>))}
                    </Select>
                    {errors.currency && <FormHelperText>{errors.currency.message}</FormHelperText>}
                  </FormControl>
                )} />
              </Grid>

              {/* ClientLink */}
              <Grid item xs={8}>
                <Controller name="ClientLink" control={control} rules={{ required: !uniqueLink ? "Client Link is required" : false }} render={({ field }) => (
                  <TextField {...field} label="Client Link" fullWidth disabled={uniqueLink} error={!!errors.ClientLink} helperText={errors.ClientLink?.message} />
                )} />
              </Grid>

              {/* Client IR */}
              <Grid item xs={4}>
                <Controller name="clientIR" control={control} rules={{ required: "Client IR is required" }} render={({ field }) => (
                  <TextField {...field} label="Client IR" type="number" fullWidth error={!!errors.clientIR} helperText={errors.clientIR?.message} />
                )} />
              </Grid>

              {/* SurveyQuota */}
              <Grid item xs={4}>
                <Controller name="SurveyQuota" control={control} rules={{ required: "Survey Quota is required" }} render={({ field }) => (
                  <TextField {...field} label="Survey Quota" type="number" fullWidth error={!!errors.SurveyQuota} helperText={errors.SurveyQuota?.message} />
                )} />
              </Grid>

              {/* ClientRate */}
              <Grid item xs={4}>
                <Controller name="ClientRate" control={control} rules={{ required: "Client Rate is required" }} render={({ field }) => (
                  <TextField {...field} label="Client Rate" type="number" fullWidth error={!!errors.ClientRate} helperText={errors.ClientRate?.message} />
                )} />
              </Grid>
                {/* Project Managers & Sales Managers - unchanged */}
              <Grid item xs={6}>
  <Controller
    name="projectManagers"
    control={control}
    rules={{
      validate: v => v.length > 0 || "Select at least one Project Manager"
    }}
    render={({ field }) => {
      const valueObjects = options.projectManagers.filter(pm =>
        field.value.includes(pm.id)
      );

      return (
        <FormControl fullWidth error={!!errors.projectManagers}>
          <Autocomplete
            multiple
            options={options.projectManagers}
            getOptionLabel={(option) => option.name}
            value={valueObjects}
            onChange={(_, newValue) =>
              field.onChange(newValue.map(v => v.id))
            }
            disableCloseOnSelect
            renderOption={(props, option, { selected }) => (
              <li {...props}>
                <Checkbox checked={selected} sx={{ mr: 1 }} />
                {option.name}
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
      validate: v => v.length > 0 || "Select at least one Sales Manager"
    }}
    render={({ field }) => {
      const valueObjects = options.salesManagers.filter(sm =>
        field.value.includes(sm.id)
      );

      return (
        <FormControl fullWidth error={!!errors.salesManagers}>
          <Autocomplete
            multiple
            options={options.salesManagers}
            getOptionLabel={(option) => option.name}
            value={valueObjects}
            onChange={(_, newValue) =>
              field.onChange(newValue.map(v => v.id))
            }
            disableCloseOnSelect
            renderOption={(props, option, { selected }) => (
              <li {...props}>
                <Checkbox checked={selected} sx={{ mr: 1 }} />
                {option.name}
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
              {/* PreScreener */}
              <Grid item xs={4}>
                <Controller name="preScreener" control={control} render={({ field }) => (
                  <FormControlLabel control={<Checkbox {...field} checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />} label="PreScreener" />
                )} />
              </Grid>

              {/* Unique Link */}
              <Grid item xs={12}>
                <Controller name="uniqueLink" control={control} render={({ field }) => (
                  <FormControlLabel control={<Checkbox {...field} checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />} label="Allow Unique Link" />
                )} />
              </Grid>
            </Grid>

            {/* Submit Button */}
            <Box mt={2} display="flex" gap={2}>
                <Button
                  type="submit"
                  name="draft"
                  variant="outlined"
                  color="primary"
                >
                  Save as Draft
                </Button>

                <Button
                  type="submit"
                  name="submit"
                  variant="contained"
                  color="primary"
                >
                  Submit
                </Button>
              </Box>

          </form>
        </div>
      </div>

      <Snackbar open={snackbarOpen} autoHideDuration={10000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} variant="filled">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AddSurvey;
