// UserPostCardDetails.jsx

import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Modal,
  Image,
} from "react-native";
import moment from "moment";
import RenderHtml from "react-native-render-html";
import { theme } from "../constants/theme";
import Avator from "./Avator";
import Icon from "../assets/icons";
import { hp } from "../helpers/common";
import config from "../constants/config";
import { userAuth } from "../contexts/AuthContext";
import axios from "axios";
import { useFetchFollowing } from "../services/followFetchService";

const UserPostCardDetails = ({
  item,
  currentUser,
  router,
  hasShadow = true,
  showMoreIcon = false,
}) => {
  const { authToken, refreshUserProfile } = userAuth();
  const ip = config.API_IP;

  console.log("checking post at user post details", item);
  
  // State for likes
  const [liked, setLiked] = useState(item.liked);
  const [likeCount, setLikeCount] = useState(item.likeCount);

  // State for fullscreen image
  const [fullScreenVisible, setFullScreenVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // State for share modal
  const [shareModalVisible, setShareModalVisible] = useState(false);

  // **New**: state for "User Options" modal (edit/delete post)
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);

  // Following list (for sharing)
  const { following, loading: loadingFollowing } = useFetchFollowing();

  const profileImageURL = item?.user?.profile_image
    ? `http://${ip}:3000/${item.user.profile_image}`
    : "https://via.placeholder.com/100";

  // Format the post's creation date using moment.js
  const createdAt = moment(item?.time).format("MMM D");

  // HTML content width
  const contentWidth = Dimensions.get("window").width - 32;

  // When the three-dots button is pressed, show options to edit or delete the post.
  const handleThreeDotsPress = () => {
    setOptionsModalVisible(true);
  };

  const openFullScreen = (imageUrl) => {
    if (!imageUrl) return;
    const fullMediaUrl = imageUrl.startsWith("http")
      ? imageUrl
      : `http://${ip}:3000${imageUrl}`;
    setSelectedImage(fullMediaUrl);
    setFullScreenVisible(true);
  };

  const closeFullScreen = () => {
    setFullScreenVisible(false);
    setSelectedImage(null);
  };

  const onLike = async () => {
    try {
      const url = `http://${ip}:3000/api/post/like-unlike/${item.id}`;
      const response = await axios.put(
        url,
        {},
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      const { liked: updatedLiked, likesCount } = response.data;
      setLiked(updatedLiked);
      setLikeCount(likesCount);
    } catch (error) {
      console.error(
        "Error toggling like:",
        error.response ? error.response.data : error.message
      );
    }
  };

  // Open the share modal
  const onShare = async () => {
    setShareModalVisible(true);
  };

  // Share the post to a user
  const sharePostToUser = async (user) => {
    try {
      const url = `http://${ip}:3000/api/post/share`;
      await axios.post(
        url,
        { postId: item.id, recipientId: user._id },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
    //   console.log("Post shared successfully with", user.name);
    } catch (error) {
      console.error(
        "Error sharing post:",
        error.response ? error.response.data : error.message
      );
    }
    setShareModalVisible(false);
  };

  // Handle editing the post
  const handleEditPost = () => {
    router.push(`/editPost?postId=${item.id}`);
    setOptionsModalVisible(false);
  };

  // **New**: Handle deleting the post
  const handleDeletePost = async () => {
    try {
      const url = `http://${ip}:3000/api/post/${item.id}`;
      await axios.delete(url, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      console.log("Post deleted successfully");
      refreshUserProfile()
      // Optionally, refresh your posts list or navigate away
    } catch (error) {
      console.error(
        "Error deleting post:",
        error.response ? error.response.data : error.message
      );
    }
    setOptionsModalVisible(false);
  };

  return (
    <View style={[styles.container, hasShadow && styles.shadow]} key={item.id}>
      {/* Header with user info and three-dots */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Avator
            size={hp(4.5)}
            uri={profileImageURL}
            rounded={theme.radius.md}
          />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.user.name}</Text>
            <Text style={styles.postTime}>{createdAt}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleThreeDotsPress}>
          <Icon
            name="threeDotsHorizontal"
            size={hp(3.4)}
            strokeWidth={3}
            color={theme.colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Post content */}
      <View style={styles.content}>
        <RenderHtml
          contentWidth={contentWidth}
          source={{ html: item.content }}
        />
      </View>

      {/* Media images (up to 4) */}
      {item.media && item.media.length > 0 && (
        <View style={styles.mediaContainer}>
          {item.media.slice(0, 4).map((mediaUrl, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => openFullScreen(mediaUrl)}
              style={styles.mediaItem}
            >
              <Image source={{ uri: mediaUrl }} style={styles.mediaImage} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Fullscreen Modal for images */}
      <Modal visible={fullScreenVisible} transparent={true}>
        <View style={styles.fullScreenContainer}>
          <Image
            source={{ uri: selectedImage }}
            style={styles.fullScreenImage}
          />
          <TouchableOpacity style={styles.closeIcon} onPress={closeFullScreen}>
            <Icon name="cross" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Footer (Like, Comment, Share) */}
      <View style={styles.footer}>
        <View style={styles.footerButton}>
          <TouchableOpacity onPress={onLike}>
            <Icon
              key={`heart-${liked}`}
              name="heart"
              size={24}
              fill={liked ? theme.colors.heart : "transparent"}
              color={liked ? theme.colors.heart : theme.colors.textLight}
            />
          </TouchableOpacity>
          <Text style={styles.count}>{likeCount}</Text>
        </View>

        <View style={styles.footerButton}>
          {showMoreIcon ? (
            <TouchableOpacity
              onPress={() => router.push(`/postDetails?postId=${item.id}`)}
            >
              <Icon name="comment" size={24} color={theme.colors.textLight} />
            </TouchableOpacity>
          ) : (
            <Icon name="comment" size={24} color={theme.colors.textLight} />
          )}
          <Text style={styles.count}>{item.commentCount}</Text>
        </View>

        <View style={styles.footerButton}>
          <TouchableOpacity onPress={onShare}>
            <Icon name="share" size={24} color={theme.colors.textLight} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Share Modal */}
      <Modal
        visible={shareModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.shareModalContainer}>
          <View style={styles.shareModalContent}>
            <Text style={styles.shareModalTitle}>Share Post With</Text>
            {loadingFollowing ? (
              <Text>Loading...</Text>
            ) : following.length > 0 ? (
              following.map((user) => (
                <TouchableOpacity
                  key={user._id}
                  style={styles.shareUserItem}
                  onPress={() => sharePostToUser(user)}
                >
                  <Text style={styles.shareUserName}>{user.name}</Text>
                  <Text style={styles.shareUserEmail}>{user.email}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text>No users found</Text>
            )}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShareModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* User Options Modal (Edit / Delete Post) */}
      <Modal
        visible={optionsModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.reportModalContainer}>
          <View style={styles.reportModalContent}>
            <Text style={styles.reportTitle}>Options</Text>
            <TouchableOpacity
              onPress={handleEditPost}
              style={styles.optionButton}
            >
              <Text style={styles.optionButtonText}>Edit Post</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDeletePost}
              style={[styles.optionButton, { backgroundColor: "red" }]}
            >
              <Text style={[styles.optionButtonText, { color: "#fff" }]}>
                Delete Post
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, { backgroundColor: "#ccc" }]}
              onPress={() => setOptionsModalVisible(false)}
            >
              <Text style={[styles.optionButtonText, { color: "#333" }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default UserPostCardDetails;

const styles = StyleSheet.create({
  container: {
    gap: 10,
    marginBottom: 15,
    padding: 10,
    borderRadius: theme.radius.xxl * 1.1,
    borderCurve: "continuous",
    backgroundColor: "white",
    elevation: 2,
    borderColor: theme.colors.gray,
    borderWidth: 0.5,
    shadowColor: "#000",
  },
  shadow: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userDetails: {
    marginLeft: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  postTime: {
    fontSize: 12,
    color: theme.colors.gray,
  },
  content: {
    marginTop: 10,
  },
  mediaContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    justifyContent: "space-between",
  },
  mediaItem: {
    width: "48%",
    aspectRatio: 1,
    marginBottom: 10,
    borderRadius: 8,
    overflow: "hidden",
  },
  mediaImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: "90%",
    height: "70%",
    resizeMode: "contain",
  },
  closeIcon: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 5,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
  },
  footerButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  count: {
    marginLeft: 5,
    fontSize: 16,
    color: theme.colors.text,
  },
  shareModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  shareModalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: 10,
    padding: 20,
    width: "100%",
  },
  shareModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  shareUserItem: {
    paddingVertical: 10,
    borderBottomColor: theme.colors.gray,
    borderBottomWidth: 0.5,
  },
  shareUserName: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  shareUserEmail: {
    fontSize: 14,
    color: theme.colors.gray,
  },
  cancelButton: {
    marginTop: 15,
    alignSelf: "flex-end",
  },
  cancelButtonText: {
    color: theme.colors.textLight,
    fontSize: 16,
  },
  reportModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  reportModalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: 10,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  optionButton: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.gray,
    marginBottom: 10,
    alignItems: "center",
  },
  optionButtonText: {
    color: theme.colors.text,
    fontSize: 16,
  },
});
