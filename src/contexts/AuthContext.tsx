
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '@/lib/firebase';
import {
  User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs, limit, Timestamp } from 'firebase/firestore';
import type { AuthFormData, UserDocument } from '@/types';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  signUp: (data: AuthFormData) => Promise<User | null>;
  logIn: (data: Pick<AuthFormData, 'password'> & { email: string }) => Promise<User | null>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signUp = async ({ email, password, displayName }: AuthFormData): Promise<User | null> => {
    setLoading(true);
    setError(null);
    if (!displayName) {
        setError("Display Name is required for signup.");
        setLoading(false);
        return null;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });

      const userDocRef = doc(db, "users", userCredential.user.uid);
      const userDocument: UserDocument = {
        uid: userCredential.user.uid,
        email: userCredential.user.email || email,
        displayName: displayName,
        createdAt: serverTimestamp() as Timestamp,
        hasClaimedFiveProductGift: false, // Initialize gift claim status
      };
      await setDoc(userDocRef, userDocument);

      setCurrentUser(auth.currentUser); 
      setLoading(false);
      return userCredential.user;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      return null;
    }
  };

  const logIn = async ({ email: emailOrDisplayName, password }: Pick<AuthFormData, 'password'> & { email: string }): Promise<User | null> => {
    setLoading(true);
    setError(null);
    let actualEmail = emailOrDisplayName;

    if (!emailOrDisplayName.includes('@')) {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('displayName', '==', emailOrDisplayName), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError("Invalid display name or password.");
          setLoading(false);
          return null;
        }
        const userData = querySnapshot.docs[0].data() as UserDocument;
        actualEmail = userData.email;
      } catch (err: any) {
        setError("Error looking up display name. Please try again or use your email.");
        setLoading(false);
        return null;
      }
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, actualEmail, password);
      setLoading(false);
      return userCredential.user;
    } catch (err: any) { // Added missing opening brace here
      setError("Invalid email/display name or password.");
      setLoading(false);
      return null;
    }
  };

  const logOut = async () => {
    setLoading(true);
    setError(null);
    try {
      await firebaseSignOut(auth);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    signUp,
    logIn,
    logOut,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
