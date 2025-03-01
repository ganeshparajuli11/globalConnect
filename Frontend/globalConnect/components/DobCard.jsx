import React, { useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { theme } from "../constants/theme";


const DobCard = ({ visible, onSubmit, onClose }) => {
  const [date, setDate] = useState(new Date());
  // For Android, we display the picker when needed
  const [showPicker, setShowPicker] = useState(Platform.OS === "ios");

  const onChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      // On Android, dismiss the picker after selection
      setShowPicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleSubmit = () => {
    onSubmit(date);
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Update Your Date of Birth</Text>
          {Platform.OS === "android" && (
            <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.dateButton}>
              <Text style={styles.dateButtonText}>{date.toDateString()}</Text>
            </TouchableOpacity>
          )}
          {(showPicker || Platform.OS === "ios") && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={onChange}
              maximumDate={new Date()} // prevent selecting future dates
            />
          )}
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={onClose} style={[styles.button, styles.cancelButton]}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSubmit} style={[styles.button, styles.submitButton]}>
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DobCard;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "80%",
    backgroundColor: theme.colors.white,
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    color: theme.colors.black,
  },
  dateButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: theme.colors.gray,
    borderRadius: 5,
    marginBottom: 20,
  },
  dateButtonText: {
    fontSize: 16,
    color: theme.colors.black,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 5,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: theme.colors.gray,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
});
