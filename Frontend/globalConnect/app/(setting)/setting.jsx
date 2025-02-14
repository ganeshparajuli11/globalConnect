import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Header from '../../components/Header';
import ScreenWrapper from '../../components/ScreenWrapper';
import { theme } from '../../constants/theme';
import { StatusBar } from 'expo-status-bar';
import { userAuth } from '../../contexts/AuthContext';

const Setting = () => {
  const router = useRouter();
  const { logout } = userAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout", 
      "Are you sure you want to logout?", 
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          onPress: async () => {
            try {
              await logout(); 
              Alert.alert('Logged Out', 'You have been logged out successfully.');
              router.replace('/login'); 
            } catch (error) {
              Alert.alert('Error', 'Failed to log out. Please try again.');
              console.error('Logout Error:', error);
            }
          }
        }
      ]
    );
  };

  return (
    <ScreenWrapper>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <Header title="Settings" showBackButton={true} />
        <View style={styles.body}>
          <TouchableOpacity
            style={styles.option}
            onPress={() => router.push('/changePassword')}
          >
            <Text style={styles.optionText}>Change Password</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            onPress={() => router.push('/privacyPolicy')}
          >
            <Text style={styles.optionText}>Privacy Policy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            onPress={() => router.push('/termsAndCondition')}
          >
            <Text style={styles.optionText}>Terms and Conditions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            onPress={() => router.push('/destination')}
          >
            <Text style={styles.optionText}>Destination</Text>
          </TouchableOpacity>

          <View style={styles.option}>
            <Text style={styles.optionText}>Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
            />
          </View>

          <TouchableOpacity style={styles.option} onPress={() => router.push('/updateProfile')}>
            <Text style={styles.optionText}>Update Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.option} onPress={() => router.push('/blockedUser')}>
            <Text style={styles.optionText}>Blocked</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.option} onPress={handleLogout}>
            <Text style={styles.optionText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Setting;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  optionText: {
    fontSize: 16,
    color: '#000',
  },
});
