import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import type { YouTubeCompetitor } from '../types/youtube';
import { useAuth } from './AuthContext';
import { db, isFirebaseConfigured, handleFirestoreError, OperationType } from '../firebase/config';

interface CompetitorContextType {
  competitors: YouTubeCompetitor[];
  selectedForComparison: string[];
  loading: boolean;
  isAdding: boolean;
  isRemoving: boolean;
  localCompetitorsPendingMigration: YouTubeCompetitor[];
  addCompetitor: (name: string, channelId: string, channelUrl: string, notes?: string) => Promise<YouTubeCompetitor>;
  editCompetitor: (id: string, name: string, channelId: string, channelUrl: string, notes?: string) => Promise<void>;
  removeCompetitor: (id: string) => Promise<void>;
  toggleComparison: (id: string) => void;
  clearComparison: () => void;
  importLocalCompetitors: () => Promise<number>;
}

const CompetitorContext = createContext<CompetitorContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'creova_youtube_competitors';
const GUEST_STORAGE_KEY = 'creova_guest_youtube_competitors';

export function CompetitorProvider({ children }: { children: React.ReactNode }) {
  const { authState, user } = useAuth();
  const [competitors, setCompetitors] = useState<YouTubeCompetitor[]>([]);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [localCompetitorsPendingMigration, setLocalCompetitorsPendingMigration] = useState<YouTubeCompetitor[]>([]);

  // Check for local unmigrated competitors
  const checkLocalCompetitors = useCallback(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLocalCompetitorsPendingMigration(parsed);
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed checking local competitors', e);
    }
    setLocalCompetitorsPendingMigration([]);
    return [];
  }, []);

  useEffect(() => {
    checkLocalCompetitors();
  }, [checkLocalCompetitors, authState]);

  // Manage competitors based on AuthState
  useEffect(() => {
    setLoading(true);

    if (authState === 'AUTHENTICATED' && user && isFirebaseConfigured && db) {
      const colRef = collection(db, 'users', user.id, 'competitors');
      const unsubscribe = onSnapshot(
        colRef,
        (snapshot) => {
          const list: YouTubeCompetitor[] = [];
          snapshot.forEach((d) => {
            const data = d.data();
            list.push({
              id: d.id,
              name: data.channelName || data.name || 'Untitled Channel',
              channelName: data.channelName || data.name || 'Untitled Channel',
              channelId: data.channelId || '',
              channelUrl: data.channelUrl || '',
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt || new Date().toISOString(),
              ownerId: data.ownerId || user.id,
              notes: data.notes || '',
            });
          });

          // Sort by createdAt desc
          list.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          setCompetitors(list);
          setLoading(false);
        },
        (err) => {
          console.error('Firestore competitors onSnapshot error:', err);
          handleFirestoreError(err, OperationType.LIST, `users/${user.id}/competitors`);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } else if (authState === 'GUEST') {
      try {
        const stored =
          localStorage.getItem(GUEST_STORAGE_KEY) || localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setCompetitors(parsed);
          }
        } else {
          setCompetitors([]);
        }
      } catch (e) {
        console.warn('Failed to load guest competitors from storage', e);
        setCompetitors([]);
      }
      setLoading(false);
    } else {
      // SIGNED_OUT
      setCompetitors([]);
      setSelectedForComparison([]);
      setLoading(false);
    }
  }, [authState, user]);

  // Persist guest competitors locally
  useEffect(() => {
    if (authState === 'GUEST') {
      try {
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(competitors));
      } catch (e) {
        console.warn('Failed to persist guest competitors to storage', e);
      }
    }
  }, [competitors, authState]);

  const addCompetitor = async (
    name: string,
    channelId: string,
    channelUrl: string,
    notes?: string
  ): Promise<YouTubeCompetitor> => {
    const trimmedName = name.trim();
    const trimmedId = channelId.trim();
    const trimmedUrl = channelUrl.trim();

    if (!trimmedName) throw new Error('Channel name is required');
    if (!trimmedId && !trimmedUrl) throw new Error('Channel ID or URL is required');

    setIsAdding(true);
    const now = new Date().toISOString();
    const finalChannelId =
      trimmedId ||
      (trimmedUrl.includes('/channel/')
        ? trimmedUrl.split('/channel/')[1].split('/')[0].split('?')[0]
        : trimmedUrl.replace('https://youtube.com/@', '@'));
    const finalChannelUrl = trimmedUrl || `https://youtube.com/channel/${finalChannelId}`;

    const newId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `comp_${Date.now()}`;

    const newCompetitor: YouTubeCompetitor = {
      id: newId,
      name: trimmedName,
      channelName: trimmedName,
      channelId: finalChannelId,
      channelUrl: finalChannelUrl,
      createdAt: now,
      updatedAt: now,
      ownerId: user?.id,
      notes: notes?.trim(),
    };

    try {
      if (authState === 'AUTHENTICATED' && user && isFirebaseConfigured && db) {
        const docRef = doc(db, 'users', user.id, 'competitors', newId);
        await setDoc(docRef, {
          id: newId,
          ownerId: user.id,
          channelName: trimmedName,
          channelId: finalChannelId,
          channelUrl: finalChannelUrl,
          createdAt: now,
          updatedAt: now,
          notes: notes?.trim() || '',
        });
        return newCompetitor;
      } else {
        setCompetitors((prev) => [newCompetitor, ...prev]);
        return newCompetitor;
      }
    } catch (err) {
      console.error('Failed to add competitor:', err);
      if (authState === 'AUTHENTICATED' && user) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.id}/competitors/${newId}`);
      }
      throw err;
    } finally {
      setIsAdding(false);
    }
  };

  const editCompetitor = async (
    id: string,
    name: string,
    channelId: string,
    channelUrl: string,
    notes?: string
  ): Promise<void> => {
    const trimmedName = name.trim();
    if (!trimmedName) throw new Error('Channel name is required');
    const now = new Date().toISOString();

    try {
      if (authState === 'AUTHENTICATED' && user && isFirebaseConfigured && db) {
        const docRef = doc(db, 'users', user.id, 'competitors', id);
        await updateDoc(docRef, {
          channelName: trimmedName,
          channelId: channelId.trim(),
          channelUrl: channelUrl.trim(),
          updatedAt: now,
          notes: notes?.trim() || '',
        });
      } else {
        setCompetitors((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  name: trimmedName,
                  channelName: trimmedName,
                  channelId: channelId.trim(),
                  channelUrl: channelUrl.trim(),
                  updatedAt: now,
                  notes: notes?.trim(),
                }
              : c
          )
        );
      }
    } catch (err) {
      console.error('Failed to edit competitor:', err);
      if (authState === 'AUTHENTICATED' && user) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.id}/competitors/${id}`);
      }
      throw err;
    }
  };

  const removeCompetitor = async (id: string): Promise<void> => {
    setIsRemoving(true);
    try {
      if (authState === 'AUTHENTICATED' && user && isFirebaseConfigured && db) {
        const docRef = doc(db, 'users', user.id, 'competitors', id);
        await deleteDoc(docRef);
      } else {
        setCompetitors((prev) => prev.filter((c) => c.id !== id));
      }
      setSelectedForComparison((prev) => prev.filter((item) => item !== id));
    } catch (err) {
      console.error('Failed to remove competitor:', err);
      if (authState === 'AUTHENTICATED' && user) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.id}/competitors/${id}`);
      }
      throw err;
    } finally {
      setIsRemoving(false);
    }
  };

  const toggleComparison = (id: string) => {
    setSelectedForComparison((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

  const clearComparison = () => {
    setSelectedForComparison([]);
  };

  const importLocalCompetitors = async (): Promise<number> => {
    if (authState !== 'AUTHENTICATED' || !user || !db) {
      throw new Error('Must be authenticated to import competitors');
    }

    const localList = checkLocalCompetitors();
    if (localList.length === 0) return 0;

    let importedCount = 0;
    const existingIds = new Set(competitors.map((c) => c.id));

    for (const item of localList) {
      if (!existingIds.has(item.id)) {
        try {
          const docRef = doc(db, 'users', user.id, 'competitors', item.id);
          await setDoc(docRef, {
            id: item.id,
            ownerId: user.id,
            channelName: item.channelName || item.name,
            channelId: item.channelId || '',
            channelUrl: item.channelUrl || '',
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            notes: item.notes || '',
          });
          importedCount++;
        } catch (err) {
          console.warn('Failed to import competitor ' + item.id, err);
        }
      }
    }

    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setLocalCompetitorsPendingMigration([]);
    return importedCount;
  };

  return (
    <CompetitorContext.Provider
      value={{
        competitors,
        selectedForComparison,
        loading,
        isAdding,
        isRemoving,
        localCompetitorsPendingMigration,
        addCompetitor,
        editCompetitor,
        removeCompetitor,
        toggleComparison,
        clearComparison,
        importLocalCompetitors,
      }}
    >
      {children}
    </CompetitorContext.Provider>
  );
}

export function useCompetitors() {
  const context = useContext(CompetitorContext);
  if (!context) {
    throw new Error('useCompetitors must be used within a CompetitorProvider');
  }
  return context;
}
