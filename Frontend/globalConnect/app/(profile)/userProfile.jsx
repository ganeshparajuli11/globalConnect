// UserProfile.jsx
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  FlatList,
} from "react-native";
import axios from "axios";

import PostCardDetails from "../../components/PostCardDetails";
import UserProfileCard from "../../components/UserProfileCard";
import { userAuth } from "../../contexts/AuthContext";
import config from "../../constants/config";
import { useLocalSearchParams, useRouter } from "expo-router";
import ScreenWrapper from "../../components/ScreenWrapper";

const UserProfile = () => {
    const { userId } = useLocalSearchParams();
  const ip = config.API_IP;
  const router = useRouter();
  const { authToken, user: currentUser } = userAuth();

  const [userData, setUserData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(
          `http://${ip}:3000/api/profile/user-data-user/${userId}`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );

        const { user, posts } = response.data.data;

        // Transform backend user data to match the expected structure
        const formattedUser = {
          ...user,
          _id: user.id, 
          posts_count: user.postsCount,
          followers: user.followersCount,
          following: user.followingCount,
        };

        // Transform posts data for PostCardDetails
        const transformedPosts = posts.map((post) => ({
          id: post._id, // Map _id to id
          content: post.text_content,
          time: post.createdAt,
          likeCount: post.likesCount,
          commentCount: post.commentsCount,
          // Determine if the current user has liked the post
          liked: currentUser ? post.likes.includes(currentUser._id) : false,
          // Convert media objects to an array of media URLs
          media:
            post.media && post.media.length > 0
              ? post.media.map((m) => m.media_path)
              : [],
          // Attach the formatted user data as the post's user
          user: formattedUser,
        }));

        setUserData(formattedUser);
        setPosts(transformedPosts);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserProfile();
    } else {
      console.error("Invalid or missing userId:", userId);
      setLoading(false);
    }
  }, [userId, currentUser, ip, authToken]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <ScreenWrapper style={styles.container}>
      {userData && (
        <UserProfileCard
          user={userData}
          isFollowing={userData.isFollowing}
          // Optionally, pass onFollowToggle if you want to handle follow/unfollow actions here.
          onFollowToggle={(id, newStatus) =>
            console.log("Toggle follow for", id, "->", newStatus)
          }
        />
      )}

      <Text style={styles.sectionTitle}>Posts</Text>

      {posts.length > 0 ? (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCardDetails
              item={item}
              currentUser={currentUser}
              router={router}
            />
          )}
        />
      ) : (
        <Text style={styles.noPosts}>No posts available.</Text>
      )}
    </ScreenWrapper>
  );
};

export default UserProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fff",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 10,
  },
  noPosts: {
    textAlign: "center",
    fontSize: 16,
    marginTop: 20,
    color: "gray",
  },
});
