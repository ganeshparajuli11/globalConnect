import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Modal,
  Image,
  ScrollView,
} from "react-native";
import moment from "moment";
import RenderHtml from "react-native-render-html";
import { theme } from "../constants/theme";
import Avator from "./Avator";
import Icon from "../assets/icons";
import VerifiedIcon from "../assets/icons/verifiedIcon";
import { hp } from "../helpers/common";
import config from "../constants/config";
import axios from "axios";
import { useFetchFollowing } from "../services/followFetchService";
import { userAuth } from "../contexts/AuthContext";

const PostCardDetails = ({
  item,
  currentUser,
  router,
  hasShadow = true,
  showMoreIcon = false,
}) => {
  const { authToken } = userAuth();
  const ip = config.API_IP;

  // Like state
  const [liked, setLiked] = useState(item.liked);
  const [likeCount, setLikeCount] = useState(item.likeCount);

  // Fullscreen image state
  const [fullScreenVisible, setFullScreenVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Share modal state
  const [shareModalVisible, setShareModalVisible] = useState(false);

  // Report Post modal state
  const [reportModalVisible, setReportModalVisible] = useState(false);

  // Liked users modal state
  const [likesModalVisible, setLikesModalVisible] = useState(false);
  const [likedUsers, setLikedUsers] = useState([]);
  const [loadingLikes, setLoadingLikes] = useState(false);

  // Following list for share modal
  const { following, loading: loadingFollowing } = useFetchFollowing();

  const profileImageURL = item?.user?.profile_image
    ? `http://${ip}:3000/${item.user.profile_image}`
    : "https://via.placeholder.com/100";

  const createdAt = moment(item?.time).format("MMM D");
  const contentWidth = Dimensions.get("window").width - 32;

  // Handle three-dots press
  const handleThreeDotsPress = () => {
    if (showMoreIcon) {
      router.push(`/postDetails?postId=${item.id}`);
    } else {
      setReportModalVisible(true);
    }
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
        { headers: { Authorization: `Bearer ${authToken}` } }
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

  const onShare = async () => {
    setShareModalVisible(true);
  };

  const sharePostToUser = async (user) => {
    try {
      const url = `http://${ip}:3000/api/post/share`;
      await axios.post(
        url,
        { postId: item.id, recipientId: user._id },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      console.log("Post shared successfully with", user.name);
    } catch (error) {
      console.error(
        "Error sharing post:",
        error.response ? error.response.data : error.message
      );
    }
    setShareModalVisible(false);
  };

  const handleReportPost = () => {
    console.log("Report Post clicked");
    router.push("/report");
    router.replace(`/report?postId=${item.id}`);
    setReportModalVisible(false);
  };

  // Fetch liked users and show modal
  const fetchLikedUsers = async () => {
    try {
      setLoadingLikes(true);
      const response = await axios.get(`http://${ip}:3000/api/post/liked/${item.id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setLikedUsers(response.data.data);
    } catch (error) {
      console.error("Error fetching liked users:", error);
    } finally {
      setLoadingLikes(false);
    }
  };

  const handleShowLikes = () => {
    fetchLikedUsers();
    setLikesModalVisible(true);
  };

  return (
    <View style={[styles.container, hasShadow && styles.shadow]} key={item.id}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Avator size={hp(4.5)} uri={profileImageURL} rounded={theme.radius.md} />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.user.name}</Text>
            {item.user.verified && (
              <VerifiedIcon size={16} color="#1877F2" style={styles.verifiedIcon} />
            )}
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

      {/* Post Content */}
      <View style={styles.content}>
        <RenderHtml contentWidth={contentWidth} source={{ html: item.content }} />
      </View>

      {/* Media Images */}
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

      {/* Fullscreen Modal for Images */}
      <Modal visible={fullScreenVisible} transparent={true}>
        <View style={styles.fullScreenContainer}>
          <Image source={{ uri: selectedImage }} style={styles.fullScreenImage} />
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
          <TouchableOpacity onPress={handleShowLikes}>
            <Text style={styles.count}>{likeCount}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerButton}>
          {showMoreIcon ? (
            <TouchableOpacity onPress={() => router.push(`/postDetails?postId=${item.id}`)}>
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
      <Modal visible={shareModalVisible} transparent={true} animationType="slide">
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

      {/* Report Post Modal */}
      <Modal visible={reportModalVisible} transparent={true} animationType="fade">
        <View style={styles.reportModalContainer}>
          <View style={styles.reportModalContent}>
            <Text style={styles.reportTitle}>Options</Text>
            <TouchableOpacity onPress={handleReportPost} style={styles.reportButton}>
              <Text style={styles.reportButtonText}>Report Post</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.reportButton, { backgroundColor: "#ccc" }]}
              onPress={() => setReportModalVisible(false)}
            >
              <Text style={[styles.reportButtonText, { color: "#333" }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Likes Modal */}
      <Modal visible={likesModalVisible} transparent={true} animationType="slide">
        <View style={styles.shareModalContainer}>
          <View style={styles.shareModalContent}>
            <Text style={styles.shareModalTitle}>Likes</Text>
            {loadingLikes ? (
              <Text>Loading...</Text>
            ) : likedUsers.length > 0 ? (
              <ScrollView style={styles.likesList}>
                {likedUsers.map((user) => {
                  const likedUserImageURL = user.profile_image
                    ? `http://${ip}:3000/${user.profile_image}`
                    : "https://via.placeholder.com/100";
                  return (
                    <TouchableOpacity
                      key={user._id}
                      style={styles.likedUserItem}
                      onPress={() => {
                        setLikesModalVisible(false);
                        router.push(`/userProfile?userId=${user._id}`);
                      }}
                    >
                      <View style={styles.userInfoContainer}>
                        <Avator
                          size={hp(5)}
                          uri={likedUserImageURL}
                          rounded={theme.radius.full}
                        />
                        <Text style={styles.likedUserName}>{user.name}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <Text>No likes yet.</Text>
            )}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setLikesModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default PostCardDetails;

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
  reportButton: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "red",
    marginBottom: 10,
    alignItems: "center",
  },
  reportButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  likesList: {
    padding: 10,
  },
  likedUserItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomColor: theme.colors.gray,
    borderBottomWidth: 0.5,
  },
  userInfoContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  likedUserName: {
    marginLeft: 10,
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: "500",
  },
});
