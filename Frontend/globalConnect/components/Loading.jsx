import React from "react";
import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { theme } from "../constants/theme";

const Loading = ({ inline }) => {
  if (inline) {
    return (
      <View style={styles.inlineContainer}>
        <ActivityIndicator
          size="small"
          color={theme.colors.white}
          style={styles.inlineSpinner}
        />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
};

export default Loading;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  inlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  inlineSpinner: {
    transform: [{ scale: 1.5 }], // Increase this value to scale the spinner further if needed
  },
  loadingText: {
    marginTop: 12,
    fontSize: 18,
    color: theme.colors.text,
    fontWeight: theme.fonts.semibold,
  },
});
