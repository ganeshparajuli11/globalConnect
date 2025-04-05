import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import { userAuth } from "../../contexts/AuthContext";
import config from "../../constants/config";
import ScreenWrapper from "../../components/ScreenWrapper";
import Header from "../../components/Header";
import PostCard from "../../components/PostCard";
import Loading from "../../components/Loading";
import { theme } from "../../constants/theme";
import { hp, wp } from "../../helpers/common";
import Input from "../../components/Input";
import CommentCard from "../../components/CommentCard";
import Icon from "../../assets/icons/index";
// Import comment services (hook and functions)
import {
  useFetchComments,
  createComment,
  deleteComment,
  editComment,
} from "../../services/commentService";
import PostCardDetails from "../../components/PostCardDetails";

const PostDetails = () => {
  const { postId } = useLocalSearchParams();
  const router = useRouter();
  const ip = config.API_IP;
  const POST_DETAILS_API_URL = `http://${ip}:3000/api/post/${postId}`;
  const { user, authToken } = userAuth();

  const [post, setPost] = useState(null);
  const [startLoading, setStartLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [likesModalVisible, setLikesModalVisible] = useState(false);
  const [likedUsers, setLikedUsers] = useState([]);
  const [loadingLikes, setLoadingLikes] = useState(false);
  // For editing comments
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editCommentText, setEditCommentText] = useState("");
  const [selectedComment, setSelectedComment] = useState(null);

  // Get comments for the post using our custom hook
  const { comments, fetchComments, loading: commentsLoading } = useFetchComments(postId);

  // Function to fetch liked users
  const fetchLikedUsers = async () => {
    try {
      setLoadingLikes(true);
      const response = await axios.get(`http://${ip}:3000/api/post/liked/${postId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setLikedUsers(response.data.data);
    } catch (error) {
      console.error("Error fetching liked users:", error);
    } finally {
      setLoadingLikes(false);
    }
  };

  // Function to open the likes modal
  const handleShowLikes = () => {
    fetchLikedUsers();
    setLikesModalVisible(true);
  };

  useEffect(() => {
    if (postId) {
      getPostDetails();
    }
  }, [postId]);

  const getPostDetails = async () => {
    try {
      setStartLoading(true);
      const response = await axios.get(POST_DETAILS_API_URL, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.status === 200) {
        setPost(response.data.data);
      } else {
        console.error("Failed to fetch post details:", response.data);
      }
    } catch (error) {
      console.error("Error fetching post details:", error);
    } finally {
      setStartLoading(false);
    }
  };

  // Create comment
  const handleCommentSubmit = async (commentText) => {
    if (!commentText.trim()) return;
    try {
      await createComment(postId, commentText, authToken);
      setComment("");
      fetchComments(); // Refresh comment list after posting
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId, authToken);
      fetchComments(); // Refresh comments after deletion
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  // Open edit modal
  const handleEditComment = (commentToEdit) => {
    setSelectedComment(commentToEdit);
    setEditCommentText(commentToEdit.text);
    setEditModalVisible(true);
  };

  // Save edited comment
  const saveEditComment = async () => {
    if (!selectedComment) return;
    try {
      await editComment(selectedComment._id, editCommentText, authToken);
      setEditModalVisible(false);
      setSelectedComment(null);
      setEditCommentText("");
      fetchComments();
    } catch (error) {
      console.error("Error editing comment:", error);
    }
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditModalVisible(false);
    setSelectedComment(null);
    setEditCommentText("");
  };

  if (startLoading || !post) {
    return (
      <ScreenWrapper style={styles.center}>
        <Loading />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper style={styles.container}>
      <Header
        title="Post Details"
        showBackButton={true}
        onBackPress={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.postContainer}>
          <PostCardDetails
            item={post}
            currentUser={user}
            router={router}
            hasShadow={false}
            showMoreIcon={false}
            onLikeCountPress={handleShowLikes} // Open likes modal on like count press
          />
        </View>

        {/* Comment Input */}
        <View style={styles.inputWrapper}>
          <Input
            value={comment}
            onChangeText={setComment}
            onSend={() => handleCommentSubmit(comment)}
          />
        </View>

        {/* Comments List */}
        <View style={styles.commentsContainer}>
          {commentsLoading ? (
            <Text>Loading comments...</Text>
          ) : comments.length === 0 ? (
            <Text style={styles.noCommentsText}>No comments yet.</Text>
          ) : (
            comments.map((c) => (
              <CommentCard
                key={c._id}
                comment={c}
                currentUserId={user.user.id}
                postOwnerId={post.user.id} // Updated to use post.user.id
                onDelete={handleDeleteComment}
                onEdit={handleEditComment}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Edit Comment Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={cancelEdit}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Comment</Text>
            <TextInput
              style={styles.editInput}
              value={editCommentText}
              onChangeText={setEditCommentText}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                onPress={saveEditComment}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#ccc" }]}
                onPress={cancelEdit}
              >
                <Text style={[styles.modalButtonText, { color: "#333" }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Likes Modal */}
      <Modal
        visible={likesModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setLikesModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, styles.likesModalContainer]}>
            <View style={styles.likesModalHeader}>
              <Text style={styles.modalTitle}>Likes</Text>
              <TouchableOpacity
                onPress={() => setLikesModalVisible(false)}
                style={styles.closeButton}
              >
                <Icon name="cross" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {loadingLikes ? (
              <Loading />
            ) : (
              <ScrollView style={styles.likesList}>
                {likedUsers.map((user) => (
                  <TouchableOpacity
                    key={user._id}
                    style={styles.likedUserItem}
                    onPress={() => {
                      setLikesModalVisible(false);
                      router.push(`/profile?userId=${user._id}`);
                    }}
                  >
                    <View style={styles.userInfoContainer}>
                      <Avator
                        size={hp(5)}
                        uri={user.profile_image}
                        rounded={theme.radius.full}
                      />
                      <Text style={styles.likedUserName}>{user.name}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

export default PostDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
  },
  postContainer: {
    marginBottom: hp(2),
  },
  inputWrapper: {
    marginBottom: hp(2),
  },
  commentsContainer: {
    marginTop: hp(2),
  },
  noCommentsText: {
    textAlign: "center",
    color: theme.colors.textLight,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: wp(5),
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: hp(1.5),
  },
  editInput: {
    borderColor: theme.colors.gray,
    borderWidth: 1,
    borderRadius: 5,
    padding: wp(3),
    marginBottom: hp(2),
    minHeight: hp(10),
    textAlignVertical: "top",
    color: theme.colors.textDark,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalButton: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderRadius: 5,
    marginLeft: wp(2),
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  likesModalContainer: {
    maxHeight: "70%",
    width: "90%",
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: 0,
    overflow: "hidden",
  },
  likesModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    padding: wp(2),
  },
  likesList: {
    padding: wp(4),
  },
  likedUserItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  userInfoContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  likedUserName: {
    marginLeft: wp(3),
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: "500",
  },
});
