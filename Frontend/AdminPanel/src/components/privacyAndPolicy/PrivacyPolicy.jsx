import React, { useState, useEffect } from "react";
import Sidebar from "../sidebar/Sidebar";
import axios from "axios";
import ReactQuill from "react-quill"; // Rich text editor
import "react-quill/dist/quill.snow.css";

const PrivacyPolicy = () => {
  const [policy, setPolicy] = useState("");         // Current saved policy content (HTML)
  const [isEditing, setIsEditing] = useState(false);  // Editing mode toggle
  const [updatedPolicy, setUpdatedPolicy] = useState(""); // Editor value

  useEffect(() => {
    // Fetch the current policy from the backend
    axios
      .get("http://localhost:3000/api/privacy-policy")
      .then((res) => {
        // Use the content field from the returned policy object
        setPolicy(res.data.policy ? res.data.policy.content : "");
      })
      .catch((err) => console.error("Error fetching policy:", err));
  }, []);

  const handleEdit = () => {
    setUpdatedPolicy(policy);
    setIsEditing(true);
  };

  const handleSave = () => {
    const apiUrl = "http://localhost:3000/api/privacy-policy";
    axios
      .post(apiUrl, { content: updatedPolicy })
      .then((res) => {
        setPolicy(updatedPolicy);
        setIsEditing(false);
      })
      .catch((err) => console.error("Error saving policy:", err));
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete the Privacy Policy?")) {
      axios
        .delete("http://localhost:3000/api/privacy-policy")
        .then(() => {
          setPolicy("");
        })
        .catch((err) => console.error("Error deleting policy:", err));
    }
  };

  return (
    <div className="flex">
      <Sidebar />

      <div className="ml-0 flex-1 min-h-screen bg-gray-100 p-6">
        <header className="flex justify-between items-center bg-white shadow-md px-6 py-4 rounded-md">
          <h1 className="text-2xl font-bold text-gray-800">Privacy Policy</h1>
          {!isEditing ? (
            <div className="flex space-x-2">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                onClick={handleEdit}
              >
                {policy ? "Edit" : "Add"}
              </button>
              {policy && (
                <button
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                  onClick={handleDelete}
                >
                  Delete
                </button>
              )}
            </div>
          ) : (
            <button
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              onClick={handleSave}
            >
              Save Changes
            </button>
          )}
        </header>

        <section className="mt-6 bg-white shadow-md p-6 rounded-md">
          {isEditing ? (
            // Render the rich text editor when editing
            <ReactQuill value={updatedPolicy} onChange={setUpdatedPolicy} />
          ) : (
            // Render the policy content as HTML when not editing
            <div
              className="text-gray-700"
              dangerouslySetInnerHTML={{ __html: policy || "No privacy policy available." }}
            />
          )}
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
