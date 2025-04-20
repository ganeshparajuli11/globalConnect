import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import BottomNav from "../../components/bottomNav";
import ScreenWrapper from "../../components/ScreenWrapper";
import SearchBar from "../../components/SearchBar";
import SortCategory from "../../components/SortCategory";
import PostCard from "../../components/PostCard";
import UserCard from "../../components/UserCard";
import DobCard from "../../components/DobCard";

import { hp, wp } from "../../helpers/common";
import { updateUserLocation } from "../../services/getLocationService";
import { checkDOB, updateDOB } from "../../services/dobService";
import { useFetchPosts, useSearchPosts } from "../../services/postServices";
import { useSearchUsers } from "../../services/useSearchUsers";
import { userAuth } from "../../contexts/AuthContext";
import { theme } from "../../constants/theme";

const Home = () => {
  const router = useRouter();
  const { authToken } = userAuth();

  const handleShareError = (error) => {
    if (!error?.error?.includes("getIO is not a function")) {
      console.error("Share error:", error);
    }
    if (error?.error?.includes("getIO is not function")) {
      console.debug("Socket sharing temporarily unavailable");
    }
    return false;
  };

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchType, setSearchType] = useState("users");
  const [showDobModal, setShowDobModal] = useState(false);

  // Hooks for fetching posts and searching
  const {
    posts,
    fetchPosts,
    loading,
    hasMore,
    page,
    error,
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

  // When search query or search type changes, if type is posts, trigger search
  useEffect(() => {
    if (searchQuery.trim() && searchType === "posts") {
      // reset search posts and fetch first page
      fetchSearchPosts(searchQuery, 1, true);
    }
  }, [searchQuery, searchType]);

  // Load more search posts if available
  const handleLoadMoreSearchPosts = useCallback(() => {
    if (searchHasMore && !searchPostLoading && searchType === "posts") {
      fetchSearchPosts(searchQuery, searchPage, false);
    }
  }, [searchHasMore, searchPostLoading, searchQuery, searchPage, searchType]);

  // Refresh posts when category changes
  useEffect(() => {
    resetPosts();
    fetchPosts(1, true);
  }, [selectedCategory]);

  // Determine whether we are searching by users or posts
  const isSearching = searchQuery.trim().length > 0;

  // Handler for switching search type (users or posts)
  const handleSearchTypeChange = (type) => {
    setSearchType(type);
    if (type === "posts" && searchQuery.trim()) {
      fetchSearchPosts(searchQuery, 1, true);
    }
  };

  // Render segmented control for search type
  const renderSearchToggle = () => {
    return (
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            searchType === "users" && styles.activeToggle,
          ]}
          onPress={() => handleSearchTypeChange("users")}
        >
          <Text
            style={[
              styles.toggleText,
              searchType === "users" && styles.activeToggleText,
            ]}
          >
            Users
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            searchType === "posts" && styles.activeToggle,
          ]}
          onPress={() => handleSearchTypeChange("posts")}
        >
          <Text
            style={[
              styles.toggleText,
              searchType === "posts" && styles.activeToggleText,
            ]}
          >
            Posts
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Update user location on mount
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

  // Check if user's DOB is set; if not, display DOB modal.
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
  }, [authToken]);

  // Handler for DOB modal submission
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

  // Render error message if destination is not set
  const renderErrorMessage = () => {
    if (error === "Please set your destination country first") {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Please set your destination country first.
          </Text>
          <TouchableOpacity
            style={styles.updateButton}
            onPress={() => router.push("/destination")}
          >
            <Text style={styles.buttonText}>Update Location</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  // Render list for posts or search results depending on search type
  const renderList = () => {
    // If in search mode and search type is "users"
    if (isSearching && searchType === "users") {
      return (
        <FlatList
          data={users}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listStyle}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <UserCard user={item} onFollowToggle={() => {}} />
          )}
          ListEmptyComponent={
            !searchUserLoading && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No users found</Text>
              </View>
            )
          }
          ListFooterComponent={
            searchUserLoading && (
              <ActivityIndicator style={{ marginVertical: 30 }} size="large" />
            )
          }
        />
      );
    }
    // If in search mode and search type is "posts"
    if (isSearching && searchType === "posts") {
      return (
        <FlatList
          data={searchPosts}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listStyle}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard
              item={{
                ...item,
                user: {
                  id: item.user?._id || item.user?.id,
                  name: item.user?.name,
                  profile_image: item.user?.profile_image,
                  verified: item.user?.verified ?? false,
                  destination: item.user?.destination,
                  flag: item.user?.flag,
                  city: item.user?.city,
                },
              }}
              verifiedStatus={item.user?.verified ?? false}
              router={router}
              onShareError={handleShareError}
            />
          )}
          onEndReached={handleLoadMoreSearchPosts}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            !searchPostLoading && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No matching posts found
                </Text>
              </View>
            )
          }
          ListFooterComponent={() => {
            if (searchPostLoading) {
              return (
                <ActivityIndicator style={{ marginVertical: 30 }} size="large" />
              );
            }
            if (!searchHasMore && searchPosts.length > 0) {
              return (
                <View style={styles.footerContainer}>
                  <Text style={styles.footerText}>
                    No more posts available
                  </Text>
                </View>
              );
            }
            return null;
          }}
        />
      );
    }
    
    // Default: show posts (when not searching)
    return (
      <>
        <SortCategory
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
        
        {/* Error message always displayed in a consistent position */}
        {renderErrorMessage()}
        
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
                  id: item.user?._id || item.user?.id,
                  name: item.user?.name,
                  profile_image: item.user?.profile_image,
                  verified: item.user?.verified ?? false,
                  destination: item.user?.destination,
                  flag: item.user?.flag,
                  city: item.user?.city,
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
                  <Text style={styles.footerText}>
                    No more posts available
                  </Text>
                </View>
              );
            }
            return null;
          }}
        />
      </>
    );
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

        {/* Show segmented control when searching */}
        {isSearching && renderSearchToggle()}

        {renderList()}
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
  // Error banner styles
  errorContainer: {
    backgroundColor: "#fdecea",
    padding: 15,
    marginHorizontal: wp(4),
    marginVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#d93025",
    textAlign: "center",
    marginBottom: 10,
  },
  updateButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});