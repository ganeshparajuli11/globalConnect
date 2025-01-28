import React, { useState } from "react";
import Sidebar from "../sidebar/Sidebar"; // Assuming the Sidebar component is located here

const NotificationPage = () => {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditing) {
      console.log("Edited Notification:", formData);
      // Add API call to update the notification
    } else {
      console.log("Created Notification:", formData);
      // Add API call to create a new notification
    }
    setFormData({ title: "", message: "" });
    setIsEditing(false);
  };

  const handleEdit = (data) => {
    setIsEditing(true);
    setFormData(data);
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
              <label className="block text-gray-700 font-medium mb-2">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter Notification Title"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
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

          {/* Example list of existing notifications for editing */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Existing Notifications</h2>
            <ul className="space-y-4">
              {/* Replace with dynamic data */}
              <li className="bg-gray-100 p-4 rounded-md shadow">
                <h3 className="font-medium text-lg">Privacy Policy Update</h3>
                <p className="text-gray-600">
                  We’ve updated our Privacy Policy. Please review the changes.
                </p>
                <button
                  onClick={() =>
                    handleEdit({
                      title: "Privacy Policy Update",
                      message: "We’ve updated our Privacy Policy. Please review the changes.",
                    })
                  }
                  className="mt-2 text-blue-600 hover:underline"
                >
                  Edit
                </button>
              </li>
              <li className="bg-gray-100 p-4 rounded-md shadow">
                <h3 className="font-medium text-lg">System Maintenance Notice</h3>
                <p className="text-gray-600">
                  Scheduled maintenance will occur on Sunday at 2 AM. Service may be temporarily unavailable.
                </p>
                <button
                  onClick={() =>
                    handleEdit({
                      title: "System Maintenance Notice",
                      message:
                        "Scheduled maintenance will occur on Sunday at 2 AM. Service may be temporarily unavailable.",
                    })
                  }
                  className="mt-2 text-blue-600 hover:underline"
                >
                  Edit
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPage;
