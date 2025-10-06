import { useContext, useEffect, useMemo, useState } from "react";
import { styled, emphasize } from "@mui/material/styles";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Chip from "@mui/material/Chip";
import HomeIcon from "@mui/icons-material/Home";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import {
  GetPartners,
  GetPartnersSurvey,
  GetSurvey,
  GetPartnerDetails,
  GetPartnersOptions,
  AddPartnerToSurvey,
  DeletePartner,
  CloneSurvey,
  GetOptionsSurvey,
  UpdateSurveyStatus,
  UpdateSurveyResponse,
  AddSurveyResponse,
  GetRatesById,
  AddRates
} from "../../api/survey";
import { useNavigate, useParams } from "react-router-dom";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import { IconButton, Typography } from "@mui/material";
import { Edit, Delete, PlayCircleOutline } from "@mui/icons-material";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";

const ViewSurvey = () => {
    const [rowData, setRowData] = useState([]);
    const [survey, setSurvey] = useState({});
    const [partners, setPartners] = useState([]); // For dropdown
    const [selectedPartnerId, setSelectedPartnerId] = useState("");
    const [partnerData, setPartnerData] = useState({});
    const [preScreener, setPreScreener] = useState(false);
    const [uniqueLink, setUniqueLink] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [partnerForm, setPartnerForm] = useState({
        rate: "",
        quota: "",
        variable: "",
        successLink: "",
        disqualificationLink: "",
        quotaLink: "",
        pausedLink: "",
        securityFailLink: ""
    });
    const [surveyLink, setSurveyLink] = useState({
        successLink: "",
        disqualificationLink: "",
        quotaFullLink: "",
        defaultVendorURL:""
    });
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");
    const [searchText, setSearchText] = useState("");
    const navigate = useNavigate();
    const { id } = useParams();
    const [paginationPageSize] = useState(100);
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState("");
    const [options, setOptions] = useState({
            salesManagers: [],
            projectManagers: [],
            countries: [],
            languages: [],
            clients: [],
            status: [],
            currencies: [], // Added for Currency options
          });
    const [ipAddress, setIpAddress] = useState("");
    const [loading, setLoading] = useState(false);

    // ---- Partner Rate related state ----
    const [partnerRateModalOpen, setPartnerRateModalOpen] = useState(false);
    const [selectedPartnerRowForRate, setSelectedPartnerRowForRate] = useState(null);
    const [newPartnerRateValue, setNewPartnerRateValue] = useState("");
    const [newPartnerRateCurrency, setNewPartnerRateCurrency] = useState(""); // currency id
    const [newPartnerRateStartDate, setNewPartnerRateStartDate] = useState(dayjs().startOf("day"));
    const [newPartnerRateNote, setNewPartnerRateNote] = useState("");
    const [partnerRateData, setPartnerRateData] = useState(null); // { activeRate, history }

    useEffect(() => {
        async function fetchData() {
            try {
                debugger;
                const surveyResp = await GetSurvey(id);
                const response1 = await GetPartnersSurvey(id);
                const response2 = await GetPartnersOptions();
                setRowData(response1.result.data);
                setNewPartnerRateCurrency(surveyResp.result.data.currencyId);
                setPreScreener(surveyResp.result.data.preScreener);
                setUniqueLink(surveyResp.result.data.uniqueLink);
                setSurvey(surveyResp.result.data);
                setPartners(response2.result.data.clients);
                const response = await GetOptionsSurvey();
                setOptions({
                    salesManagers: response.result.data.sales_managers,
                    projectManagers: response.result.data.project_managers,
                    countries: response.result.data.countries,
                    languages: response.result.data.languages,
                    clients: response.result.data.clients,
                    status: response.result.data.status,
                    currencies: response.result.data.currencies, // Example response for Currency
                });
                setSurveyLink({
                    successLink: `${process.env.REACT_APP_BASEURL}survey/survey-response/success/?uid=xxxx`,
                    disqualificationLink: `${process.env.REACT_APP_BASEURL}survey/survey-response/disqualify/?uid=xxxx`,
                    quotaFullLink: `${process.env.REACT_APP_BASEURL}survey/survey-response/quotafull/?uid=xxxx`,
                    defaultVendorURL: surveyResp.result.data.link
                });
            } catch (error) {
                showSnackbar("Failed to load survey", "error");
            }
        }
        fetchData();
    }, [id]);

    const modifiedData = rowData.map((item) => ({
        ...item,
        link2: `${item.link}`, // Append "xxxx" to the link
    }));

    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };
    const filteredData = useMemo(() => 
        modifiedData.filter((row) =>
            Object.values(row).some(val =>
                val && val.toString().toLowerCase().includes(searchText.toLowerCase())
            )
        ), 
        [modifiedData, searchText]
    );

    const showSnackbar = (message, severity) => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    const handlePartnerChange = async (event) => {
        const partnerId = event.target.value;
        setSelectedPartnerId(partnerId);
        try {
            const response = await GetPartnerDetails(partnerId);
            setPartnerData(response.result.data);
            setPartnerForm({
                rate: response.result.data.rate || "",
                quota: response.result.data.quota || "",
                variable: response.result.data.c_Variable || "",
                successLink: response.result.data.successLink || "",
                disqualificationLink: response.result.data.disqualificationLink || "",
                quotaLink: response.result.data.quotaFullLink || "",
                pausedLink: response.result.data.pausedLink || "",
                securityFailLink: response.result.data.securityFailLink || ""
            });
        } catch (error) {
            showSnackbar("Failed to fetch partner details", "error");
        }
    };

    const handleInputChange = (e) => {
        setPartnerForm({ ...partnerForm, [e.target.name]: e.target.value });
    };
    const handleSearch = (e) => {
        setSearchText(e.target.value);
    };
    const handleAddPartner = () => {
        setSelectedPartnerId(""); // clear selected partner
        setPartnerForm({
            rate: "",
            quota: "",
            variable: "",
            successLink: "",
            disqualificationLink: "",
            quotaLink: "",
            pausedLink: "",
            securityFailLink: ""
        });
        setOpenModal(true);
    };
    const handleReport = () => {
        navigate(`/survey/view-report/${id}`); // Navigate to details page
    };
    const handleSurveyEdit = () => {
        navigate(`/survey/edit/${id}`); // Navigate to edit page
    };
    const handlePreScreener = () => {
        navigate(`/survey/prescreener/${id}`); // Navigate to details page
    };
    const handleSurveyInvoice= () => {
        navigate(`/survey/invoices-list/${id}`); // Navigate to invoice page
    };

    const handleUniqueLink = () => {
        navigate(`/survey/upload-unique-links/${id}`); // Navigate to details page
    };

    const handleCloseModal = () => {
        setOpenModal(false);
    };

    const handleSavePartner = async () => {
        const createdById = localStorage.getItem("userid");
        const json_data = {
            partnerId: selectedPartnerId,
            rate: partnerForm.rate,
            quota: partnerForm.quota,
            availableVariable: partnerForm.variable,
            partnerSuccessLink: partnerForm.successLink,
            partnerDisqualificationLink: partnerForm.disqualificationLink,
            partnerQuotaLink: partnerForm.quotaLink,
            pausedLink: partnerForm.pausedLink,
            securityFailLink: partnerForm.securityFailLink,
            addedBy: createdById,
            surveyUuid: id
        };
    
        try {
            const response = await AddPartnerToSurvey(json_data);
            if (!response.errors) {
                showSnackbar("Partner added successfully!", "success");
                setOpenModal(false);
                const response2 = await GetPartnersOptions();
                setPartners(response2.result.data.clients);
                // refresh partner grid
                const response3 = await GetPartnersSurvey(id);
                setRowData(response3.result.data);
            } else {
                showSnackbar("Failed to save survey", "error");
            }
        } catch (error) {
            console.error("Error submitting survey:", error);
            showSnackbar("An unexpected error occurred", "error");
        }
    };

    const handleDelete = async (rowData) => {
        if (window.confirm(`Are you sure you want to delete the partner "${rowData.partnerName}"?`)) {
            try {
                const response = await DeletePartner(rowData.partnerId); 
                if (response.success) {
                    showSnackbar("Partner deleted successfully!", "success");
                    setRowData((prev) => prev.filter((row) => row.partnerId !== rowData.partnerId));
                } else {
                    showSnackbar("Failed to delete partner.", "error");
                }
            } catch (error) {
                console.error("Error deleting partner:", error);
                showSnackbar("An unexpected error occurred.", "error");
            }
        }
    };

    const handleOpenStatusModal = () => {
        setStatusModalOpen(true);
        setSelectedStatus(survey.statusId || ""); // load current status if available
    };
    
    const handleCloseStatusModal = () => {
        setStatusModalOpen(false);
    };
    
    const handleStatusChange = (event) => {
        setSelectedStatus(event.target.value);
    };
    
    const handleEdit = (rowData) => {
        setSelectedPartnerId(rowData.partnerId);
        setPartnerForm({
            rate: rowData.rate || "",
            quota: rowData.quota || "",
            variable: rowData.variable || "",
            successLink: rowData.successLink || "",
            disqualificationLink: rowData.disqualificationLink || "",
            quotaLink: rowData.quotaLink || "",
            pausedLink: rowData.pausedLink || "",
            securityFailLink: rowData.securityFailLink || "",
        });
        setOpenModal(true);
    };

    const handleTest = async (rowData) => {
        let ip = "Unable to fetch IP";
        try {
            const ipResponse = await fetch("https://api.ipify.org?format=json");
            const ipData = await ipResponse.json();
            ip = ipData.ip;
            setIpAddress(ipData.ip);
        } catch (ipError) {
            console.error("Failed to fetch IP address:", ipError);
            setIpAddress(ip);
        }

        const createdById = localStorage.getItem("userid");
        if (!createdById) {
            showSnackbar("User ID not found in local storage", "error");
            setLoading(false);
            return;
        }

        const json_data = {
            surveyPartnerId: rowData.id,
            respondentId: crypto.randomUUID(),
            respondentIP: ip,
            addedby: createdById,
        };

        const response = await AddSurveyResponse(json_data);

        if (response.errors == null) {
            const base_link = rowData.link;
            if (base_link) {
                const linkWithGuid = base_link.includes("?")
                    ? `${base_link}&uid=${response.result.data.responseUuid}`
                    : `${base_link}?uid=${response.result.data.responseUuid}` + `&survey_id=${id}`+ `&passcode=${response.result.data.passcode}`;
                window.open(linkWithGuid, '_blank', 'noopener,noreferrer');
            } else {
                console.error('Base link is not defined.');
            }
        } else {
            console.error('Response UUID is not defined.');
            showSnackbar("Failed to generate unique link", "error");
        }
    };

    const handleCloneSurvey = async () => {
        try {
          const createdById = localStorage.getItem("userid");
          const json_data = { id : id, addedBy: createdById };
          const response = await CloneSurvey(json_data);
          if (response.errors == null) {
            showSnackbar("Survey added successfully", "success");
          } else {
            showSnackbar("Failed to save survey", "error");
          }
        } catch (error) {
          console.error("Error submitting survey:", error);
          showSnackbar("An unexpected error occurred", "error");
        }
    };

    const handleSaveStatus = async () => {
        try {
            const createdById = localStorage.getItem("userid");
            const json_data = { StatusId : selectedStatus, createdById: createdById };
            const response = await UpdateSurveyStatus(id, json_data);
            if (response.errors == null) {
                survey.statusId = selectedStatus;
                showSnackbar(response.result.data.message, "success");
            } else {
                showSnackbar("Failed to save survey status", "error");
            }
            setStatusModalOpen(false);
        } catch (error) {
            console.error("Error updating status:", error);
            showSnackbar("Something went wrong while updating status", "error");
        }
    };


    // ----- Partner Rate: open modal & fetch rates -----
    const handleOpenRevisePartner = async (row) => {
        try {
            setSelectedPartnerRowForRate(row);

            // Reset form state first
            setNewPartnerRateValue("");
            setNewPartnerRateNote("");
            setNewPartnerRateStartDate(dayjs().startOf("day"));
            // Fetch partner rates
            const resp = await GetRatesById("Partner", row.id);
            if (resp && resp.errors == null) {
            setPartnerRateData(resp.result.data);
            } else {
            setPartnerRateData(null);
            }

            setPartnerRateModalOpen(true);
        } catch (err) {
            console.error("Open revise partner rate error:", err);
            showSnackbar("Failed to open revise rate", "error");
        }
        };

    const handleSavePartnerRate = async () => {
        try {
            if (newPartnerRateValue === "" || isNaN(Number(newPartnerRateValue))) {
                showSnackbar("Please enter a valid rate", "error");
                return;
            }
            if (!newPartnerRateStartDate) {
                showSnackbar("Please select an effective date", "error");
                return;
            }
            if (!selectedPartnerRowForRate) {
                showSnackbar("Partner not selected", "error");
                return;
            }

            const payload = {
                rate: Number(newPartnerRateValue),
                currency: newPartnerRateCurrency || survey?.currency || "",
                startDate: dayjs(newPartnerRateStartDate).format("YYYY-MM-DD"),
                note: newPartnerRateNote,
            };

            const response = await AddRates("Partner", selectedPartnerRowForRate.id, payload);

            if (response.errors == null) {
                // refresh partners list and partner's rate history
                const pResp = await GetPartnersSurvey(id);
                if (pResp && pResp.result) {
                    setRowData(pResp.result.data);
                }
                // refresh partner rates data to show updated active rate
                const ratesResp = await GetRatesById("Partner", selectedPartnerRowForRate.partnerId);
                if (ratesResp && ratesResp.errors == null) {
                    setPartnerRateData(ratesResp.result.data);
                }
                setPartnerRateModalOpen(false);
                showSnackbar("Partner rate revised successfully", "success");
            } else {
                showSnackbar("Failed to add new rate", "error");
            }
        } catch (err) {
            console.error("Save partner rate error:", err);
            showSnackbar("Failed to revise partner rate", "error");
        }
    };

    const formatRange = (r) => {
        if (!r) return "-";
        const s = r.startDate ? dayjs(r.startDate).format("YYYY-MM-DD") : "-";
        const e = r.endDate ? dayjs(r.endDate).format("YYYY-MM-DD") : "Present";
        return `${s} — ${e}`;
    };

    const getCurrencyName = (idOrName) => {
        if (!idOrName) return "";
        const found = options.currencies.find((c) => c.id === idOrName || c.name === idOrName);
        return found ? found.name : idOrName;
    };

    const columnDefs = [
            { headerName: 'ID', field: 'Id', flex: 1, hide: true },
            { headerName: 'Link', field: 'link', flex: 1, hide: true },
            { headerName: 'partnerId', field: 'partnerId', flex: 1, hide: true },
            { headerName: 'Name', field: 'partnerName', flex: 2 },
            {
            headerName: 'Rate',
            field: 'rate',
            flex: 1,
            // format as decimal with two places + currency symbol from survey.currencySymbol
            valueFormatter: (params) => {
                const v = params.value;
                if (v === null || v === undefined || v === "") return "";
                const n = Number(v);
                if (Number.isNaN(n)) return "";

                // use survey.currencySymbol stored in component scope
                const symbol = (typeof survey !== "undefined" && survey?.currencySymbol) ? survey.currencySymbol : "";
                return symbol ? `${symbol} ${n.toFixed(2)}` : n.toFixed(2);
            },
            valueParser: (params) => {
                const newVal = params.newValue;
                if (newVal === null || newVal === undefined || newVal === "") return null;
                // Remove any non-numeric characters (like currency symbol, commas) before parse
                const sanitized = String(newVal).replace(/[^0-9.-]+/g, "");
                const parsed = parseFloat(sanitized);
                return Number.isNaN(parsed) ? null : parsed;
            },
            type: "numericColumn",
            cellStyle: { textAlign: "right" }
            },
            { headerName: 'Quota', field: 'quota', flex: 1 },
            { headerName: 'Est. IR/ Curr. IR', field: 'ir', flex: 1 },
            { headerName: 'Last Complete', field: 'ir', flex: 1 },
            { headerName: 'Drops', field: 'drops', flex: 1 },
            { headerName: 'Link', field: 'link2', flex: 3 },
            {
                headerName: 'Actions',
                field: 'actions',
                flex: 2,
                cellRenderer: (params) => (
                    <>
                    
                        <IconButton onClick={() => handleEdit(params.data)} size="small">
                            <Edit fontSize="small" />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(params.data)} size="small" color="error">
                            <Delete fontSize="small" />
                        </IconButton>
                        <IconButton onClick={() => handleTest(params.data)} size="small" color="primary">
                            <PlayCircleOutline fontSize="small" />
                        </IconButton>

                        {/* Revise Rate button */}
                        <IconButton onClick={() => handleOpenRevisePartner(params.data)} size="small" color="inherit" title="Revise Rate">
                            <MonetizationOnIcon fontSize="small" />
                        </IconButton>
                    </>
                ),
            },
        ];

    return (
        <>
        <div className="right-content w-100">

    <div className="card shadow border-0 w-100 p-4">
    <div className="d-flex justify-content-between align-items-center w-100">

        <div style={{ display: "flex", alignItems: "flex-start" }}>
            <Button
                variant="text"
                onClick={() => navigate("/surveys")}
                sx={{ p: 2, pr: 2 }}
                style={{ border: "1px solid #ccc", backgroundColor: "#f1f1f1", color: "#0c2a66ff", fontWeight: "bold" }}
            >
                ⬅️ Back
            </Button>
            <div style={{ paddingLeft: "12px", paddingTop: "4px" }}>
                <h5 className="mb-0 text-muted">#{survey.surveyName}</h5>
                <p className="mb-0" style={{ color: "#ccc" }}>{survey.surveyTitle}</p>
            </div>
        </div>

        <Box display="flex" gap={1}>
            <Button variant="contained" color="primary" onClick={handleSurveyInvoice}>
                Invoice
            </Button>
            <Button variant="contained" color="primary" onClick={handleSurveyEdit}>
                Edit Survey
            </Button>
            <Button variant="contained" color="primary" onClick={handleCloneSurvey}>
                Clone
            </Button>
            <Button variant="contained" color="primary" onClick={handleReport}>
                Get Report
            </Button>
            {preScreener && (
                <Button variant="contained" color="primary" onClick={handlePreScreener}>
                    Pre Screener
                </Button>
            )}
            {uniqueLink && (
                <Button variant="contained" color="primary" onClick={handleUniqueLink}>
                    Unique Link
                </Button>
            )}
        </Box>
    </div>
</div>

                {
                    survey && 
                    <div className="card shadow border-0 p-3">
                        <div className="d-flex justify-content-between align-items-center">
                            <Typography
                                variant="h6"
                                style={{ fontWeight: "bold", color: "#0c2a66" }}
                                gutterBottom
                                >
                                Client Details
                                </Typography>
                                <Button variant="outlined" onClick={handleOpenStatusModal}>
                                    Status
                                </Button>
                            </div>
                        <table className="table bordered-table">
                            <thead>
                                <tr style={{ background: "#f9f9f9" }}>
                                    <th>Client</th>
                                    <th>Margin</th>
                                    <th>Profit</th>
                                    <th>Est. IR/ Curr. IR</th>
                                    <th>Drops</th>
                                    <th>Est. LOI/ Curr. LOI</th>
                                    <th>Last complete</th>
                                    <th>Client Rate</th>
                                    <th>Quota</th>
                                    <th>Created On</th>
                                    <th>Closed On</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{survey.clientName}</td>
                                    <td>{survey.marginPercentage}%</td>
                                    <td>{survey.totalProfit}</td>
                                    <td>{survey.ir} %</td>
                                    <td>{survey.dropsPercentage}</td>
                                    <td>{survey.loi}</td>
                                    <td>xxxx</td>
                                    <td>{survey.currencySymbol} {survey.clientRate}</td>
                                    <td>{survey.clientQuota}</td>
                                    <td>{survey.clientLaunchedDate}</td>
                                    <td>{survey.clientEndDate}</td>
                                </tr>
                            </tbody>
                        </table>
                        <p>
                            Client Survey Link - {survey.clientLink}
                        </p>
                    </div>
                }

                <div className="card shadow border-0 p-3">
                <div
                    style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: "5px",
                    }}
                >
                    <Typography
                    variant="h6"
                    style={{ fontWeight: "bold", color: "#0c2a66" }}
                    gutterBottom
                    >
                    Partners
                    </Typography>

                    <div style={{ display: "flex", alignItems: "center" }}>
                    <TextField
                        variant="outlined"
                        placeholder="Search..."
                        value={searchText}
                        size="small"
                        onChange={handleSearch}
                        style={{ marginRight: "1rem" }}
                    />
                    <Button variant="contained" color="primary" onClick={handleAddPartner}>
                        Add Partner to this Project
                    </Button>
                    </div>
                </div>

                <div className="ag-theme-quartz" style={{ height: 500 }}>
                    <AgGridReact
                    rowData={filteredData}
                    columnDefs={columnDefs}
                    pagination={true}
                    paginationPageSize={paginationPageSize}
                    />
                </div>
                </div>

                {
                    survey && 
                    <div className="card shadow border-0 p-3">
                        <Typography
                            variant="h6"
                            style={{ fontWeight: "bold", color: "#0c2a66" }}
                            gutterBottom
                            >
                            Projects Links
                            </Typography>
                        <table className="table bordered-table">
                            <tbody>
                                <tr>
                                    <td><b>Success Page</b></td>
                                    <td>{surveyLink.successLink}</td>
                                </tr>
                                <tr>
                                    <td><b>Disqualification Page</b></td>
                                    <td>{surveyLink.disqualificationLink}</td>
                                </tr>
                                <tr>
                                    <td><b>Quota Full Page</b></td>
                                    <td>{surveyLink.quotaFullLink}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                }
            </div>

            {/* Add Partner Modal */}
            <div className="right-content w-100">
                <Modal open={openModal} onClose={handleCloseModal}>
                    <Box 
                        sx={{ 
                            p: 4, 
                            bgcolor: "background.paper", 
                            borderRadius: 2, 
                            maxWidth: 600, 
                            mx: "auto", 
                            mt: 5,
                            position: "relative",
                            height: "80vh",
                            overflowY: "auto"
                        }}
                    >
                        <Button onClick={handleCloseModal} sx={{ position: "absolute", top: 8, right: 8, minWidth: "auto" }}>
                            ✖
                        </Button>

                        <h4>Add Partner</h4>
                        <TextField
                            select
                            label="Partner"
                            value={selectedPartnerId}
                            onChange={handlePartnerChange}
                            fullWidth
                            margin="normal"
                            disabled={!!partnerForm.successLink}
                        >
                            {partners && partners.map((partner) => (
                                <MenuItem key={partner.id} value={partner.id}>
                                    {partner.name}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField label="Rate" name="rate" value={partnerForm.rate} onChange={handleInputChange} fullWidth margin="normal" />
                        <TextField label="Quota" name="quota" value={partnerForm.quota} onChange={handleInputChange} fullWidth margin="normal" />
                        <TextField label="Partner Success Link" name="successLink" value={partnerForm.successLink} onChange={handleInputChange} fullWidth margin="normal" required />
                        <TextField label="Partner Disqualification Link" name="disqualificationLink" value={partnerForm.disqualificationLink} onChange={handleInputChange} fullWidth margin="normal" required />
                        <TextField label="Partner Quota Link" name="quotaLink" value={partnerForm.quotaLink} onChange={handleInputChange} fullWidth margin="normal" required />
                        <TextField label="Paused Link" name="pausedLink" value={partnerForm.pausedLink} onChange={handleInputChange} fullWidth margin="normal" />
                        <TextField label="Security Fail Link" name="securityFailLink" value={partnerForm.securityFailLink} onChange={handleInputChange} fullWidth margin="normal" />
                        <Button variant="contained" color="primary" onClick={handleSavePartner} sx={{ mt: 2 }}>
                            Save Partner
                        </Button>
                    </Box>
                </Modal>
            </div>

            {/* Partner Rate Modal */}
            <Modal open={partnerRateModalOpen} onClose={() => setPartnerRateModalOpen(false)}>
                <Box sx={{
                    p: 3, bgcolor: 'background.paper', borderRadius: 2, maxWidth: 600, mx: 'auto', mt: 6,
                    position: 'relative'
                }}>
                    <Button sx={{ position: "absolute", top: 8, right: 8 }} onClick={() => setPartnerRateModalOpen(false)}>✖</Button>
                    <Typography variant="h6">Revise Partner Rate</Typography>

                    {/* Active rate display */}
                    <Box sx={{ mt: 2, mb: 2, border: '1px solid #eee', p: 1, borderRadius: 1 }}>
                        <Typography variant="subtitle2">Active Rate</Typography>
                        {partnerRateData?.activeRate ? (
                            <>
                                <Typography variant="h6">{partnerRateData.activeRate.rate} {getCurrencyName(partnerRateData.activeRate.currency.toLowerCase())}</Typography>
                                <Typography variant="body2" color="text.secondary">Effective: {formatRange(partnerRateData.activeRate)}</Typography>
                            </>
                        ) : (
                            <Typography>No active rate</Typography>
                        )}
                    </Box>

                    <TextField
                        label="New Rate"
                        value={newPartnerRateValue}
                        onChange={(e) => setNewPartnerRateValue(e.target.value)}
                        type="number"
                        fullWidth
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        label="Note (optional)"
                        value={newPartnerRateNote}
                        onChange={(e) => setNewPartnerRateNote(e.target.value)}
                        fullWidth
                        multiline
                        rows={3}
                        sx={{ mt: 2 }}
                    />

                    {/* History */}
                    <Box sx={{ mt: 2, borderTop: '1px solid #eee', pt: 2 }}>
                        <Typography variant="subtitle2">History</Typography>
                        {partnerRateData?.history?.length ? (
                            partnerRateData.history.map((r) => (
                                <Box key={r.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                    <div>
                                        <Typography>{r.rate} {getCurrencyName(r.currency.toLowerCase())}</Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{formatRange(r)}</Typography>
                                        {r.note ? <Typography variant="caption" display="block">Note: {r.note}</Typography> : null}
                                    </div>
                                    <div>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{r.createdAt ? dayjs(r.createdAt).format("YYYY-MM-DD") : ""}</Typography>
                                    </div>
                                </Box>
                            ))
                        ) : (
                            <Typography variant="body2" color="text.secondary">No history available.</Typography>
                        )}
                    </Box>

                    <Box mt={3} display="flex" justifyContent="flex-end" gap={1}>
                        <Button onClick={() => setPartnerRateModalOpen(false)}>Cancel</Button>
                        <Button variant="contained" onClick={handleSavePartnerRate}>Save</Button>
                    </Box>
                </Box>
            </Modal>

            {/* Status Modal */}
            <Modal open={statusModalOpen} onClose={handleCloseStatusModal}>
                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: 400, bgcolor: 'background.paper', boxShadow: 24, p: 4, borderRadius: 1 }}>
                <h4>Change Survey Status</h4>
                <TextField
                    select
                    fullWidth
                    label="Select Status"
                    value={selectedStatus}
                    onChange={handleStatusChange}
                    sx={{ mt: 2 }}
                >
                    {options?.status?.map((status) => (
                                    <MenuItem key={status.id} value={status.id}>
                                      {status.name}
                                    </MenuItem>
                                  ))}

                </TextField>
                <Box mt={3} display="flex" justifyContent="flex-end" gap={1}>
                    <Button onClick={handleCloseStatusModal}>Cancel</Button>
                    <Button variant="contained" onClick={handleSaveStatus}>
                        Save
                    </Button>
                </Box>
                </Box>
        </Modal>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} variant="filled">
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </>
    );
};

export default ViewSurvey;
