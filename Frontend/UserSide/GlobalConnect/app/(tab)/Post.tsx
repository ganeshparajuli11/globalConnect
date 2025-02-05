import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
} from "react-native";
import axios from "axios";
import Icon from "react-native-vector-icons/FontAwesome";
import config from "../config";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Posts = () => {
  const ip = config.API_IP;
  // Replace with your actual current user id from context/authentication
  const currentUserId = "CURRENT_USER_ID"; 

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);
  const [menuPostId, setMenuPostId] = useState(null); // For three-dot menu modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [users, setUsers] = useState([]); // List of followed users
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [hasMore, setHasMore] = useState(true); // Track if more posts exist

  useEffect(() => {
    fetchPosts(1);
    fetchUsers();
  }, []);

  const fetchPosts = useCallback(async (pageNumber = 1, isFirstLoad = false) => {
    if (loading || !hasMore) return;

    setLoading(true);

    try {
      const authToken = await AsyncStorage.getItem("authToken");
      const response = await axios.get(
        `http://${ip}:3000/api/post/all?page=${pageNumber}&limit=5`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      const newPosts = response.data.data.map((post) => ({
        id: post.id,
        user: post.user,
        userImage: post.user?.profile_image || "https://via.placeholder.com/40",
        type: post.type || "Unknown Category",
        time: post.time,
        content: post.content || "No content available",
        image: post.image ? `http://${ip}:3000${post.image}` : "",
        liked: post.liked || false,
        likeCount: post.likeCount || 0, 
        commentCount: post.commentCount || 0,
        shareCount: post.shareCount || 0,
      }));

      setPosts((prev) => (isFirstLoad ? newPosts : [...prev, ...newPosts]));
      setPage(pageNumber + 1);

      // Stop loading more if no new posts are fetched
      if (newPosts.length === 0) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore]);

  const fetchUsers = async () => {
    try {
      const authToken = await AsyncStorage.getItem("authToken");
      
      if (!authToken) {
        console.error("No auth token found");
        return;
      }
  
      const response = await axios.get(`http://${ip}:3000/api/following`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
  
      // Assume response.data is an array of user objects that the current user follows.
      setUsers(response.data.following);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };
  
  const followUser = async (followUserId) => {
    try {
      const authToken = await AsyncStorage.getItem("authToken");
      if (!authToken) {
        console.error("No auth token found");
        return;
      }
  
      // Send follow request
      const response = await axios.post(
        "http://localhost:3000/api/follow",
        { followUserId }, // Send followUserId as part of the body
        {
          headers: {
            Authorization: `Bearer ${authToken}`, // Send authToken as Authorization header
          },
        }
      );
  
      if (response.status === 200) {
        console.log("Followed user successfully");
        fetchUsers(); // Optionally refresh the users list
      } else {
        console.error("Failed to follow user");
      }
    } catch (error) {
      console.error("Error following user:", error);
    }
  };
  
  const toggleLike = async (postId) => {
    const postIndex = posts.findIndex((post) => post.id === postId);
    const post = posts[postIndex];
  console.log("Post index: " + post)
    // Check if the post is already liked
    const isLiked = post.liked;
  
    try {

      const response = await axios.put(
        `http://${ip}:3000/api/post/like-unlike/${postId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${await AsyncStorage.getItem("authToken")}`,
          },
        }
      );
  
      if (response.status === 200) {
        // If the like/unlike was successful, update the state
        setPosts((prev) =>
          prev.map((item) =>
            item.id === postId
              ? {
                  ...item,
                  liked: !isLiked, // Toggle like status
                  likeCount: isLiked ? item.likeCount - 1 : item.likeCount + 1, // Update like count
                }
              : item
          )
        );
      } else {
        console.error("Error while toggling like/unlike.");
      }
    } catch (error) {
      console.error("Error liking/unliking the post:", error.response ? error.response.data : error.message);

    }
  };
  

  const handleComment = (postId) => {
    if (commentText.trim() === "") return;
    setComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), commentText],
    }));
    setCommentText("");
  };

  const handleShare = (postId) => {
    setShowShareModal(true);
    setSelectedPost(postId);
  };

  const sharePost = () => {
    console.log("Sharing post", selectedPost, "with users", selectedUsers);
    setShowShareModal(false);
  };

  const handleMenuAction = (action, postId) => {
    // Handle menu actions like reporting or hiding the post.
    if (action === "report") {
      console.log("Reporting post", postId);
      // TODO: Add API call to report post.
    } else if (action === "hide") {
      console.log("Hiding post", postId);
      // Optionally remove the post from the feed
      setPosts((prev) => prev.filter((post) => post.id !== postId));
    }
    setMenuPostId(null);
  };

  const renderPost = ({ item }) => {
    // Determine if the current user follows the post's author
    const isFollowing = users.some(
      (user) => user._id === item.user._id
    );
    return (
      <View style={styles.postContainer}>
        {/* Post Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image source={{ uri: item.userImage }} style={styles.userImage} />
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{item.user.name}</Text>
              <Text style={styles.postTime}>{item.time}</Text>
            </View>
          </View>
          {/* Follow/Following Button */}
          {item.user._id !== currentUserId && (
            <TouchableOpacity style={styles.followButton}>
              <Text style={styles.followButtonText}>
                {isFollowing ? "Following" : "Follow"}
              </Text>
            </TouchableOpacity>
          )}
          {/* Three-dot menu */}
          <TouchableOpacity onPress={() => setMenuPostId(item.id)}>
            <Icon name="ellipsis-h" size={20} color="#666" />
          </TouchableOpacity>
        </View>
        {/* Post Content */}
        <Text style={styles.postContent}>{item.content}</Text>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.postImage} />
        ) : null}
        {/* Post Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={() => toggleLike(item.id)}
            style={styles.actionButton}
          >
            <Icon
              name={item.liked ? "heart" : "heart-o"}
              size={22}
              color={item.liked ? "#e74c3c" : "#333"}
            />
            <Text style={styles.actionText}>{item.likeCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedPost(item.id)}
            style={styles.actionButton}
          >
            <Icon name="comment-o" size={22} color="#3498db" />
            <Text style={styles.actionText}>{item.commentCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleShare(item.id)}
            style={styles.actionButton}
          >
            <Icon name="share" size={22} color="#2ecc71" />
            <Text style={styles.actionText}>{item.shareCount}</Text>
          </TouchableOpacity>
        </View>
        {/* Comment Section */}
        {selectedPost === item.id && (
          <View style={styles.commentSection}>
            <FlatList
              data={comments[item.id] || []}
              keyExtractor={(c, i) => i.toString()}
              renderItem={({ item: comment }) => (
                <Text style={styles.comment}>{comment}</Text>
              )}
            />
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment..."
                value={commentText}
                onChangeText={setCommentText}
              />
              <TouchableOpacity onPress={() => handleComment(item.id)}>
                <Text style={styles.commentButton}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.postsListContainer}
        onEndReached={() => fetchPosts(page)}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading && <ActivityIndicator size="large" color="#333" />
        }
      />
      {/* Modal for Three-Dot Menu */}
      <Modal
        visible={menuPostId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuPostId(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setMenuPostId(null)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              onPress={() => handleMenuAction("report", menuPostId)}
            >
              <Text style={styles.modalOption}>Report Post</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleMenuAction("hide", menuPostId)}
            >
              <Text style={styles.modalOption}>Hide Post</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMenuPostId(null)}>
              <Text style={[styles.modalOption, { color: "#999" }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.shareModal}>
          <Text style={styles.shareTitle}>Share Post</Text>
          {/* Implement your share logic here */}
          <TouchableOpacity onPress={sharePost} style={styles.shareButton}>
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowShareModal(false)}
            style={styles.shareButton}
          >
            <Text style={styles.shareButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  postsListContainer: {
    padding: 10,
  },
  postContainer: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userDetails: {
    justifyContent: "center",
  },
  userName: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#333",
  },
  postTime: {
    fontSize: 12,
    color: "#777",
  },
  followButton: {
    backgroundColor: "#3498db",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 5,
    marginRight: 10,
  },
  followButtonText: {
    color: "#fff",
    fontSize: 12,
  },
  postContent: {
    marginVertical: 10,
    fontSize: 14,
    color: "#444",
  },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginVertical: 10,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    marginLeft: 5,
    fontSize: 14,
    color: "#333",
  },
  commentSection: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 5,
    marginRight: 10,
  },
  commentButton: {
    color: "#3498db",
    fontWeight: "bold",
  },
  comment: {
    fontSize: 14,
    marginBottom: 5,
    color: "#555",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  modalOption: {
    fontSize: 16,
    paddingVertical: 10,
    color: "#333",
  },
  shareModal: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  shareTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  shareButton: {
    backgroundColor: "#3498db",
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    width: "80%",
    alignItems: "center",
  },
  shareButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default Posts;
