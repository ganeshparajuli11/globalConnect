import axios from "axios";
import { useCallback, useState, useEffect } from "react";
import config from "../constants/config";
import { userAuth } from "../contexts/AuthContext";

const ip = config.API_IP;

// Base URLs for comment endpoints
const GET_COMMENTS_API_URL = `http://${ip}:3000/api/comment/all`;
const CREATE_COMMENT_API_URL = `http://${ip}:3000/api/comment/create`;
const EDIT_COMMENT_API_URL = `http://${ip}:3000/api/comment/edit`;
const DELETE_COMMENT_API_URL = `http://${ip}:3000/api/comment/delete`;

/**
 * Hook: useFetchComments
 * Fetches all comments for a specific post.
 * @param {string} postId - The ID of the post.
 */
export const useFetchComments = (postId) => {
  const { authToken } = userAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const response = await axios.get(`${GET_COMMENTS_API_URL}/${postId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      // Assuming the response returns an object with a "data" property containing comments
      setComments(response.data.data || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  }, [postId, authToken]);

  useEffect(() => {
    fetchComments();
  }, [postId, fetchComments]);

  return { comments, fetchComments, loading };
};

/**
 * createComment
 * Creates a new comment for a given post.
 * @param {string} postId - The ID of the post.
 * @param {string} text - The comment text.
 * @param {string} authToken - The authorization token.
 * @returns {Promise<Object>} - The response data.
 */
export const createComment = async (postId, text, authToken) => {
  try {
    const response = await axios.post(
      CREATE_COMMENT_API_URL,
      { postId, text },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating comment:", error);
    throw error;
  }
};

/**
 * editComment
 * Edits an existing comment.
 * @param {string} commentId - The ID of the comment to edit.
 * @param {string} text - The updated comment text.
 * @param {string} authToken - The authorization token.
 * @returns {Promise<Object>} - The response data.
 */
export const editComment = async (commentId, text, authToken) => {
  try {
    const response = await axios.put(
      `${EDIT_COMMENT_API_URL}/${commentId}`,
      { text },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return response.data;
  } catch (error) {
    console.error("Error editing comment:", error);
    throw error;
  }
};

/**
 * deleteComment
 * Deletes a comment.
 * @param {string} commentId - The ID of the comment to delete.
 * @param {string} authToken - The authorization token.
 * @returns {Promise<Object>} - The response data.
 */
export const deleteComment = async (commentId, authToken) => {
  try {
    const response = await axios.delete(`${DELETE_COMMENT_API_URL}/${commentId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
};
