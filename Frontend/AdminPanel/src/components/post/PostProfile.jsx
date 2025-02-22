import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { reactLocalStorage } from "reactjs-localstorage";
import Sidebar from "../sidebar/Sidebar";
import { ToastContainer } from "react-toastify";
import CommentsSection from "../../assets/helperComponents/CommentsSection";
import PostCard from "../../assets/helperComponents/PostCard";


const PostProfile = () => {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = reactLocalStorage.get("access_token");
    if (token) setAccessToken(token);
  }, []);

  useEffect(() => {
    if (accessToken) {
      setLoading(true);
      axios
        .get(`http://localhost:3000/api/post/${postId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((response) => {
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

  useEffect(() => {
    if (accessToken) {
      setLoadingComments(true);
      axios
        .get(`http://localhost:3000/api/comment/all/${postId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((response) => {
          setComments(response.data.data);
          setLoadingComments(false);
        })
        .catch((err) => {
          console.error("Error fetching comments:", err);
          setLoadingComments(false);
        });
    }
  }, [accessToken, postId]);

 // Helper: Resolve media URL for post media (ensure slash after domain)
 const getMediaUrl = (path) => {
  if (path.startsWith("http") || path.startsWith("//")) {
    return path;
  } else {
    return `http://localhost:3000${path}`;
  }
};

// Helper: Resolve URL for comment profile images (can be same as above)
const getCommentUrl = (path) => {
  if (path.startsWith("http") || path.startsWith("//")) {
    return path;
  } else {
    return `http://localhost:3000/${path}`;
  }
};


  if (loading)
    return <div className="p-6">Loading post details...</div>;
  if (error)
    return <div className="p-6 text-red-500">{error}</div>;
  if (!post)
    return <div className="p-6">No post found.</div>;

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <ToastContainer />
      <aside className="w-64 bg-white shadow-md">
        <Sidebar />
      </aside>
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <PostCard post={post} accessToken={accessToken} getMediaUrl={getMediaUrl} />
          <CommentsSection comments={comments} loading={loadingComments} getMediaUrl={getCommentUrl} />
        </div>
      </main>
    </div>
  );
};

export default PostProfile;
