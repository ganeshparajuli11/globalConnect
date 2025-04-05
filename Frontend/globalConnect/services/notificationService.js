// notificationService.js
import axios from 'axios';
import { useState, useCallback, useEffect } from 'react';
import config from '../constants/config';
import { userAuth } from '../contexts/AuthContext';

const ip = config.API_IP;
// Define your endpoint for fetching notifications for the logged-in user.
const GET_NOTIFICATIONS_API_URL = `http://${ip}:3000/api/notifications/user`;
const READ_NOTIFICATIONS_API_URL = `http://${ip}:3000/api/notifications/user/notification/read`;
const CLEAR_NOTIFICATIONS_API_URL = `http://${ip}:3000/api/notifications/user/clear-all`;
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

  const markAsRead = useCallback(async (notificationId) => {
    try {
      const notification = notifications.find(n => n._id === notificationId);
      if (notification?.read) {
        return true; // Already read, no further action needed
      }

      const response = await axios.put(
        READ_NOTIFICATIONS_API_URL,
        { notificationId, isRead: true },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (response.data.success) {
        setNotifications(prevNotifications =>
          prevNotifications.map(notification =>
            notification._id === notificationId
              ? { ...notification, read: true }
              : notification
          )
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  }, [authToken, notifications]);

  const clearAllNotifications = useCallback(async () => {
    try {
      const response = await axios.delete(CLEAR_NOTIFICATIONS_API_URL, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.data.success) {
        // Clear all notifications from local state
        setNotifications([]);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error clearing notifications:", error);
      if (error.response) {
        console.error(
          "Error clearing notifications: Server responded with status",
          error.response.status,
          "and data:",
          error.response.data
        );
      }
      return false;
    }
  }, [authToken]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return { 
    notifications, 
    loading, 
    fetchNotifications, 
    markAsRead,
    clearAllNotifications 
  };
};

