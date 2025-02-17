import React from "react";
import { StyleSheet, View, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // Ensure you have this installed
import { theme } from "../constants/theme"; // Adjust path if needed
import { hp, wp } from "../helpers/common"; // Adjust path if needed

const Input = ({ value, onChangeText, onSend }) => {
  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="Type comment..."
        placeholderTextColor={theme.colors.textLight}
        multiline
      />
      <TouchableOpacity style={styles.sendButton} onPress={onSend}>
        <Ionicons name="send" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default Input;

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.xl,
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: hp(1),
    paddingHorizontal: wp(2),
    color: theme.colors.textDark,
  },
  sendButton: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
    backgroundColor: theme.colors.primary, // Adjust color to match design
    justifyContent: "center",
    alignItems: "center",
    marginLeft: wp(2),
  },
});
