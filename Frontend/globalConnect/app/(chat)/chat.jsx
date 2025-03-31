import React, { useState, useEffect, useRef } from "react";
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
  BackHandler,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenWrapper from "../../components/ScreenWrapper";
import BottomNav from "../../components/bottomNav";
import config from "../../constants/config";
import { userAuth } from "../../contexts/AuthContext";
import { useFetchConversation, sendMessage, getFullMediaUrl } from "../../services/messageSerive";
import socket, { cleanup, connectSocket, setMessageHandler } from "../../socketManager/socket";
import { useExpoRouter } from "expo-router/build/global-state/router-store";

const Chat = () => {
  const { userId, name } = useLocalSearchParams();
  const { authToken, user } = userAuth();
  const { conversation, loading: fetchLoading, fetchInitialConversation } = useFetchConversation(userId);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const router = useRouter();
  const scrollViewRef = useRef(null);

  // When conversation updates, update messages
  useEffect(() => {
    if (conversation) {
      setMessages(conversation);
    }
  }, [conversation]);
  useEffect(() => {
    const backAction = () => {
      // Replace the current screen with '/home'
      router.replace("/home");
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => backHandler.remove();
  }, [router]);
  // Setup socket and incoming message handling
  useEffect(() => {
    if (!user?.user?.id || !userId) return;
    connectSocket(user.user.id)
      .then(() => console.log("Socket connected"))
      .catch((error) => console.error("Socket connection error:", error));
    // Inside your useEffect for real-time message handling
    const handleReceiveMessage = (data) => {
      if (
        (data.sender._id === userId && data.receiver._id === user.user.id) ||
        (data.sender._id === user.user.id && data.receiver._id === userId)
      ) {
        setMessages((prev) => {
          // Check if message already exists using its unique _id
          if (prev.some((msg) => msg._id === data._id)) {
            return prev;
          }
          return [...prev, data];
        });
        scrollToBottom();
      }
    };
    setMessageHandler(handleReceiveMessage);
    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("connect", () => socket.emit("join", user.user.id));
    socket.on("disconnect", () =>
      setTimeout(() => connectSocket(user.user.id), 3000)
    );
    return () => cleanup();
  }, [userId, user?.user?.id]);

  // Long press handler to save an image
  const handleLongPressImage = async (imageUrl) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please grant permission to save images");
        return;
      }
      Alert.alert(
        "Image Options",
        "Do you want to save this image to your device?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Save",
            onPress: async () => {
              try {
                const filename = imageUrl.split("/").pop();
                const localUri = FileSystem.documentDirectory + filename;
                const { uri } = await FileSystem.downloadAsync(imageUrl, localUri);
                const asset = await MediaLibrary.createAssetAsync(uri);
                await MediaLibrary.createAlbumAsync("GlobalConnect", asset, false);
                Alert.alert("Success", "Image saved successfully!");
              } catch (error) {
                console.error("Error saving image:", error);
                Alert.alert("Error", "Failed to save image");
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error handling long press:", error);
      Alert.alert("Error", "Failed to process image");
    }
  };

  const handleSend = async () => {
    if (!messageText.trim() && !selectedImage) return;
    setSending(true);
    try {
      const messageData = {
        receiverId: userId,
        messageType: selectedImage ? "image" : "text",
        content: messageText.trim(),
        media: selectedImage,
      };
      const response = await sendMessage(messageData, authToken);
      if (response.success) {
        // Instead of appending the temporary message, refetch the conversation.
        await fetchInitialConversation();
        setMessageText("");
        setSelectedImage(null);
        scrollToBottom();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      Alert.alert("Error", "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handlePickImage = async () => {
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!pickerResult.canceled) {
      setSelectedImage(pickerResult.assets[0].uri);
    }
  };

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 100000, animated: true });
    }
  };

  const renderMessage = (msg, index) => {
    const isSender = msg.sender._id === user?.user?.id;
    switch (msg.messageType) {
      case "text":
        return (
          <View
            key={msg._id + index}
            style={[styles.messageContainer, isSender ? styles.sender : styles.receiver]}
          >
            <Text style={isSender ? styles.senderText : styles.receiverText}>
              {msg.content}
            </Text>
          </View>
        );
      case "image":
        const imageUrl = msg.media && msg.media.length > 0 ? getFullMediaUrl(msg.media) : null;
        return (
          <View
            key={msg._id + index}
            style={[styles.messageContainer, isSender ? styles.sender : styles.receiver]}
          >
            {imageUrl && (
              <TouchableOpacity
                onLongPress={() => handleLongPressImage(imageUrl)}
                onPress={() => setIsPreviewModalVisible(true)}
              >
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.messageImage}
                  resizeMode="cover"
                  onError={() => {
                    // Suppress error silently.
                  }}
                />
              </TouchableOpacity>
            )}
            {msg.content && (
              <Text style={isSender ? styles.senderText : styles.receiverText}>
                {msg.content}
              </Text>
            )}
          </View>
        );
      default:
        return null;
    }
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
        onContentSizeChange={scrollToBottom}
      >
        {fetchLoading ? (
          <ActivityIndicator size="large" color="#007bff" />
        ) : (
          messages.map((msg, index) => renderMessage(msg, index))
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
  sharedPostContainer: {
    padding: 15,
    width: 250,
  },
  sharedPostLabel: {
    fontWeight: "bold",
    marginBottom: 5,
    fontSize: 14,
  },
  sharedPostImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginVertical: 8,
  },
  sharedPostContent: {
    fontSize: 14,
    marginVertical: 5,
  },
  sharedPostAuthor: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 5,
  },
});

export default Chat;