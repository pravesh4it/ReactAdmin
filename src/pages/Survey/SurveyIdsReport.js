import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";


import {
  TextField,
  Button,
  Autocomplete,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  IconButton,
} from "@mui/material";

import AttachFileIcon from "@mui/icons-material/AttachFile";
import DeleteIcon from "@mui/icons-material/Delete";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { AgGridReact } from "ag-grid-react";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import {
  CircularProgress,
  Backdrop
} from "@mui/material";
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  GetSurveyReportList,
  GenerateVendorAllocation,
  SendVendorAllocation
} from "../../api/survey";
import axios from "axios";

const SurveyIdsReport = () => {
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [searchIds, setSearchIds] = useState("");
  const [surveys, setSurveys] = useState([]);
  const [vendorData, setVendorData] = useState([]);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] =
    useState("success");
  const [emailData, setEmailData] = useState({
  poNumber: "",
  emails: "",
  subject: "",
  body: ""
});
const [errors, setErrors] = useState({
  poNumber: "",
  emails: "",
  subject: "",
  body: ""
});
const [loading, setLoading] = useState(false);
//const [systemAttachment, setSystemAttachment] = useState(null);
const [excelBlob, setExcelBlob] = useState(null);
const [excelUrl, setExcelUrl] = useState("");
const [sending, setSending] = useState(false);
const [showIdsOpen, setShowIdsOpen] = useState(false);
const [selectedIds, setSelectedIds] = useState([]);
const [viewMailOpen, setViewMailOpen] = useState(false);
const [selectedMail, setSelectedMail] = useState(null);
const [systemAttachment, setSystemAttachment] = useState({
    fileName: "",
    downloadUrl: ""
});
const [attachments, setAttachments] = useState([]);
const quillModules = {
    toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        ["link"],
        ["clean"],
        ["table"]
    ]
};
const APIURL = `${process.env.REACT_APP_API_URL}/survey/`;
const quillFormats = [
    "header",
    "bold",
    "italic",
    "underline",
    "list",
    "bullet",
    "color",
    "background",
    "align",
    "link"
];
  const showSnackbar = (
    message,
    severity = "success"
  ) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  useEffect(() => {
  loadSurveys();
}, []);


const loadSurveys = async () => {
  try {

    const response =
      await GetSurveyReportList();

    if (!response.errors) {
      setSurveys(response.result.data);
    }

  } catch (error) {
    console.error(error);

    showSnackbar(
      "Failed to load PDR list",
      "error"
    );
  }
};

const handleViewMail = (mail) => {
    setSelectedMail(mail);
    setViewMailOpen(true);
};
const validateEmailPopup = () => {

  const newErrors = {};

  if (!emailData.poNumber.trim()) {
    newErrors.poNumber = "PO Number is required";
  }

  if (!emailData.emails.trim()) {
    newErrors.emails = "Email address is required";
  } else {

    const emails = emailData.emails
      .split(";")
      .map(e => e.trim())
      .filter(Boolean);

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const invalidEmails = emails.filter(
      email => !emailRegex.test(email)
    );

    if (invalidEmails.length > 0) {
      newErrors.emails =
        "One or more email addresses are invalid";
    }
  }

  if (!emailData.subject.trim()) {
    newErrors.subject = "Subject is required";
  }

  const plainText = emailData.body
    .replace(/<[^>]*>/g, "")
    .trim();

if (!plainText) {
    newErrors.body = "Email body is required";
}

  setErrors(newErrors);

  return Object.keys(newErrors).length === 0;
};
  const handleGenerate = async () => {
    if (!selectedSurvey) {
      showSnackbar(
        "Please select a PDR",
        "warning"
      );
      return;
    }

    console.log("Generating Vendor Allocation for Survey:", selectedSurvey, "with IDs:", searchIds);

    const ids = searchIds
      .split(/[,\n\r\s]+/)
      .filter(Boolean);

    if (!ids.length) {
      showSnackbar(
        "Please paste IDs",
        "warning"
      );
      return;
    }

    const totalIds = ids.length;
    console.log("Total IDs:", totalIds);
    console.log("Selected Survey ID:", selectedSurvey.id);

    const mockVendorData = [
      
    ];
    const payload = {
      surveyId: selectedSurvey.id,
      RespondentIds: ids,
      generateAllocation: true
    };

    const response = await GenerateVendorAllocation(payload);
    console.log("Vendor Allocation Response:", response.result.data.result.data);
    console.log("Mock Vendor Data:", mockVendorData);

    setVendorData(response.result.data.result.data || mockVendorData);

    showSnackbar(
      "Vendor allocation generated",
      "success"
    );
  };
  const handleShowIds = (row) => {
  setSelectedIds(row.respondentIds || []);
  setShowIdsOpen(true);
};

  const handlePreview = (data) => {
    // Reset previous state
    setAttachments([]);
    setErrors({});
    setExcelBlob(null);

    if (excelUrl) {
        URL.revokeObjectURL(excelUrl);
        setExcelUrl("");
    }

  setPreviewData(data);
  // Generate Excel only if IDs exist
if (data.respondentIds && data.respondentIds.length > 0) {
    generateAllocationExcel(data);
}
  //generateAllocationExcel(data);
  //setPreviewData(data);
  
  console.log("Preview Data:", data);
  setSystemAttachment({
    fileName: `${data.vendorName}_Respondents.xlsx`,
    totalIds: data.respondentIds.length
});
const defaultBody = `
    <html>
    <body style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#333;">

    <p>Dear Partner,</p>

    <p>Please find below the attached Respondent IDs.</p>

    <br/>

    <p>Please complete these interviews at the earliest.</p>

    <p>
    Thanks & Regards,<br/>
    <b>Pro Dynamic Research</b>
    </p>

    </body>
    </html>
    `;

setEmailData({
    poNumber: data.poNumber || "",
    emails: data.emails || "",
    subject: data.subject || "",
    body: data.body || defaultBody
});
  setPreviewOpen(true);
  //closePreview();
};
const handleAttachmentUpload = (event) => {

    const files = Array.from(event.target.files);

    if (files.length === 0)
        return;

    setAttachments(prev => {

        const existing = [...prev];

        files.forEach(file => {

            const alreadyExists = existing.some(x =>
                x.name === file.name &&
                x.size === file.size
            );

            if (!alreadyExists) {
                existing.push(file);
            }

        });

        return existing;
    });

    // Reset input so the same file can be selected again later
    event.target.value = "";
};
const removeAttachment = (index) => {

    setAttachments(prev =>
        prev.filter((_, i) => i !== index)
    );

};
const handleSurveyChange = async (event, value) => {

    setSelectedSurvey(value);

    // Reset page
    setVendorData([]);
    setSearchIds("");

    if (!value)
        return;

    try {

        setLoading(true);

        const payload = {
            surveyId: value.id,
            respondentIds: [],
            generateAllocation: false
        };

        const response = await GenerateVendorAllocation(payload);

        if (!response.errors) {

            setVendorData(response.result.data.result.data || []);

        } else {

            showSnackbar(
                "Unable to load vendor information.",
                "warning"
            );
        }

    }
    catch (error) {

        console.error(error);

        showSnackbar(
            "Failed to load vendor information.",
            "error"
        );
    }
    finally {

        setLoading(false);

    }
};
const downloadAttachment = async (id, fileName) => {
    const response = await axios.get(
        `${APIURL}DownloadAttachment/${id}`,
        {
            responseType: "blob",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        }
    );

    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);
};

  const handleSendEmail = async () => {
    if (!validateEmailPopup()) {
    return;
  }

  try {
    //setloading(true);
    setSending(true);

    const formData = new FormData();

        formData.append(
            "surveyId",
            selectedSurvey.id
        );

        formData.append(
            "vendorId",
            previewData.vendorId
        );

        formData.append(
            "poNumber",
            emailData.poNumber
        );

        formData.append(
            "emails",
            emailData.emails
        );

        formData.append(
            "subject",
            emailData.subject
        );

        formData.append(
            "body",
            emailData.body
        );
        if (
            excelBlob &&
            systemAttachment &&
            previewData?.respondentIds?.length > 0
        ) {
            const excelFile = new File(
                [excelBlob],
                systemAttachment.fileName,
                {
                    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                }
            );

            formData.append("files", excelFile);
            formData.append(
                "systemAttachmentName",
                systemAttachment.fileName
            );
        }

        attachments.forEach(file => {

            formData.append(
                "files",
                file
            );

        });
        
    console.log("Sending email with payload:", formData);
    console.log("Is FormData:", formData instanceof FormData);

if (formData instanceof FormData) {
    for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
    }
}

    const response =
      await SendVendorAllocation(formData);

    if (!response.errors) {

      showSnackbar(
        "Email sent successfully",
        "success"
      );
      //setPreviewOpen(false);
      closePreview();
      // Reload vendor information
    const payload = {
        surveyId: selectedSurvey.id,
        respondentIds: searchIds
            .split(/[,\n\r\s]+/)
            .filter(Boolean),
        generateAllocation: true
    };

    const reload = await GenerateVendorAllocation(payload);

    if (!reload.errors) {
        setVendorData(reload.result.data.result.data);
    }

    } else {

      showSnackbar(
        "Failed to send email",
        "error"
      );
    }

  } catch (error) {

    console.error(error);

    showSnackbar(
      "Failed to send email",
      "error"
    );
  }
  finally {
    setSending(false);
  }
};

  const vendorColumnDefs = [
    {
      headerName: "Survey ID",
      field: "surveyId",
      flex: 1,
    },
    {
      headerName: "Vendor Name",
      field: "vendorName",
      flex: 1.5,
    },
    {
      headerName: "PO Number",
      field: "poNumber",
      editable: false,
      flex: 1.5,
    },
    {
      headerName: "Final IDs Count",
      field: "idsCount",
      flex: 1,
    },
    {
      headerName: "Subject Line",
      field: "subject",
      editable: true,
      flex: 2,
    },
    {
      headerName: "Email Box",
      field: "emails",
      editable: true,
      flex: 3,
    },
    {
  headerName: "Actions",
  flex: 2,
  cellRenderer: (params) => (
    <div
      style={{
        display: "flex",
        gap: "8px",
      }}
    >
      <Button
        size="small"
        variant="outlined"
        onClick={() => handlePreview(params.data)}
      >
        Preview
      </Button>

      <Button
        size="small"
        variant="contained"
        color="secondary"
        onClick={() => handleShowIds(params.data)}
      >
        Show IDs
      </Button>
    </div>
  ),
}
  ];
  const closePreview = () => {

    if (excelUrl) {
        URL.revokeObjectURL(excelUrl);
    }

    setPreviewOpen(false);

    setPreviewData(null);
    setEmailData({
        poNumber: "",
        emails: "",
        subject: "",
        body: ""
    });

    setAttachments([]);
    setErrors({});
    setExcelBlob(null);
    setExcelUrl("");
    setSystemAttachment(null);
};
  const generateAllocationExcel = (vendor) => {
    console.log("Generating Excel for vendor:", vendor);
    if (!vendor.respondentIds || vendor.respondentIds.length === 0) {
        return;
    }

    const data = vendor.respondentIds.map(x => ({
        "Respondent ID": x.respondentId,
        "Survey": x.surveyName,
        "Country": x.country
    }));

    const workbook = XLSX.utils.book_new();

    const worksheet = XLSX.utils.json_to_sheet(data);

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Respondents"
    );

    const excelArray = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array"
    });

    const blob = new Blob(
        [excelArray],
        {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        });

    const fileName =
        `${vendor.vendorName.replace(/\s+/g, "_")}_Respondents.xlsx`;

    const url = URL.createObjectURL(blob);

    setExcelBlob(blob);

    setExcelUrl(url);

    setSystemAttachment({
        fileName
    });
};
  
  const idsRowData = selectedIds;

const idsColumnDefs = [
  {
    headerName: "Sr No",
    valueGetter: "node.rowIndex + 1",
    width: 90,
  },
  {
    headerName: "Respondent ID",
    field: "respondentId",
    flex: 1.5,
  },
  {
    headerName: "Survey",
    field: "surveyName",
    flex: 2,
  },
  {
    headerName: "Country",
    field: "country",
    flex: 1,
  },
  {
    headerName: "Language",
    field: "language",
    flex: 1,
  },
];
  return (
    <>
    <div className="right-content w-100">
      <div className="card shadow border-0 p-4">

        <h4 className="mb-4">
          Vendor ID Distribution
        </h4>

        <div
          style={{
            display: "flex",
            gap: 15,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <Autocomplete
    sx={{ width: 400 }}
    options={surveys}
    value={selectedSurvey}
    onChange={handleSurveyChange}
    getOptionLabel={(option) => option.surveyName || ""}
    isOptionEqualToValue={(option, value) =>
        option.id === value?.id
    }
    renderInput={(params) => (
        <TextField
            {...params}
            label="Select PDR"
            size="small"
        />
    )}
/>

          <Button
            variant="contained"
            onClick={handleGenerate}
          >
            Generate Vendor Allocation
          </Button>
        </div>

        <div className="mt-3">
          <TextField
            fullWidth
            multiline
            minRows={6}
            maxRows={12}
            label="Paste Respondent IDs"
            value={searchIds}
            onChange={(e) =>
              setSearchIds(e.target.value)
            }
            placeholder={`RID001
RID002
RID003
RID004
RID005`}
          />
        </div>

        {vendorData.map((vendor) => (
    <div
        key={vendor.vendorId}
        className="card mt-4 shadow-sm border"
    >
        <div
            className="card-header d-flex justify-content-between align-items-center"
        >
            <div>

                <h5 className="mb-1">
                    {vendor.vendorName}
                </h5>

                <div>
                    <b>PO Number :</b> {vendor.poNumber}
                </div>

                <div>
                    <b>Total IDs :</b> {vendor.idsCount}
                </div>

            </div>
          
            <Button
                variant="contained"
                onClick={() => handlePreview(vendor)}
            >
                New Mail
            </Button>
          

        </div>

        {vendor.respondentIds?.length > 0 && (

    <Accordion className="mt-3">

        <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
        >

            <Typography fontWeight="bold">

                Allocated Respondents
                ({vendor.respondentIds.length})

            </Typography>

        </AccordionSummary>

        <AccordionDetails>

            <table className="table table-bordered table-sm">

                <thead>

                    <tr>

                        <th>#</th>

                        <th>Respondent ID</th>

                        <th>Survey</th>

                        <th>Country</th>

                        <th>Language</th>

                    </tr>

                </thead>

                <tbody>

                    {vendor.respondentIds.map((r, index) => (

                        <tr key={index}>

                            <td>{index + 1}</td>

                            <td>{r.respondentId}</td>

                            <td>{r.surveyName}</td>

                            <td>{r.country}</td>

                            <td>{r.language}</td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </AccordionDetails>

    </Accordion>

)}

        <div className="card-body">

    <h6>
        Sent Mail History
    </h6>

    {vendor.mailHistory.length === 0 ?

        <div className="text-muted">
            No mail sent yet.
        </div>

        :

        <table className="table table-bordered table-hover">

            <thead>

                <tr>

                    <th>Sent Date</th>

                    <th>Subject</th>

                    <th>To</th>

                    <th>Status</th>

                    <th>Attachments</th>

                    <th>Body</th>

                </tr>

            </thead>

            <tbody>

                {vendor.mailHistory.map((mail, index) => (

                    <tr key={index}>

                        <td>
                            {new Date(mail.sentDate).toLocaleString()}
                        </td>

                        <td>{mail.subject}</td>

                        <td>{mail.emails}</td>

                        <td>

                            {mail.isSent ?

                                <span className="badge bg-success">
                                    Sent
                                </span>

                                :

                                <span className="badge bg-danger">
                                    Failed
                                </span>

                            }

                        </td>

                        <td>

                            {mail.attachments?.length > 0 ?

                                mail.attachments.map((att, i) => (

                                    <div key={i}>

                                        <AttachFileIcon
                                            fontSize="small"
                                            sx={{
                                                verticalAlign: "middle",
                                                mr: 0.5
                                            }}
                                        />

                                        <a
                                            href={`${APIURL}DownloadAttachment/${att.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {att.fileName}
                                        </a>

                                        {att.isSystemGenerated &&
                                            <Chip
                                                label="Auto"
                                                size="small"
                                                color="success"
                                                sx={{ ml: 1 }}
                                            />
                                        }

                                    </div>

                                ))

                                :

                                <span className="text-muted">
                                    No Attachments
                                </span>

                            }

                        </td>

                        <td>

                            <Button
                                size="small"
                                onClick={() => handleViewMail(mail)}
                            >
                                View
                            </Button>

                        </td>

                    </tr>

                ))}

            </tbody>

        </table>

    }

</div>

    </div>
))}
      </div>
</div>
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Email Preview
        </DialogTitle>

        <DialogContent>

  <TextField
    fullWidth
    margin="normal"
    label="PO Number"
    value={emailData.poNumber}
    error={!!errors.poNumber}
    helperText={errors.poNumber}
    disabled={true}
    onChange={(e) => {
        setEmailData({
            ...emailData,
            poNumber: e.target.value
        });

        setErrors({
            ...errors,
            poNumber: ""
        });
    }}
/>

  <TextField
    fullWidth
    margin="normal"
    label="Email Addresses"
    value={emailData.emails}
    error={!!errors.emails}
    helperText={
        errors.emails ||
        "Multiple emails separated by ;"
    }
    onChange={(e) => {
        setEmailData({
            ...emailData,
            emails: e.target.value
        });

        setErrors({
            ...errors,
            emails: ""
        });
    }}
/>

  <TextField
    fullWidth
    margin="normal"
    label="Subject"
    value={emailData.subject}
    error={!!errors.subject}
    helperText={errors.subject}
    onChange={(e) => {
        setEmailData({
            ...emailData,
            subject: e.target.value
        });

        setErrors({
            ...errors,
            subject: ""
        });
    }}
  />

  <div style={{ marginTop: 16, marginBottom: 8 }}>

<Typography
    variant="h6"
    sx={{ mt: 3 }}
>
    Attachments
</Typography>

<List>

    {/* Auto generated attachment */}

    {systemAttachment && excelBlob && (

        <ListItem>

            <ListItemIcon>
                <InsertDriveFileIcon color="primary" />
            </ListItemIcon>

            <ListItemText
                primary={systemAttachment.fileName}
                secondary="Automatically generated"
            />

            <Button
                size="small"
                onClick={() => window.open(excelUrl)}
            >
                View
            </Button>

            <Button
                size="small"
                onClick={() =>
                    saveAs(
                        excelBlob,
                        systemAttachment.fileName
                    )
                }
            >
                Download
            </Button>

        </ListItem>

    )}

    {/* User uploaded files */}

    {attachments.map((file, index) => (

        <ListItem
            key={index}
            secondaryAction={
                <IconButton
                    edge="end"
                    color="error"
                    onClick={() => removeAttachment(index)}
                >
                    <DeleteIcon />
                </IconButton>
            }
        >

            <ListItemIcon>
                <AttachFileIcon />
            </ListItemIcon>

            <ListItemText
                primary={file.name}
                secondary={`${(file.size / 1024).toFixed(1)} KB`}
            />

        </ListItem>

    ))}

</List>

<Button
    component="label"
    variant="outlined"
    sx={{ mt: 2 }}
>
    Upload Attachment

    <input
        hidden
        multiple
        type="file"
        onChange={handleAttachmentUpload}
    />

</Button>
    <label
        style={{
            display: "block",
            marginBottom: 8,
            marginTop:10,
            fontWeight: 500
        }}
    >
        Email Body
    </label>
    <ReactQuill
    theme="snow"
    value={emailData.body}
    modules={quillModules}
    formats={quillFormats}
    onChange={(value) => {
        setEmailData({
            ...emailData,
            body: value
        });

        setErrors({
            ...errors,
            body: ""
        });
    }}
    style={{
        height: 300,
        marginBottom: 50
    }}
/>


    {errors.body && (
        <div
            style={{
                color: "#d32f2f",
                fontSize: 12,
                marginTop: 5
            }}
        >
            {errors.body}
        </div>
    )}
</div>

</DialogContent>
<DialogActions>

  <Button
    onClick={() =>
      setPreviewOpen(false)
    }
  >
    Cancel
  </Button>

  <Button
    variant="contained"
    disabled={sending}
    onClick={handleSendEmail}
>
    {sending ? (
        <CircularProgress
            size={20}
            color="inherit"
        />
    ) : (
        "Send Email"
    )}
</Button>

</DialogActions>
      </Dialog>
      <Dialog
  open={showIdsOpen}
  onClose={() => setShowIdsOpen(false)}
  maxWidth="sm"
  fullWidth
>
  <DialogTitle>
    Respondent IDs
  </DialogTitle>

  <DialogContent>

    <div
      className="ag-theme-quartz"
      style={{
        width: "100%",
        height: 500
      }}
    >
      <AgGridReact
        rowData={idsRowData}
        columnDefs={idsColumnDefs}
        pagination
        paginationPageSize={50}
      />
    </div>

  </DialogContent>

  <DialogActions>

    <Button
      onClick={() => setShowIdsOpen(false)}
    >
      Close
    </Button>

  </DialogActions>
</Dialog>
<Dialog
    open={viewMailOpen}
    onClose={() => setViewMailOpen(false)}
    maxWidth="lg"
    fullWidth
>
    <DialogTitle>
        Sent Mail Details
    </DialogTitle>

    <DialogContent>

        {selectedMail && (
            <>
                <div
                    style={{
                        marginTop: 20,
                        border: "1px solid #ddd",
                        borderRadius: 4,
                        padding: 15,
                        minHeight: 300,
                        background: "#fff",
                        overflow: "auto"
                    }}
                    dangerouslySetInnerHTML={{
                        __html: selectedMail.body
                    }}
                />
              <p> <b> Sent On :</b> {new Date(selectedMail.sentDate).toLocaleString()}</p>

            </>
        )}

    </DialogContent>

    <DialogActions>

        <Button
            onClick={() => setViewMailOpen(false)}
        >
            Close
        </Button>

    </DialogActions>
</Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() =>
          setSnackbarOpen(false)
        }
      >
        <Alert
          severity={snackbarSeverity}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SurveyIdsReport;