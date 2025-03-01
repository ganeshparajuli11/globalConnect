import axios from "axios";
import { useState, useEffect } from "react";
import config from "../constants/config";
import { userAuth } from "../contexts/AuthContext";

const ip = config.API_IP;
const API_URL = `http://${ip}:3000/api/post/all`;

export const useSearchPosts = (query) => {
  const { authToken } = userAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only search if the query has at least 2 characters
    if (query.trim().length < 2) {
      setPosts([]);
      return;
    }

    const fetchPosts = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${API_URL}?query=${encodeURIComponent(query)}`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        // Expecting the backend to return { data: [ ...posts ] }
        setPosts(response.data.data || []);
      } catch (error) {
        console.error(
          "Error searching posts:",
          error.response ? error.response.data : error.message
        );
      } finally {
        setLoading(false);
      }
    };

    // Debounce the search by 300ms
    const debounceTimeout = setTimeout(() => {
      fetchPosts();
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [query, authToken]);

  return { posts, loading };

};
