import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar
} from "react-native";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";

import PostCardDetails from "../../components/PostCardDetails";
import UserProfileCard from "../../components/UserProfileCard";
import { userAuth } from "../../contexts/AuthContext";
import config from "../../constants/config";
import { useLocalSearchParams, useRouter } from "expo-router";
import { theme } from "../../constants/theme";
import BottomNav from "../../components/bottomNav";

const UserProfile = () => {
  const { userId } = useLocalSearchParams();
  const ip = config.API_IP;
  const router = useRouter();
  const { authToken, user: currentUser } = userAuth();

  const [userData, setUserData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUserProfile = async () => {
    try {
      setRefreshing(true);
      const response = await axios.get(
        `http://${ip}:3000/api/profile/user-data-user/${userId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      const { user, posts } = response.data.data;

      // Transform user data into expected format
      const formattedUser = {
        ...user,
        _id: user.id, 
        posts_count: user.postsCount,
        followers: user.followersCount,
        following: user.followingCount,
      };

      // Transform posts data
      const transformedPosts = posts.map((post) => ({
        id: post._id,
        content: post.text_content,
        time: post.createdAt,
        likeCount: post.likesCount,
        commentCount: post.commentsCount,
        liked: currentUser ? post.likes.includes(currentUser._id) : false,
        media: post.media?.length > 0 ? post.media.map((m) => m.media_path) : [],
        user: formattedUser,
      }));

      setUserData(formattedUser);
      setPosts(transformedPosts);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    } else {
      console.error("Invalid or missing userId:", userId);
      setLoading(false);
    }
  }, [userId, currentUser, ip, authToken]);

  const onRefresh = () => {
    fetchUserProfile();
  };


  const handleFollowToggle = async () => {
    try {
      const endpoint = `http://${ip}:3000/api/users/${userData.isFollowing ? 'unfollow' : 'follow'}/${userId}`;
      
      const response = await axios.post(endpoint, {}, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.data.success) {
        // Update local state
        setUserData(prevData => ({
          ...prevData,
          isFollowing: !prevData.isFollowing,
          followers: prevData.isFollowing 
            ? prevData.followers - 1 
            : prevData.followers + 1
        }));
      }
    } catch (error) {
      console.error('Follow/Unfollow error:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        userId
      });
      Alert.alert(
        'Error',
        'Unable to update follow status. Please try again.'
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      <FlatList
        ListHeaderComponent={() => (
          <>
            {userData && (
              <View style={styles.profileContainer}>
                <UserProfileCard
                  user={userData}
                  isFollowing={userData.isFollowing}
                  onFollowToggle={() => {
                    console.log("Toggle follow for", userData._id);
                  }}
                />
              </View>
            )}
            <Text style={styles.sectionTitle}>Posts</Text>
          </>
        )}
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCardDetails
            item={item}
            currentUser={currentUser}
            router={router}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        ListEmptyComponent={
          <Text style={styles.noPosts}>No posts available.</Text>
        }
      />
      <BottomNav/>
    </SafeAreaView>
  );
};

export default UserProfile;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileContainer: {
    padding: 16,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.textDark,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  listContent: {
    paddingBottom: 20,
  },
  noPosts: {
    textAlign: "center",
    fontSize: 16,
    marginVertical: 20,
    color: theme.colors.textMedium,
  },
});
