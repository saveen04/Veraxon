'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // Fetch additional user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = { ...userDoc.data(), uid: user.uid };
            setUserData(data);

            // Minimize data stored in localStorage to only what's needed for the session/routing
            const minimalData = {
              uid: user.uid,
              email: data.email,
              role: data.role,
              username: data.username,
              photoURL: data.photoURL || user.photoURL || null,
              collegeName: data.collegeName,
              department: data.department,
              profileCompleted: data.profileCompleted || false
            };

            try {
              localStorage.setItem('veraxon_user', JSON.stringify(minimalData));
              // Sync to cookies for Next.js Middleware edge routing
              const token = await user.getIdToken();
              document.cookie = `firebaseAuthToken=${token}; path=/; max-age=3600; SameSite=Strict`;
              document.cookie = `userRole=${data.role}; path=/; max-age=3600; SameSite=Strict`;
              document.cookie = `profileCompleted=${!!data.profileCompleted}; path=/; max-age=3600; SameSite=Strict`;
            } catch (e) {
              if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                console.warn('LocalStorage quota exceeded. Clearing non-essential data.');
                localStorage.clear();
                localStorage.setItem('veraxon_user', JSON.stringify(minimalData));
              }
            }
          } else {
            console.warn('User document not found in Firestore.');
            setUserData(null);
          }
        } catch (error) {
          console.error('Error fetching user data from Firestore:', error);
          if (error.code === 'permission-denied') {
            console.error('Firestore Permission Denied. Please check your security rules.');
          }
          setUserData(null);
        }
      } else {
        setUser(null);
        setUserData(null);
        localStorage.removeItem('veraxon_user');
        document.cookie = "firebaseAuthToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "profileCompleted=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const googleSignIn = async (selectedRole) => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));

      if (!userDoc.exists()) {
        if (!selectedRole) throw new Error('Role selection required for new accounts.');

        await setDoc(doc(db, 'users', result.user.uid), {
          email: result.user.email,
          username: result.user.displayName || '',
          role: selectedRole,
          photoURL: result.user.photoURL || null,
          createdAt: new Date(),
          profileCompleted: false
        });
        return { isNew: true, role: selectedRole, profileCompleted: false };
      } else {
        const data = userDoc.data();

        // Opportunistically update photoURL if missing in DB
        if (!data.photoURL && result.user.photoURL) {
          await setDoc(doc(db, 'users', result.user.uid), { photoURL: result.user.photoURL }, { merge: true });
        }

        // If a role was selected but user already exists, we enforce their existing role to prevent role swapping
        return {
          isNew: false,
          role: data.role,
          profileCompleted: !!data.profileCompleted,
          roleMismatch: selectedRole && data.role !== selectedRole
        };
      }
    } catch (error) {
      console.error('Google Sign In Error:', error);
      throw error;
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Sign Out Error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, googleSignIn, logOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
