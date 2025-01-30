import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router"; // Assuming you're using Expo Router
import config from "../config";
export default function Message() {
  const ip = config.API_IP;
  console.log("ip: " + ip);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // Initialize the router

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        // Retrieve the auth token from AsyncStorage
        const token = await AsyncStorage.getItem("authToken");
        console.log("this is a token", token);
        if (!token) {
          console.log("No auth token found");
          return;
        }

        // Send the token in the Authorization header
        const response = await axios.get(
          `http://${ip}:3000/api/all-message`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          // Map the API response to match the component's data structure
          console.log("Messages: ", response.data.data);
          const formattedMessages = response.data.data.map((item) => ({
            id: item.userId,
            name: item.name,
            message: item.lastMessage,
            avatar: item.avatar,
          }));
          setMessages(formattedMessages);
        } else {
          console.error("Failed to fetch messages: ", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching messages: ", error.message || error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  const renderMessage = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        router.replace(
          `/ChatPage?userId=${encodeURIComponent(
            item.id
          )}&name=${encodeURIComponent(item.name)}`
        );
      }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        padding: 16,
        borderRadius: 10,
        marginBottom: 16,
      }}
    >
      <Image
        source={{ uri: item.avatar }}
        style={{ width: 48, height: 48, borderRadius: 24 }}
      />
      <View style={{ marginLeft: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>{item.name}</Text>
        <Text style={{ color: "gray" }}>{item.message}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#d1d5db",
        }}
      >
        <TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: "bold" }}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>Message</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={{ padding: 16 }}>
        <TextInput
          placeholder="Search"
          placeholderTextColor="#aaa"
          style={{
            height: 48,
            backgroundColor: "white",
            borderRadius: 24,
            paddingHorizontal: 16,
            borderWidth: 1,
            borderColor: "#d1d5db",
          }}
        />
      </View>

      {/* Message List */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#0000ff"
          style={{ marginTop: 20 }}
        />
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
}
