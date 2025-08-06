import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCzyPWdoOY-pOepSltLrRfmxOBJRiGw7U4",
  authDomain: "dateleagueai.firebaseapp.com",
  projectId: "dateleagueai",
  storageBucket: "dateleagueai.appspot.com", 
  messagingSenderId: "633816661931",
  appId: "1:633816661931:web:e1c19a12cf7339cc621cee",
  measurementId: "G-950N01N0LF",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const storage = getStorage(app);
