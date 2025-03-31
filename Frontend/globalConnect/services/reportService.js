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

/**
 * reportUser
 * Reports a user.
 * @param {string} reportedUserId - The ID of the user being reported.
 * @param {string}  - The ID of the report category.
 * @returns {Promise<Object>} - The response data.
 */
export const reportUser = async (reportedUserId, reportCategoryId) => {
  const { authToken } = userAuth();  // Dynamically get authToken from the context
  try {
    const response = await axios.post(
      REPORT_USER_API_URL,
      { reportedUserId, reportCategoryId },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return response.data;
  } catch (error) {
    console.error("Error reporting user:", error);
    throw error;
  }
};

/**
 * reportPost
 * Reports a post.
 * @param {string} reportedPostId - The ID of the post being reported.
 * @param {string} reportCategoryId - The ID of the report category.
 * @returns {Promise<Object>} - The response data.
 */
export const reportPost = async (postId, selectedCategory, authToken) => {
  console.log('Checking from report service');
  
  try {
    const response = await axios.post(
      REPORT_POST_API_URL,
      { postId, selectedCategory },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return response.data;
  } catch (error) {
    if (error.response) {
      // The server responded with a status code that falls out of the range of 2xx
      console.error("Error reporting post:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error("Error reporting post (no response received):", error.request);
    } else {
      // Something happened in setting up the request
      console.error("Error reporting post (request setup):", error.message);
    }
    throw error;
  }
};


