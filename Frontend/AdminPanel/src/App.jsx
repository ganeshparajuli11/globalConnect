import React, { createContext, useContext, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import Login from "./components/loginAndSignup/Login";
import Dashboard from "./components/dashboard/Dashboard";
import UserPage from "./components/userpage/UserPage";
import PrivacyPolicy from "./components/privacyAndPolicy/PrivacyPolicy";
import EditPrivacyAndPolicy from "./components/privacyAndPolicy/EditPrivacyAndPolicy";
import NotificationPage from "./components/notification/NotificationPage";
import ActiveUser from "./components/userpage/ActiveUser";
import InActiveUser from "./components/userpage/InActiveUser";
import ReportedUser from "./components/userpage/ReportedUser";
import BlockedUser from "./components/userpage/BlockedUser";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userCount, setUserCount] = useState(null); // Store user details

  // Check for authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem("access_token");

    // If there's a token, attempt to fetch user details to validate the token
    if (token) {
      // Call API to validate the token and get user details
      axios
        .get("http://localhost:3000/api/dashboard/getUserinfo", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          // If successful, set user as authenticated and store user details
          setIsAuthenticated(true);
          setUserCount(res.data.data);
        })
        .catch((error) => {
          console.error("Error fetching user stats:", error);
          // If error occurs, consider the user as not authenticated
          setIsAuthenticated(false);
        });
    }
  }, []);

  return (
    <Router>
      <Routes>
        {/* Redirect to login page if not authenticated */}
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
        />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
        <Route
          path="/dashboard"
          element={isAuthenticated ? <Dashboard userCount={userCount} /> : <Navigate to="/login" />}
        />
        <Route
          path="/user/all"
          element={ <UserPage />}
        />
         <Route
          path="/user/active"
          element={ <ActiveUser />}
        />
                 <Route
          path="/user/inActive"
          element={ <InActiveUser />}
        />
                         <Route
          path="/user/blocked"
          element={ <BlockedUser />}
        />
                 <Route
          path="/user/reported"
          element={ <ReportedUser/>}
        />
           <Route
          path="/privacyPolicy"
          element={ <PrivacyPolicy />}
        />
        <Route
          path="/editprivacyPolicy"
          element={ <EditPrivacyAndPolicy />}
        />
                <Route
          path="/notification"
          element={ <NotificationPage />}
        />
      </Routes>
    </Router>
  );
}

export default App;
