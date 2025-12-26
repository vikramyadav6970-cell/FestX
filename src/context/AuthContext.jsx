
"use client";

import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/config.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const signup = async (email, password, userData) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user profile in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const profileData = {
        ...userData,
        uid: user.uid,
        email: user.email,
        createdAt: serverTimestamp(),
      };
      await setDoc(userDocRef, profileData);

      if (profileData.role === 'organizer') {
        const approvalRef = collection(db, 'approvalRequests');
        await addDoc(approvalRef, {
          type: 'organizer',
          requesterId: user.uid,
          requesterName: profileData.name,
          requesterEmail: profileData.email,
          societyName: profileData.societyName,
          reason: profileData.reason,
          status: 'pending',
          createdAt: serverTimestamp(),
        });
      }


      // Fetch the newly created profile
      const newUserProfile = await getDoc(userDocRef);
      setUserProfile(newUserProfile.data());
      
      return userCredential;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    return signOut(auth);
  };

  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setLoading(true);
        setError(null);
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const profileData = userDoc.data();
            setUserProfile(profileData);
            
            // Handle pending organizer status
            if (profileData.role === 'organizer' && profileData.status === 'pending') {
              setError("Your organizer account is pending approval. Please wait for an admin to approve your request.");
            }
          } else {
            setError("User profile not found.");
            setUserProfile(null);
          }
        } catch (err) {
          setError("Failed to fetch user profile.");
          setUserProfile(null);
        } finally {
          setLoading(false);
        }
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    signup,
    login,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
