import { Outlet } from "react-router-dom";

export default function NoLayout() {
  return (
    <div className="content full">
      {/* 👇 renders child route here */}
      <Outlet />
    </div>
  );
}
