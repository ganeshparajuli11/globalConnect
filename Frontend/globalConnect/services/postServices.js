import axios from "axios";
import { useCallback, useState, useEffect } from "react";
import config from "../constants/config";
import { userAuth } from "../contexts/AuthContext";
import { useRoute } from "@react-navigation/native";

const ip = config.API_IP;
const API_URL = `http://${ip}:3000/api/post/all`;

export const useFetchPosts = (selectedCategory = "All") => {
  const { authToken } = userAuth();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = useCallback(
    async (pageNumber = 1, isFirstLoad = false) => {
      if (loading || !hasMore) return;
      setLoading(true);
      try {
        let url = `${API_URL}?page=${pageNumber}&limit=5`;
        if (selectedCategory && selectedCategory !== "All") {
          // If selectedCategory is an array, join it into a comma-separated string
          if (Array.isArray(selectedCategory)) {
            url += `&category=${selectedCategory.join(",")}`;
          } else {
            url += `&category=${selectedCategory}`;
          }
        }
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const newPosts = response.data.data.map((post) => ({
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
        }));

        setPosts((prev) => {
          const combinedPosts = isFirstLoad ? newPosts : [...prev, ...newPosts];
          const uniquePosts = combinedPosts.filter(
            (post, index, self) =>
              index === self.findIndex((p) => p.id === post.id)
          );
          return uniquePosts;
        });
        setPage(pageNumber + 1);
        if (newPosts.length === 0) {
          setHasMore(false);
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    },
    [authToken, loading, hasMore, selectedCategory]
  );

  // Reset function to clear the posts and reset pagination.
  const resetPosts = useCallback(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
  }, []);

  useEffect(() => {
    if (posts.length === 0) {
      fetchPosts(1, true);
    }
  }, []);

  return { posts, fetchPosts, loading, hasMore, page, resetPosts };
};
