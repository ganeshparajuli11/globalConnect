import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, FlatList, ActivityIndicator } from "react-native";
import BottomNav from "../../components/bottomNav";
import { theme } from "../../constants/theme";
import ScreenWrapper from "../../components/ScreenWrapper";
import { hp, wp } from "../../helpers/common";
import { useRouter } from "expo-router";
import { useFetchPosts } from "../../services/postServices";
import PostCard from "../../components/PostCard";
import { StatusBar } from "expo-status-bar";
import SearchBar from "../../components/SearchBar";
import SortCategory from "../../components/SortCategory";
import UserCard from "../../components/UserCard";
import { useSearchUsers } from "../../services/useSearchUsers";

const Home = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  // Default to "All" so all posts are fetched initially.
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Hook for posts
  const { posts, fetchPosts, loading, hasMore, page, resetPosts } = useFetchPosts(selectedCategory);

  // Hook for searching users (people)
  const { users, loading: searchLoading } = useSearchUsers(searchQuery);

  // When the selected category changes, reset and fetch fresh posts.
  useEffect(() => {
    resetPosts();
    fetchPosts(1, true);
  }, [selectedCategory]);

  // Decide which content to show:
  // If there's a search query, we'll show search results (people)
  // Otherwise, we show the normal posts (with category sort)
  const isSearching = searchQuery.trim().length > 0;

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

        {isSearching ? (
          // Render search results for people
          <FlatList
            data={users}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listStyle}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <UserCard user={item} isFollowing={false} onFollowToggle={() => {}} router = {router} />
            )}
            ListEmptyComponent={
              !searchLoading && (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No users found</Text>
                </View>
              )
            }
            ListFooterComponent={
              searchLoading && <ActivityIndicator style={{ marginVertical: 30 }} size="large" />
            }
          />
        ) : (
          // Otherwise, show posts & sorting
          <>
            <SortCategory selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} />
            <FlatList
              data={posts}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listStyle}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <PostCard item={item} router={router} />}
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
                  return <ActivityIndicator style={{ marginVertical: 30 }} size="large" />;
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

      {/* Bottom Navigation */}
      <BottomNav />
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
});
