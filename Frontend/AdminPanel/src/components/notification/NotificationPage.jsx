import React, { useState, useEffect } from "react";
import Sidebar from "../sidebar/Sidebar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FiSend,
  FiTrash2,
  FiClock,
  FiX,
  FiAlertCircle,
  FiRepeat,
} from "react-icons/fi";
import { format } from "date-fns";
import axiosInstance from "./axiosInstance";
import axios from "axios";

const NotificationPage = () => {
  // Form data now only contains message and scheduleTime
  const [formData, setFormData] = useState({
    message: "",
    scheduleTime: "",
  });
  const [notifications, setNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Dialog state management
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showResendDialog, setShowResendDialog] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const [notificationToResend, setNotificationToResend] = useState(null);

  // Helper function to get current date/time in the required format for input type="datetime-local"
  const getTodayMin = () => {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, "0");
    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Set default scheduleTime on mount if not set
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      scheduleTime: prev.scheduleTime || getTodayMin(),
    }));
  }, []);

  // Fetch notifications from the backend
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axiosInstance.get(
        "http://localhost:3000/api/notifications/admin/all"
      );
      setNotifications(res.data.notifications);
    } catch (error) {
      toast.error("Failed to fetch notifications");
      console.error("Error fetching notifications:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmitRequest = (e) => {
    e.preventDefault();
    // Show confirmation dialog instead of submitting directly
    setShowSendDialog(true);
  };

  const confirmSend = async () => {
    setIsSubmitting(true);
    try {
      const now = new Date();
      const scheduledDate = new Date(formData.scheduleTime);
      if (formData.scheduleTime && scheduledDate > now) {
        await axiosInstance.post("/notifications/admin/schedule", formData);
        toast.success("Notification scheduled successfully!");
      } else {
        await axiosInstance.post("/notifications/admin/send/global", formData);
        toast.success("Notification sent successfully!");
      }
      fetchNotifications();
      resetForm();
    } catch (error) {
      toast.error("Failed to send notification");
      console.error("Error sending notification:", error);
    } finally {
      setIsSubmitting(false);
      setShowSendDialog(false);
    }
  };

  const resetForm = () => {
    setFormData({ message: "", scheduleTime: getTodayMin() });
  };

  const handleDelete = (id) => {
    setNotificationToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await axiosInstance.delete(`/notifications/admin/${notificationToDelete}`);
      toast.success("Notification deleted successfully!");
      fetchNotifications();
    } catch (error) {
      toast.error("Failed to delete notification");
      console.error("Error deleting notification:", error);
    }
    setShowDeleteDialog(false);
    setNotificationToDelete(null);
  };

  const handleResend = (id) => {
    setNotificationToResend(id);
    setShowResendDialog(true);
  };
  
  const confirmResend = async () => {
    try {
      await axiosInstance.post(`/notifications/admin/resend/${notificationToResend}`);
      toast.success("Notification resent successfully!");
      fetchNotifications();
    } catch (error) {
      toast.error("Failed to resend notification");
      console.error("Error resending notification:", error);
    }
    setShowResendDialog(false);
    setNotificationToResend(null);
  };

  const filteredNotifications = notifications
    .filter((notification) => {
      if (filter === "all") return true;
      return notification.type === filter;
    })
    .filter(
      (notification) =>
        notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Check if notification is scheduled for the future
  const isScheduled = () => {
    const now = new Date();
    const scheduledDate = new Date(formData.scheduleTime);
    return scheduledDate > now;
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 p-8 overflow-hidden">
        <div className="max-w-6xl mx-auto h-full flex flex-col">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              Notification Management
            </h1>
            <p className="text-gray-600 mt-2">
              Send and manage notifications to your users
            </p>
          </div>

          {/* Create Form */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              Send New Notification
            </h2>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Write your notification message here..."
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="4"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule Date & Time
                </label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiClock className="text-gray-500" />
                    </div>
                    <input
                      type="datetime-local"
                      name="scheduleTime"
                      value={formData.scheduleTime}
                      onChange={handleChange}
                      min={getTodayMin()}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Select both date and time for when the notification should be sent
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting && (
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      ></path>
                    </svg>
                  )}
                  {isScheduled() ? (
                    <>
                      <FiClock className="mr-2" />
                      Schedule Notification
                    </>
                  ) : (
                    <>
                      <FiSend className="mr-2" />
                      Send Notification Now
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Notifications List - Now with scrollable container */}
          <div className="bg-white rounded-xl shadow-sm p-6 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Notification History</h2>

              <div className="flex space-x-4">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Filter */}
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All</option>
                </select>
              </div>
            </div>

            {/* Scrollable notification container */}
            <div className="overflow-y-auto flex-1 pr-1" style={{ maxHeight: "calc(100vh - 400px)" }}>
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8">
                  <FiAlertCircle className="mx-auto text-gray-400 text-4xl mb-3" />
                  <p className="text-gray-500">No notifications found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification._id}
                      className="flex items-start p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="text-gray-700 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <span>
                            {format(
                              new Date(notification.createdAt),
                              "MMM d, yyyy HH:mm"
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleResend(notification._id)}
                          className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                          title="Resend"
                        >
                          <FiRepeat />
                        </button>
                        <button
                          onClick={() => handleDelete(notification._id)}
                          className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Send/Schedule Confirmation Modal */}
      {showSendDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl p-6 w-[450px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {isScheduled() ? "Confirm Scheduling" : "Confirm Sending"}
              </h3>
              <button
                onClick={() => setShowSendDialog(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX />
              </button>
            </div>
            <p className="text-gray-600 mb-2">
              {isScheduled()
                ? "Are you sure you want to schedule this notification for:"
                : "Are you sure you want to send this notification immediately to all users?"}
            </p>
            
            {isScheduled() && (
              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <p className="font-medium">
                  {format(new Date(formData.scheduleTime), "MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            )}
            
            <div className="bg-gray-50 p-3 rounded-lg mb-6">
              <p className="font-medium">Message:</p>
              <p className="text-gray-700 mt-1">{formData.message}</p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSendDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmSend}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                {isScheduled() ? (
                  <>
                    <FiClock className="mr-2" /> Schedule
                  </>
                ) : (
                  <>
                    <FiSend className="mr-2" /> Send Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl p-6 w-[400px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Confirm Deletion</h3>
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this notification? This action
              cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resend Confirmation Modal */}
      {showResendDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl p-6 w-[400px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Confirm Resend</h3>
              <button
                onClick={() => setShowResendDialog(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to resend this notification to all users?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowResendDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmResend}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <FiRepeat className="mr-2" /> Resend
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
};

export default NotificationPage;