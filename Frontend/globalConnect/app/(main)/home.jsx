import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import BottomNav from "../../components/bottomNav";
import { theme } from "../../constants/theme";
import ScreenWrapper from "../../components/ScreenWrapper";
import { hp, wp } from "../../helpers/common";
import { useRouter } from "expo-router";
import { useFetchPosts, useSearchPosts } from "../../services/postServices";
import PostCard from "../../components/PostCard";
import { StatusBar } from "expo-status-bar";
import SearchBar from "../../components/SearchBar";
import SortCategory from "../../components/SortCategory";
import UserCard from "../../components/UserCard";
import { useSearchUsers } from "../../services/useSearchUsers";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { updateUserLocation } from "../../services/getLocationService";
import DobCard from "../../components/DobCard";
import { checkDOB, updateDOB } from "../../services/dobService";
import { userAuth } from "../../contexts/AuthContext";

const Home = () => {
  const router = useRouter();
  const { authToken } = userAuth();

  // if(!authToken){
  //   router.replace("/login")
  // }
  const handleShareError = (error) => {
    // Only log non-socket related errors
    if (!error?.error?.includes("getIO is not a function")) {
      console.error("Share error:", error);
    }

    // For socket-specific errors, just log a debug message
    if (error?.error?.includes("getIO is not function")) {
      console.debug("Socket sharing temporarily unavailable");
    }

    // Return false to prevent further error propagation
    return false;
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchType, setSearchType] = useState("users");
  // State to control display of DOB modal popup
  const [showDobModal, setShowDobModal] = useState(false);

  // Hooks for posts & search
  const {
    posts,
    fetchPosts,
    loading,
    hasMore,
    page,
    resetPosts,
  } = useFetchPosts(selectedCategory);
  const { users, loading: searchUserLoading } = useSearchUsers(searchQuery);
  const {
    posts: searchPosts,
    loading: searchPostLoading,
    fetchSearchPosts,
    hasMore: searchHasMore,
    page: searchPage,
  } = useSearchPosts(searchQuery);

  // Update search effects
  useEffect(() => {
    if (searchQuery.trim() && searchType === "posts") {
      fetchSearchPosts(searchQuery, 1, true);
    }
  }, [searchQuery, searchType]);

  const handleLoadMoreSearchPosts = useCallback(() => {
    if (searchHasMore && !searchPostLoading && searchType === "posts") {
      fetchSearchPosts(searchQuery, searchPage, false);
    }
  }, [searchHasMore, searchPostLoading, searchQuery, searchPage, searchType]);

  // When category changes, reset posts and fetch fresh data
  useEffect(() => {
    resetPosts();
    fetchPosts(1, true);
  }, [selectedCategory]);

  const isSearching = searchQuery.trim().length > 0;
  const searchLoading = searchType === "users" ? searchUserLoading : searchPostLoading;
  const handleSearchTypeChange = (type) => {
    setSearchType(type);
    if (type === "posts" && searchQuery.trim()) {
      fetchSearchPosts(searchQuery);
    }
  };

  const renderSearchToggle = () => {
    return (
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, searchType === "users" && styles.activeToggle]}
          onPress={() => handleSearchTypeChange("users")}
        >
          <Text style={[styles.toggleText, searchType === "users" && styles.activeToggleText]}>
            Users
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, searchType === "posts" && styles.activeToggle]}
          onPress={() => handleSearchTypeChange("posts")}
        >
          <Text style={[styles.toggleText, searchType === "posts" && styles.activeToggleText]}>
            Posts
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Location update: run once on mount (if not updated today)
  useEffect(() => {
    const updateLocationOnce = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        if (token) {
          await updateUserLocation(token);
        }
      } catch (error) {
        console.error("Error updating location:", error);
      }
    };
    updateLocationOnce();
  }, []);

  // Check if the user's DOB is set; if not, show the DOB popup.
  useEffect(() => {
    const checkUserDOB = async () => {
      try {
        if (authToken) {
          const response = await checkDOB(authToken);
          if (response && response.dobUpdated === false) {
            setShowDobModal(true);
          }
        }
      } catch (error) {
        console.error("Error checking DOB:", error);
      }
    };
    checkUserDOB();
  }, []);

  // Handler to update the DOB when submitted from the DobCard.
  const handleDobSubmit = async (selectedDate) => {
    try {
      if (authToken) {
        await updateDOB(authToken, selectedDate.toISOString());
        setShowDobModal(false);
      }
    } catch (error) {
      console.error("Error updating DOB:", error);
    }
  };

  return (
    <ScreenWrapper>
      <StatusBar style="dark" />
      <View style={styles.contentContainer}>
        {/* Top Navbar with Logo */}
        <View style={styles.topBar}>
          <Text style={styles.logo}>
            <Text style={styles.global}>Global</Text>
            <Text style={styles.connect}>Connect</Text>
          </Text>
        </View>

        {/* Search Bar */}
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        {/* Render segmented control when searching */}
        {isSearching && renderSearchToggle()}

        {isSearching ? (
          searchType === "users" ? (
            <FlatList
              data={users}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listStyle}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <UserCard user={item} onFollowToggle={() => {}} />
              )}
              ListEmptyComponent={
                !searchLoading && (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No users found</Text>
                  </View>
                )
              }
              ListFooterComponent={
                searchLoading && (
                  <ActivityIndicator style={{ marginVertical: 30 }} size="large" />
                )
              }
            />
          ) : (
            <FlatList
              data={posts}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listStyle}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <PostCard
                  item={{
                    ...item,
                    user: {
                      id: item.user?._id || item.user?.id, // Handle both formats
                      name: item.user?.name,
                      profile_image: item.user?.profile_image,
                      verified: item.user?.verified ?? false,
                    },
                  }}
                  verifiedStatus={item.user?.verified ?? false} // Passing verified status explicitly
                  router={router}
                  onShareError={handleShareError}
                />
              )}
              onEndReached={() => {
                if (hasMore && !loading) {
                  fetchPosts(page, false);
                }
              }}
              onEndReachedThreshold={0.5}
              ListEmptyComponent={
                !loading && (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No posts available</Text>
                  </View>
                )
              }
              ListFooterComponent={() => {
                if (loading) {
                  return (
                    <ActivityIndicator style={{ marginVertical: 30 }} size="large" />
                  );
                }
                if (!hasMore && posts.length > 0) {
                  return (
                    <View style={styles.footerContainer}>
                      <Text style={styles.footerText}>No more posts available</Text>
                    </View>
                  );
                }
                return null;
              }}
            />
          )
        ) : (
          <>
            <SortCategory
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />
            <FlatList
              data={posts}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listStyle}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <PostCard
                  item={{
                    ...item,
                    user: {
                      id: item.user?._id || item.user?.id, // Handle both formats
                      name: item.user?.name,
                      profile_image: item.user?.profile_image,
                      verified: item.user?.verified ?? false,
                    },
                  }}
                  verifiedStatus={item.user?.verified ?? false}
                  router={router}
                  onShareError={handleShareError}
                />
              )}
              onEndReached={() => {
                if (hasMore && !loading) {
                  fetchPosts(page, false);
                }
              }}
              onEndReachedThreshold={0.5}
              ListEmptyComponent={
                !loading && (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No posts available</Text>
                  </View>
                )
              }
              ListFooterComponent={() => {
                if (loading) {
                  return (
                    <ActivityIndicator style={{ marginVertical: 30 }} size="large" />
                  );
                }
                if (!hasMore && posts.length > 0) {
                  return (
                    <View style={styles.footerContainer}>
                      <Text style={styles.footerText}>No more posts available</Text>
                    </View>
                  );
                }
                return null;
              }}
            />
          </>
        )}
      </View>
      <BottomNav />
      {/* DOB Modal */}
      <DobCard
        visible={showDobModal}
        onSubmit={handleDobSubmit}
        onClose={() => setShowDobModal(false)}
      />
    </ScreenWrapper>
  );
};

export default Home;

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    paddingVertical: hp(1),
    paddingHorizontal: 20,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  logo: {
    fontSize: 20,
    fontWeight: "bold",
  },
  global: {
    color: theme.colors.primary,
  },
  connect: {
    color: theme.colors.black,
  },
  listStyle: {
    paddingTop: 20,
    paddingHorizontal: wp(4),
    paddingBottom: hp(8),
  },
  emptyContainer: {
    alignItems: "center",
    marginVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: theme.colors.gray,
  },
  footerContainer: {
    alignItems: "center",
    marginVertical: 30,
  },
  footerText: {
    fontSize: 16,
    color: theme.colors.gray,
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginHorizontal: wp(4),
    marginBottom: hp(1.5),
  },
  toggleButton: {
    flex: 1,
    paddingVertical: hp(1),
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginHorizontal: 5,
  },
  activeToggle: {
    backgroundColor: theme.colors.primary,
  },
  toggleText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: "bold",
  },
  activeToggleText: {
    color: theme.colors.white,
  },
});
