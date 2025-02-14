import React from "react";
import { StyleSheet, Text, View, FlatList, ActivityIndicator } from "react-native";
import BottomNav from "../../components/bottomNav";
import { theme } from "../../constants/theme";
import ScreenWrapper from "../../components/ScreenWrapper";
import { hp, wp } from "../../helpers/common";
import { useRouter } from "expo-router";
import { useFetchPosts } from "../../services/postServices";
import PostCard from "../../components/PostCard";
import { StatusBar } from "expo-status-bar";

const Home = () => {
  const router = useRouter();
  const { posts, fetchPosts, loading, hasMore, page } = useFetchPosts();

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

        {/* Posts List */}
        <FlatList
          data={posts}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listStyle}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard item={item} router={router} />
          )}
          onEndReached={() => {
            if (hasMore && !loading) {
              fetchPosts(page, false);
            }
          }}
          onEndReachedThreshold={0.5}
          // Display a message if no posts are available at all
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No posts available</Text>
              </View>
            )
          }
          // Footer component for loading indicator or "no more posts" message
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
      </View>

      {/* Bottom Navigation always rendered at the bottom */}
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
    paddingBottom: hp(8), // Ensures content isn't hidden behind BottomNav
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
