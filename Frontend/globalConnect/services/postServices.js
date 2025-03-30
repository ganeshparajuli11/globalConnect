import axios from "axios";
import { useCallback, useState, useEffect } from "react";
import config from "../constants/config";
import { userAuth } from "../contexts/AuthContext";

const ip = config.API_IP;
const API_URL = `http://${ip}:3000/api/post/all`;

// Helper function to format post data
const formatPostData = (post) => ({
  id: post.id,
  user: post.user,
  userImage: post.user?.profile_image
    ? `http://${ip}:3000/${post.user.profile_image}`
    : "https://via.placeholder.com/40",
  type: post.type || "Unknown Category",
  time: post.time,
  content: post.content || "No content available",
  media: post.media?.length > 0
    ? post.media.map((m) => `http://${ip}:3000${m}`)
    : [],
  liked: post.liked || false,
  likeCount: post.likeCount || 0,
  commentCount: post.commentCount || 0,
  shareCount: post.shareCount || 0,
});

export const useFetchPosts = (selectedCategory = "All") => {
  const { authToken } = userAuth();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const fetchPosts = useCallback(
    async (pageNumber = 1, isFirstLoad = false) => {
      if (loading || (!hasMore && !isFirstLoad)) return;

      setLoading(true);
      setError(null);

      try {
        let url = `${API_URL}?page=${pageNumber}&limit=5`;
        if (selectedCategory && selectedCategory !== "All") {
          url += `&category=${Array.isArray(selectedCategory) 
            ? selectedCategory.join(",") 
            : selectedCategory}`;
        }

        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        const newPosts = response.data.data.map(formatPostData);

        setPosts((prev) => {
          const combinedPosts = isFirstLoad ? newPosts : [...prev, ...newPosts];
          return combinedPosts.filter(
            (post, index, self) =>
              index === self.findIndex((p) => p.id === post.id)
          );
        });

        setPage(pageNumber + 1);
        setHasMore(newPosts.length > 0);

      } catch (error) {
        console.error("Error fetching posts:", error);
        setError(error.response?.data?.message || "Failed to fetch posts");
      } finally {
        setLoading(false);
      }
    },
    [authToken, loading, hasMore, selectedCategory]
  );

  const resetPosts = useCallback(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, []);

  // Initial load
  useEffect(() => {
    if (posts.length === 0) {
      fetchPosts(1, true);
    }
  }, []);

  return { 
    posts, 
    fetchPosts, 
    loading, 
    hasMore, 
    page, 
    resetPosts, 
    error 
  };
};

export const useSearchPosts = (searchQuery) => {
  const { authToken } = userAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchSearchPosts = useCallback(
    async (query, pageNumber = 1, isFirstLoad = false) => {
      if (!query.trim() || (loading && !isFirstLoad)) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const url = `${API_URL}?search=${encodeURIComponent(query)}&page=${pageNumber}&limit=10`;
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        const searchResults = response.data.data.map(formatPostData);

        setPosts((prev) => {
          const combinedPosts = isFirstLoad ? searchResults : [...prev, ...searchResults];
          return combinedPosts.filter(
            (post, index, self) =>
              index === self.findIndex((p) => p.id === post.id)
          );
        });

        setPage(pageNumber + 1);
        setHasMore(searchResults.length > 0);

      } catch (error) {
        console.error("Error searching posts:", error);
        setError(error.response?.data?.message || "Failed to search posts");
        setPosts([]);
      } finally {
        setLoading(false);
      }
    },
    [authToken]
  );

  // Reset search when query changes
  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    
    if (searchQuery.trim()) {
      fetchSearchPosts(searchQuery, 1, true);
    }
  }, [searchQuery, fetchSearchPosts]);

  return {
    posts,
    loading,
    error,
    hasMore,
    page,
    fetchSearchPosts,
    resetSearch: () => {
      setPosts([]);
      setPage(1);
      setHasMore(true);
      setError(null);
    }
  };
};