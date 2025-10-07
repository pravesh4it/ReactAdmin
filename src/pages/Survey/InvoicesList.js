import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableFooter,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import SendIcon from "@mui/icons-material/Send";
import { useNavigate, useParams } from "react-router-dom";
import {
  getInvoicesBySurvey,
  downloadInvoicePdf,
  sendInvoiceById,
  sendInvoiceWithPdfAttachment,
} from "../../api/invoice";
import { GetSurvey } from "../../api/survey";
import html2pdf from "html2pdf.js";
import logo from "../../assets/images/FullLogo_NoBuffer.png";
import ESOMAR from "../../assets/images/ESOMAR.PNG";

const COMPANY_FOOTER_LINES = [
  "Your Company Pvt. Ltd. | Registered Office: 12, Business Park, City",
  "GSTIN: 12ABCDE1234F1Z5 | Phone: +91-XXXXXXXXXX | Email: billing@yourcompany.com",
];

const InvoiceListForSurvey = () => {
  const { sid } = useParams(); // survey id from route
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [sendingInvoiceId, setSendingInvoiceId] = useState(null);
  const [downloadLoadingId, setDownloadLoadingId] = useState(null);
  const [confirmSendOpen, setConfirmSendOpen] = useState(false);
  const [sendingPreviewPdfId, setSendingPreviewPdfId] = useState(null);
  const [survey, setSurvey] = useState({});
  const navigate = useNavigate();

  // ref for printable area
  const printRef = useRef(null);

  // Helper: Format address lines into HTML string
  const formatAddress = (inv) => {
    if (!inv) return "";
    const a1 = inv.addrLine1 ?? inv.addr1 ?? inv.addressLine1 ?? "";
    const a2 = inv.addrLine2 ?? inv.addr2 ?? inv.addressLine2 ?? "";
    const a3 = inv.addrLine3 ?? inv.addr3 ?? inv.addressLine3 ?? "";
    const zip = inv.zipCode ?? inv.postalCode ?? inv.zip ?? "";
    const lines = [a1, a2, a3, zip].filter(Boolean);
    return lines.join("<br/>");
  };

  useEffect(() => {
    if (!sid) return;
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sid]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const surveyResponse = await GetSurvey(sid);
      setSurvey(surveyResponse.result?.data ?? {});
      const resp = await getInvoicesBySurvey(sid);
      const data = resp?.result?.data ?? resp?.data ?? [];
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Failed to fetch invoices", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleView = (invoice) => {
    setSelectedInvoice(invoice);
    setViewOpen(true);
  };

  const handleCloseView = () => {
    setSelectedInvoice(null);
    setViewOpen(false);
  };

  // download helper for blob (server-side PDF)
  const downloadBlob = (blob, filename) => {
    if (!(blob instanceof Blob)) {
      blob = new Blob([blob], { type: "application/octet-stream" });
    }
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  // server-side download (existing)
  const handleDownload = async (invoice) => {
    const id = invoice.invoiceId ?? invoice.id;
    try {
      setDownloadLoadingId(id);
      const resp = await downloadInvoicePdf(id); // should use responseType: 'blob' in axios
      const blob = resp.data;
      const contentType = blob?.type || resp.headers?.["content-type"] || "";
      if (contentType && !contentType.includes("pdf")) {
        const text = await blob.text();
        console.error("Download failed, server returned:", text);
        setSnackbar({ open: true, message: "Failed to download PDF (server error).", severity: "error" });
        return;
      }
      const invoiceNumber = invoice.invoiceNumber ?? invoice.invoiceNo ?? invoice.number ?? "invoice";
      const filename = `${invoiceNumber}.pdf`;
      downloadBlob(blob, filename);
      setSnackbar({ open: true, message: "PDF downloaded", severity: "success" });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Failed to download PDF", severity: "error" });
    } finally {
      setDownloadLoadingId(null);
    }
  };

  // Robust stamp footer - places footer above bottom margin, left-aligned lines + right-side page text
  const stampFooterOnPdf = (pdf, footerLines = [], options = {}) => {
    try {
      const margin = typeof options.margin === "number" ? options.margin : 12; // mm
      const fontSizePt = options.fontSizePt ?? 10;
      const pageCount = pdf.internal.getNumberOfPages();
      const pageHeight = pdf.internal.pageSize.getHeight(); // mm
      const pageWidth = pdf.internal.pageSize.getWidth(); // mm

      pdf.setFont("helvetica");
      pdf.setFontSize(fontSizePt);
      pdf.setTextColor(80);

      const fontSizeMm = fontSizePt * 0.352778;
      const lineSpacing = options.lineSpacingMm ?? (fontSizeMm + 1.5);
      const footerHeight = Math.max(1, footerLines.length) * lineSpacing;

      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);

        // Y position so footer sits *above* bottom margin
        let startY = pageHeight - margin - footerHeight + (fontSizeMm * 0.2);
        if (startY < margin) startY = pageHeight - margin - footerHeight;

        // left aligned
        const leftX = margin;
        footerLines.forEach((line, idx) => {
          const y = startY + idx * lineSpacing;
          const maxWidth = pageWidth - margin * 2 - 50; // leave space for right text
          const splitted = pdf.splitTextToSize(String(line), maxWidth);
          pdf.text(splitted, leftX, y);
        });

        // right aligned text (page number)
        const pageText = `Page ${i} of ${pageCount}`;
        const txtWidth =
          (pdf.getStringUnitWidth(pageText) * pdf.internal.getFontSize()) / pdf.internal.scaleFactor;
        const xRight = pageWidth - margin - txtWidth;
        const rightY = startY + (footerLines.length - 1) * lineSpacing;
        pdf.text(pageText, xRight, rightY);
      }
    } catch (err) {
      console.warn("stampFooterOnPdf error:", err);
    }
  };

  // client-side PDF generation from preview using html2pdf
  const handleClientDownload = async (invoice) => {
    const el = printRef.current;
    if (!el) {
      setSnackbar({ open: true, message: "Nothing to print", severity: "error" });
      return;
    }
    const id = invoice.invoiceId ?? invoice.id;
    try {
      setDownloadLoadingId(id);
      const invoiceNumber = invoice?.invoiceNumber ?? invoice?.invoiceNo ?? invoice?.number ?? "invoice";

      const opt = {
        margin: 12, // mm
        filename: `${invoiceNumber}.pdf`,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { scale: 1.4, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      };

      // render to a jsPDF instance
      const worker = html2pdf().set(opt).from(el).toPdf();
      const pdf = await worker.get("pdf"); // jsPDF instance

      // stamp footer
      stampFooterOnPdf(pdf, COMPANY_FOOTER_LINES, { margin: opt.margin, fontSizePt: 10 });

      // save pdf
      pdf.save(`${invoiceNumber}.pdf`);

      setSnackbar({ open: true, message: "PDF downloaded (client-side) with footer", severity: "success" });
    } catch (err) {
      console.error("Client PDF error:", err);
      setSnackbar({ open: true, message: "Failed to generate PDF", severity: "error" });
    } finally {
      setDownloadLoadingId(null);
    }
  };

  const handleClientSendEmail = async (invoice) => {
    const el = printRef.current;
    if (!el) {
      setSnackbar({ open: true, message: "Nothing to print", severity: "error" });
      return;
    }
    const id = invoice.invoiceId ?? invoice.id;
    try {
      setSendingPreviewPdfId(id);

      const invoiceNumber = invoice?.invoiceNumber ?? invoice?.invoiceNo ?? invoice?.number ?? "invoice";
      const opt = {
        margin: 12,
        filename: `${invoiceNumber}.pdf`,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { scale: 1.6, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      };

      const worker = html2pdf().set(opt).from(el).toPdf();
      const pdf = await worker.get("pdf");

      // stamp footer
      stampFooterOnPdf(pdf, COMPANY_FOOTER_LINES, { margin: opt.margin, fontSizePt: 10 });

      // produce blob and send
      const blob = pdf.output("blob");
      const fileName = `${invoiceNumber}.pdf`;
      const file = new File([blob], fileName, { type: "application/pdf" });

      const toEmail =
        invoice.accountEmail ||
        invoice.email ||
        (survey?.accountEmail ?? "") ||
        "";

      const subject = `Invoice ${invoiceNumber}`;
      const body = `Dear Client,\n\nPlease find attached invoice ${invoiceNumber}.\n\nRegards,\nTeam`;

      await sendInvoiceWithPdfAttachment(id, file, { toEmail, subject, body });

      setSnackbar({ open: true, message: "Email sent with PDF attachment (with footer).", severity: "success" });
    } catch (err) {
      console.error("Send mail (preview PDF) error:", err);
      setSnackbar({ open: true, message: "Failed to send email with attachment.", severity: "error" });
    } finally {
      setSendingPreviewPdfId(null);
    }
  };

  const handleSend = (invoice) => {
    setSelectedInvoice(invoice);
    setConfirmSendOpen(true);
  };

  const confirmSend = async () => {
    const invoiceId = selectedInvoice?.invoiceId ?? selectedInvoice?.id;
    if (!invoiceId) {
      setSnackbar({ open: true, message: "Invalid invoice id", severity: "error" });
      setConfirmSendOpen(false);
      return;
    }

    try {
      setSendingInvoiceId(invoiceId);
      const resp = await sendInvoiceById(invoiceId);
      const status = resp?.data?.result?.status ?? resp?.status;
      if (status === 200 || status === 201 || status === undefined) {
        setSnackbar({ open: true, message: "Invoice sent successfully", severity: "success" });
      } else {
        const msg = resp?.data?.result?.message ?? resp?.data?.message ?? "Failed to send invoice";
        setSnackbar({ open: true, message: msg, severity: "error" });
      }
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Error sending invoice", severity: "error" });
    } finally {
      setSendingInvoiceId(null);
      setConfirmSendOpen(false);
    }
  };

  return (
    <>
      <div className="right-content w-100">
        <div
          className="card shadow border-0 w-100 flex-row p-4"
          style={{ justifyContent: "space-between", alignItems: "center" }}
        >
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            <Button
              variant="text"
              onClick={() => navigate("/survey/details/" + sid)}
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
              <h5 className="mb-0 text-muted">#{survey.surveyName}</h5>
              <p className="mb-0" style={{ color: "#ccc" }}>{survey.surveyTitle}</p>
            </div>
          </div>

          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate("/survey/invoice/create/" + sid)}
            >
              New Invoice
            </Button>
          </Box>
        </div>
      </div>

      <Box p={1}>
        <Paper sx={{ p: 2 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {invoices.length === 0 ? (
                <Box p={3}>
                  <Typography>No invoices found for this survey.</Typography>
                </Box>
              ) : (
                <Table size="small">
                  <TableHead style={{ backgroundColor: "#f1f1f1", color: "#000", fontbWeight: "bold" }}>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Invoice No</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Grand Total</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Created By</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoices.map((inv, idx) => {
                      const id = inv.invoiceId ?? inv.id ?? `idx-${idx}`;
                      return (
                        <TableRow key={id}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>{inv.invoiceNumber ?? inv.invoiceNo ?? inv.number}</TableCell>
                          <TableCell>{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleString() : "-"}</TableCell>
                          <TableCell>{(inv.grandTotal ?? inv.grandTotalAmount ?? inv.total ?? 0).toFixed?.(2) ?? inv.grandTotal}</TableCell>
                          <TableCell>{inv.paymentStatus ?? inv.status ?? "-"}</TableCell>
                          <TableCell>{inv.createdBy ?? inv.createdBy ?? "-"}</TableCell>
                          <TableCell align="center">
                            <IconButton size="small" onClick={() => handleView(inv)} title="View">
                              <VisibilityIcon />
                            </IconButton>

                            <IconButton size="small" onClick={() => handleDownload(inv)} title="Download PDF" disabled={downloadLoadingId === id}>
                              {downloadLoadingId === id ? <CircularProgress size={18} /> : <DownloadIcon />}
                            </IconButton>

                            <IconButton size="small" onClick={() => handleSend(inv)} title="Send" disabled={sendingInvoiceId === id}>
                              {sendingInvoiceId === id ? <CircularProgress size={18} /> : <SendIcon />}
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={7}>
                        <Typography variant="caption">Total invoices: {invoices.length}</Typography>
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              )}
            </>
          )}
        </Paper>

        {/* View Dialog - show preview and client-side download */}
        <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Invoice Details</DialogTitle>
          <DialogContent>
            {selectedInvoice ? (
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Box>
                    <Typography variant="subtitle1">
                      Invoice No: {selectedInvoice.invoiceNumber ?? selectedInvoice.invoiceNo ?? selectedInvoice.number}
                    </Typography>
                    <Typography variant="body2">
                      Survey: {selectedInvoice.clientSurveyName ?? selectedInvoice.surveyName ?? "-"}
                    </Typography>
                    <Typography variant="body2">Date: {selectedInvoice.invoiceDate ? new Date(selectedInvoice.invoiceDate).toLocaleString() : "-"}</Typography>
                    <Typography variant="body2">Payment Status: {selectedInvoice.paymentStatus ?? selectedInvoice.status ?? "-"}</Typography>
                  </Box>

                  <Box textAlign="right">
                    <Typography variant="body2">
                      <strong>PO No:</strong> {selectedInvoice.poNumber ?? selectedInvoice.purchaseOrderNo ?? selectedInvoice.poNo ?? "-"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Email:</strong> {selectedInvoice.accountEmail ?? selectedInvoice.email ?? "-"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Grand Total:</strong> {(selectedInvoice.grandTotal ?? selectedInvoice.total ?? 0).toFixed?.(2) ?? selectedInvoice.grandTotal}
                    </Typography>
                  </Box>
                </Box>

                <Box mb={1}>
                  <Typography variant="subtitle2"><strong>Billing Address</strong></Typography>
                  <Typography
                    variant="body2"
                    sx={{ whiteSpace: "pre-line" }}
                  >
                    {formatAddress(selectedInvoice)?.replace(/<br\/>/g, "\n") ?? "-"}
                  </Typography>
                </Box>

                {/* Actions for preview: client-side download + server download */}
                <Box display="flex" justifyContent="flex-end" gap={1} mb={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleClientDownload(selectedInvoice)}
                    disabled={downloadLoadingId === (selectedInvoice.invoiceId ?? selectedInvoice.id)}
                    startIcon={downloadLoadingId === (selectedInvoice.invoiceId ?? selectedInvoice.id) ? <CircularProgress size={14} /> : null}
                  >
                    Download (Preview)
                  </Button>

                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    onClick={() => handleClientSendEmail(selectedInvoice)}
                    disabled={sendingPreviewPdfId === (selectedInvoice.invoiceId ?? selectedInvoice.id)}
                    startIcon={sendingPreviewPdfId === (selectedInvoice.invoiceId ?? selectedInvoice.id) ? <CircularProgress size={14} /> : <SendIcon />}
                  >
                    Send Mail (Preview PDF)
                  </Button>
                </Box>

                {/* Printable area */}
                <div ref={printRef} className="invoice-print" role="region" aria-label="invoice-printable">
                  <div className="invoice-content">
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <img src={logo} alt="Company Logo" style={{ maxHeight: 72, maxWidth: "45%" }} />
                      <img src={ESOMAR} alt="ESOMAR Logo" style={{ maxHeight: 72, maxWidth: "45%" }} />
                    </Box>

                    <Box display="flex" justifyContent="space-between" mb={2} className="invoice-header">
                      <Box>
                        <Typography variant="h6">Invoice #{selectedInvoice.invoiceNumber ?? selectedInvoice.invoiceNo}</Typography>
                        <Typography variant="body2">{selectedInvoice.clientSurveyName ?? selectedInvoice.surveyName}</Typography>
                        <Typography variant="body2">{selectedInvoice.accountEmail}</Typography>
                      </Box>
                      <Box textAlign="right" className="meta">
                        <Typography variant="body2">Date: {selectedInvoice.invoiceDate ? new Date(selectedInvoice.invoiceDate).toLocaleString() : "-"}</Typography>
                        <Typography variant="body2">PO: {selectedInvoice.poNumber ?? "-"}</Typography>
                        <Typography variant="body2">Account Manager : Priyanka</Typography>
                      </Box>
                    </Box>

                    <Box mb={2}>
                      <Typography variant="subtitle2"><strong>Billing Address</strong></Typography>
                      <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                        {formatAddress(selectedInvoice)?.replace(/<br\/>/g, "\n") ?? "-"}
                      </Typography>
                    </Box>

                    <Table size="small" style={{ border: "1px solid #ccc", borderCollapse: "collapse" }}>
                      <TableHead>
                        <TableRow>
                          <TableCell style={{ width: "6%" }}>#</TableCell>
                          <TableCell style={{ width: "50%" }}>Description</TableCell>
                          <TableCell style={{ width: "10%" }}>Qty</TableCell>
                          <TableCell style={{ width: "17%" }}>Unit Cost</TableCell>
                          <TableCell style={{ width: "17%" }}>Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(selectedInvoice.items ?? selectedInvoice.transactions ?? []).map((it, i) => (
                          <TableRow key={i}>
                            <TableCell>{it.lineNo ?? it.line_no ?? i + 1}</TableCell>
                            <TableCell className="description">{it.description ?? it.desc ?? "-"}</TableCell>
                            <TableCell>{it.quantity ?? it.qty ?? "-"}</TableCell>

                            <TableCell>{(it.unitCost ?? it.unit_price ?? 0).toFixed?.(2) ?? it.unitCost}</TableCell>
                            <TableCell>{(it.lineTotal ?? it.total ?? 0).toFixed?.(2) ?? it.lineTotal}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={4} align="right"><strong>Grand Total</strong></TableCell>
                          <TableCell><strong>{(selectedInvoice.grandTotal ?? selectedInvoice.total ?? 0).toFixed?.(2) ?? selectedInvoice.grandTotal}</strong></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>

                    <Box mt={3} className="terms">
                      <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                        {`WIRES/ACH PAYMENTS SHOULD BE SENT TO (BANK ADDRESS):

AXIS BANK,
GROUND FLOOR,
SHOP NO. 72,73,74 AND 75,`}
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                        {`WIRES/ACH PAYMENTS SHOULD BE SENT TO (BANK ADDRESS):

AXIS BANK,
GROUND FLOOR,
SHOP NO. 72,73,74 AND 75,`}
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                        {`WIRES/ACH PAYMENTS SHOULD BE SENT TO (BANK ADDRESS):

AXIS BANK,
GROUND FLOOR,
SHOP NO. 72,73,74 AND 75,`}
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                        {`WIRES/ACH PAYMENTS SHOULD BE SENT TO (BANK ADDRESS):

AXIS BANK,
GROUND FLOOR,
SHOP NO. 72,73,74 AND 75,`}
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                        {`WIRES/ACH PAYMENTS SHOULD BE SENT TO (BANK ADDRESS):

AXIS BANK,
GROUND FLOOR,
SHOP NO. 72,73,74 AND 75,`}
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                        {`WIRES/ACH PAYMENTS SHOULD BE SENT TO (BANK ADDRESS):

AXIS BANK,
GROUND FLOOR,
SHOP NO. 72,73,74 AND 75,`}
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                        {`WIRES/ACH PAYMENTS SHOULD BE SENT TO (BANK ADDRESS):

AXIS BANK,
GROUND FLOOR,
SHOP NO. 72,73,74 AND 75,`}
                      </Typography>
                    </Box>

                    {/* spacer to prevent footer overlap when html2canvas captures */}
                    <div className="bottom-spacer" />
                  </div>
                </div>
              </Box>
            ) : (
              <Typography>No invoice selected</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Confirm Send Dialog */}
        <Dialog open={confirmSendOpen} onClose={() => setConfirmSendOpen(false)}>
          <DialogTitle>Send Invoice</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to send invoice <strong>{selectedInvoice?.invoiceNumber}</strong> to client via email?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmSendOpen(false)}>Cancel</Button>
            <Button onClick={confirmSend} variant="contained" color="primary" disabled={!!sendingInvoiceId}>
              {sendingInvoiceId ? <CircularProgress size={18} /> : "Send"}
            </Button>
          </DialogActions>
        </Dialog>

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
    </>
  );
};

export default InvoiceListForSurvey;
