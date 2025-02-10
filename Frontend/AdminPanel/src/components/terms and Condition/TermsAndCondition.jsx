import React, { useState, useEffect } from "react";
import Sidebar from "../sidebar/Sidebar";
import axios from "axios";
import ReactQuill from "react-quill"; // Rich text editor
import "react-quill/dist/quill.snow.css";

const TermsAndCondition = () => {
  const [terms, setterms] = useState("");         // Current saved terms content (HTML)
  const [isEditing, setIsEditing] = useState(false);  // Editing mode toggle
  const [updatedterms, setUpdatedTerms] = useState(""); // Editor value

  useEffect(() => {
    // Fetch the current terms from the backend
    axios
      .get("http://localhost:3000/api/terms-conditions")
      .then((res) => {
        // Use the content field from the returned terms object
        setterms(res.data.terms ? res.data.terms.content : "");
      })
      .catch((err) => console.error("Error fetching terms:", err));
  }, []);

  const handleEdit = () => {
    setUpdatedTerms(terms);
    setIsEditing(true);
  };

  const handleSave = () => {
    const apiUrl = "http://localhost:3000/api/terms-conditions";
    axios
      .post(apiUrl, { content: updatedterms })
      .then((res) => {
        setterms(updatedterms);
        setIsEditing(false);
      })
      .catch((err) => console.error("Error saving terms:", err));
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete the Privacy terms?")) {
      axios
        .delete("http://localhost:3000/api/terms-conditions")
        .then(() => {
          setterms("");
        })
        .catch((err) => console.error("Error deleting terms:", err));
    }
  };

  return (
    <div className="flex">
      <Sidebar />

      <div className="ml-0 flex-1 min-h-screen bg-gray-100 p-6">
        <header className="flex justify-between items-center bg-white shadow-md px-6 py-4 rounded-md">
          <h1 className="text-2xl font-bold text-gray-800">Terms & Condition</h1>
          {!isEditing ? (
            <div className="flex space-x-2">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                onClick={handleEdit}
              >
                {terms ? "Edit" : "Add"}
              </button>
              {terms && (
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
            <ReactQuill value={updatedterms} onChange={setUpdatedTerms} />
          ) : (
            // Render the terms content as HTML when not editing
            <div
              className="text-gray-700"
              dangerouslySetInnerHTML={{ __html: terms || "No privacy terms available." }}
            />
          )}
        </section>
      </div>
    </div>
  );
};

export default TermsAndCondition;
