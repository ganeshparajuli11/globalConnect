import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { reactLocalStorage } from "reactjs-localstorage";
import Sidebar from "../sidebar/Sidebar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CommentsSection from "../../assets/helperComponents/CommentsSection";
import {
  Calendar,
  Clock,
  Eye,
  MessageCircle,
  Share2,
  Heart,
  AlertTriangle,
  User,
  Tag,
  FileText,
  Image,
  Shield,
} from "lucide-react";
import DOMPurify from "dompurify";
import PostActionModal from "../../assets/postHelper/PostActionModal";

const sanitizeHtml = (html) => {
  return {
    __html: DOMPurify.sanitize(html),
  };
};

const PostProfile = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status & action states
  const [currentStatus, setCurrentStatus] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  // Retrieve access token from local storage
  useEffect(() => {
    const token = reactLocalStorage.get("access_token");
    if (token) setAccessToken(token);
  }, []);

  // Define fetchPost as a useCallback so that it can be reused and have a stable reference.
  const fetchPost = useCallback(() => {
    if (accessToken) {
      setLoading(true);
      axios
        .get(`http://localhost:3000/api/post/${postId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((response) => {
          const postData = response.data.data;
          setPost(postData);
          setCurrentStatus(postData.status || "Active");
          // If comments are returned as full objects, use them directly.
          if (
            postData.comments &&
            Array.isArray(postData.comments) &&
            postData.comments.length > 0 &&
            typeof postData.comments[0] === "object"
          ) {
            setComments(postData.comments);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching post details:", err);
          setError("Error fetching post details");
          setLoading(false);
        });
    }
  }, [accessToken, postId]);

  // Fetch the post details on mount and when accessToken or postId changes
  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  // If the post's comments are not full objects, fetch them separately.
  useEffect(() => {
    if (
      accessToken &&
      post &&
      (!post.comments ||
        (post.comments &&
          post.comments.length > 0 &&
          typeof post.comments[0] !== "object"))
    ) {
      axios
        .get(`http://localhost:3000/api/comment/all/${postId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((response) => {
          setComments(response.data.data);
        })
        .catch((err) => {
          console.error("Error fetching comments:", err);
        });
    }
  }, [accessToken, post, postId]);

  // Helper functions (getMediaUrl, getCommentUrl, formatDate, getStatusColor) remain unchanged

  const getMediaUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("//")) {
      return path;
    }
    return `http://localhost:3000${path}`;
  };

  const getCommentUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("//")) {
      return path;
    }
    return `http://localhost:3000/${path}`;
  };

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusColor = (status) => {
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
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading)
    return (
      <div className="flex min-h-screen bg-gray-50 font-sans">
        <aside className="w-64 bg-white shadow-md">
          <Sidebar />
        </aside>
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-blue-200 mb-4"></div>
            <div className="h-4 bg-blue-200 rounded w-48 mb-2"></div>
            <div className="h-3 bg-blue-100 rounded w-32"></div>
            <p className="mt-4 text-gray-600">Loading post details...</p>
          </div>
        </main>
      </div>
    );

  if (error)
    return (
      <div className="flex min-h-screen bg-gray-50 font-sans">
        <aside className="w-64 bg-white shadow-md">
          <Sidebar />
        </aside>
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex flex-col items-center">
            <AlertTriangle size={48} className="text-red-500 mb-4" />
            <h2 className="text-xl font-medium text-red-700 mb-2">
              Error Loading Post
            </h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Go Back
            </button>
          </div>
        </main>
      </div>
    );

  if (!post)
    return (
      <div className="flex min-h-screen bg-gray-50 font-sans">
        <aside className="w-64 bg-white shadow-md">
          <Sidebar />
        </aside>
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 flex flex-col items-center">
            <AlertTriangle size={48} className="text-yellow-500 mb-4" />
            <h2 className="text-xl font-medium text-yellow-700 mb-2">
              Post Not Found
            </h2>
            <p className="text-yellow-600 mb-4">
              The requested post could not be found.
            </p>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
            >
              Go Back
            </button>
          </div>
        </main>
      </div>
    );

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      <ToastContainer position="top-right" autoClose={3000} />
      <aside className="w-64 bg-white shadow-md">
        <Sidebar />
      </aside>
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header with breadcrumbs */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Post Details</h1>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <span>Dashboard</span>
              <span className="mx-2">›</span>
              <span>Posts</span>
              <span className="mx-2">›</span>
              <span className="text-blue-600">Post ID: {postId}</span>
            </div>
          </div>

          {/* Post details card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
            {/* Top section with user info and status */}
            <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden mr-4">
                  {post.user && post.user.profilePicture ? (
                    <img
                      src={getCommentUrl(post.user.profilePicture)}
                      alt={post.user.name || "User"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-500">
                      <User size={24} />
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {post.user ? post.user.name || "Anonymous User" : "Unknown User"}
                  </h2>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock size={14} className="mr-1" />
                    <span>{formatDate(post.createdAt || new Date())}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <div className="relative">
                  <div
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      currentStatus
                    )}`}
                  >
                    <Shield size={14} className="mr-1" />
                    {currentStatus}
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Post ID: <span className="font-mono">{postId}</span>
                </div>
              </div>
            </div>

            {/* Admin Actions */}
            <div className="p-4 flex justify-end">
              <button
                onClick={() => setModalVisible(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Shield className="h-4 w-4 mr-2" />
                Manage Post
              </button>
            </div>

            {/* Post metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-gray-50 border-b border-gray-200">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase">Created At</span>
                <div className="flex items-center mt-1">
                  <Calendar size={16} className="mr-1 text-gray-600" />
                  <span className="text-sm font-medium">{formatDate(post.createdAt || new Date())}</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase">Type</span>
                <div className="flex items-center mt-1">
                  <Tag size={16} className="mr-1 text-gray-600" />
                  <span className="text-sm font-medium">{post.category?.name || "N/A"}</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase">Visibility</span>
                <div className="flex items-center mt-1">
                  <Eye size={16} className="mr-1 text-gray-600" />
                  <span className="text-sm font-medium">{post.visibility || "Public"}</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase">Last Updated</span>
                <div className="flex items-center mt-1">
                  <Clock size={16} className="mr-1 text-gray-600" />
                  <span className="text-sm font-medium">{formatDate(post.updatedAt || post.createdAt || new Date())}</span>
                </div>
              </div>
            </div>

            {/* Post content */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="flex items-center text-lg font-medium text-gray-800 mb-3">
                <FileText size={18} className="mr-2 text-gray-600" />
                Content
              </h3>
              <div
                className="bg-gray-50 rounded-lg p-4 prose max-w-none"
                dangerouslySetInnerHTML={sanitizeHtml(post.content || "No content available")}
              />
            </div>

            {/* Post media */}
            {post.media && post.media.length > 0 && (
              <div className="p-6 border-b border-gray-200">
                <h3 className="flex items-center text-lg font-medium text-gray-800 mb-3">
                  <Image size={18} className="mr-2 text-gray-600" />
                  Media
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.isArray(post.media)
                    ? post.media.map((item, index) => {
                      const mediaPath = typeof item === "object" ? item.url : item;
                      return (
                        <div key={index} className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video">
                          <img
                            src={getMediaUrl(mediaPath)}
                            alt={`Post media ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      );
                    })
                    : (
                      <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video">
                        <img
                          src={getMediaUrl(typeof post.media === "object" ? post.media.url : post.media)}
                          alt="Post media"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Engagement metrics */}
            <div className="p-6 flex flex-wrap gap-6">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mr-2">
                  <Heart size={20} className="text-red-500" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-800">{post.likes || 0}</div>
                  <div className="text-xs text-gray-500">Likes</div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mr-2">
                  <MessageCircle size={20} className="text-blue-500" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-800">
                    {comments.length || post.commentCount || 0}
                  </div>
                  <div className="text-xs text-gray-500">Comments</div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mr-2">
                  <Share2 size={20} className="text-green-500" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-800">{post.shares || 0}</div>
                  <div className="text-xs text-gray-500">Shares</div>
                </div>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-800">Comments</h3>
            </div>
            <CommentsSection comments={comments} getMediaUrl={getCommentUrl} />
          </div>
        </div>
      </main>

      {/* PostActionModal with updated onActionComplete */}
      <PostActionModal
        isVisible={modalVisible}
        setIsVisible={setModalVisible}
        post={post}
        accessToken={accessToken}
        onActionComplete={(actionType) => {
          setModalVisible(false);
          if (actionType === "delete" || actionType === "permanentDelete") {
            navigate("/posts/all");
          } else {
            fetchPost();
          }
        }}
      />
    </div>
  );
};

export default PostProfile;
