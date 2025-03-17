import axios from "axios";
import React, { useState } from "react";
import { BiSolidHide } from "react-icons/bi";
import { BiShow } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { reactLocalStorage } from "reactjs-localstorage";

const Login = ({ setIsAuthenticated }) => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData({ ...loginData, [name]: value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
  
    try {
      const res = await axios.post("http://localhost:3000/api/users/loginAdmin", loginData);
      toast.success("Login successful!");
      
      const { token } = res.data;
      localStorage.setItem("access_token", token);
      localStorage.setItem("adminId", res.data.user.id); 
      console.log("Admin ID:", res.data.user.id);
  
      // Update authentication state (pass setIsAuthenticated as a prop)
      setIsAuthenticated(true);
  
      navigate("/dashboard");
    } catch (err) {
      if (err.response) {
        toast.error(err.response.data.message || "Login failed. Please try again.");
      } else if (err.request) {
        toast.error("Server is not responding. Please try again later.");
      } else {
        toast.error("An error occurred. Please try again.");
      }
      console.error("Error during login:", err);
    }
  };
  

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <ToastContainer />
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center text-blue-700">GlobalConnect</h1>
        <p className="mt-2 text-center text-gray-600">Login into your account</p>

        <form onSubmit={handleLogin} className="mt-6">
          {/* Email Input */}
          <div className="mb-4">
            <label className="block mb-1 text-gray-600">Email Id :</label>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={loginData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-300 focus:border-blue-500"
                placeholder="Enter your email"
                required
              />
              <span className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400">
                📧
              </span>
            </div>
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <label className="block mb-1 text-gray-600">Password :</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={loginData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-300 focus:border-blue-500"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400 focus:outline-none"
              >
                {showPassword ? <BiShow /> : <BiSolidHide />}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="mb-6 text-right">
            <a
              href="/forgot-password"
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot password?
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full px-4 py-2 text-white bg-blue-600 rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300"
          >
            Log in
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
