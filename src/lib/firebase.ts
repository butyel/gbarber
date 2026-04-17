import { initializeApp, getApps } from "firebase/app";
import { getAuth as getFirebaseAuth } from "firebase/auth";
import { getFirestore as getFirebaseFirestore } from "firebase/firestore";
import { getStorage as getFirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDWekViME0_KzJmciJ_upj-koxHdWcOgWs",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "gpragas.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "gpragas",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "gpragas.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "206713090720",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:206713090720:web:d958cb0bb3eab2118acfc5",
};

let app;
let auth;
let db;
let storage;

if (typeof window !== "undefined") {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getFirebaseAuth(app);
  db = getFirebaseFirestore(app);
  storage = getFirebaseStorage(app);
}

export { app, auth, db, storage };
export const getDb = () => db;
export const getAuth = () => auth;
export const getStorage = () => storage;