import React from "react";
import { StyleSheet, Text, View, FlatList } from "react-native";
import ScreenWrapper from "../../components/ScreenWrapper";
import BottomNav from "../../components/bottomNav";
import { theme } from "../../constants/theme";
import { useFetchNotifications } from "../../services/notificationService";
import NotificationCard from "../../components/NotificationCard";


const Notification = () => {
  const { notifications, loading } = useFetchNotifications();

  return (
    <ScreenWrapper>
      <View style={styles.content}>
        <Text style={styles.headerText}>Notifications</Text>
        {loading ? (
          <Text style={styles.loadingText}>Loading notifications...</Text>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <NotificationCard notification={item} />}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
      <BottomNav />
    </ScreenWrapper>
  );
};

export default Notification;

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 10,
    backgroundColor: theme.colors.background,
  },
  headerText: {
    fontSize: 24,
    color: theme.colors.black,
    marginBottom: 10,
    fontWeight: "bold",
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.gray || "#666",
    textAlign: "center",
    marginTop: 20,
  },
  listContainer: {
    paddingBottom: 20,
  },
});
