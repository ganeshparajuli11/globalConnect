import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import apiClient from '../axiosConfig';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiClient.get('/api/category/all');  // Use apiClient here
        setCategories(response.data.categories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch posts
  const fetchPosts = async (pageNumber = 1) => {
    if (loading) return;

    setLoading(true);
    try {
      const response = await apiClient.get(`/api/post/all?page=${pageNumber}`);  // Use apiClient here
      const transformedPosts = response.data.data.map((post) => ({
        id: post._id,
        user: post.user.name, // Replace with post.user_id if available
        type: post.category_id.name,
        time: new Date(post.created_at).toLocaleDateString(), // Format as needed
        content: post.text_content,
        image: post.media_path || null,
        comments: post.comments || [],
        liked: false, // Add liked state to each post
      }));

      setPosts((prevPosts) => [...prevPosts, ...transformedPosts]);
      setPage(pageNumber + 1);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const toggleLike = (id) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === id ? { ...post, liked: !post.liked } : post
      )
    );
  };

  const renderPost = ({ item }) => (
    <View style={styles.postContainer}>
      {/* User Info */}
      <View style={styles.userInfoContainer}>
        <Image
          source={{ uri: 'https://via.placeholder.com/40' }} // Replace with user profile image
          style={styles.userImage}
        />
        <View style={styles.userInfoTextContainer}>
          <Text style={styles.userName}>{item.user}</Text>
          <Text style={styles.postType}>{`Shared as ${item.type}`}</Text>
        </View>
        <Text style={styles.postTime}>{item.time}</Text>
      </View>

      {/* Post Content */}
      <Text style={styles.postContent}>{item.content}</Text>
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.postImage} />
      )}

      {/* Post Actions */}
      <View style={styles.postActionsContainer}>
        <TouchableOpacity onPress={() => toggleLike(item.id)}>
          <Icon
            name={item.liked ? 'heart' : 'heart-o'}
            size={24}
            color={item.liked ? '#e74c3c' : '#333'}
          />
        </TouchableOpacity>
        <TouchableOpacity>
          <Icon name="comment-o" size={24} color="#3498db" /> {/* Comment */}
        </TouchableOpacity>
        <TouchableOpacity>
          <Icon name="share" size={24} color="#2ecc71" /> {/* Share */}
        </TouchableOpacity>
      </View>

      {/* Comments Section */}
      {item.comments.length > 0 && (
        <View style={styles.commentsSection}>
          <Text style={styles.commentsHeader}>Comments</Text>
          {item.comments.map((comment) => (
            <View key={comment._id} style={styles.commentContainer}>
              <Text style={styles.commentText}>{comment.text}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return <ActivityIndicator style={{ marginVertical: 20 }} />;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    setPosts([]);
    await fetchPosts(1);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    fetchPosts(page);
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />

      {/* Search Bar */}
      <TextInput placeholder="Search" style={styles.searchBar} />

      {/* Category Tabs */}
      <View style={styles.categoryTabsContainer}>
        {categories.map((category) => (
          <TouchableOpacity key={category._id} style={styles.categoryTab}>
            <Text style={styles.categoryTabText}>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Post Feed */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.postsListContainer}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
  },
  searchBar: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginBottom: 20,
  },
  categoryTabsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  categoryTab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  categoryTabText: {
    color: '#333',
    fontWeight: 'bold',
  },
  postContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
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
  commentsSection: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  commentsHeader: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 10,
  },
  commentContainer: {
    marginBottom: 10,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
  },
});
