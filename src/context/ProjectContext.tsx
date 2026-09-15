import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import type { Project } from '../types';
import { useAuth } from './AuthContext';
import { db, isFirebaseConfigured, handleFirestoreError, OperationType } from '../firebase/config';

interface ProjectContextType {
  projects: Project[];
  activeProject: Project | null;
  loading: boolean;
  isCreating: boolean;
  isDeleting: boolean;
  error: string | null;
  localProjectsPendingMigration: Project[];
  createProject: (name: string, description: string) => Promise<Project>;
  openProject: (id: string) => void;
  deleteProject: (id: string) => Promise<void>;
  updateProject: (id: string, name: string, description: string) => Promise<void>;
  importLocalProjects: () => Promise<number>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'creova_projects';
const GUEST_STORAGE_KEY = 'creova_guest_projects';

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { authState, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [localProjectsPendingMigration, setLocalProjectsPendingMigration] = useState<Project[]>([]);

  // Check for local unmigrated projects
  const checkLocalProjects = useCallback(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLocalProjectsPendingMigration(parsed);
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to read local projects for migration check', e);
    }
    setLocalProjectsPendingMigration([]);
    return [];
  }, []);

  useEffect(() => {
    checkLocalProjects();
  }, [checkLocalProjects, authState]);

  // Manage projects lifecycle based on AuthState
  useEffect(() => {
    setLoading(true);
    setError(null);

    if (authState === 'AUTHENTICATED' && user && isFirebaseConfigured && db) {
      const projectsColRef = collection(db, 'users', user.id, 'projects');
      const activeKey = `creova_active_proj_${user.id}`;
      const savedActive = localStorage.getItem(activeKey);

      const unsubscribe = onSnapshot(
        projectsColRef,
        (snapshot) => {
          const fetched: Project[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            fetched.push({
              id: docSnap.id,
              name: data.name || 'Untitled Project',
              description: data.description || '',
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt || new Date().toISOString(),
              ownerId: data.ownerId || user.id,
            });
          });

          // Sort by updatedAt desc
          fetched.sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );

          setProjects(fetched);
          if (savedActive && fetched.some((p) => p.id === savedActive)) {
            setActiveProjectId(savedActive);
          } else if (fetched.length > 0) {
            setActiveProjectId(fetched[0].id);
          } else {
            setActiveProjectId(null);
          }
          setLoading(false);
        },
        (err) => {
          console.error('Firestore projects onSnapshot error:', err);
          handleFirestoreError(err, OperationType.LIST, `users/${user.id}/projects`);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } else if (authState === 'GUEST') {
      // Guest mode - purely local storage isolated to guest
      try {
        const stored =
          localStorage.getItem(GUEST_STORAGE_KEY) || localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setProjects(parsed);
            if (parsed.length > 0) {
              setActiveProjectId(parsed[0].id);
            }
          }
        } else {
          setProjects([]);
        }
      } catch (e) {
        console.warn('Failed reading guest projects', e);
        setProjects([]);
      }
      setLoading(false);
    } else if (authState === 'SIGNED_OUT') {
      // Clear all sensitive project data from memory
      setProjects([]);
      setActiveProjectId(null);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [authState, user]);

  // Keep active project synchronized
  const activeProject =
    projects.find((p) => p.id === activeProjectId) || (projects.length > 0 ? projects[0] : null);

  // Sync active project selection to localStorage per user/guest
  useEffect(() => {
    if (!activeProjectId) return;
    try {
      if (authState === 'AUTHENTICATED' && user) {
        localStorage.setItem(`creova_active_proj_${user.id}`, activeProjectId);
      } else if (authState === 'GUEST') {
        localStorage.setItem('creova_active_guest_project', activeProjectId);
      }
    } catch {
      // ignore
    }
  }, [activeProjectId, authState, user]);

  // Save guest projects to localStorage
  useEffect(() => {
    if (authState === 'GUEST') {
      try {
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(projects));
      } catch (e) {
        console.warn('Failed to persist guest projects', e);
      }
    }
  }, [projects, authState]);

  const createProject = async (name: string, description: string): Promise<Project> => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Project name cannot be empty');
    }

    setIsCreating(true);
    setError(null);
    const now = new Date().toISOString();
    const newId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `proj_${Date.now()}`;

    const newProject: Project = {
      id: newId,
      name: trimmedName,
      description: description.trim(),
      createdAt: now,
      updatedAt: now,
      ownerId: user?.id,
    };

    try {
      if (authState === 'AUTHENTICATED' && user && isFirebaseConfigured && db) {
        const docRef = doc(db, 'users', user.id, 'projects', newId);
        await setDoc(docRef, {
          id: newId,
          name: trimmedName,
          description: description.trim(),
          createdAt: now,
          updatedAt: now,
          ownerId: user.id,
        });
        setActiveProjectId(newId);
        return newProject;
      } else {
        // Guest or fallback local
        setProjects((prev) => [newProject, ...prev]);
        setActiveProjectId(newId);
        return newProject;
      }
    } catch (err) {
      console.error('Failed to create project:', err);
      if (authState === 'AUTHENTICATED' && user) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.id}/projects/${newId}`);
      }
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  const openProject = (id: string) => {
    const target = projects.find((p) => p.id === id);
    if (target) {
      setActiveProjectId(id);
    }
  };

  const updateProject = async (id: string, name: string, description: string): Promise<void> => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const now = new Date().toISOString();

    try {
      if (authState === 'AUTHENTICATED' && user && isFirebaseConfigured && db) {
        const docRef = doc(db, 'users', user.id, 'projects', id);
        await updateDoc(docRef, {
          name: trimmedName,
          description: description.trim(),
          updatedAt: now,
        });
      } else {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...p, name: trimmedName, description: description.trim(), updatedAt: now }
              : p
          )
        );
      }
    } catch (err) {
      console.error('Failed to update project:', err);
      if (authState === 'AUTHENTICATED' && user) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.id}/projects/${id}`);
      }
      throw err;
    }
  };

  const deleteProject = async (id: string): Promise<void> => {
    setIsDeleting(true);
    try {
      if (authState === 'AUTHENTICATED' && user && isFirebaseConfigured && db) {
        const docRef = doc(db, 'users', user.id, 'projects', id);
        await deleteDoc(docRef);
      } else {
        setProjects((prev) => {
          const filtered = prev.filter((p) => p.id !== id);
          if (activeProjectId === id) {
            const nextActive = filtered.length > 0 ? filtered[0].id : null;
            setActiveProjectId(nextActive);
          }
          return filtered;
        });
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
      if (authState === 'AUTHENTICATED' && user) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.id}/projects/${id}`);
      }
      throw err;
    } finally {
      setIsDeleting(false);
    }
  };

  // Safe migration of local projects into Firestore for authenticated user
  const importLocalProjects = async (): Promise<number> => {
    if (authState !== 'AUTHENTICATED' || !user || !db) {
      throw new Error('Must be authenticated to import projects to cloud');
    }

    const localItems = checkLocalProjects();
    if (localItems.length === 0) return 0;

    let importedCount = 0;
    const existingIds = new Set(projects.map((p) => p.id));

    for (const item of localItems) {
      if (!existingIds.has(item.id)) {
        try {
          const docRef = doc(db, 'users', user.id, 'projects', item.id);
          await setDoc(docRef, {
            id: item.id,
            name: item.name,
            description: item.description || '',
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: item.updatedAt || new Date().toISOString(),
            ownerId: user.id,
          });
          importedCount++;
        } catch (err) {
          console.warn('Failed to import project ' + item.id, err);
        }
      }
    }

    // Clear local storage after user confirmed import
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setLocalProjectsPendingMigration([]);
    return importedCount;
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        loading,
        isCreating,
        isDeleting,
        error,
        localProjectsPendingMigration,
        createProject,
        openProject,
        deleteProject,
        updateProject,
        importLocalProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
}

export const useProject = useProjects;
