import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';  // Import ImagePicker

export default function Profile() {
  const [profileData, setProfileData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imageUri, setImageUri] = useState(null); // For storing the picked image URI

  const router = useRouter();

  // Fetch Profile and Posts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const authToken = await AsyncStorage.getItem('authToken');
        if (!authToken) {
          Alert.alert('Error', 'No authentication token found. Please log in.');
          return;
        }

        const config = { headers: { Authorization: `Bearer ${authToken}` } };

        const profileResponse = await axios.get(
          'http://192.168.18.105:3000/api/profile/getUserProfile',
          config
        );

        setProfileData(profileResponse.data.data.user);
        setPosts(profileResponse.data.data.posts);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch profile data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle image selection
  const handleImagePick = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission required', 'We need access to your photos to change the profile picture.');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!pickerResult.canceled) {
      setImageUri(pickerResult.assets[0].uri); // Update based on ImagePicker return structure
      uploadImage(pickerResult.assets[0].uri);
    }
  };

  // Handle image upload to the server
  const uploadImage = async (uri) => {
    try {
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        Alert.alert('Error', 'No authentication token found.');
        return;
      }

      const formData = new FormData();
      formData.append('image', {
        uri: uri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      });

      const config = {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data',
        },
      };

      const response = await axios.post(
        'http://192.168.18.105:3000/api/profile/update-profile',
        formData,
        config
      );

      if (response.data.success) {
        Alert.alert('Success', 'Profile image updated successfully!');
        setProfileData((prevData) => ({
          ...prevData,
          profile_image: response.data.profileImage,
        }));
      } else {
        Alert.alert('Error', 'Failed to update profile image.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image.');
    }
  };

  const renderPost = ({ item }) => (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <Image
          source={{ uri: profileData?.profile_image || 'https://via.placeholder.com/50' }}
          style={styles.postAvatar}
        />
        <View style={styles.postInfo}>
          <Text style={styles.postUser}>{profileData?.name || 'User'}</Text>
          <Text style={styles.postLocation}>{item.location || 'Unknown Location'}</Text>
        </View>
        <Text style={styles.postTime}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.postContent}>{item.text_content}</Text>
      {item.media_path && (
        <Image source={{ uri: item.media_path }} style={styles.postMedia} />
      )}
      <View style={styles.postActions}>
        <TouchableOpacity>
          <Icon name="thumb-up" size={24} style={styles.actionIcon} />
        </TouchableOpacity>
        <TouchableOpacity>
          <Icon name="chat-bubble-outline" size={24} style={styles.actionIcon} />
        </TouchableOpacity>
        <TouchableOpacity>
          <Icon name="share" size={24} style={styles.actionIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <TouchableOpacity onPress={handleImagePick}>
          <Image
            source={{ uri: imageUri || profileData?.profile_image || 'https://via.placeholder.com/100' }}
            style={styles.profileImage}
          />
        </TouchableOpacity>
        <Text style={styles.profileName}>{profileData?.name || 'Unknown User'}</Text>
        <Text style={styles.profileEmail}>{profileData?.email}</Text>
        <Text style={styles.profileLocation}>
          {profileData?.location} ➡ {profileData?.destination_country}
        </Text>
        <TouchableOpacity
          style={styles.settingsIcon}
          onPress={() => router.replace("/(settings)")}
        >
          <Icon name="settings" size={30} color="#555" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={renderPost}
        contentContainerStyle={styles.postsContainer}
        ListEmptyComponent={<Text style={styles.noPostsText}>No posts available.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileHeader: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileEmail: {
    fontSize: 14,
    color: '#777',
    marginBottom: 5,
  },
  profileLocation: {
    fontSize: 14,
    color: '#555',
  },
  settingsIcon: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  postsContainer: {
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  postContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  postAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  postInfo: {
    flex: 1,
  },
  postUser: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  postLocation: {
    fontSize: 12,
    color: '#777',
  },
  postTime: {
    fontSize: 12,
    color: '#777',
  },
  postContent: {
    fontSize: 14,
    color: '#333',
    marginBottom: 15,
  },
  postMedia: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionIcon: {
    color: '#777',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPostsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#777',
    marginTop: 20,
  },
});
