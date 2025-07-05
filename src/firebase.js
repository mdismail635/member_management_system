// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAQH6YGo1dhkarnq5XZI37Nh0u1fvFny_Y",
  authDomain: "south-para-youth-society-1.firebaseapp.com",
  projectId: "south-para-youth-society-1",
  storageBucket: "south-para-youth-society-1.firebasestorage.app",
  messagingSenderId: "914452668664",
  appId: "1:914452668664:web:8bddab57ab049ab26f5b0d",
  measurementId: "G-TGCM5CG3E0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;


