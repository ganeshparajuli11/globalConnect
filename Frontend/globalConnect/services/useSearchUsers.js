import axios from "axios";
import { useState, useEffect } from "react";
import config from "../constants/config";
import { userAuth } from "../contexts/AuthContext";

const ip = config.API_IP;

export const useSearchUsers = (query) => {
  const { authToken } = userAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only perform search if query length is > 1 (or any minimum you decide)
    if (query.length < 2) {
      setUsers([]);
      return;
    }
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `http://${ip}:3000/api/profile/search?query=${encodeURIComponent(query)}`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        // Assume your backend returns { data: [array of users] }
        setUsers(response.data.data || []);
        console.log("user data in search", response.data.data);
      } catch (error) {
        console.error("Error searching users:", error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the search by 300ms
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, authToken]);

  return { users, loading };
};
