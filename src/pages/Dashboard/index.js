import * as React from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  Button,
  IconButton,
  Stack,
  Divider,
  LinearProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Avatar,
  Tooltip,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ShareIcon from "@mui/icons-material/Share";
import AssessmentIcon from "@mui/icons-material/Assessment";
import RefreshIcon from "@mui/icons-material/Refresh";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ScheduleIcon from "@mui/icons-material/Schedule";
import CloseIcon from "@mui/icons-material/Close";
import LaunchIcon from "@mui/icons-material/Launch";


import {
  GetDashboardOverview,
  GetResponsesTimeSeries,
  GetTopSurveys,
  GetRecentSurveys,
  GetUpcomingSurveys
} from "../../api/Dashboard";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

// ---- Status colors for donut ----
const STATUS_COLORS = {
  Active: "#0288d1",
  Draft: "#9e9e9e",
  Closed: "#ef5350"
};

// ---- Small UI helpers ----
const StatusChip = ({ status }) => {
  const map = {
    Active: { color: "primary", icon: <CheckCircleIcon fontSize="small" /> },
    Draft: { color: "default", icon: <ScheduleIcon fontSize="small" /> },
    Closed: { color: "error", icon: <CloseIcon fontSize="small" /> },
  };
  const cfg = map[status] || map.Draft;
  return (
    <Chip
      size="small"
      color={cfg.color}
      variant="outlined"
      icon={cfg.icon}
      label={status}
      sx={{ fontWeight: 600 }}
    />
  );
};

const KpiCard = ({ label, value = 0, suffix, icon }) => (
  <Card sx={{ height: "100%" }}>
    <CardContent>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="overline" color="text.secondary">
          {label}
        </Typography>
        {icon}
      </Stack>
      <Typography variant="h4" sx={{ mt: 0.5 }}>
        {Number(value).toLocaleString()}
        {suffix && (
          <Typography component="span" variant="h6" color="text.secondary" sx={{ ml: 0.5 }}>
            {suffix}
          </Typography>
        )}
      </Typography>
      {label === "Response Rate" && (
        <Box sx={{ mt: 1 }}>
          <LinearProgress variant="determinate" value={Math.max(0, Math.min(100, Number(value)))} />
        </Box>
      )}
    </CardContent>
  </Card>
);

export default function SurveyDashboard() {
  // Loading & error state
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // API-backed state
  const [overview, setOverview] = React.useState(null); // { totalSurveys, activeSurveys, closedSurveys, totalResponses, responseRate, statusDistribution[] }
  const [series, setSeries] = React.useState([]);       // [{ date: Date, count: number }]
  const [topSurveys, setTopSurveys] = React.useState([]); // [{ surveyId, name, responses }]
  const [recentSurveys, setRecentSurveys] = React.useState([]); // RecentSurveyRowDto[]
  const [upcomingSurveys, setUpcomingSurveys] = React.useState([]); // UpcomingSurveyDto[]
  const [alerts, setAlerts] = React.useState([]); // AlertDto[]
  const navigate = useNavigate();

  // Transformations for charts
  const responsesOverTime = React.useMemo(
    () =>
      (series || []).map((p) => ({
        date: format(new Date(p.date), "MMM d"),
        responses: p.count,
      })),
    [series]
  );

  const statusDistribution = React.useMemo(() => {
    const sd = overview?.statusDistribution || [];
    // Expecting items like { status: "Active", count: 10 }
    return sd.map((x) => ({ name: x.status, value: x.count }));
  }, [overview]);

  const fetchAll = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
        debugger;
      // Parallelize calls
      const [ov, ts, top, recent, upc] = await Promise.all([
        GetDashboardOverview(),
        GetResponsesTimeSeries(14),
        GetTopSurveys(5),
        GetRecentSurveys(10),
        GetUpcomingSurveys(8),
        //GetDashboardAlerts(),
      ]);

      setOverview(ov.result.data || null);
      setSeries(ts.result.data || []);
      setTopSurveys(top.result.data || []);
      setRecentSurveys(recent.result.data || []);
      setUpcomingSurveys(upc.result.data || []);
      //setAlerts(al.data || []);
    } catch (e) {
      console.error(e);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleRefresh = async () => {
    await fetchAll();
  };

  const viewReport = (surveyId) => {
    navigate(`/survey/view-report/${surveyId}`); // Navigate to details page
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: "auto", mt: { xs: 6, md: 8 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>
          Survey Dashboard
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(`/survey/add`)}
          >
            New Survey
          </Button>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* KPIs */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard label="Total Surveys" value={overview?.totalSurveys ?? 0} icon={<AssessmentIcon />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard label="Active Surveys" value={overview?.activeSurveys ?? 0} icon={<CheckCircleIcon />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard label="Closed Surveys" value={overview?.closedSurveys ?? 0} icon={<CloseIcon />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard label="Total Responses" value={overview?.totalResponses ?? 0} icon={<AssessmentIcon />} />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ height: 360 }}>
            <CardHeader
              title="Responses Over Time"
              subheader="Last 14 days"
              action={
                <Chip
                  size="small"
                  label={`${overview?.responseRate ?? 0}% response rate`}
                  color="primary"
                />
              }
              titleTypographyProps={{ fontWeight: 800 }}
            />
            <CardContent sx={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={responsesOverTime} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <ReTooltip />
                  <Line type="monotone" dataKey="responses" stroke="#1976d2" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: 360 }}>
            <CardHeader title="Status Distribution" titleTypographyProps={{ fontWeight: 800 }} />
            <CardContent sx={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={100}
                    label
                  >
                    {statusDistribution.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#90caf9"} />
                    ))}
                  </Pie>
                  <Legend />
                  <ReTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent + Upcoming + Alerts */}
      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid item xs={12} md={12}>
          <Card>
            <CardHeader title="Recent Surveys" titleTypographyProps={{ fontWeight: 800 }} />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              <Table size="small">
                <TableHead style={{ background: "#f5f5f5", fontWeight: 700 }}>
                  <TableRow>
                    <TableCell>Survey</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created Date</TableCell>
                    <TableCell>End Date</TableCell>
                    <TableCell align="right">Responses</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(recentSurveys || []).map((s) => (
                    <TableRow key={s.surveyId} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar>{(s.name || "?").slice(0, 1)}</Avatar>
                          <Box>
                            <Typography fontWeight={800}>{s.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                            {s.owner}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <StatusChip status={s.status} />
                      </TableCell>
                      <TableCell>
                        {s.createdAt ? format(new Date(s.createdAt), "MMM d, yyyy") : "—"}
                      </TableCell>
                      <TableCell>
                        {s.endAt ? format(new Date(s.endAt), "MMM d, yyyy") : "—"}
                      </TableCell>
                      <TableCell align="right">{Number(s.responses || 0).toLocaleString()}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Report">
                            <IconButton onClick={() => viewReport(s.surveyId)}>
                              <LaunchIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!recentSurveys || recentSurveys.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                          No recent surveys.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
{/* Footer quick actions 
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            <Card>
              <CardHeader title="Upcoming / Scheduled" titleTypographyProps={{ fontWeight: 800 }} />
              <Divider />
              <CardContent>
                <Stack spacing={1.5}>
                  {(upcomingSurveys || []).map((u) => (
                    <Stack key={u.surveyId} direction="row" alignItems="center" spacing={1}>
                      <ScheduleIcon fontSize="small" />
                      <Box>
                        <Typography fontWeight={600}>{u.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Starts {u.startAt ? format(new Date(u.startAt), "MMM d, yyyy") : "—"} • Owner: {u.owner}
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                  {(!upcomingSurveys || upcomingSurveys.length === 0) && (
                    <Typography variant="body2" color="text.secondary">
                      No upcoming surveys.
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Alerts" titleTypographyProps={{ fontWeight: 800 }} />
              <Divider />
              <CardContent>
                <Stack spacing={1.25}>
                  {(alerts || []).map((a, idx) => (
                    <Stack key={idx} direction="row" alignItems="center" spacing={1}>
                      <WarningAmberIcon color={a.type === "warning" ? "warning" : a.type === "error" ? "error" : "info"} fontSize="small" />
                      <Typography variant="body2">{a.text}</Typography>
                    </Stack>
                  ))}
                  {(!alerts || alerts.length === 0) && (
                    <Typography variant="body2" color="text.secondary">
                      No alerts.
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

     
*/}
 </Grid>
      {/* Footer quick actions */}
      <Box sx={{ mt: 3 }}>
        <Divider />
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="space-between"
          spacing={1.5}
          sx={{ py: 2 }}
        >
          <Typography variant="body2" color="text.secondary">
            Tip: Use the Clone action to create a copy with your <strong>…CL01</strong> naming rule.
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={() => console.log("Clone flow")}>
              Clone Survey
            </Button>
            <Button variant="outlined" startIcon={<ShareIcon />} onClick={() => console.log("Share flow")}>
              Share Link
            </Button>
            <Button variant="contained" startIcon={<AssessmentIcon />} onClick={() => console.log("Open reports")}>
              View Reports
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
