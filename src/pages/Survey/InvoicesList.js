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
import footerLinkedInImg from "../../assets/images/linkedin.png";
import footerFacebookImg from "../../assets/images/facebook.png";
import footerWebImg from "../../assets/images/web.png";
import { LinkedIn, Facebook, Language } from "@mui/icons-material";

/**
 * Footer lines (we will stamp only 1-2 short lines into the PDF footer)
 */
const PDF_FOOTER_LINES = [
  "Pease send your RFQs to sales@prodynamicresearch.com for response 24x7",
];

const SOCIAL_LINKS = {
  linkedin: "https://www.linkedin.com/company/pro-dynamic-research",
  facebook: "https://www.facebook.com/prodynamicresearch",
  website: "http://prodynamicresearch.com",
};

const InvoiceListForSurvey = () => {
  const { sid } = useParams();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [sendingInvoiceId, setSendingInvoiceId] = useState(null);
  const [downloadLoadingId, setDownloadLoadingId] = useState(null);
  const [confirmSendOpen, setConfirmSendOpen] = useState(false);
  const [sendingPreviewPdfId, setSendingPreviewPdfId] = useState(null);
  const [footerIconsData, setFooterIconsData] = useState({ linkedin: null, facebook: null, website: null });
  const [survey, setSurvey] = useState({});
  const navigate = useNavigate();

  const printRef = useRef(null);

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

  // preload icons to data URLs once (used by jsPDF.addImage)
  useEffect(() => {
    const loadDataUrl = async (src) => {
      try {
        const res = await fetch(src);
        const blob = await res.blob();
        return await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.warn("Failed to load footer icon", src, e);
        return null;
      }
    };

    (async () => {
      const [lnk, fb, web] = await Promise.all([
        loadDataUrl(footerLinkedInImg),
        loadDataUrl(footerFacebookImg),
        loadDataUrl(footerWebImg),
      ]);
      setFooterIconsData({ linkedin: lnk, facebook: fb, website: web });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleDownload = async (invoice) => {
    const id = invoice.invoiceId ?? invoice.id;
    try {
      setDownloadLoadingId(id);
      const resp = await downloadInvoicePdf(id); // axios should use responseType: 'blob'
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
// stamp footer with icons and links onto every page (icons are added as images, links via pdf.link)
const stampFooterOnPdf = (pdf, footerLines = [], options = {}, iconsData = [], iconUrls = []) => {
  try {
    const margin = typeof options.margin === "number" ? options.margin : 8; // mm
    const fontSizePt = options.fontSizePt ?? 9;
    const pageCount = pdf.internal.getNumberOfPages();
    const pageHeight = pdf.internal.pageSize.getHeight(); // mm
    const pageWidth = pdf.internal.pageSize.getWidth(); // mm

    const iconSizeMm = options.iconSizeMm ?? 6; // mm
    const iconGapMm = options.iconGapMm ?? 2; // mm

    pdf.setFont("helvetica");
    pdf.setFontSize(fontSizePt);
    pdf.setTextColor(70);

    const fontSizeMm = fontSizePt * 0.352778;
    const lineSpacing = options.lineSpacingMm ?? (fontSizeMm + 1.2);
    const footerHeight = Math.max(1, footerLines.length + 1) * lineSpacing;

    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);

      let startY = pageHeight - margin - footerHeight + (fontSizeMm * 0.2);
      if (startY < margin) startY = pageHeight - margin - footerHeight;

      // draw text lines (left aligned)
      footerLines.forEach((line, idx) => {
        const y = startY + idx * lineSpacing;
        const maxWidth = pageWidth - margin * 2 - 70; // leave space for icons or extra text
        const splitted = pdf.splitTextToSize(String(line), maxWidth);
        pdf.text(splitted, margin, y);
      });

      // ====== NEW SECTION: "Follow us on:" with icons on second line (left side) ======
      if (iconsData.length > 0) {
        const followText = "Follow us on:";
        const followTextWidth = (pdf.getStringUnitWidth(followText) * pdf.internal.getFontSize()) / pdf.internal.scaleFactor;

        const iconsY = startY + (footerLines.length) * lineSpacing; // place on next line
        let iconsStartX = margin + followTextWidth + 2; // start icons right after the text

        // draw "Follow us on:"
        pdf.text(followText, margin, iconsY + iconSizeMm / 2.5);

        // draw icons next to the text
        iconsData.forEach((d, idx) => {
          if (!d) return;
          try {
            pdf.addImage(d, "PNG", iconsStartX, iconsY - iconSizeMm / 2, iconSizeMm, iconSizeMm);
            // add hyperlink rectangle over the icon area
            const url = iconUrls[idx];
            if (url) {
              pdf.link(iconsStartX, iconsY - iconSizeMm / 2, iconSizeMm, iconSizeMm, { url });
            }
          } catch (e) {
            console.warn("pdf.addImage failed for footer icon", e);
          }
          iconsStartX += iconSizeMm + iconGapMm;
        });
      }

      // page number on right
      const pageText = `Page ${i} of ${pageCount}`;
      const txtWidth = (pdf.getStringUnitWidth(pageText) * pdf.internal.getFontSize()) / pdf.internal.scaleFactor;
      const xRight = pageWidth - margin - txtWidth;
      const rightY = startY + (footerLines.length - 1) * lineSpacing;
      pdf.text(pageText, xRight, rightY);
    }
  } catch (err) {
    console.warn("stampFooterOnPdf error:", err);
  }
};


  // client-side PDF generation
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
  margin: 10, // mm — match the @page margin in CSS
  filename: `${invoiceNumber}.pdf`,
  image: { type: "jpeg", quality: 0.95 },
  html2canvas: { scale: 1.0, useCORS: true, logging: false, scrollY: 0 },
  jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  pagebreak: {
    mode: ["css", "legacy"],
    avoid: [".invoice-header", ".terms", ".invoice-table", ".bottom-spacer"]
  },
};
      window.scrollTo(0, 0);
      const worker = html2pdf().set(opt).from(el).toPdf();
      const pdf = await worker.get("pdf");

      // stamp short footer lines + icons (icons order: website, linkedin, facebook)
      const iconArray = [footerIconsData.website, footerIconsData.linkedin, footerIconsData.facebook];
      const iconUrls = [SOCIAL_LINKS.website, SOCIAL_LINKS.linkedin, SOCIAL_LINKS.facebook];
      stampFooterOnPdf(pdf, PDF_FOOTER_LINES, { margin: opt.margin, fontSizePt: 9, iconSizeMm: 6, iconGapMm: 3 }, iconArray, iconUrls);

      pdf.save(`${invoiceNumber}.pdf`);
      setSnackbar({ open: true, message: "PDF downloaded with stamped footer.", severity: "success" });
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
        margin: 8,
        filename: `${invoiceNumber}.pdf`,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { scale: 1.0, useCORS: true, logging: false, scrollY: 0 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"], avoid: [".invoice-header", ".terms", ".invoice-table"] },
      };

      window.scrollTo(0, 0);
      const worker = html2pdf().set(opt).from(el).toPdf();
      const pdf = await worker.get("pdf");

      const iconArray = [footerIconsData.website, footerIconsData.linkedin, footerIconsData.facebook];
      const iconUrls = [SOCIAL_LINKS.website, SOCIAL_LINKS.linkedin, SOCIAL_LINKS.facebook];
      stampFooterOnPdf(pdf, PDF_FOOTER_LINES, { margin: opt.margin, fontSizePt: 9, iconSizeMm: 6, iconGapMm: 3 }, iconArray, iconUrls);

      const blob = pdf.output("blob");
      const fileName = `${invoiceNumber}.pdf`;
      const file = new File([blob], fileName, { type: "application/pdf" });

      const toEmail = invoice.accountEmail || invoice.email || (survey?.accountEmail ?? "") || "";
      const subject = `Invoice ${invoiceNumber}`;
      const body = `<!doctype html>
        <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <title>Invoice ${invoiceNumber}</title>
          <style>
            body { font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #222; margin: 0; padding: 0; -webkit-text-size-adjust: 100%; }
            .container { width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; box-sizing: border-box; }
            .header { padding-bottom: 10px; border-bottom: 1px solid #eee; margin-bottom: 16px; }
            .content p { margin: 12px 0; line-height: 1.5; }
            .cta { margin-top: 18px; }
            .button { display: inline-block; background: #0858f7; color: #fff; padding: 10px 16px; border-radius: 6px; text-decoration: none; font-weight: 600; }
            .footer { margin-top: 22px; font-size: 12px; color: #666; border-top: 1px solid #f0f0f0; padding-top: 12px; }
            .social a { margin-right: 8px; color: #0858f7; text-decoration: none; }
            @media (max-width:480px){ .container{padding:12px;} .button{padding:8px 12px;} }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin:0; font-size:18px;">Pro Dynamic Research</h2>
            </div>

            <div class="content">
              <p>Dear Client,</p>

              <p>Please find attached invoice <strong>#${invoiceNumber}</strong> for your reference.</p>

              <p>If you would like to view the invoice online or have any questions, reply to this email or contact our sales team at
              <a href="mailto:sales@prodynamicresearch.com">sales@prodynamicresearch.com</a>.</p>

              <div class="cta">
                <!-- Optional: link to website (use only if you host the invoice somewhere) -->
                <a class="button" href="${SOCIAL_LINKS.website}" target="_blank" rel="noopener">Visit our website</a>
              </div>

              <p style="margin-top:18px;">Regards,<br/>Team — Pro Dynamic Research</p>
            </div>

            <div class="footer">
              <div>Pease send your RFQs to <a href="mailto:sales@prodynamicresearch.com">sales@prodynamicresearch.com</a> for response 24x7</div>
              <div style="margin-top:8px;" class="social">
                Follow us:
                <a href="${SOCIAL_LINKS.linkedin}" target="_blank" rel="noopener">LinkedIn</a> |
                <a href="${SOCIAL_LINKS.facebook}" target="_blank" rel="noopener">Facebook</a> |
                <a href="${SOCIAL_LINKS.website}" target="_blank" rel="noopener">Website</a>
              </div>
            </div>
          </div>
        </body>
        </html>`;

      //const body = `Dear client. Please find the attached invoice <strong>#${invoiceNumber}</strong> for your reference.`;
      await sendInvoiceWithPdfAttachment(id, file, { toEmail, subject, body });

      setSnackbar({ open: true, message: "Email sent with PDF attachment.", severity: "success" });
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

          <Box display="flex" gap={1} alignItems="center">
            <Button variant="contained" color="primary" onClick={() => navigate("/survey/invoice/" + sid)}>
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

        {/* View Dialog */}
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
                  <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                    {formatAddress(selectedInvoice)?.replace(/<br\/>/g, "\n") ?? "-"}
                  </Typography>
                </Box>

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
                <div ref={printRef} className="invoice-print" role="region" aria-label="invoice-printable" style={{ position: "relative", paddingBottom: 24 }}>
                  <div className="invoice-content">
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <img src={logo} alt="Company Logo" style={{ maxHeight: 72, maxWidth: "45%" }} />
                      <img src={ESOMAR} alt="ESOMAR Logo" style={{ maxHeight: 72, maxWidth: "45%" }} />
                    </Box>

                    <Box display="flex" justifyContent="space-between" mb={2} className="invoice-header avoid-break">
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

                    <Table className="invoice-table avoid-break" size="small" style={{ border: "1px solid #ccc", borderCollapse: "collapse" }}>
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

                    <Box mt={3} className="terms avoid-break">
                      <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
{`WIRES/ACH PAYMENTS SHOULD BE SENT TO (BANK ADDRESS):

AXIS BANK,
GROUND FLOOR,
SHOP NO. 72,73,74 AND 75,
PARAS TRADE CENTRE,
GURUGRAM, HARYANA -122003

ACCOUNT NUMBER: 920020061212577
IFSC: UTIB0004373

FOR RECEIVING INTERNATIONAL WIRES IN USD ONLY:
Swift Code: AXISINBBA31

FOR CREDIT TO (COMPANY ADDRESS):
PRO DYNAMIC RESEARCH,
FLAT NO. 904, TOWER 9, VALLEY VIEW ESTATE,
GURGAON FARIDABAD ROAD,
GURGRAM, HARYANA-122003
GSTIN 06ASBPL4141J1ZX`}
                      </Typography>
                    </Box>

                    {/* NO HTML footer here — footer will be stamped into the PDF only */}

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
