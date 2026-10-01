import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "firebase-configure-me",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "firebase-configure-me.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "firebase-configure-me",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "firebase-configure-me.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:000000000000:web:configureme",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://firebase-configure-me-default-rtdb.firebaseio.com",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firebaseDatabase = getDatabase(firebaseApp);

export async function getFirebaseMessaging() {
  return (await isSupported()) ? getMessaging(firebaseApp) : null;
}
