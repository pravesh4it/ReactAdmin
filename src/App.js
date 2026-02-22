import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import "./responsive.css";
import { createContext, useState, useEffect } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// pages
import LoginForm from "./pages/Login/index1";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Partners from "./pages/Partners";
import ManageUsers from "./pages/Users";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import ProductUpload from "./pages/ProductUpload";
import AddSurvey from "./pages/Survey/AddSurvey";
import Surveys from "./pages/Survey";
import ViewSurvey from "./pages/Survey/ViewSurvey";
import EditSurvey from "./pages/Survey/EditSurvey";
import SurveyQuestions from "./pages/Survey/SurveyQuestions";
import SurveyResponse from "./pages/Survey/SurveyResponse";
import SurveyReport from "./pages/Survey/SurveyReport";
import PreScreener from "./pages/Survey/PreScreener";
import UploadUniqueLinks from "./pages/Survey/UploadUniqueLinks";
import RecontactSurvey from "./pages/Survey/Recontact";

// layouts
import MainLayout from "./components/MainLayout";
import NoLayout from "./components/NoLayout";
import MyAccount from "./pages/Account/Index";
import MultiSelectsAdmin from "./pages/MultiSelect/MultiSelectAdmin";
import CountryLanguageAdmin from "./pages/Country/CountryLanguageAdmin";
import CountriesAdmin from "./pages/Country/CountryAdmin";
import InvoicePage from "./pages/Survey/Invoice";
import InvoiceListForSurvey from "./pages/Survey/InvoicesList";

dayjs.extend(utc);
dayjs.extend(timezone);

const MyContext = createContext();
const isAuthenticated = () => localStorage.getItem("token") !== null;

const VERSION_URL = '/version.json';

async function fetchVersion() {
  const res = await fetch(`${VERSION_URL}?t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('version fetch failed');
  const data = await res.json();
  return data.version;
}

function App() {
  const [isToggleSidebar, setIsToggleSidebar] = useState(false);
  const [isOpenNav, setIsOpenNav] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  // 👇 add login state
  const [isLogin, setIsLogin] = useState(() => {
    return !!localStorage.getItem("token"); // true if token exists
  });

  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("dark");
      document.body.classList.remove("light");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.add("light");
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);
  // 🔄 Auto-reload when a new deployment is detected
  useEffect(() => {
    let timerId;
    const KEY = 'appVersion';

    const check = async () => {
      try {
        const latest = await fetchVersion();
        const current = localStorage.getItem(KEY);
        if (current && current !== latest) {
          localStorage.setItem(KEY, latest);
          // Reload to pick new assets and code
          window.location.reload();
          return;
        }
        if (!current) localStorage.setItem(KEY, latest);
      } catch (e) {
        // Optional: console.warn(e);
      }
    };

    check();                       // run on mount
    timerId = setInterval(check, 5 * 60 * 1000); // then every 5 minutes
    return () => clearInterval(timerId);
  }, []);

  const values = {
    isToggleSidebar,
    setIsToggleSidebar,
    theme,
    setTheme,
    isOpenNav,
    setIsOpenNav,
    // 👇 provide login context
    isLogin,
    setIsLogin,
  };

  return (
    <BrowserRouter>
      <MyContext.Provider value={values}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Routes>
            {/* 👇 Routes without Header & Sidebar */}
            <Route element={<NoLayout />}>
              <Route path="/" element={<LoginForm />} />
              <Route path="/signUp" element={<SignUp />} />
              <Route path="/survey/survey-start" element={<SurveyQuestions />} />
              <Route path="/survey/survey-response/:type" element={<SurveyResponse />} />
            </Route>

            {/* 👇 Routes with Header & Sidebar */}
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={isAuthenticated() ? <Dashboard /> : <Navigate to="/" />} />
              <Route path="/clients" element={isAuthenticated() ? <Clients /> : <Navigate to="/" />} />
              <Route path="/partners" element={isAuthenticated() ? <Partners /> : <Navigate to="/" />} />
              <Route path="/users" element={isAuthenticated() ? <ManageUsers /> : <Navigate to="/" />} />
              <Route path="/products" element={isAuthenticated() ? <Products /> : <Navigate to="/" />} />
              <Route path="/product/details" element={isAuthenticated() ? <ProductDetails /> : <Navigate to="/" />} />
              <Route path="/product/upload" element={isAuthenticated() ? <ProductUpload /> : <Navigate to="/" />} />
              <Route path="/surveys" element={isAuthenticated() ? <Surveys /> : <Navigate to="/" />} />
              <Route path="/survey/add" element={isAuthenticated() ? <AddSurvey /> : <Navigate to="/" />} />
              <Route path="/survey/details/:id" element={isAuthenticated() ? <ViewSurvey /> : <Navigate to="/" />} />
              <Route path="/survey/edit/:id" element={isAuthenticated() ? <EditSurvey /> : <Navigate to="/" />} />
              
              <Route path="/survey/view-report/:sid" element={isAuthenticated() ? <SurveyReport /> : <Navigate to="/" />} />
              <Route path="/survey/prescreener/:sid" element={isAuthenticated() ? <PreScreener /> : <Navigate to="/" />} />
              <Route path="/survey/upload-unique-links/:sid" element={isAuthenticated() ? <UploadUniqueLinks /> : <Navigate to="/" />} />
              <Route path="/survey/recontact" element={isAuthenticated() ? <RecontactSurvey /> : <Navigate to="/" />} />
              <Route path="/account" element={isAuthenticated() ? <MyAccount /> : <Navigate to="/" />} />
              <Route path="/multiselects" element={isAuthenticated() ? <MultiSelectsAdmin /> : <Navigate to="/" />} />
              <Route path="/country-languages" element={isAuthenticated() ? <CountryLanguageAdmin /> : <Navigate to="/" />} />
              <Route path="/countries" element={isAuthenticated() ? <CountriesAdmin /> : <Navigate to="/" />} />
              <Route path="/survey/invoice/:sid" element={isAuthenticated() ? <InvoicePage /> : <Navigate to="/" />} />
              <Route path="/survey/invoices-list/:sid" element={isAuthenticated() ? <InvoiceListForSurvey /> : <Navigate to="/" />} />
            </Route>
          </Routes>
        </LocalizationProvider>
      </MyContext.Provider>
    </BrowserRouter>
  );
}

export default App;
export { MyContext };
