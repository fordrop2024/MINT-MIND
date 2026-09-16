import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import type {
  Idea,
  IdeaGenerationInputs,
  IdeaAnalysis,
  IdeaVariation,
} from '../types/idea';
import { useAuth } from './AuthContext';
import { useProject } from './ProjectContext';
import { db, isFirebaseConfigured, handleFirestoreError, OperationType } from '../firebase/config';
import {
  generateIdeasAPI,
  analyzeIdeaAPI,
  generateVariationsAPI,
  improveIdeaAPI,
} from '../services/aiService';

interface IdeaContextType {
  ideas: Idea[];
  projectIdeas: Idea[];
  activeIdea: Idea | null;
  loading: boolean;
  isGenerating: boolean;
  generationStep: string;
  generationProgress: number;
  error: string | null;
  generateIdeas: (inputs: IdeaGenerationInputs) => Promise<Idea[]>;
  saveIdea: (idea: Idea) => Promise<void>;
  updateIdea: (ideaId: string, updates: Partial<Idea>) => Promise<void>;
  deleteIdea: (ideaId: string) => Promise<void>;
  duplicateIdea: (idea: Idea) => Promise<Idea>;
  improveIdea: (idea: Idea) => Promise<Idea>;
  analyzeIdea: (idea: Idea) => Promise<IdeaAnalysis>;
  generateVariations: (idea: Idea) => Promise<IdeaVariation[]>;
  setActiveIdea: (idea: Idea | null) => void;
  clearError: () => void;
}

const IdeaContext = createContext<IdeaContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'creova_ideas';
const GUEST_STORAGE_KEY = 'creova_guest_ideas';

export function IdeaProvider({ children }: { children: React.ReactNode }) {
  const { authState, user } = useAuth();
  const { activeProject } = useProject();

  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [activeIdea, setActiveIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Load from local storage helper
  const loadLocalIdeas = useCallback(() => {
    try {
      const storageKey = authState === 'GUEST' ? GUEST_STORAGE_KEY : LOCAL_STORAGE_KEY;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setIdeas(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to parse local ideas', e);
    }
    setIdeas([]);
  }, [authState]);

  // Save to local storage helper
  const saveLocalIdeas = useCallback((newIdeas: Idea[]) => {
    try {
      const storageKey = authState === 'GUEST' ? GUEST_STORAGE_KEY : LOCAL_STORAGE_KEY;
      localStorage.setItem(storageKey, JSON.stringify(newIdeas));
    } catch (e) {
      console.warn('Failed to store local ideas', e);
    }
  }, [authState]);

  // Persistence listener based on AuthState
  useEffect(() => {
    setLoading(true);
    setError(null);

    if (authState === 'AUTHENTICATED' && user && isFirebaseConfigured && db) {
      const ideasColRef = collection(db, 'users', user.id, 'ideas');

      const unsubscribe = onSnapshot(
        ideasColRef,
        (snapshot) => {
          const fetched: Idea[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Idea;
            fetched.push({
              ...data,
              id: docSnap.id,
              ownerId: user.id,
            });
          });

          // Sort by updatedAt desc
          fetched.sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );

          setIdeas((prev) => {
            // Retain any in-memory draft ideas generated in current session that haven't been saved yet
            const unsavedDrafts = prev.filter(
              (p) => p.status === 'draft' && !fetched.some((f) => f.id === p.id)
            );
            return [...unsavedDrafts, ...fetched];
          });
          setLoading(false);
        },
        (err) => {
          console.error('Firestore ideas onSnapshot error:', err);
          handleFirestoreError(err, OperationType.LIST, `users/${user.id}/ideas`);
          loadLocalIdeas();
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } else {
      // Guest or offline
      loadLocalIdeas();
      setLoading(false);
    }
  }, [authState, user, loadLocalIdeas]);

  // Generate Ideas with real progress tracking
  const generateIdeas = async (inputs: IdeaGenerationInputs): Promise<Idea[]> => {
    setIsGenerating(true);
    setError(null);
    setGenerationProgress(10);
    setGenerationStep('Analyzing topic velocity & audience signals...');

    try {
      const timer1 = setTimeout(() => {
        setGenerationProgress(35);
        setGenerationStep('Synthesizing high-retention hooks & curiosity gaps...');
      }, 700);

      const timer2 = setTimeout(() => {
        setGenerationProgress(70);
        setGenerationStep('Scoring algorithmic opportunity & packaging concepts...');
      }, 1500);

      // Link to active project if not explicitly set
      const enrichedInputs: IdeaGenerationInputs = {
        ...inputs,
        projectId: inputs.projectId || activeProject?.id,
      };

      const generated = await generateIdeasAPI(enrichedInputs);

      clearTimeout(timer1);
      clearTimeout(timer2);
      setGenerationProgress(100);
      setGenerationStep('Finalizing creator blueprint...');

      // Mark ideas with active ownerId
      const finalIdeas: Idea[] = generated.map((idea) => ({
        ...idea,
        ownerId: user?.id || 'guest',
        projectId: enrichedInputs.projectId,
      }));

      // Automatically add generated ideas to state so user sees them immediately
      setIdeas((prev) => {
        const combined = [...finalIdeas, ...prev];
        saveLocalIdeas(combined);
        return combined;
      });

      if (finalIdeas.length > 0) {
        setActiveIdea(finalIdeas[0]);
      }

      setIsGenerating(false);
      setGenerationProgress(0);
      setGenerationStep('');
      return finalIdeas;
    } catch (err: any) {
      console.error('Failed to generate ideas:', err);
      const msg = err.message || 'Idea generation failed. Please check connection and try again.';
      setError(msg);
      setIsGenerating(false);
      setGenerationProgress(0);
      setGenerationStep('');
      throw err;
    }
  };

  // Save Idea
  const saveIdea = async (idea: Idea): Promise<void> => {
    setError(null);
    const updatedIdea: Idea = {
      ...idea,
      status: 'saved',
      updatedAt: new Date().toISOString(),
      ownerId: user?.id || 'guest',
      projectId: idea.projectId || activeProject?.id,
    };

    if (authState === 'AUTHENTICATED' && user && isFirebaseConfigured && db) {
      try {
        const ideaRef = doc(db, 'users', user.id, 'ideas', updatedIdea.id);
        await setDoc(ideaRef, updatedIdea);
      } catch (err) {
        console.error('Failed to save idea to Firestore:', err);
        handleFirestoreError(err, OperationType.WRITE, `users/${user.id}/ideas/${updatedIdea.id}`);
        // Fallback to local
        setIdeas((prev) => {
          const next = [updatedIdea, ...prev.filter((i) => i.id !== updatedIdea.id)];
          saveLocalIdeas(next);
          return next;
        });
      }
    } else {
      setIdeas((prev) => {
        const next = [updatedIdea, ...prev.filter((i) => i.id !== updatedIdea.id)];
        saveLocalIdeas(next);
        return next;
      });
    }
  };

  // Update Idea
  const updateIdea = async (ideaId: string, updates: Partial<Idea>): Promise<void> => {
    setError(null);
    const timestamp = new Date().toISOString();
    const existingIdea = ideas.find((i) => i.id === ideaId);
    const mergedIdea: Idea = {
      ...(existingIdea || ({ id: ideaId, title: updates.title || 'Untitled Idea' } as any)),
      ...updates,
      id: ideaId,
      ownerId: user?.id || 'guest',
      updatedAt: timestamp,
    };

    if (authState === 'AUTHENTICATED' && user && isFirebaseConfigured && db) {
      try {
        const ideaRef = doc(db, 'users', user.id, 'ideas', ideaId);
        await setDoc(ideaRef, mergedIdea, { merge: true });
        setIdeas((prev) => {
          const next = prev.map((i) =>
            i.id === ideaId ? mergedIdea : i
          );
          saveLocalIdeas(next);
          return next;
        });
      } catch (err) {
        console.error('Failed to update idea in Firestore:', err);
        setIdeas((prev) => {
          const next = prev.map((i) =>
            i.id === ideaId ? mergedIdea : i
          );
          saveLocalIdeas(next);
          return next;
        });
      }
    } else {
      setIdeas((prev) => {
        const next = prev.map((i) =>
          i.id === ideaId ? mergedIdea : i
        );
        saveLocalIdeas(next);
        return next;
      });
    }
  };

  // Delete Idea
  const deleteIdea = async (ideaId: string): Promise<void> => {
    setError(null);
    if (authState === 'AUTHENTICATED' && user && isFirebaseConfigured && db) {
      try {
        const ideaRef = doc(db, 'users', user.id, 'ideas', ideaId);
        await deleteDoc(ideaRef);
      } catch (err) {
        console.error('Failed to delete idea from Firestore:', err);
        handleFirestoreError(err, OperationType.DELETE, `users/${user.id}/ideas/${ideaId}`);
        setIdeas((prev) => {
          const next = prev.filter((i) => i.id !== ideaId);
          saveLocalIdeas(next);
          return next;
        });
      }
    } else {
      setIdeas((prev) => {
        const next = prev.filter((i) => i.id !== ideaId);
        saveLocalIdeas(next);
        return next;
      });
    }

    if (activeIdea?.id === ideaId) {
      setActiveIdea(null);
    }
  };

  // Duplicate Idea
  const duplicateIdea = async (idea: Idea): Promise<Idea> => {
    const duplicated: Idea = {
      ...idea,
      id: `idea_${Date.now()}_copy`,
      title: `${idea.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveIdea(duplicated);
    return duplicated;
  };

  // Improve Idea with AI
  const improveIdea = async (idea: Idea): Promise<Idea> => {
    setError(null);
    try {
      const improved = await improveIdeaAPI(idea);
      const updated: Idea = {
        ...idea,
        title: improved.title || idea.title,
        hook: improved.hook || idea.hook,
        concept: improved.concept || idea.concept,
        angle: improved.angle || idea.angle,
        reason: improved.reason || idea.reason,
        updatedAt: new Date().toISOString(),
      };

      await saveIdea(updated);
      setActiveIdea(updated);
      return updated;
    } catch (err: any) {
      console.error('Failed to improve idea:', err);
      setError(err.message || 'Failed to improve idea.');
      throw err;
    }
  };

  // Analyze Idea
  const analyzeIdea = async (idea: Idea): Promise<IdeaAnalysis> => {
    setError(null);
    try {
      return await analyzeIdeaAPI(idea);
    } catch (err: any) {
      console.error('Failed to analyze idea:', err);
      setError(err.message || 'Failed to analyze idea.');
      throw err;
    }
  };

  // Generate Variations
  const generateVariations = async (idea: Idea): Promise<IdeaVariation[]> => {
    setError(null);
    try {
      return await generateVariationsAPI(idea);
    } catch (err: any) {
      console.error('Failed to generate variations:', err);
      setError(err.message || 'Failed to generate variations.');
      throw err;
    }
  };

  // Filter ideas for active project
  const projectIdeas = activeProject
    ? ideas.filter((i) => !i.projectId || i.projectId === activeProject.id)
    : ideas;

  return (
    <IdeaContext.Provider
      value={{
        ideas,
        projectIdeas,
        activeIdea,
        loading,
        isGenerating,
        generationStep,
        generationProgress,
        error,
        generateIdeas,
        saveIdea,
        updateIdea,
        deleteIdea,
        duplicateIdea,
        improveIdea,
        analyzeIdea,
        generateVariations,
        setActiveIdea,
        clearError: () => setError(null),
      }}
    >
      {children}
    </IdeaContext.Provider>
  );
}

export function useIdea() {
  const context = useContext(IdeaContext);
  if (!context) {
    throw new Error('useIdea must be used within an IdeaProvider');
  }
  return context;
}
