import axios from "axios";
import { useCallback, useState, useEffect } from "react";
import config from "../constants/config";
import { userAuth } from "../contexts/AuthContext";

const ip = config.API_IP;

// Base URLs for report endpoints
const GET_CATEGORIES_API_URL = `http://${ip}:3000/api/dashboard/`;
const REPORT_USER_API_URL = `http://${ip}:3000/api/report/create`;
const REPORT_POST_API_URL = `http://${ip}:3000/api/report/post/create`;



/**
 * Hook: useFetchCategories
 * Fetches all categories available for reporting.
 */
export const useFetchCategories = () => {
  const { authToken } = userAuth();  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(GET_CATEGORIES_API_URL, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, loading };
};


export const reportUser = async (reportedUserId, reportCategoryId, authToken) => {
  try {
    const response = await axios.post(
      REPORT_USER_API_URL,
      { reportedUserId, reportCategoryId },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return response.data;
  } catch (error) {
    console.error("Error reporting user:", error.response?.data || error.message);
    // Return a standard response to be handled in UI
    let message = "An error occurred while reporting.";
    if (error.response && error.response.data && error.response.data.message) {
      message = error.response.data.message;
    }
    return { success: false, message };
  }
};


export const reportPost = async (postId, selectedCategory, authToken) => {
 
  
  try {
    const response = await axios.post(
      REPORT_POST_API_URL,
      { postId, selectedCategory },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      "An error occurred while reporting.";
      
    // Only log if it is NOT the self-report error message
    if (errorMessage !== "You cannot report your own post.") {
      console.error("Error reporting post:", errorMessage);
    }
      
    return { success: false, message: errorMessage };
  }
};


