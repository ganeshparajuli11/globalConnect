import React from "react";

const ProfilePostCard = ({ post, user }) => {
  const getProfileUrl = (path) => {
    if (!path) return "https://via.placeholder.com/150";
    if (path.startsWith("http") || path.startsWith("//")) return path;
    return `http://localhost:3000/${path}`;
  };

  const getMediaUrl = (path) => {
    if (path.startsWith("http") || path.startsWith("//")) return path;
    return `http://localhost:3000${path}`;
  };

  const renderHTML = (htmlString) => {
    return <div dangerouslySetInnerHTML={{ __html: htmlString }} />;
  };

  // Determine grid class based on number of images
  const getGridClass = (count) => {
    if (count === 1) return "flex justify-center"; // Single image centered
    if (count === 2) return "grid grid-cols-2 gap-2";
    return "grid grid-cols-3 gap-2";
  };

  return (
    <div className="bg-white shadow-lg rounded-2xl p-5 mb-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <img
            src={getProfileUrl(user.profile_image)}
            alt="User Profile"
            className="w-12 h-12 rounded-full border-2 border-gray-300 shadow-sm"
          />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
            <p className="text-xs text-gray-500">
              {new Date(post.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="flex space-x-3">
          <button className="text-red-500 hover:text-red-700 transition">🗑 Delete</button>
          <button className="text-yellow-500 hover:text-yellow-700 transition">🚩 Flag</button>
          <button className="text-green-500 hover:text-green-700 transition">✅ Approve</button>
        </div>
      </div>

      {/* Post Content */}
      <div className="mb-4 text-gray-800 text-lg leading-relaxed">
        {renderHTML(post.text_content)}
      </div>

      {/* Media Section */}
      {post.media && post.media.length > 0 && (
        <div className={getGridClass(post.media.length)}>
          {post.media.map((mediaItem) =>
            mediaItem.media_type.startsWith("image") ? (
              <img
                key={mediaItem._id}
                src={getMediaUrl(mediaItem.media_path)}
                alt="Media"
                className={`rounded-lg object-cover shadow-sm hover:scale-105 transition-transform ${
                  post.media.length === 1 ? "w-auto h-auto max-w-[500px] max-h-[400px]" : "w-full h-56"
                }`}
              />
            ) : (
              <video
                key={mediaItem._id}
                controls
                className="w-full h-56 rounded-lg object-cover shadow-md"
              >
                <source src={getMediaUrl(mediaItem.media_path)} type={mediaItem.media_type} />
                Your browser does not support video.
              </video>
            )
          )}
        </div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap mt-4">
          {post.tags.map((tag, index) => (
            <span
              key={index}
              className="text-xs bg-gray-100 text-gray-800 rounded-full px-3 py-1 mr-2 mb-2 shadow-sm"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfilePostCard;
