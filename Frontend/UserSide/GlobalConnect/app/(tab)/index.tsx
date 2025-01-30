import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import Icon from "react-native-vector-icons/FontAwesome";
import config from "../config";

const Index = () => {
  const ip = config.API_IP;
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`http://${ip}:3000/api/category/all`);
        setCategories(response.data.categories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch posts
  const fetchPosts = async (pageNumber = 1, category = selectedCategory) => {
    if (loading) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `http://${ip}:3000/api/post/all?page=${pageNumber}&limit=5&category=${category || ""}`
      );

      const transformedPosts = response.data.data.map((post) => ({
        id: post.id,
        user: post.user || "Unknown User",
        userImage: post.userImage || "https://via.placeholder.com/40", // Default if missing
        type: post.type || "Unknown Category",
        time: new Date(post.time).toLocaleDateString(),
        content: post.content || "No content available",
        image: post.image ? `http://192.168.18.105:3000${post.image}` : "", // Prepend the base URL to image
        comments: post.comments || [],
        liked: post.liked || false,
      }));

      setPosts((prevPosts) =>
        pageNumber === 1
          ? transformedPosts
          : [...prevPosts, ...transformedPosts]
      );
      setPage(pageNumber + 1);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory]);

  // Toggle like for a post
  const toggleLike = (id) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === id ? { ...post, liked: !post.liked } : post
      )
    );
  };

  // Render each post
  const renderPost = ({ item }) => (
    <View style={styles.postContainer}>
      {/* User Info */}
      <View style={styles.userInfoContainer}>
        <Image source={{ uri: item.userImage }} style={styles.userImage} />
        <View style={styles.userInfoTextContainer}>
          <Text style={styles.userName}>{item.user}</Text>
          <Text style={styles.postType}>{`Shared as ${item.type}`}</Text>
        </View>
        <Text style={styles.postTime}>{item.time}</Text>
      </View>

      {/* Post Content */}
      <Text style={styles.postContent}>{item.content}</Text>
      {item.image && item.image !== "" && (
        <Image source={{ uri: item.image }} style={styles.postImage} />
      )}

      {/* Post Actions */}
      <View style={styles.postActionsContainer}>
        <TouchableOpacity onPress={() => toggleLike(item.id)}>
          <Icon
            name={item.liked ? "heart" : "heart-o"}
            size={24}
            color={item.liked ? "#e74c3c" : "#333"}
          />
        </TouchableOpacity>
        <TouchableOpacity>
          <Icon name="comment-o" size={24} color="#3498db" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Icon name="share" size={24} color="#2ecc71" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render loading footer
  const renderFooter = () => {
    if (!loading) return null;
    return <ActivityIndicator style={{ marginVertical: 20 }} />;
  };

  // Handle pull to refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    setPosts([]);
    await fetchPosts(1);
    setRefreshing(false);
  };

  // Handle load more when user scrolls
  const handleLoadMore = () => {
    if (posts.length > 0) fetchPosts(page);
  };

  // Handle category selection
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
    setPage(1);
    setPosts([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden={false} backgroundColor="#fff" barStyle="dark-content" />
      {/* Search Bar */}
      <TextInput placeholder="Search" style={styles.searchBar} />
      {/* Category Tabs */}
      <View style={styles.categoryTabsContainer}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category._id}
            style={[
              styles.categoryTab,
              selectedCategory === category._id && styles.selectedCategoryTab,
            ]}
            onPress={() => handleCategorySelect(category._id)}
          >
            <Text
              style={[
                styles.categoryTabText,
                selectedCategory === category._id && styles.selectedCategoryTabText,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Post Feed */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item, index) => item.id || index.toString()} // Use id or index if id is not available
        contentContainerStyle={styles.postsListContainer}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={() => {
          return loading ? (
            <ActivityIndicator
              size="large"
              color="#3498db"
              style={{ marginVertical: 20 }}
            />
          ) : (
            <Text style={{ textAlign: "center", marginVertical: 20 }}>
              No posts available.
            </Text>
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
  },
  searchBar: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 20,
  },
  categoryTabsContainer: {
    flexDirection: "row",
    marginBottom: 20,
    justifyContent: "space-between",
  },
  categoryTab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  categoryTabText: {
    color: "#333",
    fontWeight: "bold",
  },
  postContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userInfoTextContainer: {
    flex: 1,
  },
  userName: {
    fontWeight: "bold",
    fontSize: 16,
  },
  postType: {
    color: "#666",
    fontSize: 14,
  },
  postTime: {
    fontSize: 12,
    color: "#aaa",
  },
  postContent: {
    fontSize: 14,
    marginBottom: 10,
  },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  postActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  commentsSection: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  selectedCategoryTab: {
    backgroundColor: "#3498db",
  },
  selectedCategoryTabText: {
    color: "#fff",
  },
});

export default Index;
