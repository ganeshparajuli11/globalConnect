import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import config from "../config";
import socket from "../socket"
export default function ActivityScreen() {
  const ip = config.API_IP;
  // State to hold notifications
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);  // For loading state

  const fetchNotifications = async () => {
    try {
      // Retrieve authToken from AsyncStorage
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        console.log("No auth token found");
        setLoading(false);
        return;
      }

      // Make the API request with the Bearer token
      const response = await axios.get(`http://${ip}:3000/api/notifications/get`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,  
        },
      });

      const data = response.data;

      if (data.notifications && data.notifications.length > 0) {
        setNotifications(data.notifications);  // Update state with notifications
      } else {
        setNotifications([]);  // If no notifications
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    }
  };

// In the frontend (React Native):
useEffect(() => {
  // Listening to notifications in real-time via socket
  socket.on('receiveNotification', (data) => {
    console.log('Received notification:', data);
    // You can update your notifications state here
  });
}, []);


  // Render each notification item
  const renderItem = ({ item }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      {/* User Avatar */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 40, height: 40, backgroundColor: '#E5E7EB', borderRadius: 20, marginRight: 12 }} />
        {/* Notification Text */}
        <View>
          <Text style={{ fontSize: 14, fontWeight: item.isBold ? 'bold' : 'normal' }}>
            {item.user} <Text style={{ fontWeight: 'normal' }}>{item.action}</Text>
          </Text>
          <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{item.time}</Text>
        </View>
      </View>
      {/* Placeholder for Post Preview */}
      <View style={{ width: 40, height: 40, backgroundColor: '#E5E7EB', borderRadius: 8 }} />
    </View>
  );

  // Show loading indicator until data is fetched
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
        }}
      >
        <TouchableOpacity>
          <Text style={{ fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Activity</Text>
        <View style={{ width: 20 }} />
      </View>

      {/* Notifications */}
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16 }}>New</Text>
        }
      />
    </View>
  );
}
