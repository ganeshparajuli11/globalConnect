import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import config from "../config";

export default function AddPost() {
  const ip = config.API_IP;
  const router = useRouter();

  // Required fields state
  const [textContent, setTextContent] = useState("");
  const [tags, setTags] = useState(""); // Comma-separated string (e.g., "software, developer, hiring")
  const [selectedImages, setSelectedImages] = useState([]);

  // Category state
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  // Fetch categories from API
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

  // Pick image from gallery (optional)
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Denied", "Allow access to photos to upload images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImages([...selectedImages, result.assets[0].uri]);
    }
  };

  const removeImage = (uri) => {
    setSelectedImages(selectedImages.filter((image) => image !== uri));
  };

  // Submit the post with only required fields
  const handleSubmit = async () => {
    // Prepare our required payload
    // Convert comma-separated tags into an array and remove empty entries.
    const tagsArray = tags.split(",").map((tag) => tag.trim()).filter(Boolean);

    const authToken = await AsyncStorage.getItem("authToken");

    try {
      let response;
      // If images are selected, use FormData
      if (selectedImages.length > 0) {
        const data = new FormData();
        data.append("category_id", selectedCategory);
        data.append("text_content", textContent);
        // Append each tag separately. Many backends (with multer) will collect these into an array.
        tagsArray.forEach((tag) => data.append("tags", tag));

        // Append each image file.
        selectedImages.forEach((uri) => {
          let filename = uri.split("/").pop();
          let match = /\.(\w+)$/.exec(filename);
          let type = match ? `image/${match[1]}` : "image";
          data.append("media", { uri, name: filename, type });
        });

        response = await axios.post(`http://${ip}:3000/api/post/create`, data, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        // No images: send JSON payload
        const payload = {
          category_id: selectedCategory,
          text_content: textContent,
          tags: tagsArray,
        };

        response = await axios.post(`http://${ip}:3000/api/post/create`, payload, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });
      }

      if (response.status === 201 || response.status === 200) {
        Alert.alert("Success", "Post created successfully!");
        router.replace("/(tab)");
      } else {
        throw new Error("Post creation failed with status " + response.status);
      }
    } catch (error) {
      if (error.response) {
        console.error("Error creating post:", error.response.data);
        Alert.alert("Error", `Failed to create post: ${JSON.stringify(error.response.data)}`);
      } else {
        console.error("Error creating post:", error.message);
        Alert.alert("Error", `Failed to create post: ${error.message}`);
      }
    }
  };

  // Confirm discard
  const handleGoBack = () => {
    Alert.alert("Discard Post?", "Are you sure you want to discard this post?", [
      { text: "Cancel", style: "cancel" },
      { text: "Yes", onPress: () => router.replace("/(tab)") },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9f9f9" }}>
      <ScrollView style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.header}>Create Post</Text>
        </View>

        {/* Category Picker */}
        <Text style={styles.label}>Select Category</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedCategory}
            style={styles.picker}
            onValueChange={(itemValue) => setSelectedCategory(itemValue)}
          >
            {categories.map((cat) => (
              <Picker.Item key={cat._id} label={cat.name} value={cat._id} />
            ))}
          </Picker>
        </View>

        {/* Text Content Input */}
        <TextInput
          style={styles.input}
          placeholder="Enter your post"
          value={textContent}
          onChangeText={setTextContent}
          multiline
        />

        {/* Tags Input */}
        <TextInput
          style={styles.input}
          placeholder="Enter tags (comma separated)"
          value={tags}
          onChangeText={setTags}
        />

        {/* Image Upload Button (Optional) */}
        <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
          <Text style={styles.uploadButtonText}>Add Image</Text>
        </TouchableOpacity>

        {/* Display Selected Images */}
        <ScrollView horizontal>
          {selectedImages.map((uri, index) => (
            <View key={index} style={{ position: "relative", marginRight: 10 }}>
              <Image source={{ uri }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.removeImage} onPress={() => removeImage(uri)}>
                <Ionicons name="close-circle" size={20} color="red" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* Submit Button */}
        <TouchableOpacity style={styles.postButton} onPress={handleSubmit}>
          <Text style={styles.postButtonText}>Post</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: { marginRight: 16 },
  header: { fontSize: 24, fontWeight: "bold" },
  label: { fontSize: 16, marginBottom: 8 },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 16,
    overflow: "hidden",
  },
  picker: { height: 50, width: "100%" },
  input: {
    minHeight: 45,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  uploadButton: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  uploadButtonText: { color: "#fff", fontSize: 16 },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 10,
  },
  removeImage: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "#fff",
    borderRadius: 50,
    padding: 5,
  },
  postButton: {
    backgroundColor: "#28a745",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  postButtonText: { color: "#fff", fontSize: 16 },
});
