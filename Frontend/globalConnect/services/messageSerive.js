import axios from "axios";
import { useState, useCallback, useEffect } from "react";
import config from "../constants/config";
import { userAuth } from "../contexts/AuthContext";
import { connectSocket, sendSocketMessage, setMessageHandler, disconnectSocket } from "../socketManager/socket";

const ip = config.API_IP;

// API Endpoints
const ALL_MESSAGE_API_URL = `http://${ip}:3000/api/all-message/`;
const RECEIVE_MESSAGE_API_URL = `http://${ip}:3000/api/get-message`;
const SEND_MESSAGE_API_URL = `http://${ip}:3000/api/message`;

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

export const sendMessage = async (messageData, authToken) => {
  try {
    const formData = new FormData();
    
    // Add text content if present
    if (messageData.content) {
      formData.append('content', messageData.content);
    }
    
    // Add image if present
    if (messageData.media) {
      const imageUri = messageData.media;
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image';
      
      formData.append('media', {
        uri: imageUri,
        name: filename,
        type,
      });
    }
    
    formData.append('receiverId', messageData.receiverId);
    formData.append('messageType', messageData.messageType);
    
    const response = await axios.post(SEND_MESSAGE_API_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${authToken}`,
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error sending message:');
    console.error('Error message:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Request details:', error.request);
    }
    console.error('Error config:', error.config);
    console.error('Full error details:', error.toJSON ? error.toJSON() : error);
    throw error;
  }
};

const getProfileImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `http://localhost:3000${imagePath}`;
};

export const getFullMediaUrl = (mediaPath) => {
  if (!mediaPath) return null;
  // If mediaPath is in media array
  if (Array.isArray(mediaPath) && mediaPath.length > 0) {
    return `http://${ip}:3000${mediaPath[0].media_path}`;
  }
  // If mediaPath is a direct path
  if (typeof mediaPath === 'string') {
    return `http://${ip}:3000${mediaPath}`;
  }
  return null;
};

// Save image to device
export const saveImageToDevice = async (imageUrl) => {
  try {
    const filename = imageUrl.split('/').pop();
    const result = await FileSystem.downloadAsync(
      imageUrl,
      FileSystem.documentDirectory + filename
    );
    
    if (result.status === 200) {
      return result.uri;
    }
    throw new Error('Failed to download image');
  } catch (error) {
    console.error('Error saving image:', error);
    throw error;
  }
};

export const useFetchConversation = (senderId) => {
  const { authToken } = userAuth();
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastReadTimestamp, setLastReadTimestamp] = useState(null);

  const fetchInitialConversation = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(RECEIVE_MESSAGE_API_URL, { senderId }, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.data.success) {
        setConversation(response.data.data);
        setLastReadTimestamp(response.data.data[response.data.data.length - 1]?.timestamp);
      } else {
        console.error("Error fetching initial conversation:", response.data);
      }
    } catch (error) {
      console.error("Error fetching initial conversation:", error);
    } finally {
      setLoading(false);
    }
  }, [authToken, senderId]);

  const fetchNewMessages = useCallback(async () => {
    if (!lastReadTimestamp) return;
    try {
      const response = await axios.post(RECEIVE_MESSAGE_API_URL, { senderId, lastReadTimestamp }, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.data.success) {
        setConversation((prevConversation) => [...prevConversation, ...response.data.data]);
        setLastReadTimestamp(response.data.data[response.data.data.length - 1]?.timestamp);
      } else {
        console.error("Error fetching new messages:", response.data);
      }
    } catch (error) {
      console.error("Error fetching new messages:", error);
    }
  }, [authToken, senderId, lastReadTimestamp]);

  useEffect(() => {
    fetchInitialConversation();
  }, [fetchInitialConversation]);

  return { conversation, loading, fetchNewMessages, fetchInitialConversation };
};

