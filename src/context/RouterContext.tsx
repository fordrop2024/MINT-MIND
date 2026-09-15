import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { AppRoute } from '../types';

interface RouterContextType {
  currentRoute: AppRoute;
  navigate: (route: AppRoute) => void;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

const VALID_ROUTES: AppRoute[] = [
  '/login',
  '/dashboard',
  '/ai-command',
  '/trends',
  '/research',
  '/ideas',
  '/script',
  '/video-generator',
  '/image-studio',
  '/editor',
  '/voice',
  '/thumbnail',
  '/seo',
  '/repurpose',
  '/youtube',
  '/scheduler',
  '/analytics',
  '/brand',
  '/templates',
  '/projects',
  '/team',
  '/settings',
  '/youtube-intelligence',
  '/youtube-intelligence/channel',
  '/youtube-intelligence/video',
  '/youtube-intelligence/rankings',
  '/youtube-intelligence/topics',
  '/youtube-intelligence/competitors',
  '/youtube-intelligence/live',
  '/youtube-intelligence/outliers',
  '/youtube-intelligence/strategy',
];

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const getInitialRoute = (): AppRoute => {
    try {
      const path = window.location.pathname as AppRoute;
      if (VALID_ROUTES.includes(path)) {
        return path;
      }
    } catch {
      // fallback
    }
    return '/dashboard';
  };

  const [currentRoute, setCurrentRoute] = useState<AppRoute>(getInitialRoute);

  const navigate = useCallback((route: AppRoute) => {
    if (!VALID_ROUTES.includes(route)) return;
    setCurrentRoute(route);
    try {
      if (window.location.pathname !== route) {
        window.history.pushState(null, '', route);
      }
    } catch {
      // fallback if in restricted frame
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname as AppRoute;
      if (VALID_ROUTES.includes(path)) {
        setCurrentRoute(path);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <RouterContext.Provider value={{ currentRoute, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
}
