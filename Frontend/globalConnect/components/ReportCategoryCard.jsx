import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";

const ReportCategoryCard = ({ title, description, selected, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.innerContainer}>
        <View style={styles.checkboxContainer}>
          {selected ? <View style={styles.checkedBox} /> : <View style={styles.uncheckedBox} />}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ReportCategoryCard;

const styles = StyleSheet.create({
  card: {
    padding: 15,
    marginVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    minHeight: 80,
  },
  innerContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: "#555",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  checkedBox: {
    width: 16,
    height: 16,
    backgroundColor: "blue",
  },
  uncheckedBox: {
    width: 16,
    height: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    color: "#555",
  },
});
