// ============================
// src/components/MultiSelectsAdmin.jsx
// ============================
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { Activity, Edit, Delete, LucideCloudy } from "lucide-react";
import {
  listMultiSelects,
  createMultiSelect,
  updateMultiSelect,
  deleteMultiSelect,
} from "../../api/MultiSelect";

// Put near your constants
const DEFAULT_SELECTION_TYPES = ["Status", "Quiz Type", "Language"];
// Keep a clean empty row but don't hardcode "status" here
const emptyRow = {
  id: "",
  name: "",
  displayName: "",
  isActive: true,
  description: "",
  selectionType: "", // will be filled in openCreate
};

export default function MultiSelectsAdmin() {
  const [rows, setRows] = useState([]);
  const [filterType, setFilterType] = useState(DEFAULT_SELECTION_TYPES[0]); // "Status"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const gridRef = useRef(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState(false);

  // New state for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { handleSubmit, control, reset, setValue, formState: { errors, isSubmitting } } = useForm({ defaultValues: emptyRow, mode: "onChange" });

  // When calling the API, send API-shaped type
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await listMultiSelects(filterType);

      const mapped = (data?.result?.data ?? []).map((d) => ({
        id: d.id ?? d.Id,
        name: d.name ?? d.Name,
        displayName: d.displayName ?? d.DisplayName,
        isActive: (d.isActive ?? d.IsActive) ?? true,
        description: d.description ?? d.Description ?? "",
        // Map API type back to human UI label so the Select shows correctly
        selectionType: filterType,
      }));
      setRows(mapped);
    } catch (e) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [filterType]);


  useEffect(() => { loadData(); }, [loadData]);

  // ------- AgGrid setup -------
  const columnDefs = useMemo(() => [
    { headerName: "Id", field: "id", minWidth: 240, flex: 2 },
    { headerName: "Name", field: "name", flex: 1, filter: true },
    { headerName: "Display Name", field: "displayName", flex: 1, filter: true },
    { headerName: "Active", field: "isActive", width: 110, valueFormatter: p => p.value ? "Yes" : "No" },
    { headerName: "Type", field: "selectionType", width: 140 },
    { headerName: "Description", field: "description", flex: 2 },
    {
      headerName: "Actions",
      field: "actions",
      width: 140,
      cellRenderer: (params) => {
        const row = params.data;
        return (
          <Stack direction="row" spacing={1}>
            <IconButton size="small" onClick={() => openEdit(row)}><Edit size={16} /></IconButton>
            <IconButton size="small" onClick={() => openDeleteDialog(row)}><Delete size={16} /></IconButton>
          </Stack>
        );
      },
      pinned: "right",
    },
  ], []);

  const defaultColDef = useMemo(() => ({ sortable: true, resizable: true }), []);

  const onQuickFilter = (e) => {
    // ag-grid quick filter API
    gridRef.current?.api && gridRef.current.api.setQuickFilter(e.target.value);
  };

  // Open/Create/Edit handlers
  const openCreate = () => {
    setEditing(false);
    reset({ ...emptyRow, selectionType: DEFAULT_SELECTION_TYPES[0] }); // default to first item
    setOpenDialog(true);
  };

  const openEdit = (row) => {
    setEditing(true);
    // row.selectionType is already mapped to UI via loadData
    reset(row);
    setOpenDialog(true);
  };

  // New: open the confirmation dialog (instead of window.confirm)
  const openDeleteDialog = (row) => {
    setDeleteTarget(row);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      setError("");
      await deleteMultiSelect(deleteTarget.id);
      setSuccess("Deleted successfully");
      closeDeleteDialog();
      await loadData();
    } catch (e) {
      setError(e.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  async function onSubmit(values) {
    try {
      setError("");
      const payload = {
        Id: values.id || undefined,
        Name: values.name.trim(),
        DisplayName: values.displayName.trim(),
        IsActive: !!values.isActive,
        Description: values.description?.trim() || "",
        SelectionType: values.selectionType, // <-- API expects e.g. "STATUS"
      };

      if (editing) {
        await updateMultiSelect(values.id, payload);
        setSuccess("Updated successfully");
      } else {
        const created = await createMultiSelect(payload);
        setSuccess("Created successfully");
        setFilterType(values.selectionType); // switch filter to new type
        if (created?.id || created?.Id) setValue("id", created.id ?? created.Id);
      }
      setOpenDialog(false);
      await loadData();
    } catch (e) {
      setError(e.message || "Save failed");
    }
  }


  return (
    <Box className="p-6 max-w-7xl mx-auto" style={{ marginTop: "70px" }}>
      <Paper className="p-4 rounded-2xl shadow-sm">
        <Stack direction="row" justifyContent="space-between" alignItems="center" className="mb-3">
          <Typography variant="h5" fontWeight={700}>Manage Multi Selects</Typography>
          <Stack direction="row" spacing={1}>
            <IconButton onClick={loadData} disabled={loading}>{loading ? <CircularProgress size={20} /> : <LucideCloudy size={18} />}</IconButton>
            <Button variant="contained" startIcon={<Activity />} onClick={openCreate}>Add</Button>
          </Stack>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} className="mb-3">
          <FormControl sx={{ minWidth: 220 }}>
            <InputLabel id="filter-type-label">Selection Type</InputLabel>
            <Select
              labelId="filter-type-label"
              label="Selection Type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              {DEFAULT_SELECTION_TYPES.map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="Search" onChange={onQuickFilter} fullWidth placeholder="Search name, display, description" />
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

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? "Edit" : "Create"} MultiSelect</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>

            <Controller
              name="selectionType"
              control={control}
              rules={{ required: "Selection Type is required" }}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel id="seltype">Selection Type</InputLabel>
                  <Select
                    {...field}
                    labelId="seltype"
                    label="Selection Type"
                    disabled={editing}                 // <-- disable on edit
                  >
                    {DEFAULT_SELECTION_TYPES.map((t) => (
                      <MenuItem key={t} value={t}>{t}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
            {errors.selectionType && <Alert severity="error">{errors.selectionType.message}</Alert>}

            <Controller name="name" control={control} rules={{ required: "Name is required", minLength: { value: 2, message: "Min 2 chars" } }} render={({ field }) => (
              <TextField {...field} label="Name" fullWidth />
            )} />
            {errors.name && <Alert severity="error">{errors.name.message}</Alert>}

            <Controller name="displayName" control={control} rules={{ required: "Display Name is required" }} render={({ field }) => (
              <TextField {...field} label="Display Name" fullWidth />
            )} />
            {errors.displayName && <Alert severity="error">{errors.displayName.message}</Alert>}

            <Controller name="isActive" control={control} render={({ field }) => (
              <FormControlLabel control={<Checkbox checked={field.value} onChange={(e)=>field.onChange(e.target.checked)} />} label="Is Active" />
            )} />

            <Controller name="description" control={control} render={({ field }) => (
              <TextField {...field} label="Description" fullWidth multiline minRows={3} />
            )} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={isSubmitting}>{editing ? "Save" : "Create"}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog (replaces window.confirm) */}
      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent dividers>
          <Typography>
            {deleteTarget
              ? `Are you sure you want to delete "${deleteTarget.displayName || deleteTarget.name}"? This action cannot be undone.`
              : "Are you sure you want to delete this item?"}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} disabled={deleting}>Cancel</Button>
          <Button onClick={confirmDelete} variant="contained" color="error" disabled={deleting}>
            {deleting ? <CircularProgress size={18} /> : "Delete"}
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

// ============================
// Usage notes:
// 1) Ensure env: REACT_APP_API_URL e.g. https://localhost:7077/api
// 2) Your backend endpoints should be:
//    GET    /multiselects?selectionType=STATUS
//    POST   /multiselects
//    PUT    /multiselects/{id}
//    DELETE /multiselects/{id}
// 3) Install deps: npm i @mui/material @emotion/react @emotion/styled react-hook-form ag-grid-react ag-grid-community axios lucide-react
// 4) AgGrid theme CSS imported above; adjust theme if needed.
