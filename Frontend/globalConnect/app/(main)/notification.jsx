import { StyleSheet, Text, View } from "react-native";
import React from "react";
import ScreenWrapper from "../../components/ScreenWrapper";
import BottomNav from "../../components/bottomNav";
import { theme } from "../../constants/theme";


const Notification = () => {
  return (
    <ScreenWrapper>
      <View style={styles.content}>
        <Text style={styles.welcomeText}>Notifications</Text>
      </View>

      <BottomNav />
    </ScreenWrapper>
  );
};

export default Notification;

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 24,
    color: theme.colors.black,
  },
});
