import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { theme } from '../../constants/theme';
import ScreenWrapper from '../../components/ScreenWrapper';
import { userAuth } from '../../contexts/AuthContext';
import config from '../../constants/config';

const API_URL = `http://${config.API_IP}:3000/api/profile`;

const HandleAccount = () => {
  const router = useRouter();
  const { authToken, user: currentUser } = userAuth();
  const [isDeactivated, setIsDeactivated] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDeactivateConfirm = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/deactivate`,
        {},
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (response.status === 200) {
        setIsDeactivated(true);
        setShowDeactivateModal(false);
        router.replace('/login');
      }
    } catch (error) {
      console.error('Error deactivating account:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to deactivate account'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/deleteAccount`,
        {},
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (response.status === 200) {
        setShowDeleteModal(false);
        Alert.alert(
          'Account Scheduled for Deletion',
          'Your account will be permanently deleted if you do not log in within 15 days.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/login'),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to delete account'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderModalButtons = (onConfirm, confirmText, confirmStyle) => (
    <View style={styles.modalButtons}>
      <TouchableOpacity
        style={[styles.modalButton, styles.cancelButton]}
        onPress={() => {
          setShowDeactivateModal(false);
          setShowDeleteModal(false);
        }}
        disabled={loading}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.modalButton, confirmStyle]}
        onPress={onConfirm}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          <Text style={styles.confirmButtonText}>{confirmText}</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={theme.colors.text}
          />
        </TouchableOpacity>

        <Text style={styles.title}>Account Settings</Text>

        <View style={styles.optionsContainer}>
          <View style={styles.optionItem}>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>Deactivate Account</Text>
              <Text style={styles.optionDescription}>
                Temporarily disable your account. You can reactivate it anytime by logging in.
              </Text>
            </View>
            <Switch
              value={isDeactivated}
              onValueChange={() => setShowDeactivateModal(true)}
              trackColor={{ false: '#767577', true: theme.colors.primary }}
              thumbColor={isDeactivated ? '#fff' : '#f4f3f4'}
            />
          </View>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => setShowDeleteModal(true)}
          >
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* Deactivate Confirmation Modal */}
        <Modal visible={showDeactivateModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={[styles.warningIconContainer, { backgroundColor: 'rgba(255,189,48,0.1)' }]}>
                <MaterialIcons name="pause-circle-outline" size={40} color="#FFB930" />
              </View>
              <Text style={styles.modalTitle}>Deactivate Account?</Text>
              <Text style={styles.modalDescription}>
                Your account will be temporarily disabled and hidden from other users.
                You can reactivate it anytime by logging back in.
              </Text>
              {renderModalButtons(handleDeactivateConfirm, "Deactivate", styles.deactivateButton)}
            </View>
          </View>
        </Modal>

        {/* Delete Account Modal */}
        <Modal visible={showDeleteModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.warningIconContainer}>
                <MaterialIcons name="warning" size={40} color="#FF3B30" />
              </View>
              <Text style={styles.modalTitle}>Delete Account?</Text>
              <Text style={styles.modalDescription}>
                Your account will be scheduled for deletion. If you don't log in within 15 days,
                your account and all associated data will be permanently deleted.
              </Text>
              {renderModalButtons(handleDeleteAccount, "Delete", styles.confirmButton)}
            </View>
          </View>
        </Modal>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  optionsContainer: {
    paddingHorizontal: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  optionTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: theme.colors.gray,
  },
  deleteButton: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    alignItems: 'center',
  },
  warningIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,59,48,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 16,
    color: theme.colors.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#F1F1F1',
  },
  confirmButton: {
    backgroundColor: '#FF3B30',
  },
  deactivateButton: {
    backgroundColor: theme.colors.primary,
  },
  cancelButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HandleAccount;
