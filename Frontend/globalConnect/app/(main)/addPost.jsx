import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import ScreenWrapper from "../../components/ScreenWrapper";
import BottomNav from "../../components/bottomNav";
import Icon from "../../assets/icons";
import { userAuth } from "../../contexts/AuthContext";
import { theme } from "../../constants/theme";
import config from "../../constants/config";
import Header from "../../components/Header";
import TextEditor from "../../components/TextEditor";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { hp } from "../../helpers/common";
import axios from "axios";

const AddPost = () => {
  const { user, authToken } = userAuth();
  const bodyRef = useRef("");
  const editorRef = useRef(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);

  // Category & Tags state
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  const ip = config.API_IP;
  // Safely extract the profile image path from the nested user object.
  const profileImagePath =
    user?.user?.profile_image?.uri || user?.user?.profile_image || "";
  const profileImageURL = profileImagePath
    ? `http://${ip}:3000/${profileImagePath}`
    : "https://via.placeholder.com/100";

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`http://${ip}:3000/api/category/all`);
        if (response.data && response.data.categories) {
          setCategories(response.data.categories);
          if (response.data.categories.length > 0) {
            setSelectedCategory(response.data.categories[0]._id);
          }
        }
      } catch (error) {
        console.error(
          "Error fetching categories:",
          error.response ? error.response.data : error.message
        );
      }
    };

    fetchCategories();
  }, []);

  // Function to pick an image from the gallery
  const onPick = async () => {
    if (files.length >= 4) {
      alert("You can only add up to 4 images.");
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
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
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

  // Add this function to handle tag input
  const handleTagInput = (text) => {
    setTagInput(text);
    
    // If user types a space or comma after text, create a new tag
    if (text.endsWith(' ') || text.endsWith(',')) {
      const newTag = text.slice(0, -1).trim();
      if (newTag && !tags.includes(newTag)) {
        // Add # if it doesn't start with one
        const formattedTag = newTag.startsWith('#') ? newTag : `#${newTag}`;
        setTags([...tags, formattedTag]);
      }
      setTagInput('');
    }
  };

  // Add this function to remove tags
  const removeTag = (indexToRemove) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  // Modify the onSubmit function to include tags
  const onSubmit = async () => {
    try {
      let response;
      if (files.length > 0) {
        const data = new FormData();
        data.append("category_id", selectedCategory);
        data.append("text_content", bodyRef.current);
        // Add tags to FormData
        tags.forEach(tag => {
          data.append("tags", tag.replace('#', '')); // Remove # before sending
        });
        files.forEach((file) => {
          let filename = file.uri.split("/").pop();
          let match = /\.(\w+)$/.exec(filename);
          let type = match ? `image/${match[1]}` : "image";
          data.append("media", { uri: file.uri, name: filename, type });
        });

        response = await axios.post(`http://${ip}:3000/api/post/create`, data, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        const payload = {
          category_id: selectedCategory,
          text_content: bodyRef.current,
          tags: tags.map(tag => tag.replace('#', '')), // Remove # before sending
        };

        response = await axios.post(
          `http://${ip}:3000/api/post/create`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          }
        );
      }

      if (response.status === 201 || response.status === 200) {
        Alert.alert("Success", "Post created successfully!");
        router.replace("home");
      } else {
        throw new Error("Post creation failed with status " + response.status);
      }
    } catch (error) {
      if (error.response) {
        console.error("Error creating post:", error.response.data);
        Alert.alert(
          "Error",
          `Failed to create post: ${JSON.stringify(error.response.data)}`
        );
      } else {
        console.error("Error creating post:", error.message);
        Alert.alert("Error", `Failed to create post: ${error.message}`);
      }
    }
  };

  return (
    <ScreenWrapper bg={theme.colors.white}>
      <View style={styles.container}>
        <Header title="Create Post" showBackButton={true} />
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
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
                      setSelectedCategory(category._id);
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

          {/* Tags Input Section */}
          <View style={styles.tagsContainer}>
            <Text style={styles.label}>Tags</Text>
            <TextInput
              style={styles.tagInput}
              value={tagInput}
              onChangeText={handleTagInput}
              placeholder="Add tags (e.g., #travel)"
              placeholderTextColor="#999"
            />
            {/* Display Tags */}
            <View style={styles.tagsWrapper}>
              {tags.map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.tag}
                  onPress={() => removeTag(index)}
                >
                  <Text style={styles.tagText}>{tag}</Text>
                  <Text style={styles.tagRemove}>×</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Post Button */}
          <TouchableOpacity style={styles.postButton} onPress={onSubmit}>
            <Text style={styles.postButtonText}>Post</Text>
          </TouchableOpacity>
        </ScrollView>

        <BottomNav />
      </View>
    </ScreenWrapper>
  );
};

export default AddPost;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100, // Add extra padding at bottom for content
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
  postButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 30,
  },
  postButtonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  // Styles for displaying multiple images
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
  // Category selection styles
  categoryContainer: {
    marginBottom: 20,
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
  // Tags input style (if needed)
  tagsContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: theme.colors.textDark,
    marginBottom: 8,
    fontWeight: '500',
  },
  tagInput: {
    backgroundColor: theme.colors.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.textDark,
    marginBottom: 8,
  },
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: theme.colors.white,
    fontSize: 14,
    marginRight: 4,
  },
  tagRemove: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
