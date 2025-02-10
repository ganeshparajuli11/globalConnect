import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./components/sidebar/Sidebar";


function AdminRootLayout({setIsAuthenticated}) {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar setIsAuthenticated={setIsAuthenticated}/>

      {/* Main Content */}
      <div style={{ flex: 1, padding: "20px" }}>
        <Outlet />
      </div>
    </div>
  );
}

export default AdminRootLayout;
