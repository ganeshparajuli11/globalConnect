import axios from "axios";
import { useState, useCallback, useEffect } from "react";
import config from "../constants/config";
import { userAuth } from "../contexts/AuthContext";

const ip = config.API_IP;

// API Endpoints
const ALL_MESSAGE_API_URL = `http://${ip}:3000/api/all-message/`;
const SEND_MESSAGE_API_URL = `http://${ip}:3000/api/message`;
// Renamed to fix the spelling of "receive"
const RECEIVE_MESSAGE_API_URL = `http://${ip}:3000/api/get-message`;

/**
 * Hook to fetch the chat list.
 */
export const useFetchChatList = () => {
  const { authToken } = userAuth();
  const [chatList, setChatList] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchChatList = useCallback(async () => {
    setLoading(true);
    try {
      console.log("Fetching chat list from:", ALL_MESSAGE_API_URL);
      const response = await axios.get(ALL_MESSAGE_API_URL, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      console.log("Chat list response:", response.data);
      if (response.data.success) {
        setChatList(response.data.data);
      } else {
        console.error(
          "Error fetching chat list: API responded with success=false",
          response.data
        );
      }
    } catch (error) {
      console.error("Error in fetchChatList:");
      if (error.response) {
        console.error(
          "Server responded with status",
          error.response.status,
          "and data:",
          error.response.data
        );
      } else if (error.request) {
        console.error("No response received:", error.request);
      } else {
        console.error("Error message:", error.message);
      }
      console.error("Full error details:", error.toJSON ? error.toJSON() : error);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchChatList();
  }, [fetchChatList]);

  return { chatList, loading, fetchChatList };
};

/**
 * Function to send a message.
 * Logs detailed error information if sending fails.
 */
export const sendMessage = async (messageData, authToken) => {
  try {
    const headers = { Authorization: `Bearer ${authToken}` };
    // If messageData is FormData (for image uploads), set the content type accordingly
    if (messageData instanceof FormData) {
      headers["Content-Type"] = "multipart/form-data";
      // Log FormData entries for debugging:
      console.log("FormData entries:");
      for (let [key, value] of messageData.entries()) {
        console.log(key, value);
      }
    }
    console.log("Sending message to:", SEND_MESSAGE_API_URL);
    console.log("Message data:", messageData);
    const response = await axios.post(SEND_MESSAGE_API_URL, messageData, { headers });
    console.log("Send message response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error sending message:");
    if (error.response) {
      console.error("Server responded with status", error.response.status);
      console.error("Response headers:", error.response.headers);
      console.error("Response data:", error.response.data);
    } else if (error.request) {
      console.error("No response received. Request details:", error.request);
    } else {
      console.error("Error message:", error.message);
    }
    console.error("Full error details:", error.toJSON ? error.toJSON() : error);
    throw error;
  }
};

/**
 * Hook to fetch the conversation with a specific sender.
 * Logs additional error details on failure.
 */
export const useFetchConversation = (senderId) => {
  const { authToken } = userAuth();
  console.log("Using token in conversation fetch:", authToken);
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchConversation = useCallback(async () => {
    if (!senderId) return;
    setLoading(true);
    try {
      console.log(
        "Fetching conversation from:",
        RECEIVE_MESSAGE_API_URL,
        "with senderId:",
        senderId
      );
      const response = await axios.post(
        RECEIVE_MESSAGE_API_URL,
        { senderId },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      console.log("Conversation response:", response.data);
      if (response.data.success) {
        // Transform messages to include populated post data
        const transformedMessages = response.data.data.map(message => {
          if (message.messageType === "post" && message.post) {
            return {
              ...message,
              post: {
                _id: message.post._id,
                text_content: message.post.text_content,
                media: message.post.media,
                author: message.post.author,
                createdAt: message.post.createdAt
              }
            };
          }
          return message;
        });
        setConversation(transformedMessages);
      } else {
        console.error(
          "Error fetching conversation: API responded with success=false",
          response.data
        );
      }
    } catch (error) {
      console.error("Error fetching conversation:");
      if (error.response) {
        console.error(
          "Server responded with status",
          error.response.status,
          "and data:",
          error.response.data
        );
      } else if (error.request) {
        console.error("No response received:", error.request);
      } else {
        console.error("Error message:", error.message);
      }
      console.error("Full error details:", error.toJSON ? error.toJSON() : error);
    } finally {
      setLoading(false);
    }
  }, [authToken, senderId]);

  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  return { conversation, loading, fetchConversation };
};

/**
 * Helper to build a full media URL from a relative path.
 */
export const getFullMediaUrl = (mediaPath) => {
  if (!mediaPath) return "";
  // Remove any leading slashes if needed and build the full URL
  const normalizedPath = mediaPath.startsWith("/") ? mediaPath.slice(1) : mediaPath;
  return `http://${config.API_IP}:3000/${normalizedPath}`;
};
