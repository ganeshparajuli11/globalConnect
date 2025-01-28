import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import axios from 'axios';

const index = () => {
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/category/all');
        setCategories(response.data.categories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/post/all');
        const transformedPosts = response.data.data.map((post) => ({
          id: post._id,
          user: 'Anonymous', // Replace with post.user_id if available
          type: post.category_id.name,
          time: new Date(post.created_at).toLocaleDateString(), // Format as needed
          content: post.text_content,
          image: post.media_path || null,
          comments: [], // Add comments fetching logic if needed
        }));
        setPosts(transformedPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };

    fetchPosts();
  }, []);

  const renderPost = ({ item }) => (
    <View>
      {/* User Info */}
      <View>
        <View>
          <Image
            source={{ uri: 'https://via.placeholder.com/40' }} // Replace with user profile image
            style={{ width: 40, height: 40, borderRadius: 20 }}
          />
          <View>
            <Text>{item.user}</Text>
            <Text>{item.type}</Text>
          </View>
        </View>
        <Text>{item.time}</Text>
      </View>

      {/* Post Content */}
      <Text>{item.content}</Text>
      {item.image && (
        <Image source={{ uri: item.image }} style={{ width: '100%', height: 200 }} />
      )}

      {/* Warning */}
      {item.type === 'Rooms' && (
        <Text style={{ color: 'red' }}>
          *Please personally verify the rooms before moving in*
        </Text>
      )}

      {/* Post Actions */}
      <View>
        <TouchableOpacity>
          <Text>❤️</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text>💬</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text>🔄</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View>
      <StatusBar hidden={true} />
      {/* Search Bar */}
      <TextInput
        placeholder="Search"
        style={{ padding: 10, borderWidth: 1, marginBottom: 10 }}
      />

      {/* Category Tabs */}
      <View style={{ flexDirection: 'row', marginBottom: 20 }}>
        {categories.map((category) => (
          <TouchableOpacity key={category._id}>
            <Text>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Post Feed */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

export default index;
