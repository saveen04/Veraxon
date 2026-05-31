import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
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

let app;
let auth = null;
let firestore = null;
let storage = null;
let database = null;
let analytics = null;

try {
  // Safe client-side and server-side initialization
  if (typeof window !== 'undefined') {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    firestore = getFirestore(app);
    storage = getStorage(app);
    database = getDatabase(app);
    
    // Dynamically import analytics only on client
    import('firebase/analytics').then(({ getAnalytics }) => {
      analytics = getAnalytics(app);
    }).catch(e => console.log('Analytics loading failed:', e));
  } else {
    // Basic node init for server context if needed
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  }
} catch (error) {
  console.warn('Firebase initialization warning:', error.message);
}

const db = firestore;

export { app, auth, firestore, db, storage, database, analytics };
export default app;
