import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDOazunHRF6xSI37d6Dxru0MHXZR89OuFg",
  authDomain: "veraxon-04.firebaseapp.com",
  databaseURL: "https://veraxon-04-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "veraxon-04",
  storageBucket: "veraxon-04.firebasestorage.app",
  messagingSenderId: "412386840139",
  appId: "1:412386840139:web:26864e37c6e22cebc907ce",
  measurementId: "G-WG12699KXL"
};

// Always initialize Firebase (Next.js 'use client' components are browser-only)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const firestore = getFirestore(app);
const db = firestore;
const storage = getStorage(app);
const database = getDatabase(app);
const googleProvider = new GoogleAuthProvider();

let analytics = null;

// Load analytics only in browser
if (typeof window !== 'undefined') {
  import('firebase/analytics').then(({ getAnalytics }) => {
    analytics = getAnalytics(app);
  }).catch(e => console.log('Analytics loading failed:', e));
}

export { app, auth, firestore, db, storage, database, analytics, googleProvider };
export default app;
