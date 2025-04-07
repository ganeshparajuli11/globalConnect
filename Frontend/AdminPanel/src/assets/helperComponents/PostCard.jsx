import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const PostCard = ({ post, accessToken, getMediaUrl }) => {
  const [openAction, setOpenAction] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState("");
  const [modalReason, setModalReason] = useState("");
  const [suspendFrom, setSuspendFrom] = useState("");
  const [suspendUntil, setSuspendUntil] = useState("");

  // Helper: Badge classes based on status
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

  // Helper: Determine MIME type from filename based on its extension.
  const getFileMimeType = (filename) => {
    const extension = filename.split(".").pop().toLowerCase();
    if (["jpg", "jpeg", "png", "gif"].includes(extension)) {
      return `image/${extension === "jpg" ? "jpeg" : extension}`;
    } else if (extension === "mp4") {
      return "video/mp4";
    }
    return "";
  };


  // Update post status via API
  const updatePostStatus = async (
    action,
    reason = "",
    suspendFromVal = "",
    suspendUntilVal = ""
  ) => {
    try {
      const payload = { status: action };
      if (["Suspended", "Blocked", "Under Review"].includes(action)) {
        payload.reason = reason;
      }
      if (action === "Suspended") {
        payload.suspended_from = suspendFromVal;
        payload.suspended_until = suspendUntilVal;
      }
      await axios.put(
        `http://localhost:3000/api/post/status/${post.id || post._id}`,
        payload,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      toast.success("Post status updated successfully.");
    } catch (error) {
      console.error("Error updating post status", error);
      alert("Error updating post status.");
    }
  };

  const handleActionChange = (action) => {
    if (["Suspended", "Blocked", "Under Review"].includes(action)) {
      setModalAction(action);
      setModalReason("");
      setSuspendFrom("");
      setSuspendUntil("");
      setModalOpen(true);
    } else {
      updatePostStatus(action);
    }
    setOpenAction(false);
  };

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

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      {/* Header: User Info & Action Button */}
      <div className="flex justify-between items-center border-b pb-4 mb-4">
        <div className="flex items-center gap-4">
          <img
            src={`http://localhost:3000/${post.user.profile_image}`}
            alt={post.user.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <h2 className="text-xl font-bold text-gray-800">{post.user.name}</h2>
            <p className="text-sm text-gray-500">
              {new Date(post.time).toLocaleString()}
            </p>
          </div>
        </div>
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
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-20">
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

      {/* Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <p>
            <span className="font-medium text-gray-600">Post ID:</span>{" "}
            <span className="text-gray-800">{post.id || post._id}</span>
          </p>
          <p>
            <span className="font-medium text-gray-600">Type:</span>{" "}
            <span className="text-gray-800">{post.type || "N/A"}</span>
          </p>
          <p>
            <span className="font-medium text-gray-600">Visibility:</span>{" "}
            <span className="text-gray-800">{post.visibility}</span>
          </p>
        </div>
        <div className="space-y-2">
          <p>
            <span className="font-medium text-gray-600">Status:</span>
            <span
              className={`ml-2 px-3 py-1 rounded-full text-sm ${getStatusBadgeClass(
                post.status || "Active"
              )}`}
            >
              {post.status || "Active"}
            </span>
          </p>
          <p>
            <span className="font-medium text-gray-600">Created At:</span>{" "}
            <span className="text-gray-800">
              {new Date(post.time).toLocaleString()}
            </span>
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Content</h3>
        <div
          className="text-gray-700"
          dangerouslySetInnerHTML={{
            __html: post.content || "No content provided.",
          }}
        />
      </div>

      {/* Media */}
      {post.media && post.media.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Media</h3>
          <div className="grid grid-cols-2 gap-4">
            {post.media.map((m, index) => {
              // For backwards compatibility, check if m is a string.
              // Otherwise, use m.url if available, and derive media type from the URL.
              const mediaPath = typeof m === "string" ? m : (m.url || m.media_path);
              const mediaType =
                typeof m === "string"
                  ? getFileMimeType(m)
                  : m.media_type
                    ? m.media_type
                    : getFileMimeType(m.url);
              const description =
                typeof m === "string" ? "" : m.description || "";
              return (
                <div
                  key={typeof m === "string" ? index : m.id || m._id}
                  className="border rounded overflow-hidden"
                >
                  {mediaType.startsWith("image") ? (
                    <img
                      src={getMediaUrl(mediaPath)}
                      alt={description || "Media"}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <video controls className="w-full h-48">
                      <source src={getMediaUrl(mediaPath)} type={mediaType} />
                    </video>
                  )}
                  {description && (
                    <div className="p-2">
                      <p className="text-xs text-gray-500">{description}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* Statistics */}
      <div className="flex justify-around border-t pt-4 mb-6">
        <div className="text-center">
          <p className="font-bold text-gray-800">{post.likeCount || 0}</p>
          <p className="text-sm text-gray-600">Likes</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-gray-800">{post.commentCount || 0}</p>
          <p className="text-sm text-gray-600">Comments</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-gray-800">{post.shareCount || 0}</p>
          <p className="text-sm text-gray-600">Shares</p>
        </div>
      </div>

      {/* Moderation History & Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Moderation History */}
        {post.moderation_history && (
          <div className="bg-gray-50 rounded p-4 shadow-inner">
            <h4 className="text-lg font-semibold text-gray-700 mb-2">
              Moderation History
            </h4>
            {post.moderation_history.length > 0 ? (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
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
              <p className="text-gray-600 text-sm">
                No moderation actions recorded.
              </p>
            )}
          </div>
        )}

        {/* Reports */}
        {post.reports && (
          <div className="bg-gray-50 rounded p-4 shadow-inner">
            <h4 className="text-lg font-semibold text-gray-700 mb-2">
              Reports
            </h4>
            {post.reports.length > 0 ? (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
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
              <p className="text-gray-600 text-sm">
                No reports found for this post.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Modal for Status Update */}
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
  );
};

export default PostCard;
