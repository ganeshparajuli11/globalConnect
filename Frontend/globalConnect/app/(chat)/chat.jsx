import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { Ionicons } from "@expo/vector-icons";

import ScreenWrapper from "../../components/ScreenWrapper";
import BottomNav from "../../components/bottomNav";
import config from "../../constants/config";
import { userAuth } from "../../contexts/AuthContext";
import { useFetchConversation, sendMessage, getFullMediaUrl } from "../../services/messageSerive";
import socket from "../../socketManager/socket";

const Chat = () => {
  const ip = config.API_IP;
  // Extract conversation partner id and name from route params
  const { userId, name } = useLocalSearchParams();
  const { authToken, user } = userAuth();
  const { conversation, loading, fetchConversation } = useFetchConversation(userId);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);

  // Reference for the ScrollView to auto-scroll
  const scrollViewRef = useRef(null);

  // Socket listener for incoming messages
  useEffect(() => {
    const handleReceiveMessage = (data) => {
      if (data.senderId === userId || data.receiverId === user?._id) {
        fetchConversation();
        setTimeout(() => {
          scrollToBottom();
        }, 200);
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);
    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [userId, user, fetchConversation]);

  // Function to send a text-only message
  const handleSendText = async () => {
    if (!messageText.trim()) return;
    try {
      setSending(true);
      const messageData = {
        receiverId: userId,
        messageType: "text",
        content: messageText,
      };
      const response = await sendMessage(messageData, authToken);
      if (response.success) {
        socket.emit("sendMessage", {
          senderId: user._id,
          receiverId: userId,
          content: messageText,
          messageType: "text",
        });
        await fetchConversation();
        setMessageText("");
        setTimeout(() => {
          scrollToBottom();
        }, 200);
      } else {
        console.error("Error sending message:", response.message);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  // Function to send an image message (with optional caption)
  const handleSendImage = async () => {
    if (!selectedImage) return;
    try {
      setSending(true);
      const formData = new FormData();
      formData.append("receiverId", userId);
      formData.append("messageType", "image");
      if (messageText.trim()) {
        formData.append("content", messageText);
      }
      const uriParts = selectedImage.split("/");
      const fileName = uriParts[uriParts.length - 1];
      const fileTypeMatch = /\.(\w+)$/.exec(fileName);
      const fileType = fileTypeMatch ? `image/${fileTypeMatch[1]}` : "image";
      formData.append("media", {
        uri: selectedImage,
        name: fileName,
        type: fileType,
      });
      const response = await sendMessage(formData, authToken);
      if (response.success) {
        socket.emit("sendMessage", {
          senderId: user._id,
          receiverId: userId,
          messageType: "image",
          localUri: selectedImage,
        });
        await fetchConversation();
        setSelectedImage(null);
        setMessageText("");
        setTimeout(() => {
          scrollToBottom();
        }, 200);
      } else {
        console.error("Error sending image:", response.message);
      }
    } catch (error) {
      console.error("Failed to send image:", error);
    } finally {
      setSending(false);
    }
  };

  // Unified send function
  const handleSend = async () => {
    if (selectedImage) {
      await handleSendImage();
    } else {
      await handleSendText();
    }
  };

  // Launch image picker
  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access media library is required!");
      return;
    }
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
      setSelectedImage(pickerResult.assets[0].uri);
    }
  };

  // Helper to build full URL for profile images (if needed)
  const getProfilePicUrl = (avatar) => {
    if (!avatar) return "https://via.placeholder.com/100";
    return avatar.startsWith("http") ? avatar : `http://${ip}:3000/${avatar}`;
  };

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 100000, animated: true });
    }
  };

  // Handle long press on image to save it
  const handleLongPressImage = async (imageUri) => {
    // Request media library permission if not already granted
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow media library permissions to save images.");
      return;
    }
    Alert.alert(
      "Save Image",
      "Do you want to save this image to your device?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save",
          onPress: async () => {
            try {
              await MediaLibrary.saveToLibraryAsync(imageUri);
              Alert.alert("Success", "Image saved to your library!");
            } catch (error) {
              console.error("Error saving image:", error);
              Alert.alert("Error", "Failed to save image.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{name}</Text>
        <View style={styles.headerIcons}>
          <Ionicons name="videocam" size={24} color="#007bff" />
          <Ionicons name="ellipsis-horizontal" size={24} color="#007bff" style={{ marginLeft: 15 }} />
        </View>
      </View>

      {/* Conversation Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={{ padding: 10, flexGrow: 1 }}
        onContentSizeChange={() => scrollToBottom()}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#007bff" />
        ) : (
          conversation.map((msg) => {
            const isSender = msg.sender.name === "You";
            if (msg.messageType === "text") {
              return (
                <View
                  key={msg._id}
                  style={[styles.messageContainer, isSender ? styles.sender : styles.receiver]}
                >
                  <Text style={isSender ? styles.senderText : styles.receiverText}>
                    {msg.content}
                  </Text>
                </View>
              );
            } else if (msg.messageType === "image") {
              // Build the full image URL from the backend "image" field
              const imageUrl = msg.image ? getFullMediaUrl(msg.image) : null;
              return (
                <View
                  key={msg._id}
                  style={[styles.messageContainer, isSender ? styles.sender : styles.receiver]}
                >
                  {imageUrl && (
                    <TouchableOpacity onLongPress={() => handleLongPressImage(imageUrl)}>
                      <Image source={{ uri: imageUrl }} style={styles.messageImage} />
                    </TouchableOpacity>
                  )}
                  {msg.content ? (
                    <Text style={isSender ? styles.senderText : styles.receiverText}>
                      {msg.content}
                    </Text>
                  ) : null}
                </View>
              );
            }
            return null;
          })
        )}
      </ScrollView>

      {/* Image Preview Section */}
      {selectedImage && (
        <>
          <View style={styles.previewContainer}>
            <TouchableOpacity onPress={() => setIsPreviewModalVisible(true)}>
              <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedImage(null)} style={styles.removeImageButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <Modal visible={isPreviewModalVisible} transparent={true}>
            <View style={styles.modalContainer}>
              <Image source={{ uri: selectedImage }} style={styles.fullScreenImage} resizeMode="contain" />
              <TouchableOpacity onPress={() => setIsPreviewModalVisible(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={30} color="#fff" />
              </TouchableOpacity>
            </View>
          </Modal>
        </>
      )}

      {/* Input Section */}
      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={handlePickImage} style={styles.imageButton}>
          <Ionicons name="images" size={24} color="#007bff" />
        </TouchableOpacity>
        <TextInput
          style={styles.textInput}
          placeholder="Type your message..."
          placeholderTextColor="#777"
          value={messageText}
          onChangeText={setMessageText}
        />
        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
          {sending ? <ActivityIndicator color="#fff" /> : <Ionicons name="send" size={20} color="#fff" />}
        </TouchableOpacity>
      </View>
      <BottomNav />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#f9f9f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  messageContainer: {
    marginVertical: 5,
    maxWidth: "75%",
    borderRadius: 20,
    padding: 10,
  },
  sender: {
    alignSelf: "flex-end",
    backgroundColor: "#007bff",
  },
  receiver: {
    alignSelf: "flex-start",
    backgroundColor: "#f1f1f1",
  },
  senderText: {
    color: "#fff",
    fontSize: 16,
  },
  receiverText: {
    color: "#333",
    fontSize: 16,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 10,
    marginBottom: 5,
  },
  previewContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
    backgroundColor: "#eaeaea",
    borderRadius: 10,
    marginHorizontal: 10,
    marginBottom: 5,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  removeImageButton: {
    marginLeft: 10,
    backgroundColor: "#ff3333",
    borderRadius: 20,
    padding: 5,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#f9f9f9",
    alignItems: "center",
  },
  imageButton: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    color: "#333",
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: "100%",
    height: "80%",
  },
  modalCloseButton: {
    position: "absolute",
    top: 40,
    right: 20,
  },
});

export default Chat;
