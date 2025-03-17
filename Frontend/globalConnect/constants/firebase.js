// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";  
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDnTvc3ccZjfFwFtt-f3msWHsP_iDstB3Q",
  authDomain: "globalconnect-23156.firebaseapp.com",
  projectId: "globalconnect-23156",
  storageBucket: "globalconnect-23156.appspot.com",
  messagingSenderId: "503357022891",
  appId: "1:503357022891:web:4e1f79b678484560740dee",
  measurementId: "G-BR9ZGGH9R2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
