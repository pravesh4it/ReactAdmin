// src/components/CountriesAdmin.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box, Paper, Typography, Stack, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Snackbar, Alert, IconButton, CircularProgress
} from "@mui/material";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { Activity, Edit, Delete, LucideCloudy } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { listCountries, createCountry, updateCountry, deleteCountry } from "../../api/Country";

const emptyRow = {
  id: "",
  name: "",
  currency: "",
  currencySymbol: "",
  isdCode: "",
  shortCode: ""
};

export default function CountriesAdmin() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const gridRef = useRef(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState(false);

  const { handleSubmit, control, reset, setValue, formState: { errors, isSubmitting } } =
    useForm({ defaultValues: emptyRow, mode: "onChange" });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await listCountries();
      // Map API shape to UI shape
      const mapped = (data ?? []).map(d => ({
        id: d.id ?? d.Id,
        name: d.name ?? d.Name,
        currency: d.currency ?? d.Currency,
        currencySymbol: d.currencySymbol ?? d.CurrencySymbol,
        isdCode: d.isdCode ?? d.IsdCode,
        shortCode: d.shortCode ?? d.ShortCode
      }));
      setRows(mapped);
    } catch (e) {
      setError(e?.message || "Failed to load countries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const columnDefs = useMemo(() => [
    { headerName: "Id", field: "id", minWidth: 260, flex: 2 },
    { headerName: "Name", field: "name", flex: 1, filter: true },
    { headerName: "Currency", field: "currency", width: 140 },
    { headerName: "Symbol", field: "currencySymbol", width: 110 },
    { headerName: "ISD Code", field: "isdCode", width: 110 },
    { headerName: "Short Code", field: "shortCode", width: 110 },
    {
      headerName: "Actions", field: "actions", width: 140,
      cellRenderer: (params) => {
        const row = params.data;
        return (
          <Stack direction="row" spacing={1}>
            <IconButton size="small" onClick={() => openEdit(row)}><Edit size={16} /></IconButton>
            <IconButton size="small" onClick={() => onDelete(row)}><Delete size={16} /></IconButton>
          </Stack>
        );
      },
      pinned: "right"
    }
  ], []);

  const defaultColDef = useMemo(() => ({ sortable: true, resizable: true }), []);

  const openCreate = () => {
    setEditing(false);
    reset(emptyRow);
    setOpenDialog(true);
  };

  const openEdit = (row) => {
    setEditing(true);
    reset(row);
    setOpenDialog(true);
  };

  async function onSubmit(values) {
    try {
      setError("");
      const payload = {
        Id: values.id || undefined,
        Name: values.name?.trim(),
        Currency: values.currency?.trim(),
        CurrencySymbol: values.currencySymbol?.trim(),
        IsdCode: values.isdCode?.trim(),
        ShortCode: values.shortCode?.trim()
      };
      if (editing) {
        await updateCountry(values.id, payload);
        setSuccess("Country updated");
      } else {
        const created = await createCountry(payload);
        setSuccess("Country created");
        if (created?.id || created?.Id) setValue("id", created.id ?? created.Id);
      }
      setOpenDialog(false);
      await loadData();
    } catch (e) {
      setError(e?.message || "Save failed");
    }
  }

  async function onDelete(row) {
    if (!window.confirm(`Delete country "${row.name}"?`)) return;
    try {
      const ok = await deleteCountry(row.id);
      if (ok) {
        setSuccess("Deleted");
        await loadData();
      } else {
        setError("Delete failed");
      }
    } catch (e) {
      setError(e?.message || "Delete failed");
    }
  }

  return (
    <Box className="p-6 max-w-7xl mx-auto" style={{ marginTop: "70px" }}>
      <Paper className="p-4 rounded-2xl shadow-sm">
        <Stack direction="row" justifyContent="space-between" alignItems="center" className="mb-3">
          <Typography variant="h5" fontWeight={700}>Manage Countries</Typography>
          <Stack direction="row" spacing={1}>
            <IconButton onClick={loadData} disabled={loading}>{loading ? <CircularProgress size={20} /> : <LucideCloudy size={18} />}</IconButton>
            <Button variant="contained" startIcon={<Activity />} onClick={openCreate}>Add Country</Button>
          </Stack>
        </Stack>

        <div className="ag-theme-quartz" style={{ height: 520, width: "100%" }}>
          <AgGridReact
            ref={gridRef}
            rowData={rows}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            rowSelection="single"
            animateRows
            pagination
            paginationPageSize={25}
          />
        </div>
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? "Edit Country" : "Create Country"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            <Controller name="name" control={control} rules={{ required: "Name is required" }} render={({ field }) => (
              <TextField {...field} label="Name" fullWidth />
            )} />
            {errors.name && <Alert severity="error">{errors.name.message}</Alert>}

            <Controller name="currency" control={control} render={({ field }) => (
              <TextField {...field} label="Currency" fullWidth />
            )} />

            <Controller name="currencySymbol" control={control} render={({ field }) => (
              <TextField {...field} label="Currency Symbol" fullWidth />
            )} />

            <Controller name="isdCode" control={control} render={({ field }) => (
              <TextField {...field} label="ISD Code" fullWidth />
            )} />

            <Controller name="shortCode" control={control} render={({ field }) => (
              <TextField {...field} label="Short Code" fullWidth />
            )} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={isSubmitting}>{editing ? "Save" : "Create"}</Button>
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
