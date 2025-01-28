import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { initializeApp, getApps } from 'firebase/app';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC8dT5TbY96fSdkT3aJOLpeNzmh-C1bHOY",
  authDomain: "globalconnect-1bf4f.firebaseapp.com",
  databaseURL: "https://globalconnect-1bf4f-default-rtdb.firebaseio.com",
  projectId: "globalconnect-1bf4f",
  storageBucket: "globalconnect-1bf4f.firebasestorage.app",
  messagingSenderId: "945534825485",
  appId: "1:945534825485:web:b380761c7f8e0d153c1144",
  measurementId: "G-6XM59TQTMK"
};

// Initialize Firebase only if it hasn't been initialized yet
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const App = () => {
  useEffect(() => {
    // You can add other Firebase setup or logic here if needed in the future.
  }, []);

  return (
    <View>
      <Text>Firebase Initialized Without Analytics</Text>
    </View>
  );
};

export default App;
