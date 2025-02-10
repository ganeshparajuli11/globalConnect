import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // To get the post ID from the URL
import axios from "axios";
import { reactLocalStorage } from "reactjs-localstorage";
import Sidebar from "../sidebar/Sidebar";
import { toast, ToastContainer } from "react-toastify";

const PostProfile = () => {
  const { postId } = useParams(); // Expecting route /post/:id
  const [post, setPost] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for action dropdown and status update modal
  const [openAction, setOpenAction] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState(""); // e.g., "Suspended", "Blocked", "Under Review"
  const [modalReason, setModalReason] = useState("");
  const [suspendFrom, setSuspendFrom] = useState("");
  const [suspendUntil, setSuspendUntil] = useState("");

  // Retrieve the access token from local storage
  useEffect(() => {
    const token = reactLocalStorage.get("access_token");
    if (token) {
      setAccessToken(token);
    }
  }, []);

  // Fetch post details when token and postId are available
  useEffect(() => {
    if (accessToken) {
      setLoading(true);
      axios
        .get(`http://localhost:3000/api/post/${postId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((response) => {
          // Expected response shape: { message: "...", data: { ... } }
          setPost(response.data.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching post details:", err);
          setError("Error fetching post details");
          setLoading(false);
        });
    }
  }, [accessToken, postId]);

  // Helper function to return badge classes based on status
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Suspended":
        return "bg-yellow-100 text-yellow-800";
      case "Blocked":
        return "bg-red-100 text-red-800";
      case "Under Review":
        return "bg-blue-100 text-blue-800";
      case "Deleted":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  // Function to update the post status via API
  const updatePostStatus = async (action, reason = "", suspendFromVal = "", suspendUntilVal = "") => {
    try {
      const payload = { status: action };
      // For statuses that require a reason, attach it
      if (["Suspended", "Blocked", "Under Review"].includes(action)) {
        payload.reason = reason;
      }
      // For Suspended status, also include the suspension dates
      if (action === "Suspended") {
        payload.suspended_from = suspendFromVal;
        payload.suspended_until = suspendUntilVal;
      }
      await axios.put(
        `http://localhost:3000/api/post/status/${postId}`,
        payload,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      // Update local state with new status (and suspension info if applicable)
      setPost((prev) => ({
        ...prev,
        status: action,
        suspended_from: action === "Suspended" ? suspendFromVal : null,
        suspended_until: action === "Suspended" ? suspendUntilVal : null,
      }));
      toast.success("Post status updated successfully.");
    } catch (error) {
      console.error("Error updating post status", error);
      alert("Error updating post status.");
    }
  };

  // Handle action dropdown selection
  const handleActionChange = (action) => {
    if (["Suspended", "Blocked", "Under Review"].includes(action)) {
      // For these statuses, we need extra input – open the modal.
      setModalAction(action);
      setModalReason("");
      setSuspendFrom("");
      setSuspendUntil("");
      setModalOpen(true);
    } else {
      // For Active and Deleted, update immediately.
      updatePostStatus(action);
    }
    setOpenAction(false);
  };

  // Confirm the modal update (for actions that require extra data)
  const handleConfirmStatusUpdate = async () => {
    if (!modalReason) {
      alert("Please provide a reason.");
      return;
    }
    if (modalAction === "Suspended" && (!suspendFrom || !suspendUntil)) {
      alert("Please provide both suspension dates.");
      return;
    }
    await updatePostStatus(modalAction, modalReason, suspendFrom, suspendUntil);
    setModalOpen(false);
  };

  // Helper to resolve media URL (prepend base URL if needed)
  const getMediaUrl = (path) => {
    if (path.startsWith("http") || path.startsWith("//")) {
      return path;
    } else {
      return `http://localhost:3000${path}`;
    }
  };

  if (loading) return <div className="p-6">Loading post details...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!post) return <div className="p-6">No post found.</div>;

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <ToastContainer/>
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Post Details Card */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center border-b pb-4 mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Post Details</h1>
              <div className="relative">
                <button
                  onClick={() => setOpenAction(!openAction)}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full focus:outline-none"
                >
                  <svg
                    className="w-6 h-6 text-gray-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 13a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
                  </svg>
                </button>
                {openAction && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow-lg z-10">
                    {["Active", "Suspended", "Blocked", "Under Review", "Deleted"].map(
                      (action) => (
                        <button
                          key={action}
                          onClick={() => handleActionChange(action)}
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                        >
                          {action}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Metadata */}
              <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                  Metadata
                </h2>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-gray-600">Post ID:</span>{" "}
                    <span className="text-gray-800">{post._id}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">User:</span>{" "}
                    <span className="text-gray-800">
                      {post.user_id?.name || "Unknown"}
                    </span>{" "}
                    <span className="text-sm text-gray-500">
                      ({post.user_id?.email})
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Category:</span>{" "}
                    <span className="text-gray-800">
                      {post.category_id?.name || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Status:</span>
                    <span
                      className={`ml-2 px-3 py-1 rounded-full text-sm ${getStatusBadgeClass(
                        post.status || "Active"
                      )}`}
                    >
                      {post.status || "Active"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Visibility:
                    </span>{" "}
                    <span className="text-gray-800">{post.visibility}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Created At:
                    </span>{" "}
                    <span className="text-gray-800">
                      {new Date(post.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {post.edited && post.edited_at && (
                    <div>
                      <span className="font-medium text-gray-600">
                        Edited At:
                      </span>{" "}
                      <span className="text-gray-800">
                        {new Date(post.edited_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {post.suspended_until && (
                    <div>
                      <span className="font-medium text-gray-600">
                        Suspended Until:
                      </span>{" "}
                      <span className="text-gray-800">
                        {new Date(post.suspended_until).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-600">Pinned:</span>{" "}
                    <span className="text-gray-800">
                      {post.pinned ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Content & Engagement */}
              <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                  Content & Engagement
                </h2>
                <div className="mb-4">
                  <p className="text-gray-700 mb-2 font-medium">
                    Text Content:
                  </p>
                  <p className="text-gray-600">
                    {post.text_content || "No text content provided."}
                  </p>
                </div>
                {post.media && post.media.length > 0 && (
                  <div className="mb-4">
                    <p className="text-gray-700 mb-2 font-medium">Media:</p>
                    <div className="grid grid-cols-2 gap-4">
                      {post.media.map((m) => (
                        <div
                          key={m._id}
                          className="border rounded overflow-hidden"
                        >
                          {m.media_type.startsWith("image") ? (
                            <img
                              src={getMediaUrl(m.media_path)}
                              alt={m.description || "Media"}
                              className="w-full h-40 object-cover"
                            />
                          ) : (
                            <video controls className="w-full h-40">
                              <source
                                src={getMediaUrl(m.media_path)}
                                type={m.media_type}
                              />
                            </video>
                          )}
                          {m.description && (
                            <div className="p-2">
                              <p className="text-xs text-gray-500">
                                {m.description}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-gray-600">Tags:</span>{" "}
                    <span className="text-gray-800">
                      {post.tags && post.tags.length > 0
                        ? post.tags.join(", ")
                        : "None"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Views:</span>{" "}
                    <span className="text-gray-800">{post.views}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Shares:</span>{" "}
                    <span className="text-gray-800">{post.shares}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Likes:</span>{" "}
                    <span className="text-gray-800">
                      {post.likes ? post.likes.length : 0}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Comments:
                    </span>{" "}
                    <span className="text-gray-800">
                      {post.comments ? post.comments.length : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Moderation History & Reports */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Moderation History */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                Moderation History
              </h2>
              {post.moderation_history && post.moderation_history.length > 0 ? (
                <ul className="space-y-2">
                  {post.moderation_history.map((mh, index) => (
                    <li key={index} className="border-b pb-2">
                      <p className="text-gray-800 font-medium">{mh.action}</p>
                      <p className="text-sm text-gray-600">
                        by {mh.admin?.name || "Admin"} on{" "}
                        {new Date(mh.date).toLocaleString()}
                        {mh.note && (
                          <span className="italic"> (Note: {mh.note})</span>
                        )}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">
                  No moderation actions recorded.
                </p>
              )}
            </div>

            {/* Reports */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                Reports
              </h2>
              {post.reports && post.reports.length > 0 ? (
                <ul className="space-y-2">
                  {post.reports.map((report, index) => (
                    <li key={index} className="border-b pb-2">
                      <p className="text-gray-800">
                        Reported by {report.reported_by?.name || "User"} on{" "}
                        {new Date(report.reported_at).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Reason: {report.reason}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">
                  No reports found for this post.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Modal for status update */}
        {modalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-30">
            <div className="bg-white rounded-lg shadow-lg w-96 p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                {modalAction} Post
              </h2>
              <div className="mb-4">
                <label className="block text-gray-600 mb-2">Reason:</label>
                <input
                  type="text"
                  className="w-full border rounded p-2"
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                />
              </div>
              {modalAction === "Suspended" && (
                <>
                  <div className="mb-4">
                    <label className="block text-gray-600 mb-2">
                      Suspend From:
                    </label>
                    <input
                      type="date"
                      className="w-full border rounded p-2"
                      value={suspendFrom}
                      onChange={(e) => setSuspendFrom(e.target.value)}
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block text-gray-600 mb-2">
                      Suspend Until:
                    </label>
                    <input
                      type="date"
                      className="w-full border rounded p-2"
                      value={suspendUntil}
                      onChange={(e) => setSuspendUntil(e.target.value)}
                    />
                  </div>
                </>
              )}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setModalOpen(false);
                    setModalAction("");
                    setModalReason("");
                    setSuspendFrom("");
                    setSuspendUntil("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmStatusUpdate}
                  className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostProfile;
