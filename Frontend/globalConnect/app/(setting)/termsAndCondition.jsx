import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import RenderHtml from 'react-native-render-html';
import BackButton from '../../components/BackButton';
import config from '../../constants/config';
import { StatusBar } from 'expo-status-bar';

const TermsAndCondition = () => {
  const ip = config.API_IP;
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();
  const router = useRouter();

  const fetchPolicy = async () => {
    try {
      const response = await axios.get(`http://${ip}:3000/api/terms-conditions`);
      // The API returns an object with a "policy" key
      setPolicy(response.data.terms);
    } catch (error) {
      console.error('Error fetching terms and condition:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPolicy();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPolicy();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!policy) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to load Terms and Condition.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
       <StatusBar style="dark" />
      {/* Header with Back Button */}
      <View style={styles.header}>
        <BackButton size={24} />
        <Text style={styles.headerTitle}>Terms and Condition</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {policy.effectiveDate && (
          <Text style={styles.effectiveDate}>
            Effective Date: {new Date(policy.effectiveDate).toLocaleDateString()}
          </Text>
        )}

        <RenderHtml
          contentWidth={width - 32} // Adjusted for 16px padding on each side
          source={{ html: policy.content }}
        />
      </ScrollView>
    </View>
  );
};

export default TermsAndCondition;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginRight: 32, // Balances the back button on the left
  },
  contentContainer: {
    paddingBottom: 32,
  },
  effectiveDate: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF0000',
  },
});
