import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDUGoawbda9t5SANXg5xsUvnYu2zojYJCQ",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "gbarber-c55e1.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "gbarber-c55e1",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "gbarber-c55e1.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "780850283537",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:780850283537:web:3491a82712f3adafda1db0",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);

export function getUserId(): string | null {
  if (typeof window !== "undefined" && auth) {
    const user = auth.currentUser;
    return user?.uid || null;
  }
  return null;
}