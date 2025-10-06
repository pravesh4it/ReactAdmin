// src/components/CountryLanguageAdmin.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box, Paper, Typography, Stack, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, Snackbar, Alert, IconButton, CircularProgress, FormControl, InputLabel,
  Select, MenuItem, TextField
} from "@mui/material";

import Checkbox from "@mui/material/Checkbox";
import Autocomplete from "@mui/material/Autocomplete";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { Activity, LucideCloudy } from "lucide-react";
import { listMultiSelects } from "../../api/MultiSelect";
import { listCountries } from "../../api/Country";
import { listCountryLanguages, addCountryLanguages, updateCountryLanguages } from "../../api/CountryLanguage";

export default function CountryLanguageAdmin() {
  const [countries, setCountries] = useState([]);
  const [selectedCountryId, setSelectedCountryId] = useState("");
  const [languageOptions, setLanguageOptions] = useState([]); // { id, name, displayName }
  const [mappings, setMappings] = useState([]); // current mappings for the grid
  const [loading, setLoading] = useState(false);

  // dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("add"); // 'add' | 'replace'

  // Autocomplete selected options (array of language objects)
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [primaryLanguageId, setPrimaryLanguageId] = useState(null);

  // action loading states
  const [saving, setSaving] = useState(false);

  // UI feedback
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const gridRef = useRef(null);

  // load lookups (countries + languages)
  const loadLookups = useCallback(async () => {
    try {
      setLoading(true);
      const cs = await listCountries();
      setCountries((cs ?? []).map(c => ({ id: c.id ?? c.Id, name: c.name ?? c.Name })));

      const langs = await listMultiSelects("Language");
      const mappedLangs = (langs?.result?.data ?? langs ?? []).map(l => ({
        id: l.id ?? l.Id,
        name: l.name ?? l.Name,
        displayName: l.displayName ?? l.DisplayName
      }));
      setLanguageOptions(mappedLangs);
    } catch (e) {
      setError(e?.message || "Failed to load lookups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLookups(); }, [loadLookups]);

  // load current mappings for selected country
  const loadMappings = useCallback(async (countryId) => {
    if (!countryId) { setMappings([]); return; }
    try {
      setLoading(true);
      setError("");
      const data = await listCountryLanguages(countryId);
      const mapped = (data ?? []).map(d => ({
        id: d.id ?? d.Id,
        countryId: d.countryId ?? d.CountryId,
        languageId: d.languageId ?? d.LanguageId ?? d.multiSelectId ?? d.MultiSelectId,
        languageName: d.languageName ?? d.LanguageName ?? (d.language?.name ?? ""),
        languageDisplayName: d.languageDisplayName ?? d.LanguageDisplayName ?? (d.language?.displayName ?? ""),
        isPrimary: !!d.isPrimary
      }));
      setMappings(mapped);
    } catch (e) {
      setError(e?.message || "Failed to load languages for country");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCountryId) loadMappings(selectedCountryId);
  }, [selectedCountryId, loadMappings]);

  // ag-grid columns
  const columnDefs = useMemo(() => [
    { headerName: "Mapping Id", field: "id", minWidth: 260, flex: 2 },
    { headerName: "Language Id", field: "languageId", minWidth: 240, flex: 2 },
    { headerName: "Language", field: "languageDisplayName", flex: 1 },
    { headerName: "Primary", field: "isPrimary", width: 120, valueFormatter: p => p.value ? "Yes" : "No" }
  ], []);
  const defaultColDef = useMemo(() => ({ sortable: true, resizable: true }), []);

  // Open dialogs
  const openAddDialog = () => {
    if (!selectedCountryId) { setError("Choose a country first"); return; }
    setDialogMode("add");
    setSelectedLanguages([]); // start empty for append
    setPrimaryLanguageId(null);
    setDialogOpen(true);
  };

  const openReplaceDialog = () => {
    if (!selectedCountryId) { setError("Choose a country first"); return; }
    setDialogMode("replace");
    // pre-select currently mapped languages
    const currentLangs = mappings.map(m => {
      const opt = languageOptions.find(l => l.id === m.languageId);
      return opt ? opt : { id: m.languageId, name: m.languageName, displayName: m.languageDisplayName };
    });
    setSelectedLanguages(currentLangs);
    const primary = mappings.find(m => m.isPrimary);
    setPrimaryLanguageId(primary?.languageId ?? null);
    setDialogOpen(true);
  };

  // optimistic update helpers
  const makeTempId = () => `temp_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;

  // Save handler (Add or Replace) with optimistic update + rollback
  const onSaveDialog = async () => {
    if (!selectedCountryId) { setError("Country not selected"); return; }
    const selectedIds = selectedLanguages.map(s => s.id).filter(Boolean);
    if (!selectedIds.length) { setError("Select at least one language"); return; }

    const payload = {
      countryId: selectedCountryId,
      languageIds: selectedIds,
      primaryLanguageId: primaryLanguageId || undefined
    };

    // store current for rollback
    const prevMappings = [...mappings];

    // compute optimistic new mapping list
    if (dialogMode === "add") {
      // append only new languageIds that are not present
      const existingIds = new Set(mappings.map(m => m.languageId));
      const newSelected = selectedIds.filter(id => !existingIds.has(id));
      if (newSelected.length === 0) {
        setSuccess("No new languages to add");
        setDialogOpen(false);
        return;
      }
      const newMappings = [
        ...mappings,
        ...newSelected.map(id => {
          const lang = languageOptions.find(l => l.id === id) ?? { id, name: id, displayName: id };
          return {
            id: makeTempId(),
            countryId: selectedCountryId,
            languageId: id,
            languageName: lang.name,
            languageDisplayName: lang.displayName ?? lang.name,
            isPrimary: primaryLanguageId === id
          };
        })
      ];

      // optimistic UI update
      setMappings(newMappings);
      setSaving(true);
      try {
        await addCountryLanguages(payload);
        setSuccess("Languages added");
      } catch (e) {
        // rollback
        setMappings(prevMappings);
        setError(e?.response?.data?.message || e?.message || "Failed to add languages");
      } finally {
        setSaving(false);
        setDialogOpen(false);
        // reload from server to get real ids & state
        await loadMappings(selectedCountryId);
      }
    } else {
      // replace
      const replacedMappings = selectedIds.map(id => {
        const lang = languageOptions.find(l => l.id === id) ?? { id, name: id, displayName: id };
        return {
          id: makeTempId(),
          countryId: selectedCountryId,
          languageId: id,
          languageName: lang.name,
          languageDisplayName: lang.displayName ?? lang.name,
          isPrimary: primaryLanguageId === id
        };
      });

      // optimistic update
      setMappings(replacedMappings);
      setSaving(true);
      try {
        await updateCountryLanguages(selectedCountryId, payload);
        setSuccess("Languages replaced");
      } catch (e) {
        // rollback
        setMappings(prevMappings);
        setError(e?.response?.data?.message || e?.message || "Failed to replace languages");
      } finally {
        setSaving(false);
        setDialogOpen(false);
        await loadMappings(selectedCountryId);
      }
    }
  };

  return (
    <Box className="p-6 max-w-7xl mx-auto" style={{ marginTop: "70px" }}>
      <Paper className="p-4 rounded-2xl shadow-sm">
        <Stack direction="row" justifyContent="space-between" alignItems="center" className="mb-3">
          <Typography variant="h5" fontWeight={700}>Manage Country Languages</Typography>
          <Stack direction="row" spacing={1}>
            <IconButton
              onClick={() => { loadLookups(); selectedCountryId && loadMappings(selectedCountryId); }}
              disabled={loading || saving}
            >
              {(loading && !saving) ? <CircularProgress size={20} /> : <LucideCloudy size={18} />}
            </IconButton>
          </Stack>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} className="mb-3" alignItems="center">
          <FormControl sx={{ minWidth: 320 }}>
            <InputLabel id="country-select-label">Country</InputLabel>
            <Select
              labelId="country-select-label"
              value={selectedCountryId}
              label="Country"
              onChange={(e) => setSelectedCountryId(e.target.value)}
            >
              <MenuItem value="">-- Select country --</MenuItem>
              {countries.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>

          <Button variant="contained" onClick={openAddDialog} disabled={!selectedCountryId || saving}>Add Languages</Button>
          <Button variant="outlined" onClick={openReplaceDialog} disabled={!selectedCountryId || saving}>Replace Languages</Button>
        </Stack>

        <div className="ag-theme-quartz" style={{ height: 420, width: "100%" }}>
          <AgGridReact
            ref={gridRef}
            rowData={mappings}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            rowSelection="single"
            animateRows
            pagination
            paginationPageSize={25}
          />
        </div>
      </Paper>

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogMode === "add" ? "Add Languages (append)" : "Replace Languages"}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" mb={1}>
            {dialogMode === "add"
              ? "Select languages to append to the country."
              : "Select languages to set as the new list for the country (existing mappings will be replaced)."}
          </Typography>

          <Autocomplete
            multiple
            disableCloseOnSelect
            options={languageOptions}
            getOptionLabel={(option) => option.displayName ?? option.name}
            value={selectedLanguages}
            onChange={(event, newValue) => {
              setSelectedLanguages(newValue);
              // if primary not among selected anymore, clear it
              if (primaryLanguageId && !newValue.some(v => v.id === primaryLanguageId)) {
                setPrimaryLanguageId(null);
              }
            }}
            renderOption={(props, option, { selected }) => (
              <li {...props}>
                <Checkbox style={{ marginRight: 8 }} checked={selected} />
                {option.displayName ?? option.name}
              </li>
            )}
            renderInput={(params) => <TextField {...params} label="Pick languages" placeholder="Search languages..." />}
            sx={{ mt: 2 }}
          />

          <Box mt={2}>
            <Typography variant="body2" mb={1}>Primary Language (optional)</Typography>
            <FormControl fullWidth>
              <InputLabel id="primary-lang-label">Primary</InputLabel>
              <Select
                labelId="primary-lang-label"
                value={primaryLanguageId ?? ""}
                label="Primary"
                onChange={(e) => setPrimaryLanguageId(e.target.value || null)}
              >
                <MenuItem value="">None</MenuItem>
                {selectedLanguages.map(l => <MenuItem key={l.id} value={l.id}>{l.displayName ?? l.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => !saving && setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button
            variant="contained"
            onClick={onSaveDialog}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={18} /> : null}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError("")}>
        <Alert onClose={() => setError("")} severity="error" sx={{ width: '100%' }}>{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={2500} onClose={() => setSuccess("")}>
        <Alert onClose={() => setSuccess("")} severity="success" sx={{ width: '100%' }}>{success}</Alert>
      </Snackbar>
    </Box>
  );
}
