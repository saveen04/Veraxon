'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { getDashboardRoute, normalizeRole, isStaffRole } from '@/lib/roles';
import { useRouter } from 'next/navigation';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  /**
   * authState holds EVERYTHING in one object so React batches the update
   * into a single render. This eliminates the race where user is set but
   * userData is still null, which was causing the role-redirect loop.
   */
  const [authState, setAuthState] = useState({
    user:     null,
    userData: null,
    loading:  true,
  });

  const router      = useRouter();
  const resolvedRef = useRef(false);

  useEffect(() => {
    if (!auth) {
      setAuthState({ user: null, userData: null, loading: false });
      return;
    }

    // Hard 6-second safety timeout — prevents infinite spinner if Firebase
    // never responds (offline, bad config, etc.)
    const timeoutId = setTimeout(() => {
      if (!resolvedRef.current) {
        console.warn('[AuthContext] Timeout — forcing loading=false');
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    }, 6000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      resolvedRef.current = true;
      clearTimeout(timeoutId);

      if (!firebaseUser) {
        // Signed out — clear everything in ONE update
        setAuthState({ user: null, userData: null, loading: false });
        try {
          localStorage.removeItem('veraxon_user');
          document.cookie = 'firebaseAuthToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          document.cookie = 'userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          document.cookie = 'profileCompleted=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        } catch { /* ignore */ }
        return;
      }

      // Fetch Firestore profile before resolving.
      // Do not fall back to cached role data — role changes must be enforced from Firestore.
      let profileData = null;
      try {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (snap.exists()) {
          const data = snap.data();
          const verifiedRole = normalizeRole(data.role);

          profileData = {
            ...data,
            uid: firebaseUser.uid,
            role: verifiedRole || data.role || null,
          };

          const minimal = {
            uid: firebaseUser.uid,
            email: profileData.email,
            role: profileData.role,
            username: profileData.username,
            photoURL: profileData.photoURL || firebaseUser.photoURL || null,
            collegeName: profileData.collegeName || '',
            department: profileData.department || '',
            profileCompleted: profileData.profileCompleted || false,
          };

          try {
            localStorage.setItem('veraxon_user', JSON.stringify(minimal));
            const token = await firebaseUser.getIdToken();
            document.cookie = `firebaseAuthToken=${token}; path=/; max-age=3600; SameSite=Strict`;
            document.cookie = `userRole=${minimal.role || ''}; path=/; max-age=3600; SameSite=Strict`;
            document.cookie = `profileCompleted=${!!profileData.profileCompleted}; path=/; max-age=3600; SameSite=Strict`;
          } catch { /* ignore */ }
        } else {
          console.warn('[AuthContext] No Firestore doc for uid:', firebaseUser.uid);
        }
      } catch (err) {
        console.error('[AuthContext] Firestore fetch error:', err.code, err.message);
      }

      if (!profileData) {
        setAuthState({ user: firebaseUser, userData: null, loading: false });
        return;
      }

      // Single atomic setState — user, userData, and loading=false together
      setAuthState({
        user: firebaseUser,
        userData: profileData,
        loading: false,
      });
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const googleSignIn = async (selectedRole) => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const snap = await getDoc(doc(db, 'users', result.user.uid));

    if (!snap.exists()) {
      if (!selectedRole) throw new Error('Role selection required for new accounts.');
      await setDoc(doc(db, 'users', result.user.uid), {
        email: result.user.email,
        username: result.user.displayName || '',
        role: selectedRole,
        photoURL: result.user.photoURL || null,
        createdAt: new Date(),
        profileCompleted: false,
      });
      return { isNew: true, role: normalizeRole(selectedRole), profileCompleted: false };
    }

    const data = snap.data();
    const verifiedRole = normalizeRole(data.role);

    if (!data.photoURL && result.user.photoURL) {
      await setDoc(
        doc(db, 'users', result.user.uid),
        { photoURL: result.user.photoURL },
        { merge: true }
      );
    }

    return {
      isNew: false,
      role: verifiedRole,
      profileCompleted: !!data.profileCompleted,
      roleMismatch: selectedRole && verifiedRole && normalizeRole(selectedRole) !== verifiedRole,
    };
  };

  const logOut = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (err) {
      console.error('[AuthContext] signOut error:', err);
    }
  };

  const { user, userData, loading } = authState;

  return (
    <AuthContext.Provider value={{ user, userData, loading, googleSignIn, logOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
