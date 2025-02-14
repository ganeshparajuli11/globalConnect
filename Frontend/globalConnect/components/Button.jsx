import { StyleSheet, Text, Pressable } from "react-native";
import React from "react";
import { theme } from "../constants/theme";
import { hp, wp } from "../helpers/common";
import Loading from "../components/Loading"; // Adjust the path as needed

const Button = ({
  buttonStyle,
  textStyle,
  title = "",
  onPress = () => {},
  loading = false,
  hasShadow = true,
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        buttonStyle,
        hasShadow && styles.shadow,
        loading && styles.loading,
        pressed && styles.pressed,
      ]}
      disabled={loading}
    >
      {loading ? (
        <Loading inline />
      ) : (
        <Text style={[styles.text, textStyle]}>{title}</Text>
      )}
    </Pressable>
  );
};

export default Button;

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary,
    height: hp(6.6),
    borderRadius: theme.radius.xl,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: wp(4), // Added horizontal padding for inner spacing
  },
  text: {
    color: "white",
    fontSize: hp(2.5),
    fontWeight: theme.fonts.bold,
    paddingVertical: hp(1), // Added vertical padding for text clarity
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  loading: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.8,
  },
});
