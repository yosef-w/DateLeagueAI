import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// TODO: Replace with your own Firebase project configuration
const firebaseConfig = {
  apiKey: 'YOUR_FIREBASE_API_KEY',
  authDomain: 'yourproject.firebaseapp.com',
  projectId: 'yourproject',
  storageBucket: 'yourproject.appspot.com',
  messagingSenderId: 'XXXXXX',
  appId: 'XXXXX',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
