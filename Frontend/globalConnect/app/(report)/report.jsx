import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import ReportCategoryCard from "../../components/ReportCategoryCard";
import { useFetchCategories, reportPost } from "../../services/reportService";
import Icon from "../../assets/icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { userAuth } from "../../contexts/AuthContext";

const Report = ({ visible }) => {
  const router = useRouter();
  const { postId } = useLocalSearchParams();
  const { categories, loading } = useFetchCategories();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [reporting, setReporting] = useState(false);
const {authToken} = userAuth()
  
const handleReportPost = async () => {
  if (!selectedCategory) {
    Alert.alert("Select Category", "Please select a category to report.");
    return;
  }

  console.log("Reporting post with:", { postId, selectedCategory });
  try {
    setReporting(true);
    // Capture the returned result from reportPost
    const result = await reportPost(postId, selectedCategory, authToken);
    if (result.success) {
      Alert.alert("Report Submitted", "Your report has been submitted successfully.");
      router.back();
    } else {
      Alert.alert("Report Failed", result.message || "Unable to submit report. Please try again.");
    }
  } catch (error) {
    Alert.alert("Report Failed", error.message || "Unable to submit report. Please try again.");
  } finally {
    setReporting(false);
  }
};
  

  const handleClose = () => {
    setSelectedCategory(null);
    router.back();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header with title and top-right close icon */}
          <View style={styles.headerContainer}>
            <Text style={styles.header}>Report a Problem</Text>
            <TouchableOpacity onPress={handleClose}>
              <Icon name="cross" size={24} color="black" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#000" />
          ) : categories.length > 0 ? (
            <View style={styles.listContainer}>
              <FlatList
                data={categories}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.flatListContent}
                renderItem={({ item }) => (
                  <ReportCategoryCard
                    key={item._id}
                    title={item.report_title}
                    description={item.description}
                    selected={selectedCategory === item._id}
                    onPress={() => setSelectedCategory(item._id)}
                  />
                )}
              />
            </View>
          ) : (
            <Text style={styles.noDataText}>No categories available</Text>
          )}

          {/* Report Post Button */}
          <TouchableOpacity
            style={styles.reportButton}
            onPress={handleReportPost}
            disabled={reporting}
          >
            <Text style={styles.reportButtonText}>
              {reporting ? "Reporting..." : "Report Post"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default Report;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    height: "70%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  listContainer: {
    height: 300,
    width: "100%",
  },
  flatListContent: {
    flexGrow: 1,
    paddingBottom: 10,
  },
  noDataText: {
    textAlign: "center",
    color: "#555",
    marginVertical: 20,
  },
  reportButton: {
    marginTop: 20,
    backgroundColor: "red",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  reportButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
