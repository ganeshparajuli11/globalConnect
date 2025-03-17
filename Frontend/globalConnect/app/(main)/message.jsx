import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { theme } from "../../constants/theme";
import ScreenWrapper from "../../components/ScreenWrapper";
import BottomNav from "../../components/bottomNav";
import { useFetchChatList } from "../../services/messageSerive";
import BackButton from "../../components/BackButton";
import config from "../../constants/config";
import moment from "moment"; // Import moment library for better time formatting

const MessagePage = () => {
  const ip = config.API_IP;
  const router = useRouter();
  const { chatList, loading, fetchChatList } = useFetchChatList();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredChats, setFilteredChats] = useState([]);
  const [error, setError] = useState(null); // State to handle errors

  useEffect(() => {
    setFilteredChats(chatList);
  }, [chatList]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredChats(chatList);
    } else {
      const filtered = chatList.filter((chat) =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredChats(filtered);
    }
  }, [searchQuery, chatList]);

  useEffect(() => {
    const fetchChatListWithRetry = async () => {
      try {
        await fetchChatList();
      } catch (error) {
        setError("Failed to fetch messages. Please try again later.");
      }
    };

    fetchChatListWithRetry();
  }, [fetchChatList]);

  const renderChatItem = ({ item }) => {
    const avatarUrl = item?.avatar
      ? `http://${ip}:3000/${item.avatar}`
      : "https://via.placeholder.com/100";

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => {
          router.replace(
            `/chat?userId=${encodeURIComponent(
              item.userId
            )}&name=${encodeURIComponent(item.name)}`
          );
        }}
      >
        <Image
          source={{ uri: avatarUrl }}
          style={styles.avatar}
          onError={(e) => {
            console.error("Image load error:", e);
            // Use a placeholder image
            //   setAvatarUrl("your_placeholder_image_url");
          }}
        />
        <View style={styles.chatDetails}>
          <Text style={styles.chatName}>{item.name}</Text>
          <Text style={styles.chatMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </View>
        <Text style={styles.timestamp}>
          {item.timestamp ? moment(item.timestamp).fromNow() : ""}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <BackButton size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search"
          placeholderTextColor={theme.colors.gray}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>

      {/* Chat List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : filteredChats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No chats yet.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.userId}
          renderItem={renderChatItem}
          contentContainerStyle={styles.chatListContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No chats yet.</Text>
            </View>
          }
        />
      )}

      <BottomNav />
    </ScreenWrapper>
  );
};

export default MessagePage;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.white,
    // Soft shadow for a subtle elevation effect
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.text,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.background,
  },
  searchInput: {
    height: 48,
    backgroundColor: theme.colors.white,
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    color: theme.colors.text,
    // Subtle shadow instead of border strokes
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  chatListContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: theme.colors.background,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    // Minimalistic shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  chatDetails: {
    flex: 1,
    marginLeft: 16,
  },
  chatName: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
  },
  chatMessage: {
    fontSize: 14,
    color: theme.colors.gray,
    marginTop: 4,
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.gray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    color: theme.colors.gray,
  },
});
