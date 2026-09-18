import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, isFirebaseConfigured, handleFirestoreError, OperationType } from '../firebase/config';
import { useAuth } from './AuthContext';
import type {
  YouTubePublishPayload,
  ConnectedYouTubeChannel,
} from '../services/youtubePublishService';
import {
  getConnectedYouTubeChannel,
} from '../services/youtubePublishService';
import type {
  YouTubeOutlier,
  YouTubeChannel,
} from '../types/youtube';
import {
  detectPerformanceOutliers,
  generateTopicOpportunityClusters,
  type TopicOpportunityCluster,
} from '../services/youtubeIntelligenceService';

interface YouTubeContextType {
  channel: ConnectedYouTubeChannel | null;
  publishingQueue: YouTubePublishPayload[];
  outliers: YouTubeOutlier[];
  topicClusters: TopicOpportunityCluster[];
  isLoading: boolean;
  activeNiche: string;
  setActiveNiche: (niche: string) => void;
  publishVideo: (payload: YouTubePublishPayload) => Promise<void>;
  updateQueueItem: (id: string, updates: Partial<YouTubePublishPayload>) => Promise<void>;
  removeFromQueue: (id: string) => Promise<void>;
  connectChannel: () => Promise<void>;
  disconnectChannel: () => Promise<void>;
  refreshRadar: (niche: string) => void;
}

const YouTubeContext = createContext<YouTubeContextType | undefined>(undefined);

const LOCAL_STORAGE_QUEUE_KEY = 'mintmind_youtube_publishing_queue';

export const YouTubeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [channel, setChannel] = useState<ConnectedYouTubeChannel | null>(getConnectedYouTubeChannel);
  const [publishingQueue, setPublishingQueue] = useState<YouTubePublishPayload[]>([]);
  const [activeNiche, setActiveNiche] = useState('AI & Content Creation');
  const [isLoading, setIsLoading] = useState(false);

  // Topic clusters and outliers
  const [topicClusters, setTopicClusters] = useState<TopicOpportunityCluster[]>(() =>
    generateTopicOpportunityClusters('AI & Content Creation')
  );
  const [outliers, setOutliers] = useState<YouTubeOutlier[]>(() =>
    detectPerformanceOutliers([
      {
        id: 'v1',
        title: 'I Automated My Entire Workflow in 48 Hours (Step-by-Step)',
        views: 184000,
        channelTitle: 'Creator Systems',
        publishedAt: '2026-03-02',
      },
      {
        id: 'v2',
        title: 'Why 99% Of Creators Are Using AI Completely Wrong',
        views: 312000,
        channelTitle: 'Digital Momentum',
        publishedAt: '2026-02-18',
      },
      {
        id: 'v3',
        title: 'The Uncomfortable Truth About the Future of Content Creation',
        views: 420000,
        channelTitle: 'Tech Vision',
        publishedAt: '2026-01-25',
      },
    ])
  );

  // Sync Publishing Queue with Firestore or LocalStorage
  useEffect(() => {
    if (isFirebaseConfigured && db && user?.uid) {
      const queueColRef = collection(db, 'users', user.uid, 'youtube_publish_queue');
      const unsubscribe = onSnapshot(
        queueColRef,
        (snapshot) => {
          const items: YouTubePublishPayload[] = [];
          snapshot.forEach((d) => {
            items.push(d.data() as YouTubePublishPayload);
          });
          setPublishingQueue(items);
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/youtube_publish_queue`);
        }
      );
      return () => unsubscribe();
    } else {
      // LocalStorage fallback
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_QUEUE_KEY);
        if (stored) {
          setPublishingQueue(JSON.parse(stored));
        }
      } catch (err) {
        console.warn('Failed to load youtube publish queue from localStorage', err);
      }
    }
  }, [user]);

  // Persist to local storage if not using cloud
  const saveToLocal = (items: YouTubePublishPayload[]) => {
    setPublishingQueue(items);
    try {
      localStorage.setItem(LOCAL_STORAGE_QUEUE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed saving publish queue to localStorage', e);
    }
  };

  const publishVideo = async (payload: YouTubePublishPayload) => {
    setIsLoading(true);
    try {
      const updatedItem: YouTubePublishPayload = {
        ...payload,
        status: payload.scheduledPublishTime ? 'scheduled' : 'published',
        publishedVideoId: payload.publishedVideoId || `yt-v-${Date.now()}`,
        publishedUrl: payload.publishedUrl || 'https://youtube.com/watch?v=dQw4w9WgXcQ',
        updatedAt: new Date().toISOString(),
      };

      if (isFirebaseConfigured && db && user?.uid) {
        const docRef = doc(db, 'users', user.uid, 'youtube_publish_queue', payload.id);
        await setDoc(docRef, updatedItem, { merge: true });
      } else {
        const exists = publishingQueue.some((q) => q.id === payload.id);
        const nextQueue = exists
          ? publishingQueue.map((q) => (q.id === payload.id ? updatedItem : q))
          : [updatedItem, ...publishingQueue];
        saveToLocal(nextQueue);
      }
    } catch (err: any) {
      console.error('Failed to publish video:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateQueueItem = async (id: string, updates: Partial<YouTubePublishPayload>) => {
    if (isFirebaseConfigured && db && user?.uid) {
      const docRef = doc(db, 'users', user.uid, 'youtube_publish_queue', id);
      await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
    } else {
      const nextQueue = publishingQueue.map((q) =>
        q.id === id ? { ...q, ...updates, updatedAt: new Date().toISOString() } : q
      );
      saveToLocal(nextQueue);
    }
  };

  const removeFromQueue = async (id: string) => {
    if (isFirebaseConfigured && db && user?.uid) {
      const docRef = doc(db, 'users', user.uid, 'youtube_publish_queue', id);
      await deleteDoc(docRef);
    } else {
      const nextQueue = publishingQueue.filter((q) => q.id !== id);
      saveToLocal(nextQueue);
    }
  };

  const connectChannel = async () => {
    setChannel(getConnectedYouTubeChannel());
  };

  const disconnectChannel = async () => {
    setChannel(null);
  };

  const refreshRadar = (niche: string) => {
    setActiveNiche(niche);
    setTopicClusters(generateTopicOpportunityClusters(niche));
  };

  return (
    <YouTubeContext.Provider
      value={{
        channel,
        publishingQueue,
        outliers,
        topicClusters,
        isLoading,
        activeNiche,
        setActiveNiche,
        publishVideo,
        updateQueueItem,
        removeFromQueue,
        connectChannel,
        disconnectChannel,
        refreshRadar,
      }}
    >
      {children}
    </YouTubeContext.Provider>
  );
};

export const useYouTube = () => {
  const context = useContext(YouTubeContext);
  if (!context) {
    throw new Error('useYouTube must be used within a YouTubeProvider');
  }
  return context;
};
