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

const PostCard = ({ item, currentUser, router, hasShadow = true }) => {
  const { authToken } = userAuth();
  const ip = config.API_IP;

  // Initialize like state using the backend's "liked" property
  const [liked, setLiked] = useState(item.liked);
  const [likeCount, setLikeCount] = useState(item.likeCount);

  const [fullScreenVisible, setFullScreenVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const profileImageURL = item?.user?.profile_image
    ? `http://${ip}:3000/${item.user.profile_image}`
    : "https://via.placeholder.com/100";

  const openPostDetails = () => {
    router.push("PostDetails", { postId: item.id });
  };

  // Format the post's creation date using moment.js
  const createdAt = moment(item?.time).format("MMM D");

  // Compute content width for the RenderHtml component
  const contentWidth = Dimensions.get("window").width - 32;

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
      console.log("Requesting URL:", url);
      const response = await axios.put(
        url,
        {},
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      // Update state based on the response using the "liked" property
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

  return (
    <View style={[styles.container, hasShadow && styles.shadow]} key={item.id}>
      {/* Header with user info and options */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Avator size={hp(4.5)} uri={profileImageURL} rounded={theme.radius.md} />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.user.name}</Text>
            <Text style={styles.postTime}>{createdAt}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={openPostDetails}>
          <Icon
            name="threeDotsHorizontal"
            size={hp(3.4)}
            strokeWidth={3}
            color={theme.colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Post content rendered as HTML */}
      <View style={styles.content}>
        <RenderHtml contentWidth={contentWidth} source={{ html: item.content }} />
      </View>

      {/* Render media images if available (up to 4) */}
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

      {/* Fullscreen Modal for Image */}
      <Modal visible={fullScreenVisible} transparent={true}>
        <View style={styles.fullScreenContainer}>
          <Image source={{ uri: selectedImage }} style={styles.fullScreenImage} />
          <TouchableOpacity style={styles.closeIcon} onPress={closeFullScreen}>
            <Icon name="cross" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Combined footer with Love, Comment, and Share icons */}
      <View style={styles.footer}>
        <View style={styles.footerButton}>
          <TouchableOpacity onPress={onLike}>
            <Icon
              name="heart"
              size={24}
              fill={liked ? theme.colors.heart : "transparent"}
              color={liked ? theme.colors.heart : theme.colors.textLight}
            />
          </TouchableOpacity>
          <Text style={styles.count}>{likeCount}</Text>
        </View>

        <View style={styles.footerButton}>
          <TouchableOpacity>
            <Icon name="comment" size={24} color={theme.colors.textLight} />
          </TouchableOpacity>
          <Text style={styles.count}>{item.commentCount}</Text>
        </View>

        <View style={styles.footerButton}>
          <TouchableOpacity>
            <Icon name="share" size={24} color={theme.colors.textLight} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default PostCard;

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
});
