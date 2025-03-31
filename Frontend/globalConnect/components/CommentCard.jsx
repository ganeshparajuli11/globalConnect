import React, { useState } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity, 
  Modal 
} from "react-native";
import { theme } from "../constants/theme";
import { hp, wp } from "../helpers/common";
import config from "../constants/config";
import Icon from "../assets/icons"; 

const CommentCard = ({
  comment,
  currentUserId,
  postOwnerId,
  onDelete,
  onEdit,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  console.log("comments ",postOwnerId);
  // const isCommentOwner = comment.userId._id === currentUserId;
  // const isPostOwner = postOwnerId === currentUserId;
  // Build profile image URL
  const ip = config.API_IP;
  const profileImageUrl = comment.userId.profile_image
    ? `http://${ip}:3000/${comment.userId.profile_image}`
    : "https://via.placeholder.com/40";

  // Permissions
  const isCommentOwner = comment.userId._id === currentUserId;
  const isPostOwner = postOwnerId === currentUserId;
  const canDelete = isCommentOwner || isPostOwner;
  const canEdit = isCommentOwner; 

  const handleConfirmDelete = () => {
    setShowDeleteModal(false);
    onDelete(comment._id);
  };

  return (
    <View style={styles.commentContainer}>
      {/* Avatar */}
      <Image source={{ uri: profileImageUrl }} style={styles.avatar} />

      {/* Text area */}
      <View style={styles.textArea}>
        <Text style={styles.authorName}>{comment.userId.name}</Text>
        <Text style={styles.commentText}>{comment.text}</Text>
      </View>

      {/* Action icons (edit/delete) */}
      <View style={styles.actionIcons}>
        {canEdit && (
          <TouchableOpacity onPress={() => onEdit(comment)}>
            {/* Example using your Icon component, or Ionicons */}
            <Icon name="edit" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
        {canDelete && (
          <TouchableOpacity
            style={{ marginLeft: wp(3) }}
            onPress={() => setShowDeleteModal(true)}
          >
            <Icon name="delete" size={20} color="red" />
          </TouchableOpacity>
        )}
      </View>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirm Deletion</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete this comment?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "red" }]}
                onPress={handleConfirmDelete}
              >
                <Text style={styles.modalButtonText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#ccc" }]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: "#333" }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CommentCard;

const styles = StyleSheet.create({
  commentContainer: {
    flexDirection: "row",
    padding: hp(1.2),
    marginVertical: hp(0.5),
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    alignItems: "flex-start",
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    marginRight: wp(3),
  },
  textArea: {
    flex: 1,
  },
  authorName: {
    fontWeight: "bold",
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: hp(0.5),
  },
  commentText: {
    fontSize: 14,
    color: theme.colors.textDark,
  },
  actionIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: theme.colors.white,
    borderRadius: 10,
    padding: wp(5),
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: hp(1),
    color: theme.colors.text,
  },
  modalMessage: {
    fontSize: 14,
    marginBottom: hp(2),
    color: theme.colors.text,
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
});
