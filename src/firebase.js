// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Helpful flag used by the app to detect if firebaseConfig has been populated
export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.apiKey !== 'TU_API_KEY' && firebaseConfig.projectId !== 'tu-proyecto'
);