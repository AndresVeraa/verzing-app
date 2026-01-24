// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBvg5GD5frY0ZgopW3lnyy1E5JpPDHMHdY",
  authDomain: "verzing-app-e0abc.firebaseapp.com",
  projectId: "verzing-app-e0abc",
  storageBucket: "verzing-app-e0abc.firebasestorage.app",
  messagingSenderId: "542730288052",
  appId: "1:542730288052:web:7cdaf07de9ff1ebd2a50e1",
  measurementId: "G-RFM7ED1CQQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Auth helper functions
export const loginWithEmail = (email, password) => 
  signInWithEmailAndPassword(auth, email, password);

export const registerWithEmail = (email, password) => 
  createUserWithEmailAndPassword(auth, email, password);

export const loginWithGoogle = () => 
  signInWithPopup(auth, googleProvider);

export const resetPassword = (email) => 
  sendPasswordResetEmail(auth, email);

export const logout = () => 
  signOut(auth);

export const updateUserProfile = (user, data) =>
  updateProfile(user, data);

export { onAuthStateChanged };

// Helpful flag used by the app to detect if firebaseConfig has been populated
export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.apiKey !== 'TU_API_KEY' && firebaseConfig.projectId !== 'tu-proyecto'
);