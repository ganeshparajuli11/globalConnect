import React, { useState, useEffect } from "react";
import Sidebar from "../sidebar/Sidebar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiSend, FiTrash2, FiEdit2, FiX, FiAlertCircle } from "react-icons/fi";
import { format } from "date-fns";
import axiosInstance from "./axiosInstance";

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [formData, setFormData] = useState({
    message: "",
    title: "",
    type: "info", 
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  // Fetch notifications from the backend
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axiosInstance.get("/notifications/admin");
      setNotifications(res.data);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axiosInstance.put(`/notifications/${editId}`, formData);
        toast.success("Notification updated successfully!");
      } else {
        await axiosInstance.post("/notifications/admin/send/global", formData);
        toast.success("Notification sent successfully!");
      }
      fetchNotifications();
      resetForm();
    } catch (error) {
      toast.error(isEditing ? "Failed to update notification" : "Failed to send notification");
      console.error("Error saving notification:", error);
    }
  };

  const resetForm = () => {
    setFormData({ message: "", title: "", type: "info" });
    setIsEditing(false);
    setEditId(null);
  };

  const handleEdit = (notification) => {
    setIsEditing(true);
    setEditId(notification._id);
    setFormData({
      message: notification.message,
      title: notification.title || "",
      type: notification.type || "info",
    });
  };

  const handleDelete = (id) => {
    setNotificationToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await axiosInstance.delete(`/notifications/${notificationToDelete}`);
      toast.success("Notification deleted successfully!");
      fetchNotifications();
    } catch (error) {
      toast.error("Failed to delete notification");
      console.error("Error deleting notification:", error);
    }
    setShowDeleteDialog(false);
    setNotificationToDelete(null);
  };

  const filteredNotifications = notifications
    .filter(notification => {
      if (filter === "all") return true;
      return notification.type === filter;
    })
    .filter(notification =>
      notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (notification.title && notification.title.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Notification Management</h1>
            <p className="text-gray-600 mt-2">Send and manage notifications to your users</p>
          </div>

          {/* Create/Edit Form */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {isEditing ? "Edit Notification" : "Send New Notification"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter notification title..."
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="info">Information</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
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

              <div className="flex justify-end space-x-3">
                {isEditing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiSend className="mr-2" />
                  {isEditing ? "Update Notification" : "Send Notification"}
                </button>
              </div>
            </form>
          </div>

          {/* Notifications List */}
          <div className="bg-white rounded-xl shadow-sm p-6">
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
                  <option value="all">All Types</option>
                  <option value="info">Information</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>
            </div>

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
                      {notification.title && (
                        <h3 className="font-medium text-gray-900">{notification.title}</h3>
                      )}
                      <p className="text-gray-700 mt-1">{notification.message}</p>
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <span className={`
                          px-2 py-1 rounded-full text-xs mr-2
                          ${notification.type === 'success' ? 'bg-green-100 text-green-800' : ''}
                          ${notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${notification.type === 'error' ? 'bg-red-100 text-red-800' : ''}
                          ${notification.type === 'info' ? 'bg-blue-100 text-blue-800' : ''}
                        `}>
                          {notification.type || 'info'}
                        </span>
                        <span>{format(new Date(notification.createdAt), 'MMM d, yyyy HH:mm')}</span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(notification)}
                        className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <FiEdit2 />
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
              Are you sure you want to delete this notification? This action cannot be undone.
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
