import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import config from "../../config";
export default function ChatPage() {

  const ip = config.API_IP;  
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const { userId, name } = useLocalSearchParams();

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const authToken = await AsyncStorage.getItem("authToken");
        if (!authToken || !userId) return;

        const response = await axios.post(
          `http://${ip}:3000/api/get-message`,
          { senderId: userId },
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data.success) {
          setMessages(response.data.data);
        } else {
          console.error("Error fetching messages:", response.data.message);
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      }
    };

    fetchMessages();
  }, [userId]);

  const handleSend = async () => {
    if (message.trim()) {
      try {
        const authToken = await AsyncStorage.getItem("authToken");
        if (!authToken || !userId) return;

        const response = await axios.post(
          `http://${ip}:3000/api/message`,
          {
            receiverId: userId, // Assuming receiverId is the same as userId for simplicity
            content: message,
          },
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data.success) {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              _id: response.data.data._id,
              sender: { name: "You" },
              content: response.data.data.content,
              timestamp: response.data.data.timestamp,
            },
          ]);
          setMessage("");
        } else {
          console.error("Error sending message:", response.data.message);
        }
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with username and icons */}
      <View style={styles.header}>
        <Text style={styles.username}>{name}</Text>
        <View style={styles.headerIcons}>
          <Ionicons name="videocam" size={24} color="#007bff" />
          <Ionicons
            name="ellipsis-horizontal"
            size={24}
            color="#007bff"
            style={{ marginLeft: 15 }}
          />
        </View>
      </View>

      {/* Messages Section */}
      <ScrollView contentContainerStyle={styles.messagesContainer}>
        {messages.map((msg) => (
          <View
            key={msg._id}
            style={[
              styles.messageContainer,
              msg.sender.name === "You" ? styles.sender : styles.receiver,
            ]}
          >
            <Text
              style={[
                styles.message,
                msg.sender.name === "You"
                  ? styles.senderMessage
                  : styles.receiverMessage,
              ]}
            >
              {msg.content}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Input Section */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          value={message}
          onChangeText={setMessage}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    backgroundColor: "#f9f9f9",
  },
  username: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  messagesContainer: {
    flexGrow: 1,
    padding: 10,
    justifyContent: "flex-end",
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
  senderMessage: {
    color: "#fff",
    fontSize: 16,
  },
  receiverMessage: {
    color: "#333",
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    backgroundColor: "#f9f9f9",
  },
  textInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 20,
    paddingLeft: 10,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
