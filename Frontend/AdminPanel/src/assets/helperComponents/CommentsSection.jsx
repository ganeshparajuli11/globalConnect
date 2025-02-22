// src/components/CommentsSection.jsx

import React from "react";
import { Link } from "react-router-dom";

const CommentsSection = ({
  comments,
  loading,
  getMediaUrl,      // Or whatever function you use for generating the URL
}) => {
  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">
        Comments ({comments.length})
      </h2>
      {loading ? (
        <p className="text-gray-600">Loading comments...</p>
      ) : comments.length > 0 ? (
        comments.map((comment) => (
          <div
            key={comment._id}
            className="flex items-start space-x-4 p-4 border-b last:border-0"
          >
            <Link
              to={`/user/${comment.userId?._id}`}
              className="flex-shrink-0"
            >
              {comment.userId?.profile_image ? (
                <img
                  src={getMediaUrl(comment.userId.profile_image)}
                  alt={comment.userId.name}
                  className="w-12 h-12 rounded-full object-cover border"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center border">
                  <span className="text-xl text-white">
                    {comment.userId?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </Link>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <Link
                  to={`/user/${comment.userId?._id}`}
                  className="text-lg font-semibold text-gray-800 hover:underline"
                >
                  {comment.userId?.name || "Unknown User"}
                </Link>
                <span className="text-xs text-gray-500">
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-gray-700">{comment.text}</p>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-600">No comments yet.</p>
      )}
    </section>
  );
};

export default CommentsSection;
