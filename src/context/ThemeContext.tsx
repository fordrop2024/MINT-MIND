import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ThemeMode } from '../types';
import { useAuth } from './AuthContext';
import { db, isFirebaseConfigured } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'creova_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { authState, user } = useAuth();

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light' || saved === 'mix') {
        return saved;
      }
    } catch {
      // ignore storage error
    }
    return 'dark'; // Default futuristic dark command center
  });

  // Apply classes to HTML root immediately whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-light', 'theme-mix');
    root.classList.add(`theme-${theme}`);
    root.style.colorScheme = theme === 'light' ? 'light' : 'dark';

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      console.warn('Could not persist theme to localStorage', e);
    }
  }, [theme]);

  // Sync theme from Firestore when user authenticates
  useEffect(() => {
    if (authState === 'AUTHENTICATED' && user && isFirebaseConfigured && db) {
      const settingsDocRef = doc(db, 'users', user.id, 'settings', 'preferences');
      getDoc(settingsDocRef)
        .then((snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data.theme === 'dark' || data.theme === 'light' || data.theme === 'mix') {
              setThemeState(data.theme);
            }
          }
        })
        .catch((err) => {
          console.warn('Could not fetch user theme settings from Firestore:', err);
        });
    }
  }, [authState, user]);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);

    // If authenticated, persist to Firestore
    if (authState === 'AUTHENTICATED' && user && isFirebaseConfigured && db) {
      const settingsDocRef = doc(db, 'users', user.id, 'settings', 'preferences');
      setDoc(
        settingsDocRef,
        {
          id: 'preferences',
          theme: mode,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch((err) => {
        console.warn('Failed persisting theme to Firestore:', err);
      });
    }
  };

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === 'dark' ? 'mix' : theme === 'mix' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
