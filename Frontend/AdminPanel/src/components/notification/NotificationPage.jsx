import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../sidebar/Sidebar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [formData, setFormData] = useState({
    message: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);

  // Fetch notifications from the backend
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/notifications/admin/get");
      setNotifications(res.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle form submission for create/update
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`http://localhost:3000/api/notifications/${editId}`, formData);
        toast.success("Notification updated successfully!");
      } else {
        await axios.post("http://localhost:3000/api/notifications/admin/send", formData);
        toast.success("Notification created successfully!");
      }
      fetchNotifications();
      setFormData({ message: "" });
      setIsEditing(false);
      setEditId(null);
    } catch (error) {
      console.error("Error saving notification:", error);
    }
  };

  // Handle editing a notification
  const handleEdit = (notification) => {
    setIsEditing(true);
    setEditId(notification._id);
    setFormData({
      message: notification.message,
    });
  };

  // Handle deleting a notification
  const handleDelete = (id) => {
    setNotificationToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:3000/api/notifications/${notificationToDelete}`);
      toast.success("Notification deleted successfully!");
      fetchNotifications();
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
    setShowDeleteDialog(false);
    setNotificationToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
    setNotificationToDelete(null);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">
            {isEditing ? "Edit Notification" : "Create New Notification"}
          </h1>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Write notification message here..."
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                rows="4"
                required
              ></textarea>
            </div>

            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              {isEditing ? "Update" : "Create"}
            </button>
          </form>

          {/* List of existing notifications */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Existing Notifications</h2>
            {notifications.length === 0 ? (
              <p className="text-gray-600">No notifications found.</p>
            ) : (
              <ul className="space-y-4">
                {notifications.map((notification) => (
                  <li key={notification._id} className="bg-gray-100 p-4 rounded-md shadow">
                    <p className="text-gray-700">{notification.message}</p>

                    <div className="mt-2 flex space-x-4">
                      <button
                        onClick={() => handleEdit(notification)}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(notification._id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Deletion */}
      {showDeleteDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="mb-4">Are you sure you want to delete this notification?</p>
            <div className="flex space-x-4">
              <button
                onClick={confirmDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-md"
              >
                Yes
              </button>
              <button
                onClick={cancelDelete}
                className="bg-gray-600 text-white px-4 py-2 rounded-md"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default NotificationPage;
