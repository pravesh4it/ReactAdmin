import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { useContext } from "react";
import { MyContext } from "../App";

export default function MainLayout() {
  const { isToggleSidebar, isOpenNav, setIsOpenNav } = useContext(MyContext);

  return (
    <>
      <Header />
      <div className="main d-flex">
        <div
          className={`sidebarOverlay d-none ${isOpenNav ? "show" : ""}`}
          onClick={() => setIsOpenNav(false)}
        ></div>
        <div
          className={`sidebarWrapper ${
            isToggleSidebar ? "toggle" : ""
          } ${isOpenNav ? "open" : ""}`}
        >
          <Sidebar />
        </div>

        <div
          className={`content ${isToggleSidebar ? "toggle" : ""}`}
        >
          {/* 👇 renders child route here */}
          <Outlet />
        </div>
      </div>
    </>
  );
}
