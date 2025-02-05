import React, { createContext, useContext, useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
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
import AllCategory from "./components/category/AllCategory";
import { Sidebar } from "lucide-react";
import UserProfile from "./components/userpage/UserProfile";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userCount, setUserCount] = useState(null); // Store user details

  // Check for authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("access_token");
      if (token) {
        axios
          .get("http://localhost:3000/api/dashboard/getUserinfo", {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => {
            setIsAuthenticated(true);
            setUserCount(res.data.data);
          })
          .catch(() => {
            setIsAuthenticated(false);
          });
      } else {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
    window.addEventListener("storage", checkAuth); // Listen for changes in localStorage
    return () => window.removeEventListener("storage", checkAuth);
  }, []);

  return (
    <Router>
      <Sidebar setIsAuthenticated={setIsAuthenticated} />

      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" />
            ) : (
              <Login setIsAuthenticated={setIsAuthenticated} />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <Dashboard userCount={userCount} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="/user/all" element={<UserPage />} />
        <Route path="/user/active" element={<ActiveUser />} />
        <Route path="/user/inActive" element={<InActiveUser />} />
        <Route path="/user/blocked" element={<BlockedUser />} />
        <Route path="/user/reported" element={<ReportedUser />} />
        <Route path="/privacyPolicy" element={<PrivacyPolicy />} />
        <Route path="/editprivacyPolicy" element={<EditPrivacyAndPolicy />} />
        <Route path="/notification" element={<NotificationPage />} />
        <Route path="/allCategory" element={<AllCategory />} />
        <Route path="/user/:userId" element={<UserProfile />} />
      </Routes>
    </Router>
  );
}

export default App;
