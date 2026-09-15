import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  auth,
  db,
  googleAuthProvider,
  isFirebaseConfigured,
  firebaseConfigError,
  handleFirestoreError,
  OperationType,
} from '../firebase/config';

export type AuthState = 'LOADING' | 'AUTHENTICATED' | 'GUEST' | 'SIGNED_OUT';

export interface UserProfile {
  id: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: string;
  lastLoginAt: string;
  accountType: 'user' | 'guest';
  preferences: Record<string, unknown>;
}

interface AuthContextType {
  authState: AuthState;
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isFirebaseConfigured: boolean;
  configError: string | null;
  error: string | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_STORAGE_KEY = 'creova_guest_mode_active';
const GUEST_PROFILE_KEY = 'creova_guest_profile';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>('LOADING');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Synchronize Firestore user document for authenticated users
  const syncUserProfile = async (fbUser: FirebaseUser): Promise<UserProfile> => {
    const defaultProfile: UserProfile = {
      id: fbUser.uid,
      displayName: fbUser.displayName || 'CREOVA Creator',
      email: fbUser.email,
      photoURL: fbUser.photoURL,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      accountType: 'user',
      preferences: {},
    };

    if (!db) {
      return defaultProfile;
    }

    const userDocRef = doc(db, 'users', fbUser.uid);

    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data() as Partial<UserProfile>;
        const updated: UserProfile = {
          ...defaultProfile,
          ...data,
          lastLoginAt: new Date().toISOString(),
        };

        // Update last login
        await setDoc(
          userDocRef,
          {
            lastLoginAt: new Date().toISOString(),
            displayName: fbUser.displayName || updated.displayName,
            photoURL: fbUser.photoURL || updated.photoURL,
          },
          { merge: true }
        ).catch((err) => {
          console.warn('Could not update lastLoginAt in Firestore:', err);
        });

        return updated;
      } else {
        // Create initial user document
        await setDoc(userDocRef, {
          id: fbUser.uid,
          displayName: fbUser.displayName || 'CREOVA Creator',
          email: fbUser.email || '',
          photoURL: fbUser.photoURL || '',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          accountType: 'user',
          preferences: {},
        });
        return defaultProfile;
      }
    } catch (err) {
      console.error('Failed to sync user profile with Firestore:', err);
      return defaultProfile;
    }
  };

  // Auth observer lifecycle
  useEffect(() => {
    let unsubscribe = () => {};

    if (isFirebaseConfigured && auth) {
      unsubscribe = onAuthStateChanged(
        auth,
        async (fbUser) => {
          if (fbUser) {
            setFirebaseUser(fbUser);
            try {
              const profile = await syncUserProfile(fbUser);
              setUser(profile);
              setAuthState('AUTHENTICATED');
              localStorage.removeItem(GUEST_STORAGE_KEY);
            } catch (err) {
              console.error('Error synchronizing user session:', err);
              setUser({
                id: fbUser.uid,
                displayName: fbUser.displayName || 'CREOVA Creator',
                email: fbUser.email,
                photoURL: fbUser.photoURL,
                createdAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString(),
                accountType: 'user',
                preferences: {},
              });
              setAuthState('AUTHENTICATED');
            }
          } else {
            setFirebaseUser(null);
            // Check if Guest Mode was previously enabled
            const isGuest = localStorage.getItem(GUEST_STORAGE_KEY) === 'true';
            if (isGuest) {
              const cached = localStorage.getItem(GUEST_PROFILE_KEY);
              if (cached) {
                try {
                  setUser(JSON.parse(cached));
                } catch {
                  initGuestUser();
                }
              } else {
                initGuestUser();
              }
              setAuthState('GUEST');
            } else {
              setUser(null);
              setAuthState('SIGNED_OUT');
            }
          }
        },
        (authError) => {
          console.error('Firebase Auth observer error:', authError);
          setAuthState('SIGNED_OUT');
        }
      );
    } else {
      // Firebase not configured or in transition
      const isGuest = localStorage.getItem(GUEST_STORAGE_KEY) === 'true';
      if (isGuest) {
        initGuestUser();
        setAuthState('GUEST');
      } else {
        setAuthState('SIGNED_OUT');
      }
    }

    return () => unsubscribe();
  }, []);

  const initGuestUser = () => {
    let guestId = 'guest_creator';
    try {
      const existing = localStorage.getItem(GUEST_PROFILE_KEY);
      if (existing) {
        const parsed = JSON.parse(existing);
        setUser(parsed);
        return;
      }
      guestId = 'guest_' + Math.random().toString(36).substring(2, 10);
    } catch {
      // fallback
    }

    const guestProfile: UserProfile = {
      id: guestId,
      displayName: 'Guest Creator',
      email: null,
      photoURL: null,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      accountType: 'guest',
      preferences: {},
    };

    try {
      localStorage.setItem(GUEST_STORAGE_KEY, 'true');
      localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(guestProfile));
    } catch (e) {
      console.warn('Could not cache guest profile:', e);
    }

    setUser(guestProfile);
  };

  const loginWithGoogle = async () => {
    setError(null);
    setLoading(true);

    if (!isFirebaseConfigured || !auth) {
      const errMsg =
        'Firebase configuration is missing or could not be loaded. Please complete the Firebase setup terms in the platform to enable Google Sign-In.';
      setError(errMsg);
      setLoading(false);
      throw new Error(errMsg);
    }

    try {
      const cred = await signInWithPopup(auth, googleAuthProvider);
      setFirebaseUser(cred.user);
      const profile = await syncUserProfile(cred.user);
      setUser(profile);
      setAuthState('AUTHENTICATED');
      localStorage.removeItem(GUEST_STORAGE_KEY);
      localStorage.removeItem(GUEST_PROFILE_KEY);
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      console.error('Google Sign-In error details:', firebaseError);

      if (
        firebaseError.code === 'auth/popup-closed-by-user' ||
        firebaseError.code === 'auth/cancelled-popup-request'
      ) {
        setError('Sign-in popup was closed. Please try again.');
      } else if (firebaseError.code === 'auth/popup-blocked') {
        setError('Sign-in popup was blocked by your browser. Please allow popups for this site.');
      } else if (firebaseError.code === 'auth/network-request-failed') {
        setError('Network error during authentication. Check your internet connection.');
      } else {
        setError(
          firebaseError.message || 'An error occurred during Google Sign-In. Please try again.'
        );
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginAsGuest = () => {
    setError(null);
    initGuestUser();
    setAuthState('GUEST');
  };

  const logout = async () => {
    setError(null);
    setLoading(true);
    try {
      if (auth && auth.currentUser) {
        await signOut(auth);
      }
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      localStorage.removeItem(GUEST_STORAGE_KEY);
      localStorage.removeItem(GUEST_PROFILE_KEY);
      setUser(null);
      setFirebaseUser(null);
      setAuthState('SIGNED_OUT');
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        authState,
        user,
        firebaseUser,
        isFirebaseConfigured,
        configError: firebaseConfigError,
        error,
        loading,
        loginWithGoogle,
        loginAsGuest,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
