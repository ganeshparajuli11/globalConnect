import React, { useState } from "react";
import Sidebar from "../sidebar/Sidebar"; // Assuming the Sidebar component is located in ../sidebar

const EditPrivacyAndPolicy = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
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
      console.log("Edited Terms & Conditions:", formData);
      // Add API call to update the terms and conditions
    } else {
      console.log("Created Terms & Conditions:", formData);
      // Add API call to create new terms and conditions
    }
    setFormData({ title: "", description: "" });
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
            {isEditing ? "Edit Terms & Conditions" : "Create New Terms & Conditions"}
          </h1>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter Title"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Write description here..."
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

    
        </div>
      </div>
    </div>
  );
};

export default EditPrivacyAndPolicy;
