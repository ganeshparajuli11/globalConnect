import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import config from "../config";

export default function Profile() {
  const ip = config.API_IP;
  const [profileData, setProfileData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imageUri, setImageUri] = useState(null);
  const [followCounts, setFollowCounts] = useState({ followerCount: 0, followingCount: 0 });

  const router = useRouter();

  // Fetch Profile, Posts, and Follow Counts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const authToken = await AsyncStorage.getItem('authToken');
        if (!authToken) {
          Alert.alert('Error', 'No authentication token found. Please log in.');
          return;
        }

        const configReq = { headers: { Authorization: `Bearer ${authToken}` } };

        // Fetch profile data
        const profileResponse = await axios.get(
          `http://${ip}:3000/api/profile/getUserProfile`,
          configReq
        );
        setProfileData(profileResponse.data.data.user);
        setPosts(profileResponse.data.data.posts);

        // Fetch follower and following counts
        const followCountsResponse = await axios.get(
          `http://${ip}:3000/api/profile/follow-counts`,
          configReq
        );
        setFollowCounts(followCountsResponse.data);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch profile data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle image selection for profile picture
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
      setImageUri(pickerResult.assets[0].uri); 
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

      const configUpload = {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data',
        },
      };

      const response = await axios.post(
        `http://${ip}:3000/api/profile/profile/update-profile`,
        formData,
        configUpload
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

  // Updated post design to match main feed posts
  const renderPost = ({ item }) => (
    <View style={styles.postContainer}>
      {/* User Info */}
      <View style={styles.userInfoContainer}>
        <Image
          source={{ uri: profileData?.profile_image || 'https://via.placeholder.com/40' }}
          style={styles.userImage}
        />
        <View style={styles.userInfoTextContainer}>
          <Text style={styles.userName}>{profileData?.name || 'User'}</Text>
          <Text style={styles.postType}>
            {item.category_name ? `Shared as ${item.category_name}` : 'Shared a post'}
          </Text>
        </View>
        <Text style={styles.postTime}>
        {item.createdAt}
        </Text>
      </View>

      {/* Post Content */}
      <Text style={styles.postContent}>{item.text_content}</Text>
      {item.media_path && item.media_path !== "" && (
        <Image source={{ uri: item.media_path }} style={styles.postImage} />
      )}

      {/* Post Actions */}
      <View style={styles.postActionsContainer}>
        <TouchableOpacity>
          <Icon name="heart-o" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Icon name="comment-o" size={24} color="#3498db" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Icon name="share" size={24} color="#2ecc71" />
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
      {/* Profile Header */}
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
          Destination: {profileData?.destination_country}
        </Text>

        {/* Followers & Following Section */}
        <View style={styles.followContainer}>
          <TouchableOpacity onPress={() => { () => router.replace("/(settings)") }}>
            <Text style={styles.followText}>
              Followers: {followCounts.followerCount}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { /* Navigate to Following screen */ }}>
            <Text style={styles.followText}>
              Following: {followCounts.followingCount}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.settingsIcon}
          onPress={() => router.replace("/(settings)")}
        >
          <Icon name="cog" size={30} color="#555" />
        </TouchableOpacity>
      </View>

      {/* Posts Feed */}
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
  followContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginTop: 10,
  },
  followText: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: 'bold',
  },
  settingsIcon: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  postsContainer: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 20,
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
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userInfoTextContainer: {
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  postType: {
    color: '#666',
    fontSize: 14,
  },
  postTime: {
    fontSize: 12,
    color: '#aaa',
  },
  postContent: {
    fontSize: 14,
    marginBottom: 10,
    color: '#333',
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  postActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
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