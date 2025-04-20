import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import config from "../constants/config";
import { userAuth } from "../contexts/AuthContext";

const ip = config.API_IP;
const API_URL = `http://${ip}:3000/api/post/all`;
const DESTINATION_POST_URL = `http://${ip}:3000/api/post/toggle-destination`;
const DESTINATION_STATE_URL = `http://${ip}:3000/api/post/destination-post-state`;

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
  media:
    post.media?.length > 0
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
    async (pageNumber = 1, isFirstLoad = false, searchQuery = "") => {
        if (loading || (!hasMore && !isFirstLoad)) return;

        setLoading(true);
        setError(null);

        try {
            let url = `${API_URL}?page=${pageNumber}&limit=5`;
            if (searchQuery) {
                url += `&search=${encodeURIComponent(searchQuery)}`;
            }
            if (selectedCategory && selectedCategory !== "All") {
                url += `&category=${
                    Array.isArray(selectedCategory)
                        ? selectedCategory.join(",")
                        : selectedCategory
                }`;
            }

            console.log("Fetching posts with URL:", url);

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            // Format the posts returned from the API.
            const newPosts = response.data.data.map(formatPostData);

            setPosts((prev) => {
                const combinedPosts = isFirstLoad ? newPosts : [...prev, ...newPosts];
                // Remove duplicates based on post id
                return combinedPosts.filter(
                    (post, index, self) =>
                        index === self.findIndex((p) => p.id === post.id)
                );
            });

            setPage(pageNumber + 1);
            setHasMore(newPosts.length > 0);
        } catch (error) {
            const backendMessage = error.response?.data?.message;
            // Suppress logging for the "destination not set" error
            if (backendMessage === "Please set your destination country first") {
                setError(backendMessage);
                setHasMore(false);
                return;
            }
            console.error("Error fetching posts:", error);
            setError(backendMessage || "Failed to fetch posts");
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

  return { posts, fetchPosts, loading, hasMore, page, resetPosts, error };
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
        const url = `${API_URL}?search=${encodeURIComponent(
          query
        )}&page=${pageNumber}&limit=10`;
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
    },
  };
};

export const useToggleDestinationPost = () => {
  const { authToken } = userAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [destinationEnabled, setDestinationEnabled] = useState(false);

  const fetchDestinationState = async () => {
    try {
      const response = await axios.get(DESTINATION_STATE_URL, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setDestinationEnabled(response.data.is_destinationPost);
      return response.data.is_destinationPost;
    } catch (error) {
      console.error("Error fetching destination state:", error);
      return false;
    }
  };

  const toggleDestination = async () => {
    setLoading(true);
    setError(null);
  
    try {
      const response = await axios.put(
        DESTINATION_POST_URL,
        {},
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
  
      setDestinationEnabled(response.data.is_destinationPost);
      return {
        success: true,
        isEnabled: response.data.is_destinationPost,
        message: response.data.message,
      };
    } catch (error) {
      const backendMessage =
        error.response?.data?.message ||
        "Failed to toggle destination post";
      console.error("Error toggling destination post:", backendMessage);
      setError(backendMessage);
      return {
        success: false,
        error: backendMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDestinationState();
  }, []);

  return { 
    toggleDestination, 
    fetchDestinationState,
    destinationEnabled,
    loading, 
    error 
  };
};