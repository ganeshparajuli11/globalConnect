import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import ScreenWrapper from "../../components/ScreenWrapper";
import BottomNav from "../../components/bottomNav";
import Icon from "../../assets/icons";
import { userAuth } from "../../contexts/AuthContext";
import { theme } from "../../constants/theme";
import config from "../../constants/config";
import Header from "../../components/Header";
import TextEditor from "../../components/TextEditor";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { hp } from "../../helpers/common";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";

const EditPost = () => {
  const { postId } = useLocalSearchParams();
  const { user, authToken, refreshUserProfile } = userAuth();
  const bodyRef = useRef("");
  const editorRef = useRef(null);
  const router = useRouter();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [post, setPost] = useState(null);
  const [removedMediaIds, setRemovedMediaIds] = useState([]);

  // Category state
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // For exit confirmation dialog
  const [showExitDialog, setShowExitDialog] = useState(false);
  const pendingNavigationEvent = useRef(null);

  const ip = config.API_IP;
  // Correctly extract the profile image path from nested user data.
  const profileImagePath =
    user?.user?.profile_image?.uri || user?.user?.profile_image || "";
  const profileImageURL = profileImagePath
    ? `http://${ip}:3000/${profileImagePath}`
    : "https://via.placeholder.com/100";

  // We'll store some initial values to detect unsaved changes.
  const initialPostData = useRef(null);

  // Function to check for unsaved changes.
  const checkUnsavedChanges = () => {
    if (!post || !initialPostData.current) return false;
    const originalContent = initialPostData.current.content;
    const originalCategory = initialPostData.current.category;
    const originalMediaCount = initialPostData.current.mediaCount;
    return (
      bodyRef.current !== originalContent ||
      selectedCategory !== originalCategory ||
      removedMediaIds.length > 0 ||
      files.some((file) => !file.isExisting) ||
      files.length !== originalMediaCount
    );
  };

  // Listen for navigation events to show confirmation dialog on unsaved changes.
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (!checkUnsavedChanges()) return;
      // Prevent default behavior of leaving the screen.
      e.preventDefault();
      pendingNavigationEvent.current = e;
      setShowExitDialog(true);
    });
    return unsubscribe;
  }, [navigation, post, files, selectedCategory, removedMediaIds]);

  // Fetch post data and categories on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch post details
        const postResponse = await axios.get(
          `http://${ip}:3000/api/post/${postId}`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );

        if (postResponse.data && postResponse.data.data) {
          const postData = postResponse.data.data;
          console.log("Successfully parsed post data:", {
            id: postData.id,
            content: postData.content?.substring(0, 50) + "...",
            category: postData.category,
            mediaCount: postData.media?.length || 0,
          });

          setPost(postData);
          bodyRef.current = postData.content;

          // Store initial data for unsaved changes detection
          initialPostData.current = {
            content: postData.content,
            category: postData.category?.id || "", 
            mediaCount: postData.media?.length || 0,
          };

          // Set category based on post data
          if (postData.category?.id) {
            console.log("Setting category from post data:", postData.category.id);
            setSelectedCategory(postData.category.id);
          }

          // Set existing media with proper URL construction
          if (postData.media && postData.media.length > 0) {
            console.log(`Processing ${postData.media.length} media items`);
            const formattedMedia = postData.media.map((mediaItem) => {
              const mediaUrl = mediaItem.url;
              const fullUrl = mediaUrl.startsWith("/")
                ? `http://${ip}:3000${mediaUrl}`
                : mediaUrl;
              console.log("Formatted media URL:", fullUrl);
              return {
                uri: fullUrl,
                id: mediaItem.id, // Use the `id` field from the media object
                isExisting: true, // Flag to identify existing media
              };
            });
            setFiles(formattedMedia);
          } else {
            console.log("No media found in post data");
            setFiles([]);
          }
        } else {
          console.error("Invalid post data structure:", postResponse.data);
          Alert.alert("Error", "Invalid post data received from server");
        }

        // Fetch categories
        console.log("Fetching categories...");
        const categoryResponse = await axios.get(
          `http://${ip}:3000/api/category/all`
        );
        if (categoryResponse.data && categoryResponse.data.categories) {
          console.log(
            `Successfully fetched ${categoryResponse.data.categories.length} categories`
          );
          setCategories(categoryResponse.data.categories);
        } else {
          console.error("Invalid category data structure:", categoryResponse.data);
          Alert.alert("Warning", "Failed to load categories");
        }
      } catch (error) {
        console.error("Error in fetchData:");
        if (error.response) {
          console.error("Server Error Response:", {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          });
          Alert.alert(
            "Server Error",
            `Failed to load post: ${
              error.response.data.message || "Unknown server error"
            }`
          );
        } else if (error.request) {
          console.error("No Response Error:", error.request);
          Alert.alert(
            "Network Error",
            "Failed to connect to server. Please check your internet connection."
          );
        } else {
          console.error("Request Setup Error:", error.message);
          Alert.alert(
            "Error",
            "An unexpected error occurred while loading the post"
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [postId, authToken, ip]);

  // Function to pick an image from the gallery
  const onPick = async () => {
    if (files.length >= 4) {
      Alert.alert("Limit Reached", "You can only add up to 4 images.");
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setFiles((prevFiles) => [...prevFiles, result.assets[0]]);
    }
  };

  // Remove an image at a given index
  const removeImage = (index) => {
    setFiles((prevFiles) => {
      const fileToRemove = prevFiles[index];
      // If it's an existing image, add its ID to removedMediaIds
      if (fileToRemove.isExisting && fileToRemove.id) {
        console.log("Adding media to removal list:", fileToRemove.id);
        setRemovedMediaIds((prev) => [...prev, fileToRemove.id]);
      }
      return prevFiles.filter((_, i) => i !== index);
    });
  };

  // Returns the correct URI for a file
  const getFileUri = (file) => {
    if (!file) return null;
    if (typeof file === "object" && file.uri) {
      return file.uri;
    }
    if (typeof file === "string") {
      return file;
    }
    return null;
  };



// Update post
const onSubmit = async () => {
  try {
    console.log("Starting post update process...");
    console.log("Preparing form data with:", {
      postId,
      categoryId: selectedCategory || "Not provided",
      contentLength: bodyRef.current?.length || 0,
      mediaCount: files.length,
      removedMediaCount: removedMediaIds.length,
    });

    const data = new FormData();

    // Trim the selectedCategory to ensure it's not just whitespace.
    const trimmedCategory = selectedCategory ? selectedCategory.trim() : "";
    console.log("Trimmed category ID:", trimmedCategory);
    // Append category_id only if a valid category is selected
    if (trimmedCategory) {
      data.append("category_id", trimmedCategory);
    }

    data.append("text_content", bodyRef.current);

    // Add the list of media IDs to remove
    if (removedMediaIds.length > 0) {
      console.log("Adding removed media IDs:", removedMediaIds);
      data.append("removed_media", JSON.stringify(removedMediaIds));
    }

    // Add any new images (only if they're not existing ones)
    const newMediaFiles = files.filter((file) => !file.isExisting);
    console.log(`Adding ${newMediaFiles.length} new media files to form data`);

    newMediaFiles.forEach((file, index) => {
      let filename = file.uri.split("/").pop();
      let match = /\.(\w+)$/.exec(filename);
      let type = match ? `image/${match[1]}` : "image";
      console.log(`Processing new file ${index + 1}:`, {
        filename,
        type,
        uri: file.uri.substring(0, 50) + "...", // First 50 chars of URI
      });
      data.append("media", { uri: file.uri, name: filename, type });
    });

    console.log("Sending update request to server...");
    const response = await axios.put(
      `http://${ip}:3000/api/post/edit/${postId}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("Update response received:", {
      status: response.status,
      data: response.data,
    });

    if (response.status === 200) {
      console.log("Post successfully updated");
      Alert.alert("Success", "Post updated successfully!");
      refreshUserProfile();
      initialPostData.current = {
        content: bodyRef.current,
        category: selectedCategory,
        mediaCount: files.length,
      };
      setRemovedMediaIds([]); // Clear removed media IDs after successful update
      router.back();
    } else {
      console.error("Unexpected success status:", response.status);
      throw new Error("Post update failed with status " + response.status);
    }
  } catch (error) {
    console.error("Error in onSubmit:");
    if (error.response) {
      console.error("Server Error Response:", {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
      Alert.alert(
        "Update Failed",
        `Server Error: ${error.response.data.message || "Unknown server error"}`
      );
    } else if (error.request) {
      console.error("No Response Error:", error.request);
      Alert.alert(
        "Network Error",
        "Failed to connect to server. Please check your internet connection."
      );
    } else {
      console.error("Request Setup Error:", error.message);
      Alert.alert(
        "Error",
        "An unexpected error occurred while updating the post"
      );
    }
  }
};



  // Ensure selectedCategory is set correctly when selecting a category
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId); // Set the selected category ID
  };

  // Handle exit dialog actions
  const handleDiscardChanges = () => {
    if (pendingNavigationEvent.current) {
      navigation.dispatch(pendingNavigationEvent.current.data.action);
    }
    setShowExitDialog(false);
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <Header title="Edit Post" showBackButton={true} />

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* User Info */}
        <View style={styles.userRow}>
          {user && user.user && user.user.profile_image ? (
            <Image source={{ uri: profileImageURL }} style={styles.avatar} />
          ) : (
            <Icon name="user" color={theme.colors.textDark} size={32} />
          )}
          <Text style={styles.username}>
            {user && user.user && user.user.name ? user.user.name : "Username"}
          </Text>
        </View>

        {/* Rich Text Editor */}
        <View style={styles.richTextEditor}>
          <TextEditor
            editorRef={editorRef}
            onChange={(body) => (bodyRef.current = body)}
            initialContent={post?.content}
          />
        </View>

        {/* Display Selected Images with Remove Icon */}
        {files.length > 0 && (
          <View style={styles.filesContainer}>
            {files.map((file, index) => (
              <View key={index} style={styles.fileWrapper}>
                <Image
                  source={{ uri: getFileUri(file) }}
                  style={styles.previewImage}
                />
                <TouchableOpacity
                  style={styles.removeIcon}
                  onPress={() => removeImage(index)}
                >
                  <Icon name="cross" color={theme.colors.textDark} size={20} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Media Options */}
        <View style={styles.mediaContainer}>
          <TouchableOpacity style={styles.mediaButton} onPress={onPick}>
            <Icon name="image" color={theme.colors.textDark} size={24} />
            <Text style={styles.mediaText}>Add Image</Text>
          </TouchableOpacity>
        </View>

        {/* Category Selection Dropdown */}
        <View style={styles.categoryContainer}>
          <Text style={styles.label}>Category</Text>
          <TouchableOpacity
            style={styles.categorySelect}
            onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
          >
            <Text style={styles.categorySelectText}>
              {categories.find((cat) => cat._id === selectedCategory)?.name ||
                "Select Category"}
            </Text>
          </TouchableOpacity>
          {showCategoryDropdown && (
            <View style={styles.categoryDropdown}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category._id}
                  onPress={() => {
                    handleCategorySelect(category._id);
                    setShowCategoryDropdown(false);
                  }}
                  style={styles.categoryItem}
                >
                  <Text style={styles.categoryItemText}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Update Button */}
        <TouchableOpacity style={styles.updateButton} onPress={onSubmit}>
          <Text style={styles.updateButtonText}>Update Post</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNav />

      {/* Exit Confirmation Modal */}
      {showExitDialog && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={showExitDialog}
          onRequestClose={() => setShowExitDialog(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Discard changes?</Text>
              <Text style={styles.modalMessage}>
                You have unsaved changes. Are you sure you want to discard them?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    setShowExitDialog(false);
                    pendingNavigationEvent.current = null;
                  }}
                >
                  <Text style={styles.modalButtonText}>Stay</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleDiscardChanges}
                >
                  <Text style={styles.modalButtonText}>Discard</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ScreenWrapper>
  );
};

export default EditPost;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    padding: 16,
    backgroundColor: theme.colors.white,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  username: {
    fontSize: 16,
    color: theme.colors.textDark,
    fontWeight: "600",
  },
  richTextEditor: {
    marginBottom: 20,
  },
  mediaContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginBottom: 20,
  },
  mediaButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.lightGray,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mediaText: {
    color: theme.colors.textDark,
    fontSize: 16,
    marginLeft: 8,
  },
  updateButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 30,
  },
  updateButtonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  filesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  fileWrapper: {
    width: "48%",
    height: hp(30),
    marginBottom: 10,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  removeIcon: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 4,
    zIndex: 1,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: theme.colors.textDark,
    marginBottom: 8,
  },
  categorySelect: {
    backgroundColor: theme.colors.lightGray,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  categorySelectText: {
    fontSize: 16,
    color: theme.colors.textDark,
  },
  categoryDropdown: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginTop: 5,
    maxHeight: 200,
  },
  categoryItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  categoryItemText: {
    fontSize: 16,
    color: theme.colors.textDark,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: theme.colors.white,
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 10,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonText: {
    color: theme.colors.white,
    fontSize: 16,
  },
});
