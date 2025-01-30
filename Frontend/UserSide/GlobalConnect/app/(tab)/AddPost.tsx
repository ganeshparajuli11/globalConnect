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
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [fields, setFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [selectedImages, setSelectedImages] = useState([]);
  const [tags, setTags] = useState(""); // State for tags

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`http://${ip}:3000/api/category/all`);
        setCategories(response.data.categories);
        if (response.data.categories.length > 0) {
          setCategory(response.data.categories[0]._id);
          setFields(response.data.categories[0].fields);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  // Handle input change
  const handleFieldChange = (fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  // Pick Image
  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Denied",
        "Allow access to photos to upload images."
      );
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

  // Submit Form
  const handleSubmit = async () => {
    const authToken = await AsyncStorage.getItem("authToken");
    const data = new FormData();

    data.append("category_id", category);

    // Prepare fields as an array of objects with name and value
    const formattedFields = fields.map((field) => {
      return { name: field.name, value: formData[field.name] || "" };
    });

    data.append("fields", JSON.stringify(formattedFields));

    // Append tags to FormData
    const tagsArray = tags.split(",").map((tag) => tag.trim()); // Split tags by commas and remove spaces
    data.append("tags", JSON.stringify(tagsArray));

    // Append other data like location, visibility, and metadata
    data.append("location", "Sydney, Australia");
    data.append("visibility", "public");
    data.append(
      "metadata",
      JSON.stringify({ salary: "100,000 AUD", employment_type: "Full-time" })
    );

    // Append images to FormData
    selectedImages.forEach((uri, index) => {
      let filename = uri.split("/").pop();
      let match = /\.(\w+)$/.exec(filename);
      let type = match ? `image/${match[1]}` : "image";

      // Debugging: Check if the image is correctly formatted
      console.log("Appending image:", uri, filename, type);

      data.append("media", {
        uri,
        name: filename,
        type,
      });
    });

    try {
      console.log("Sending data:", data); // Debugging: log FormData

      const response = await axios.post(
        `http://${ip}:3000/api/post/create`,
        data,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        Alert.alert("Success", "Post created successfully!");
        router.replace("/(tab)");
      } else {
        throw new Error("Post creation failed.");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      Alert.alert("Error", "Failed to create post.");
    }
  };

  const handleGoBack = () => {
    Alert.alert(
      "Discard Post?",
      "Are you sure you want to discard this post?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: () => router.replace("/(tab)"), // Navigate to home tab
        },
      ]
    );
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
            selectedValue={category}
            style={styles.picker}
            onValueChange={(itemValue) => {
              setCategory(itemValue);
              const selectedCategory = categories.find(
                (cat) => cat._id === itemValue
              );
              setFields(selectedCategory ? selectedCategory.fields : []);
            }}
          >
            {categories.map((cat) => (
              <Picker.Item key={cat._id} label={cat.name} value={cat._id} />
            ))}
          </Picker>
        </View>

        {/* Dynamic Input Fields */}
        {fields.map((field, index) => (
          <TextInput
            key={index}
            style={styles.input}
            placeholder={field.label}
            value={formData[field.name] || ""}
            onChangeText={(value) => handleFieldChange(field.name, value)}
          />
        ))}

        {/* Tags Field */}
        <TextInput
          style={styles.input}
          placeholder="Enter tags (comma separated)"
          value={tags}
          onChangeText={(value) => setTags(value)}
        />

        {/* Image Upload */}
        <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
          <Text style={styles.uploadButtonText}>Add Image</Text>
        </TouchableOpacity>

        {/* Display Selected Images */}
        <ScrollView horizontal>
          {selectedImages.map((uri, index) => (
            <View key={index} style={{ position: "relative", marginRight: 10 }}>
              <Image source={{ uri }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeImage}
                onPress={() => removeImage(uri)}
              >
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
  label: { fontSize: 16, fontWeight: "500", marginBottom: 8 },
  pickerWrapper: { marginBottom: 16 },
  picker: { height: 50, borderColor: "#ccc", borderWidth: 1, borderRadius: 8 },
  input: {
    height: 45,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingLeft: 10,
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
