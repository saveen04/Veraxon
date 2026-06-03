/**
 * Firestore helper utilities
 * Re-exports the db instance and provides typed collection helpers.
 * Import from here when you only need Firestore (avoids pulling in Auth/Storage).
 */
export { db } from '@/lib/firebase';

import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, addDoc, updateDoc, setDoc, deleteDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ─── Collection references ────────────────────────────────────────────────────
export const collections = {
  users: () => collection(db, 'users'),
  tests: () => collection(db, 'tests'),
  assessments: () => collection(db, 'assessments'),
  submissions: () => collection(db, 'submissions'),
  infractions: () => collection(db, 'infractions'),
  violations: () => collection(db, 'violations'),
  results: () => collection(db, 'results'),
  notifications: () => collection(db, 'notifications'),
  questionBanks: () => collection(db, 'questionBanks'),
};

// ─── Re-export common Firestore helpers ───────────────────────────────────────
export {
  collection, doc, getDoc, getDocs, query, where, orderBy, limit,
  addDoc, updateDoc, setDoc, deleteDoc, serverTimestamp, onSnapshot,
};

/**
 * Get a Firestore doc and return {id, ...data} or null.
 */
export async function getDocById(collectionName, docId) {
  try {
    const snap = await getDoc(doc(db, collectionName, docId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (e) {
    console.error(`[firestore] getDocById(${collectionName}/${docId}):`, e);
    return null;
  }
}

/**
 * Query a collection and return array of {id, ...data}.
 */
export async function queryDocs(collectionName, constraints = []) {
  try {
    const q = query(collection(db, collectionName), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error(`[firestore] queryDocs(${collectionName}):`, e);
    return [];
  }
}
