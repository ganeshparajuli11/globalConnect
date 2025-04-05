// show all the followers and following of a user where user can both follow and unfollow them too. 

import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { theme } from "../../constants/theme";
import { hp, wp } from "../../helpers/common";
import UserCard from "../../components/UserCard";
import axios from "axios";
import config from "../../constants/config";
import { userAuth } from "../../contexts/AuthContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import Icon from "../../assets/icons";
import BackButton from "../../components/BackButton";
import ScreenWrapper from "../../components/ScreenWrapper";


const FollowerPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("followers");
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const { authToken } = userAuth();
  const ip = config.API_IP;

  // Header component
  const Header = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <BackButton size={24} color={theme.colors.black} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>
        {activeTab === "followers" ? "Followers" : "Following"}
      </Text>
    </View>
  );

  // Fetch followers and following
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const [followersRes, followingRes] = await Promise.all([
        axios.get(`http://${ip}:3000/api/followers`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        axios.get(`http://${ip}:3000/api/following`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);

      console.log("Followers Response:", followersRes.data);
      console.log("Following Response:", followingRes.data);

      // Extract the followers and following arrays from the response
      const followersData = followersRes.data.followers || [];
      const followingData = followingRes.data.following || [];

      // Add isFollowing property to each user
      const processedFollowers = followersData.map(user => ({
        ...user,
        isFollowing: followingData.some(f => f._id === user._id)
      }));

      const processedFollowing = followingData.map(user => ({
        ...user,
        isFollowing: true
      }));

      console.log("Processed Followers:", processedFollowers);
      console.log("Processed Following:", processedFollowing);

      setFollowers(processedFollowers);
      setFollowing(processedFollowing);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);


//   console.log("testing followers", followers)


// It fetch the followers and following of the user but it is not showing the followers and following of the user.
// testing followers {"followers": [{"_id": "67b424dd03b4e39a4a5ee46d", "email": "ganeshparajuli2059@gmail.com", "name": "Ganesh parajuli", "profile_image": "uploads/profile/1739891854907.jpg"}, {"_id": "67b800e7c22c9ff2c84c226d", "email": "rautmandip717@gmail.com", "name": "Mandip raut", "profile_image": "uploads/profile/1740201902305.jpg"}], "success": true}

  // Handle follow/unfollow toggle
  const handleFollowToggle = async (userId, isFollowing) => {
    try {
      // Update the local state to reflect the change
      const updateUserList = (list) =>
        list.map((user) =>
          user._id === userId ? { ...user, isFollowing } : user
        );

      setFollowers(updateUserList(followers));
      setFollowing(updateUserList(following));

      // Refresh the data after toggle
      await fetchUsers();
    } catch (error) {
      console.error("Error in handleFollowToggle:", error);
    }
  };

  // Tab button component
  const TabButton = ({ title, isActive, onPress }) => (
    <TouchableOpacity
      style={[styles.tabButton, isActive && styles.activeTabButton]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.tabButtonText,
          isActive && styles.activeTabButtonText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  // Render user list
  const renderUserList = ({ item }) => (
    <UserCard user={item} onFollowToggle={handleFollowToggle} />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScreenWrapper>
    <View style={styles.container}>
      <Header />
      <View style={styles.tabContainer}>
        <TabButton
          title={`Followers (${followers.length})`}
          isActive={activeTab === "followers"}
          onPress={() => setActiveTab("followers")}
        />
        <TabButton
          title={`Following (${following.length})`}
          isActive={activeTab === "following"}
          onPress={() => setActiveTab("following")}
        />
      </View>

      <FlatList
        data={activeTab === "followers" ? followers : following}
        renderItem={renderUserList}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    paddingBottom: hp(1),
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: wp(4),
    color: theme.colors.black,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray,
  },
  tabButton: {
    flex: 1,
    paddingVertical: hp(1),
    alignItems: "center",
    marginHorizontal: wp(2),
    borderRadius: 20,
    backgroundColor: theme.colors.white,
  },
  activeTabButton: {
    backgroundColor: theme.colors.primary,
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  activeTabButtonText: {
    color: theme.colors.white,
  },
  listContainer: {
    padding: wp(4),
  },
});

export default FollowerPage;

