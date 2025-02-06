import { View, Text, Button, FlatList, TouchableOpacity, Image } from 'react-native'
import React, { useState } from 'react'

const users = [
  { id: '1', name: 'User 1', profilePic: 'https://example.com/user1.jpg', isFollowing: false },
  { id: '2', name: 'User 2', profilePic: 'https://example.com/user2.jpg', isFollowing: true },
  { id: '3', name: 'User 3', profilePic: 'https://example.com/user3.jpg', isFollowing: false },
  // Add more users here
];

export default function Follower() {
  const [tab, setTab] = useState('followers'); // 'followers' or 'following'
  const [usersList, setUsersList] = useState(users);

  const handleFollowToggle = (userId) => {
    setUsersList(prevState => 
      prevState.map(user => 
        user.id === userId 
          ? { ...user, isFollowing: !user.isFollowing } 
          : user
      )
    );
  }

  const renderItem = ({ item }) => (
    <View style={{ flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: '#ddd' }}>
      <Image source={{ uri: item.profilePic }} style={{ width: 40, height: 40, borderRadius: 20 }} />
      <Text style={{ marginLeft: 10, flex: 1, alignSelf: 'center' }}>{item.name}</Text>
      <TouchableOpacity onPress={() => handleFollowToggle(item.id)}>
        <Text style={{
          color: item.isFollowing ? 'green' : 'blue',
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderColor: item.isFollowing ? 'green' : 'blue',
          borderWidth: 1,
          borderRadius: 5,
        }}>
          {item.isFollowing ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <Text style={{ fontSize: 24, marginBottom: 10 }}>Followers & Following</Text>

      <View style={{ flexDirection: 'row', marginBottom: 20 }}>
        <Button title="Followers" onPress={() => setTab('followers')} />
        <Button title="Following" onPress={() => setTab('following')} />
      </View>

      <FlatList
        data={usersList.filter(user => 
          tab === 'followers' ? user.isFollowing : !user.isFollowing
        )}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />
    </View>
  )
}
