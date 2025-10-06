import { axiosCall } from "../Services/APIAXIOS";

// ✅ Get overview KPIs
export async function GetDashboardOverview() {
    try {
        let URL = `${process.env.REACT_APP_API_URL}/dashboard/overview`;
        console.log("Calling:", URL);
        let headers = {};
        let result = await axiosCall(URL, 'get', headers, {}, false);
        console.log("Overview result:", result);
        return result;
    } catch (err) {
        console.error("Error in GetDashboardOverview:", err);
        return err;
    }
}

// ✅ Get responses time-series
export async function GetResponsesTimeSeries(days = 14) {
    try {
        let URL = `${process.env.REACT_APP_API_URL}/dashboard/timeseries?days=${days}`;
        console.log("Calling:", URL);
        let headers = {};
        let result = await axiosCall(URL, 'get', headers, {}, false);
        console.log("TimeSeries result:", result);
        return result;
    } catch (err) {
        console.error("Error in GetResponsesTimeSeries:", err);
        return err;
    }
}

// ✅ Get top surveys
export async function GetTopSurveys(limit = 5) {
    try {
        let URL = `${process.env.REACT_APP_API_URL}/dashboard/top?limit=${limit}`;
        console.log("Calling:", URL);
        let headers = {};
        let result = await axiosCall(URL, 'get', headers, {}, false);
        console.log("TopSurveys result:", result);
        return result;
    } catch (err) {
        console.error("Error in GetTopSurveys:", err);
        return err;
    }
}

// ✅ Get recent surveys
export async function GetRecentSurveys(limit = 10) {
    try {
        let URL = `${process.env.REACT_APP_API_URL}/dashboard/recent?limit=${limit}`;
        console.log("Calling:", URL);
        let headers = {};
        let result = await axiosCall(URL, 'get', headers, {}, false);
        console.log("RecentSurveys result:", result);
        return result;
    } catch (err) {
        console.error("Error in GetRecentSurveys:", err);
        return err;
    }
}

// ✅ Get upcoming/scheduled surveys
export async function GetUpcomingSurveys(limit = 8) {
    try {
        let URL = `${process.env.REACT_APP_API_URL}/dashboard/upcoming?limit=${limit}`;
        console.log("Calling:", URL);
        let headers = {};
        let result = await axiosCall(URL, 'get', headers, {}, false);
        console.log("UpcomingSurveys result:", result);
        return result;
    } catch (err) {
        console.error("Error in GetUpcomingSurveys:", err);
        return err;
    }
}

// ✅ Get alerts
export async function GetDashboardAlerts() {
    try {
        let URL = `${process.env.REACT_APP_API_URL}/dashboard/alerts`;
        console.log("Calling:", URL);
        let headers = {};
        let result = await axiosCall(URL, 'get', headers, {}, false);
        console.log("Alerts result:", result);
        return result;
    } catch (err) {
        console.error("Error in GetDashboardAlerts:", err);
        return err;
    }
}
