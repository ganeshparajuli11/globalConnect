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

  console.log("testing the token at top", authToken)
  const fetchChatList = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(ALL_MESSAGE_API_URL, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.data.success) {
        setChatList(response.data.data);
      } else {
        console.error(
          "Error fetching chat list: API responded with success=false",
          response.data
        );
      }
    } catch (error) {
      if (error.response) {
        console.error(
          "Error fetching chat list: Server responded with status",
          error.response.status,
          "and data:",
          error.response.data
        );
      } else if (error.request) {
        console.error(
          "Error fetching chat list: No response received",
          error.request
        );
      } else {
        console.error("Error fetching chat list:", error.message);
      }
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchChatList();
  }, [fetchChatList]);

  return { chatList, loading, fetchChatList };
};


export const sendMessage = async (messageData, authToken) => {
  try {
    const headers = { Authorization: `Bearer ${authToken}` };
    // If messageData is FormData (image upload), set the content type accordingly
    if (messageData instanceof FormData) {
      headers["Content-Type"] = "multipart/form-data";
    }
    const response = await axios.post(SEND_MESSAGE_API_URL, messageData, {
      headers,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(
        "Error sending message: Server responded with status",
        error.response.status,
        "and data:",
        error.response.data
      );
    } else if (error.request) {
      console.error("Error sending message: No response received", error.request);
    } else {
      console.error("Error sending message:", error.message);
    }
    throw error;
  }
};


export const useFetchConversation = (senderId) => {
  const { authToken } = userAuth();
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchConversation = useCallback(async () => {
    if (!senderId) return;
    setLoading(true);
    try {
      const response = await axios.post(
        RECEIVE_MESSAGE_API_URL,
        { senderId },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      if (response.data.success) {
        setConversation(response.data.data);
      } else {
        console.error(
          "Error fetching conversation: API responded with success=false",
          response.data
        );
      }
    } catch (error) {
      if (error.response) {
        console.error(
          "Error fetching conversation: Server responded with status",
          error.response.status,
          "and data:",
          error.response.data
        );
      } else if (error.request) {
        console.error(
          "Error fetching conversation: No response received",
          error.request
        );
      } else {
        console.error("Error fetching conversation:", error.message);
      }
    } finally {
      setLoading(false);
    }
  }, [authToken, senderId]);

  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  return { conversation, loading, fetchConversation };
};
