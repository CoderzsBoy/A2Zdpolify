
// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// IMPORTANT: Replace these with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyCXLmfbn5tFn75F2wJMm1wRLbyjE4w1bZ4",
  authDomain: "a2zidx.firebaseapp.com",
  projectId: "a2zidx",
  storageBucket: "a2zidx.firebasestorage.app",
  messagingSenderId: "649021355439",
  appId: "1:649021355439:web:f7af4732a79688a3db6b5a",
  measurementId: "G-112GTGP351" // Optional: if you use Google Analytics
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { app, db, storage, auth };
