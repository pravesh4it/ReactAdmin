// InvoicePage.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  Paper,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableFooter,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { GetSurveyById } from "../../api/survey";
import { CreateInvoice } from "../../api/invoice";

// IMPORTANT: Replace this import with your actual API wrapper that calls InvoiceRepository endpoints.
// The CreateInvoice function should accept the payload object (same shape as below) and return a response object.


const defaultAccountEmail = "accounts@yourcompany.com"; // change as needed

const InvoicePage = () => {
  const { sid } = useParams();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);

  const [accountEmail, setAccountEmail] = useState(defaultAccountEmail);
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [address3, setAddress3] = useState("");
  const [zipCode, setZipCode] = useState("");

  const [surveyIdField, setSurveyIdField] = useState("");
  const [clientSurveyName, setClientSurveyName] = useState("");
  const [poNumber, setPoNumber] = useState("");

  const [rows, setRows] = useState([
    { id: 1, quantity: 1, description: "", unit: 0.0, total: 0.0 },
  ]);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [submitting, setSubmitting] = useState(false); // disable send while request in progress

  useEffect(() => {
    const fetch = async () => {
      try {
        // fetch survey by id using provided API wrapper
        const resp = await GetSurveyById(sid);

        // adjust these lines depending on how GetSurveyById returns data
        // Common shapes:
        // 1) resp.result.data => survey object
        // 2) resp.data => survey
        // 3) resp => survey
        const surveyObj = resp?.result?.data ?? resp?.data ?? resp;
        if (!surveyObj) {
          setSnackbar({ open: true, message: "Survey not found", severity: "error" });
          setSurvey(null);
        } else {
          setSurvey(surveyObj);
          // set defaults - adjust field names according to your survey object
          setSurveyIdField(surveyObj.id ?? surveyObj.surveyId ?? sid ?? "");
          setClientSurveyName(surveyObj.name ?? surveyObj.surveyName ?? surveyObj.title ?? "");
          // optionally set default addresses/emails if survey contains client billing info
          if (surveyObj.accountEmail) setAccountEmail(surveyObj.accountEmail);
          if (surveyObj.addressLine1) setAddress1(surveyObj.addressLine1);
          if (surveyObj.addressLine2) setAddress2(surveyObj.addressLine2);
          if (surveyObj.addressLine3) setAddress3(surveyObj.addressLine3);
          if (surveyObj.zipCode) setZipCode(surveyObj.zipCode);
        }
      } catch (err) {
        console.error(err);
        setSnackbar({ open: true, message: "Failed to load survey", severity: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [sid]);

  // add row
  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      { id: prev.length ? prev[prev.length - 1].id + 1 : 1, quantity: 1, description: "", unit: 0.0, total: 0 },
    ]);
  };

  const handleRemoveRow = (id) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleRowChange = (id, key, value) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [key]: value };

        // ensure numeric parse for quantity and unit
        const qty = Number(updated.quantity) || 0;
        const unit = Number(updated.unit) || 0;
        updated.total = parseFloat((qty * unit).toFixed(2));
        return updated;
      })
    );
  };

  const grandTotal = rows.reduce((acc, r) => acc + Number(r.total || 0), 0);

  const validatePayload = (payload) => {
    if (!payload.surveyId) return "Survey ID is required.";
    if (!payload.accountEmail) return "Account email is required.";
    if (!payload.rows || payload.rows.length === 0) return "Add at least one invoice row.";
    for (let i = 0; i < payload.rows.length; i++) {
      const r = payload.rows[i];
      if (!r.description || r.description.toString().trim() === "") {
        return `Description is required for row ${i + 1}.`;
      }
      if (Number(r.quantity) <= 0) {
        return `Quantity must be > 0 for row ${i + 1}.`;
      }
    }
    return null;
  };

  const handleSendInvoice = async () => {
    debugger;
    const payload = {
      surveyId: surveyIdField,
      clientSurveyName,
      poNumber,
      accountEmail,
      address: {
        line1: address1,
        line2: address2,
        line3: address3,
        zip: zipCode,
      },
      invoiceDate: dayjs().format("YYYY-MM-DDTHH:mm:ss"),
      rows: rows.map((r) => ({
        quantity: Number(r.quantity) || 0,
        description: r.description,
        unit: Number(r.unit) || 0,
        total: Number(r.total || 0),
      })),
      grandTotal: parseFloat(grandTotal.toFixed(2)),
    };

    const validationError = validatePayload(payload);
    if (validationError) {
      setSnackbar({ open: true, message: validationError, severity: "error" });
      return;
    }

    setSubmitting(true);
    try {
      // Call backend API - adapt to your CreateInvoice wrapper's contract
      // Expected: CreateInvoice(payload) => { result: { status: 200, data: { invoiceId, invoiceNumber } } }
      const resp = await CreateInvoice(payload);
        debugger;
      if (!resp.errors) {
        setSnackbar({ open: true, message: "Invoice created successfully", severity: "success" });
          // fallback: go to invoice list page
          navigate("/survey/invoices-list/"+sid);
        
      } else {
        // try to read error message
        setSnackbar({ open: true, message: "Failed to create invoice", severity: "error" });
      }
    } catch (err) {
      console.error("CreateInvoice error:", err);
      // if server returns structured error you can display it
      //const serverMsg = err?.response?.data?.message ?? err?.message ?? "Failed to create invoice";
      setSnackbar({ open: true, message: "Failed to create invoice", severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (!survey) return <Typography>No survey found</Typography>;

  return (
    <Box p={14}>
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8}>
            <Typography variant="h6">
              Invoice for:&nbsp;
              <u>{survey.title ?? survey.surveyName ?? survey.name}</u>
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Survey ID: {survey.id ?? survey.surveyId ?? survey.name ?? sid}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Status: {survey.status}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4} textAlign="right">
            {survey.status === "Invoice" && (
              <Button variant="contained" color="primary" onClick={() => {/* could open modal */}}>
                Create Invoice
              </Button>
            )}
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>Billing</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Accounts Email"
              value={accountEmail}
              onChange={(e) => setAccountEmail(e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="PO Number"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Survey ID"
              value={surveyIdField}
              onChange={(e) => setSurveyIdField(e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Client Survey Name"
              value={clientSurveyName}
              onChange={(e) => setClientSurveyName(e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>Physical Address</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField label="Address Line 1" value={address1} onChange={(e) => setAddress1(e.target.value)} fullWidth size="small" />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Address Line 2" value={address2} onChange={(e) => setAddress2(e.target.value)} fullWidth size="small" />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Address Line 3" value={address3} onChange={(e) => setAddress3(e.target.value)} fullWidth size="small" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="ZIP Code" value={zipCode} onChange={(e) => setZipCode(e.target.value)} fullWidth size="small" />
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="subtitle1">Invoice Items</Typography>
          <Button startIcon={<AddIcon />} onClick={handleAddRow} size="small" variant="outlined">Add Row</Button>
        </Box>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Unit Price</TableCell>
              <TableCell>Total</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((r, idx) => (
              <TableRow key={r.id}>
                <TableCell>{idx + 1}</TableCell>

                <TableCell>
                  <TextField
                    size="small"
                    value={r.quantity}
                    type="number"
                    inputProps={{ min: 0, step: "1" }}
                    onChange={(e) => handleRowChange(r.id, "quantity", e.target.value)}
                    sx={{ width: "100px" }}
                  />
                </TableCell>

                <TableCell>
                  <TextField
                    size="small"
                    value={r.description}
                    onChange={(e) => handleRowChange(r.id, "description", e.target.value)}
                    fullWidth
                  />
                </TableCell>

                <TableCell>
                  <TextField
                    size="small"
                    value={r.unit}
                    type="number"
                    inputProps={{ min: 0, step: "0.01" }}
                    onChange={(e) => handleRowChange(r.id, "unit", e.target.value)}
                    sx={{ width: "120px" }}
                  />
                </TableCell>

                <TableCell>
                  <TextField size="small" value={Number(r.total || 0).toFixed(2)} InputProps={{ readOnly: true }} sx={{ width: "120px" }} />
                </TableCell>

                <TableCell align="center">
                  <IconButton size="small" color="error" onClick={() => handleRemoveRow(r.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TableCell colSpan={4} align="right"><Typography fontWeight="bold">Grand Total</Typography></TableCell>
              <TableCell>
                <Typography fontWeight="bold">{grandTotal.toFixed(2)}</Typography>
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </Paper>

      <Box display="flex" gap={2} justifyContent="flex-end">
        <Button variant="outlined" onClick={() => navigate(-1)} disabled={submitting}>Cancel</Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSendInvoice}
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
        >
          {submitting ? "Submitting..." : "Submit"}
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InvoicePage;
