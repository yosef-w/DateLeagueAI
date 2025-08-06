import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getStorage } from 'firebase/storage';

// TODO: Replace with your own Firebase project configuration
const firebaseConfig = {
  apiKey: 'a19d25dff543b631f6cfdf31313ef5b6d61301e7',
  authDomain: 'yourproject.firebaseapp.com',
  projectId: 'yourproject',
  storageBucket: 'yourproject.appspot.com',
  messagingSenderId: 'XXXXXX',
  appId: 'XXXXX',
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export const storage = getStorage(app);
