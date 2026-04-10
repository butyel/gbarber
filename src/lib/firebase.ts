import { initializeApp, getApps, getApps as getFirebaseApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export let auth: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export let db: any;

// Initialize on client side only
if (typeof window !== "undefined") {
  if (getFirebaseApps().length === 0) {
    initializeApp(firebaseConfig);
  }
  auth = getAuth(getFirebaseApps()[0]);
  db = getFirestore(getFirebaseApps()[0]);
}

export function getUserId(): string | null {
  if (typeof window !== "undefined" && auth) {
    const user = auth.currentUser;
    return user?.uid || null;
  }
  return null;
}