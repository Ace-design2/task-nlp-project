import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// TODO: Replace the following with your app's Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDenrwvRbAAizsaIkJk9QEF69TVTVT2FLI",
  authDomain: "task-nlp-project.firebaseapp.com",
  projectId: "task-nlp-project",
  storageBucket: "task-nlp-project.firebasestorage.app",
  messagingSenderId: "814428224322",
  appId: "1:814428224322:web:f7c60aa614b4b56b4c66db",
  measurementId: "G-YFTRR9Y3Q3",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export {
  auth,
  db,
  signInAnonymously,
  signInWithPopup,
  googleProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  storage,
  ref,
  uploadBytes,
  getDownloadURL,
  sendPasswordResetEmail,
};
