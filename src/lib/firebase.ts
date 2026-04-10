import { initializeApp, getApps } from "firebase/app";
import { getAuth as getFirebaseAuth } from "firebase/auth";
import { getFirestore as getFirebaseFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDUGoawbda9t5SANXg5xsUvnYu2zojYJCQ",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "gbarber-c55e1.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "gbarber-c55e1",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "gbarber-c55e1.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "780850283537",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:780850283537:web:3491a82712f3adafda1db0",
};

let app;
let auth;
let db;

if (typeof window !== "undefined") {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getFirebaseAuth(app);
  db = getFirebaseFirestore(app);
}

export { app, auth, db };
export const getDb = () => db;
export const getAuth = () => auth;