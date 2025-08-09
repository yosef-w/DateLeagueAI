import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCzyPWdoOY-pOepSltLrRfmxOBJRiGw7U4",
  authDomain: "dateleagueai.firebaseapp.com",
  projectId: "dateleagueai",
  storageBucket: "dateleagueai.firebasestorage.app", // ✅ this is the correct bucket
  messagingSenderId: "633816661931",
  appId: "1:633816661931:web:e1c19a12cf7339cc621cee",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// ✅ explicitly use the correct bucket
export const storage = getStorage(app, "gs://dateleagueai.firebasestorage.app");
