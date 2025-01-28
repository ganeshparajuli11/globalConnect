import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';


const splashScreen = () => {

  return (
    <View style={styles.container}>
      <Text style={styles.logoText}>
        <Text style={styles.blueText}>Global</Text>Connect
      </Text>
      <Text style={styles.subText}>No more stress...</Text>
      <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9', // Light gray background
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000', // Black text
    textAlign: 'center',
  },
  blueText: {
    color: '#007BFF', // Blue color for "Global"
  },
  subText: {
    fontSize: 16,
    color: '#666', // Gray text for the subtitle
    marginTop: 8,
  },
  loader: {
    marginTop: 20,
  },
});

export default splashScreen ;

