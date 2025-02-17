// notificationService.js
import axios from 'axios';
import { useState, useCallback, useEffect } from 'react';
import config from '../constants/config';
import { userAuth } from '../contexts/AuthContext';

const ip = config.API_IP;
// Define your endpoint for fetching notifications for the logged-in user.
const GET_NOTIFICATIONS_API_URL = `http://${ip}:3000/api/notifications/user`;


export const useFetchNotifications = () => {
  const { authToken } = userAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(GET_NOTIFICATIONS_API_URL, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.data.notifications) {
        setNotifications(response.data.notifications);
      } else {
        console.error("Error: Unexpected response structure", response.data);
      }
    } catch (error) {
      if (error.response) {
        console.error(
          "Error fetching notifications: Server responded with status",
          error.response.status,
          "and data:",
          error.response.data
        );
      } else if (error.request) {
        console.error("Error fetching notifications: No response received", error.request);
      } else {
        console.error("Error fetching notifications:", error.message);
      }
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return { notifications, loading, fetchNotifications };
};
