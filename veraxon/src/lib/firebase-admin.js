/**
 * Firebase Admin SDK — server-side only.
 *
 * This module initialises the Firebase Admin SDK using a service-account
 * private key stored in the FIREBASE_ADMIN_SDK_KEY environment variable
 * (JSON string) or individual FIREBASE_ADMIN_* variables.
 *
 * NEVER import this file from client-side code or any file that is
 * bundled for the browser.  It is safe to import from:
 *   - Next.js API routes  (src/app/api/.../route.js)
 *   - Server Components   (async components without 'use client')
 *   - Next.js middleware  (src/middleware.js)
 */

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// ─── Credential resolution ────────────────────────────────────────────────────
// Priority:
//   1. FIREBASE_ADMIN_SDK_KEY  — full service-account JSON as a string
//   2. Individual FIREBASE_ADMIN_* vars  — for environments that don't allow
//      multi-line secrets (e.g. some CI systems)
//   3. Application Default Credentials  — when running on Google Cloud infra

function buildCredential() {
  // Option 1: full JSON key
  const sdkKey = process.env.FIREBASE_ADMIN_SDK_KEY;
  if (sdkKey) {
    try {
      const serviceAccount = JSON.parse(sdkKey);
      return cert(serviceAccount);
    } catch {
      console.error(
        "firebase-admin: FIREBASE_ADMIN_SDK_KEY is set but could not be parsed as JSON.",
      );
    }
  }

  // Option 2: individual env vars
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );

  if (projectId && clientEmail && privateKey) {
    return cert({ projectId, clientEmail, privateKey });
  }

  // Option 3: Application Default Credentials (Google Cloud / Cloud Run / etc.)
  // Returning undefined tells the Admin SDK to use ADC automatically.
  console.warn(
    "firebase-admin: No explicit credentials found. Falling back to Application Default Credentials. " +
      "If running locally, set FIREBASE_ADMIN_SDK_KEY or individual FIREBASE_ADMIN_* vars in .env.local",
  );
  return undefined;
}

// ─── Singleton initialisation ─────────────────────────────────────────────────

let adminApp;
let adminAuth;
let adminDb;
let adminStorage;

function getAdminApp() {
  if (adminApp) return adminApp;

  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }

  const credential = buildCredential();
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "veraxon-04";

  const storageBucket =
    process.env.FIREBASE_ADMIN_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    `${projectId}.firebasestorage.app`;

  const appConfig = { projectId, storageBucket };
  if (credential) appConfig.credential = credential;

  adminApp = initializeApp(appConfig);
  return adminApp;
}

// ─── Lazy service accessors ───────────────────────────────────────────────────

/**
 * Returns the Firebase Admin Auth instance.
 * @returns {import('firebase-admin/auth').Auth}
 */
export function getAdminAuth() {
  if (!adminAuth) {
    adminAuth = getAuth(getAdminApp());
  }
  return adminAuth;
}

/**
 * Returns the Firebase Admin Firestore instance.
 * @returns {import('firebase-admin/firestore').Firestore}
 */
export function getAdminFirestore() {
  if (!adminDb) {
    adminDb = getFirestore(getAdminApp());
  }
  return adminDb;
}

/**
 * Returns the Firebase Admin Storage instance.
 * @returns {import('firebase-admin/storage').Storage}
 */
export function getAdminStorage() {
  if (!adminStorage) {
    adminStorage = getStorage(getAdminApp());
  }
  return adminStorage;
}

/**
 * Verifies a Firebase ID token and returns the decoded token claims.
 * Throws if the token is invalid or expired.
 *
 * @param {string} idToken - Firebase ID token from the client
 * @returns {Promise<import('firebase-admin/auth').DecodedIdToken>}
 */
export async function verifyFirebaseToken(idToken) {
  return getAdminAuth().verifyIdToken(idToken);
}

/**
 * Retrieves a Firebase user record by UID.
 *
 * @param {string} uid
 * @returns {Promise<import('firebase-admin/auth').UserRecord>}
 */
export async function getFirebaseUser(uid) {
  return getAdminAuth().getUser(uid);
}

/**
 * Sets custom claims on a Firebase user (e.g. role).
 *
 * @param {string} uid
 * @param {Record<string, any>} claims
 * @returns {Promise<void>}
 */
export async function setUserClaims(uid, claims) {
  return getAdminAuth().setCustomUserClaims(uid, claims);
}

// Default export for convenience
export default getAdminApp;
