import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";

export default function AddPost() {
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [fields, setFields] = useState([]); // Store dynamic fields
  const [formData, setFormData] = useState({}); // Dynamic form data
  const [selectedImages, setSelectedImages] = useState([]);
  const authToken = "your-auth-token"; // Replace with the actual token

  // Fetch categories and fields dynamically
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("http://192.168.18.105:3000/api/category/all");
        setCategories(response.data.categories);
        if (response.data.categories.length > 0) {
          setCategory(response.data.categories[0].id); // Set default category
          setFields(response.data.categories[0].fields); // Set fields for the first category
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  // Handle form field change dynamically
  const handleFieldChange = (fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  // Pick multiple images
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Permission Denied", "You need to allow access to your photos to upload images.");
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

  // Handle form submission
  const handleSubmit = async () => {
    const postData = {
      category_id: category,
      ...formData, // Include all dynamic fields in the post data
      media: selectedImages.map((uri) => ({
        media_path: uri,
        media_type: "image",
        description: "Uploaded image",
      })),
    };

    try {
      const response = await axios.post("http://localhost:3000/api/post/create", postData, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      Alert.alert("Success", "Post created successfully!");
      console.log("Post created:", response.data);
    } catch (error) {
      Alert.alert("Error", "Failed to create post.");
      console.error("Error creating post:", error);
    }
  };

  // Render dynamic fields based on category and schema
  const renderInputFields = () => {
    return fields.map((field, index) => {
      switch (field.type) {
        case "text":
          return (
            <TextInput
              key={index}
              style={styles.input}
              placeholder={field.label}
              value={formData[field.name] || ""}
              onChangeText={(value) => handleFieldChange(field.name, value)}
            />
          );
        case "textarea":
          return (
            <TextInput
              key={index}
              style={[styles.textInput, { height: 80 }]}
              placeholder={field.label}
              multiline
              value={formData[field.name] || ""}
              onChangeText={(value) => handleFieldChange(field.name, value)}
            />
          );
        case "dropdown":
          return (
            <Picker
              key={index}
              selectedValue={formData[field.name] || ""}
              style={styles.picker}
              onValueChange={(value) => handleFieldChange(field.name, value)}
            >
              {field.options.map((option, idx) => (
                <Picker.Item key={idx} label={option.label} value={option.value} />
              ))}
            </Picker>
          );
        case "file":
          return (
            <TouchableOpacity key={index} style={styles.uploadButton} onPress={pickImage}>
              <Text style={styles.uploadButtonText}>Add File</Text>
            </TouchableOpacity>
          );
        default:
          return null;
      }
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Create Post</Text>
      </View>

      {/* Category Picker */}
      <Text style={styles.label}>Select Category</Text>
      <Picker
        selectedValue={category}
        style={styles.picker}
        onValueChange={(itemValue) => {
          setCategory(itemValue);
          const selectedCategory = categories.find((cat) => cat.id === itemValue);
          setFields(selectedCategory.fields);
        }}
      >
        {categories.map((cat) => (
          <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
        ))}
      </Picker>

      {/* Dynamic Input Fields */}
      {renderInputFields()}

      {/* Tags Input */}
      <TextInput
        style={styles.input}
        placeholder="Enter tags (comma-separated)"
        value={formData.tags || ""}
        onChangeText={(value) => handleFieldChange("tags", value)}
      />

      {/* Submit Button */}
      <TouchableOpacity style={styles.postButton} onPress={handleSubmit}>
        <Text style={styles.postButtonText}>Post</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f9f9f9",
  },
  picker: {
    flex: 1,
    marginLeft: 8,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  textInput: {
    height: 120,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    textAlignVertical: "top",
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: "#007BFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  postButton: {
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  postButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
