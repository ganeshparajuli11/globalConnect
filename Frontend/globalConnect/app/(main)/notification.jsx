import React, { useState } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Animated,
  Modal,
  Alert
} from "react-native";
import ScreenWrapper from "../../components/ScreenWrapper";
import BottomNav from "../../components/bottomNav";
import { theme } from "../../constants/theme";
import { useFetchNotifications } from "../../services/notificationService";
import NotificationCard from "../../components/NotificationCard";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";

const Notification = () => {
  const router = useRouter();
  const { notifications, loading, clearAllNotifications, markAsRead } = useFetchNotifications();
  const [selectedTab, setSelectedTab] = useState('all');
  const scrollY = new Animated.Value(0);
  const [showClearDialog, setShowClearDialog] = useState(false);

  const handleClearAll = () => {
    setShowClearDialog(true);
  };

  const confirmClearAll = async () => {
    setShowClearDialog(false);
    const success = await clearAllNotifications();
    if (success) {
      Alert.alert(
        "Success",
        "All notifications have been cleared",
        [{ text: "OK" }]
      );
    }
  };

  const handleNotificationPress = async (notificationId) => {
    await markAsRead(notificationId);
  };

  const unreadNotifications = notifications?.filter(n => !n.read) || [];
  const readNotifications = notifications?.filter(n => n.read) || [];

  const renderSectionHeader = (title, count) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      </View>
      {title === 'Unread' && count > 0 && (
        <TouchableOpacity 
          style={styles.markAllReadButton}
          onPress={() => {
            // Implement mark all as read functionality
            Alert.alert("Coming Soon", "This feature will be available soon!");
          }}
        >
          <Text style={styles.markAllReadText}>Mark all as read</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderNotificationsList = (data) => (
    <FlatList
      data={data}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <NotificationCard 
          notification={item} 
          onPress={handleNotificationPress}
        />
      )}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false }
      )}
      scrollEventThrottle={16}
    />
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      );
    }

    if (notifications?.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color={theme.colors.gray} />
          <Text style={styles.emptyText}>No notifications yet</Text>
          <Text style={styles.emptySubText}>You'll see your notifications here</Text>
        </View>
      );
    }

    return (
      <View style={styles.notificationsContainer}>
        {unreadNotifications.length > 0 && (
          <View style={styles.section}>
            {renderSectionHeader('Unread', unreadNotifications.length)}
            {renderNotificationsList(unreadNotifications)}
          </View>
        )}
        
        {readNotifications.length > 0 && (
          <View style={styles.section}>
            {renderSectionHeader('Read', readNotifications.length)}
            {renderNotificationsList(readNotifications)}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScreenWrapper>
      <View style={styles.content}>
        <Animated.View style={[
          styles.header,
          {
            transform: [{
              translateY: scrollY.interpolate({
                inputRange: [-50, 0, 50],
                outputRange: [0, 0, -50],
              })
            }]
          }
        ]}>
          <View style={styles.headerContent}>
            <Text style={styles.headerText}>Notifications</Text>
            {notifications?.length > 0 && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={handleClearAll}
              >
                <Ionicons name="trash-outline" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
        
        {renderContent()}

        {/* Clear All Confirmation Dialog */}
        <Modal
          visible={showClearDialog}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowClearDialog(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="trash-outline" size={48} color={theme.colors.primary} />
              </View>
              <Text style={styles.modalTitle}>Clear All Notifications</Text>
              <Text style={styles.modalMessage}>
                Are you sure you want to clear all notifications? This action cannot be undone.
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowClearDialog(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={confirmClearAll}
                >
                  <Text style={styles.confirmButtonText}>Clear All</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
      <BottomNav />
    </ScreenWrapper>
  );
};

export default Notification;

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
    elevation: 2,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    zIndex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerText: {
    fontSize: 24,
    color: theme.colors.black,
    fontWeight: "bold",
  },
  clearButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.lightGray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.gray,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: theme.colors.text,
    marginTop: 12,
    fontWeight: '600',
  },
  emptySubText: {
    fontSize: 14,
    color: theme.colors.gray,
    marginTop: 4,
  },
  notificationsContainer: {
    flex: 1,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.white,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.black,
    marginRight: 8,
  },
  countBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  markAllReadButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  markAllReadText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 24,
    width: '85%',
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: theme.colors.lightGray,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
  },
  cancelButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  confirmButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
