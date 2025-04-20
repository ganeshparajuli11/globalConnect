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
import RenderHTML from 'react-native-render-html';
import BackButton from '../../components/BackButton';
import config from '../../constants/config';
import { StatusBar } from 'expo-status-bar';
import ScreenWrapper from '../../components/ScreenWrapper';

const PrivacyPolicy = () => {
  const ip = config.API_IP;
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();
  const router = useRouter();

  const fetchPolicy = async () => {
    try {
      const response = await axios.get(`http://${ip}:3000/api/privacy-policy`);
      // The API returns an object with a "policy" key
      setPolicy(response.data.policy);
    } catch (error) {
      console.error('Error fetching privacy policy:', error);
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
        <Text style={styles.errorText}>Unable to load Privacy Policy.</Text>
      </View>
    );
  }

  return (
    <ScreenWrapper style={styles.container}>
       <StatusBar style="dark" />
      {/* Header with Back Button */}
      <View style={styles.header}>
        <BackButton size={24} />
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Optionally show the effective date */}
        {policy.effectiveDate && (
          <Text style={styles.effectiveDate}>
            Effective Date: {new Date(policy.effectiveDate).toLocaleDateString()}
          </Text>
        )}

        {/* Render the HTML content */}
        <RenderHTML
          contentWidth={width - 32} // Adjust for your container's padding
          source={{ html: policy.content }}
        />
      </ScrollView>
    </ScreenWrapper>
  );
};

export default PrivacyPolicy;

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
