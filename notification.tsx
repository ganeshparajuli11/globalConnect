import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native';

const notifications = [
  {
    id: '1',
    user: 'john.doe',
    action: 'liked your post.',
    time: '5min',
    isBold: true,
  },
  {
    id: '2',
    user: 'john.doe, jane_doe and 5 others',
    action: 'liked your post.',
    time: '19min',
    isBold: true,
  },
  {
    id: '3',
    user: 'john.doe',
    action: 'liked your post.',
    time: '1h',
    isBold: true,
  },
  {
    id: '4',
    user: 'postMaker',
    action: 'started following you.',
    time: '3d',
    isBold: false,
  },
];

export default function ActivityScreen() {
  const renderItem = ({ item }: { item: any }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      {/* User Avatar */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 40, height: 40, backgroundColor: '#E5E7EB', borderRadius: 20, marginRight: 12 }} />
        {/* Notification Text */}
        <View>
          <Text
            style={{ fontSize: 14, fontWeight: item.isBold ? 'bold' : 'normal' }}
          >
            {item.user} <Text style={{ fontWeight: 'normal' }}>{item.action}</Text>
          </Text>
          <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{item.time}</Text>
        </View>
      </View>
      {/* Placeholder for Post Preview */}
      <View style={{ width: 40, height: 40, backgroundColor: '#E5E7EB', borderRadius: 8 }} />
    </View>
  );

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
