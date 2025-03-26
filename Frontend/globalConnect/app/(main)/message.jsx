import React, { useState, useEffect, useRef } from "react";
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
  StatusBar,
  Animated,
  Dimensions,
  Keyboard
} from "react-native";
import { useRouter } from "expo-router";
import { theme } from "../../constants/theme";
import ScreenWrapper from "../../components/ScreenWrapper";
import BottomNav from "../../components/bottomNav";
import { useFetchChatList } from "../../services/messageSerive";
import BackButton from "../../components/BackButton";
import config from "../../constants/config";
import moment from "moment";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

// Modified conversation types without groups
const conversationTypes = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "friends", label: "Friends" }
];

const MessagePage = () => {
  const ip = config.API_IP;
  const router = useRouter();
  const { chatList, loading, fetchChatList } = useFetchChatList();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredChats, setFilteredChats] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [error, setError] = useState(null);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const searchBarAnim = useState(new Animated.Value(0))[0];
  const searchInputRef = useRef(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const flatListRef = useRef(null);

  // Keep track of keyboard visibility
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

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
      } catch (err) {
        setError("Failed to fetch messages. Please try again later.");
      }
    };
    fetchChatListWithRetry();
  }, [fetchChatList]);

  // Filtered chats based on selected tab - removed groups option
  const getFilteredChatsByTab = () => {
    if (activeTab === "all") return filteredChats;
    if (activeTab === "unread") return filteredChats.filter(chat => chat.unread);
    if (activeTab === "friends") return filteredChats.filter(chat => chat.isFriend);
    return filteredChats;
  };

  // Fixed search bar toggle function to ensure keyboard focus
  const toggleSearchBar = () => {
    if (showSearchBar) {
      // Hide search bar
      Keyboard.dismiss();
      Animated.timing(searchBarAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start(() => {
        setShowSearchBar(false);
        setSearchQuery("");
      });
    } else {
      // Show search bar and focus input
      setShowSearchBar(true);
      Animated.timing(searchBarAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }).start(() => {
        // Ensure focus is applied after animation completes and component is fully rendered
        if (searchInputRef.current) {
          // Delay focus to ensure component is ready
          setTimeout(() => {
            searchInputRef.current.focus();
          }, 100);
        }
      });
    }
  };

  // Modified tab press handler - don't dismiss keyboard when changing tabs
  const handleTabPress = (tabId) => {
    setActiveTab(tabId);
    // Scroll to top when changing tabs
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  };

  const getTimeString = (timestamp) => {
    if (!timestamp) return "";
    const messageDate = moment(timestamp);
    const now = moment();
    
    if (now.diff(messageDate, 'days') < 1) {
      return messageDate.format('h:mm A');
    } else if (now.diff(messageDate, 'days') < 7) {
      return messageDate.format('ddd');
    } else {
      return messageDate.format('MMM D');
    }
  };

  const renderChatItem = ({ item, index }) => {
    const avatarUrl = item?.avatar
      ? `http://${ip}:3000/${item.avatar}`
      : "https://via.placeholder.com/100";

    const isUnread = item.unread;

    return (
      <Animated.View style={styles.chatItemContainer}>
        <TouchableOpacity
          style={[styles.chatItem, isUnread && styles.unreadChatItem]}
          onPress={() => {
            router.replace(
              `/chat?userId=${encodeURIComponent(item.userId)}&name=${encodeURIComponent(
                item.name
              )}`
            );
          }}
          activeOpacity={0.7}
        >
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatar}
              onError={(e) => {
                // Silent fallback
              }}
            />
            {item.isOnline && <View style={styles.onlineIndicator} />}
          </View>
          
          <View style={styles.chatDetails}>
            <View style={styles.nameTimeRow}>
              <Text style={[styles.chatName, isUnread && styles.unreadName]} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.timeContainer}>
                {isUnread && <View style={styles.unreadDot} />}
                <Text style={[styles.timestamp, isUnread && styles.unreadTime]}>
                  {getTimeString(item.timestamp)}
                </Text>
              </View>
            </View>
            
            <View style={styles.messagePreviewContainer}>
              {item.isTyping ? (
                <Text style={styles.typingText}>typing...</Text>
              ) : (
                <Text style={[styles.chatMessage, isUnread && styles.unreadMessage]} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
        
        <View style={styles.swipeActionsPlaceholder} />
      </Animated.View>
    );
  };

  const renderTabItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.tabItem, activeTab === item.id && styles.activeTabItem]} 
      onPress={() => handleTabPress(item.id)}
    >
      <Text style={[styles.tabText, activeTab === item.id && styles.activeTabText]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  // Modified empty state to maintain consistent height
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyContent}>
        <View style={styles.emptyIconContainer}>
          <MaterialCommunityIcons name="message-text-outline" size={64} color="#FFF" />
        </View>
        <Text style={styles.emptyTitle}>No conversations yet</Text>
        <Text style={styles.emptyText}>
          When you start a new conversation, it will appear here
        </Text>
      </View>
    </View>
  );

  const renderHeader = () => (
    <FlatList
      horizontal
      data={conversationTypes}
      renderItem={renderTabItem}
      keyExtractor={(item) => item.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabsContainer}
    />
  );

  const renderHeaderWithSearch = () => (
    <>
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={() => {
              router.back();
            }}>
              <BackButton size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Messages</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerButton} onPress={toggleSearchBar}>
              <Ionicons name="search" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Improved Search Bar Implementation */}
        {showSearchBar && (
          <Animated.View
            style={[
              styles.searchBarContainer,
              {
                height: searchBarAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 60]
                }),
                opacity: searchBarAnim
              }
            ]}
          >
            <View style={styles.searchInputWrapper}>
              <Ionicons name="search" size={20} color={theme.colors.gray} />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Search conversations..."
                placeholderTextColor={theme.colors.gray}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                blurOnSubmit={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={20} color={theme.colors.gray} />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        )}
      </View>

      {renderHeader()}
    </>
  );
  
  const displayedChats = getFilteredChatsByTab();

  return (
    <ScreenWrapper style={styles.container}>
      <StatusBar backgroundColor={theme.colors.background} barStyle="dark-content" />

      {/* Chat List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIndicatorContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
          <Text style={styles.loadingText}>Loading your conversations...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="wifi-outline" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => fetchChatList()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={displayedChats}
          keyExtractor={(item) => item.userId}
          renderItem={renderChatItem}
          contentContainerStyle={styles.chatListContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeaderWithSearch}
          stickyHeaderIndices={[0]}
          ListEmptyComponent={renderEmptyState}
          bounces={true}
          initialNumToRender={10}
          onRefresh={fetchChatList}
          refreshing={loading}
          keyboardShouldPersistTaps="always"
          removeClippedSubviews={false}
          // Ensure keyboard doesn't dismiss on scroll
          onScrollBeginDrag={() => {}}
          keyboardDismissMode="none"
        />
      )}

      <BottomNav />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background || "#F8F9FA",
  },
  headerContainer: {
    backgroundColor: theme.colors.background || "#F8F9FA",
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    zIndex: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.text || "#1A1A1A",
  },
  headerButton: {
    padding: 8,
    marginLeft: 4,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    overflow: 'hidden',
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text || "#1A1A1A",
    marginLeft: 8,
    paddingVertical: 10,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.background || "#F8F9FA",
  },
  tabItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  activeTabItem: {
    backgroundColor: theme.colors.primary || "#5B37B7",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.secondaryText || "#555555",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  chatListContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 80,
    minHeight: Dimensions.get('window').height - 80, // Ensure minimum height to prevent UI jumping
  },
  chatItemContainer: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  unreadChatItem: {
    backgroundColor: 'rgba(91, 55, 183, 0.05)',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  onlineIndicator: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CD964',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  chatDetails: {
    flex: 1,
    marginLeft: 16,
  },
  nameTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  chatName: {
    fontSize: 17,
    fontWeight: "600",
    color: theme.colors.text || "#1A1A1A",
    flex: 1,
    marginRight: 8,
  },
  unreadName: {
    fontWeight: "700",
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary || "#5B37B7",
    marginRight: 6,
  },
  timestamp: {
    fontSize: 13,
    color: theme.colors.gray || "#8A8A8A",
  },
  unreadTime: {
    color: theme.colors.primary || "#5B37B7",
    fontWeight: "600",
  },
  messagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatMessage: {
    fontSize: 15,
    color: theme.colors.secondaryText || "#555555",
    flex: 1,
  },
  unreadMessage: {
    color: theme.colors.text || "#1A1A1A",
  },
  typingText: {
    fontSize: 15,
    color: theme.colors.primary || "#5B37B7",
    fontStyle: 'italic',
  },
  swipeActionsPlaceholder: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  loadingIndicatorContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary || "#5B37B7",
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.secondaryText || "#555555",
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.error || "#FF3B30",
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text || "#1A1A1A",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.secondaryText || "#555555",
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: theme.colors.primary || "#5B37B7",
    borderRadius: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    paddingTop: 80, // This gives consistent position for the empty state
    justifyContent: 'flex-start',
    minHeight: Dimensions.get('window').height - 280, // Ensure minimum height
  },
  emptyContent: {
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primary || "#5B37B7",
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.text || "#1A1A1A",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.secondaryText || "#555555",
    textAlign: "center",
    marginBottom: 32,
  }
});

export default MessagePage;