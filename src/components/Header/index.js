import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/images/IconOnly_Transparent_NoBuffer.png";
import Button from "@mui/material/Button";
import logo1 from "../../assets/images/Logo-transparent.png";
import {
  MdMenuOpen,
  MdOutlineMenu,
} from "react-icons/md";

import { MyContext } from "../../App";
import Logout from "@mui/icons-material/Logout";
import { Margin } from "@mui/icons-material";

const Header = () => {
  const {
    theme,
    setTheme,               // kept in case you toggle elsewhere
    isToggleSidebar,
    setIsToggleSidebar,
    isLogin,
    setIsLogin,
    setIsOpenNav,           // mobile sidebar control
  } = useContext(MyContext);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  const handleLogout = () => {
    localStorage.clear();
    setIsLogin(false);
    window.location.href = "/"; // or use navigate("/")
  };

  useEffect(() => {
    const storedEmail = localStorage.getItem("email");
    const storedRole = localStorage.getItem("role");
    if (storedEmail) {
      setEmail(storedEmail);
      setRole(storedRole || "");
    }
  }, []);

  return (
    <header
      className="d-flex align-items-center"
      style={{ backgroundColor: theme === "dark" ? "#121212" : "#80bae4ff" }}
    >
      <div className="container-fluid w-100">
        <div className="row d-flex align-items-center w-100">
          {/* Logo + Mobile Menu Button */}
          <div className="col-6 col-sm-2 d-flex align-items-center part1">
            {/* Mobile menu button */}
            <div className="d-md-none me-2">
              <Button className="rounded-circle" onClick={() => setIsOpenNav(true)}>
                <MdOutlineMenu />
              </Button>
            </div>

            <Link to="/dashboard" className="d-flex align-items-center logo">
              <img src={logo1} alt="logo" />
            </Link>
            <div className="ms-2 d-none d-md-block">
              <h2 className="mb-0 ml-2" style={{ color: "#fff" }}></h2>
            </div>
          </div>

          {/* Sidebar Toggle (Desktop) */}
          <div className="col-sm-3 d-none d-md-flex align-items-center part2">
            <Button
              className="rounded-circle"
              onClick={() => setIsToggleSidebar(!isToggleSidebar)}
              style={{ marginLeft: "-70px" }}   // 👈 moves button 70px left
            >
              {isToggleSidebar === false ? <MdMenuOpen /> : <MdOutlineMenu />}
            </Button>
          </div>

          {/* Right Side */}
          <div className="col-6 col-sm-7 d-flex align-items-center justify-content-end part3">
            <Link to="/survey/add">
                <Button variant="contained" color="primary" size="medium" style={{ marginRight: "16px" }}>
              + New Survey
            </Button>
              </Link>
            {!isLogin ? (
              
              <Link to="/">
                <Button className="btn-blue btn-lg btn-round">Sign In</Button>
              </Link>
            ) : (
              <div className="d-flex align-items-center" style={{ gap: "16px" }}>
                {/* Initials circle + email/role */}
                <div className="d-flex align-items-center" style={{ gap: "10px" }}>
                  <span
                    className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                      width: "40px",
                      height: "40px",
                      backgroundColor: "#1976d2",
                      color: "#fff",
                      fontWeight: "bold",
                      fontSize: "16px",
                    }}
                  >
                    {email ? email.substring(0, 2).toUpperCase() : "U"}
                  </span>
                  <div className="userInfo res-hide ms-2">
                    <h4 className="mb-0" style={{ fontSize: 14, lineHeight: 1.2 }}>{email}</h4>
                    <p className="mb-0" style={{ fontSize: 12, opacity: 0.85 }}></p>
                  </div>
                </div>

                {/* Logout button (visible when logged in) */}
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  onClick={handleLogout}
                  startIcon={<Logout fontSize="small" />}
                >
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
