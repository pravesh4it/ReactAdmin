import { Link, useLocation } from "react-router-dom";
import { Button } from "@mui/material";
import {
  MdDashboard,
  MdMessage,
} from "react-icons/md";
import { FaProductHunt, FaUsers } from "react-icons/fa";
import { IoIosSettings } from "react-icons/io";
import { IoMdLogOut } from "react-icons/io";
import { FaUser } from "react-icons/fa";
import { RiSurveyLine } from "react-icons/ri"; 
import { TbReportSearch } from "react-icons/tb";

const menuItems = [
  { label: "Dashboard", path: "/dashboard", icon: <MdDashboard /> },
  { label: "Clients", path: "/clients", icon: <FaUsers /> },
  { label: "Partners", path: "/partners", icon: <FaProductHunt /> },
  { label: "Surveys", path: "/surveys", icon: <RiSurveyLine /> },
  { label: "Users", path: "/users", icon: <FaUser /> },
  { label: "Recontact", path: "/survey/recontact", icon: <TbReportSearch /> },
  { label: "My Account", path: "/account", icon: <IoIosSettings /> },
  { label: "Manage Multiselects", path: "/multiselects", icon: <IoIosSettings /> },
  { label: "Manage Country Languages", path: "/country-languages", icon: <IoIosSettings /> },
  { label: "Manage Countries", path: "/countries", icon: <IoIosSettings /> }
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="sidebar">
      <ul>
        {menuItems.map((item, index) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <li key={index}>
              <Link to={item.path}>
                <Button className={`w-100 ${isActive ? "active" : ""}`}>
                  <span className="icon">{item.icon}</span>
                  {item.label}
                </Button>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Sidebar;
