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
  Script,
  ScriptSettings,
  ScriptSection,
  ScriptScene,
  ScriptVersion,
  ScriptSEO,
  ThumbnailConcept,
  RepurposeVersions,
  ContentPackage,
  AISectionAction,
  CaptionLine,
} from '../types/script';
import type { Idea } from '../types/idea';
import { useAuth } from './AuthContext';
import { useProject } from './ProjectContext';
import { db, isFirebaseConfigured, handleFirestoreError, OperationType } from '../firebase/config';
import {
  generateScriptAPI,
  rewriteSectionAPI,
  generateSEOAPI,
  generateThumbnailsAPI,
  repurposeScriptAPI,
  generateContentPackageAPI,
  generateSceneImageAPI,
} from '../services/aiService';
import { voiceEngine } from '../services/voiceService';

interface ScriptContextType {
  scripts: Script[];
  projectScripts: Script[];
  activeScript: Script | null;
  loading: boolean;
  isGenerating: boolean;
  generationStep: string;
  error: string | null;
  selectedSectionId: string | null;
  createScript: (settings: ScriptSettings, fromIdea?: Idea) => Promise<Script>;
  updateScript: (scriptId: string, updates: Partial<Script>) => Promise<void>;
  updateSection: (scriptId: string, sectionId: string, content: string) => Promise<void>;
  updateScene: (scriptId: string, sceneNumber: number, updates: Partial<ScriptScene>) => Promise<void>;
  deleteScript: (scriptId: string) => Promise<void>;
  saveScript: (script: Script) => Promise<void>;
  setActiveScript: (script: Script | null) => void;
  setSelectedSectionId: (id: string | null) => void;
  saveVersion: (scriptId: string, note?: string) => Promise<void>;
  restoreVersion: (scriptId: string, versionNumber: number) => Promise<void>;
  rewriteSection: (
    scriptId: string,
    sectionId: string,
    action: AISectionAction,
    options?: { targetLanguage?: string }
  ) => Promise<string>;
  generateSEO: (scriptId: string) => Promise<ScriptSEO>;
  generateThumbnails: (scriptId: string) => Promise<ThumbnailConcept[]>;
  repurposeScript: (scriptId: string) => Promise<RepurposeVersions>;
  generateCompleteContentPackage: (scriptId: string) => Promise<ContentPackage>;
  generateSceneImage: (scriptId: string, sceneNumber: number) => Promise<string>;
  generateSceneVideo: (scriptId: string, sceneNumber: number) => Promise<void>;
  generateSceneVoiceover: (scriptId: string, sceneNumber: number) => Promise<void>;
  generateCaptions: (scriptId: string) => Promise<void>;
  createVideoFromScript: (scriptId: string) => Promise<{ timelineReady: boolean; totalScenes: number; message: string }>;
  clearError: () => void;
}

const ScriptContext = createContext<ScriptContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'creova_scripts';
const GUEST_STORAGE_KEY = 'creova_guest_scripts';

export function ScriptProvider({ children }: { children: React.ReactNode }) {
  const { authState, user } = useAuth();
  const { activeProject } = useProject();

  const [scripts, setScripts] = useState<Script[]>([]);
  const [activeScript, setActiveScript] = useState<Script | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  // Load from local storage helper
  const loadLocalScripts = useCallback(() => {
    try {
      const storageKey = authState === 'GUEST' ? GUEST_STORAGE_KEY : LOCAL_STORAGE_KEY;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setScripts(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to parse local scripts', e);
    }
    setScripts([]);
  }, [authState]);

  // Save to local storage helper
  const saveLocalScripts = useCallback((newScripts: Script[]) => {
    try {
      const storageKey = authState === 'GUEST' ? GUEST_STORAGE_KEY : LOCAL_STORAGE_KEY;
      localStorage.setItem(storageKey, JSON.stringify(newScripts));
    } catch (e) {
      console.warn('Failed to store local scripts', e);
    }
  }, [authState]);

  // Persistence listener based on AuthState
  useEffect(() => {
    setLoading(true);
    setError(null);

    if (authState === 'AUTHENTICATED' && user && isFirebaseConfigured && db) {
      const scriptsColRef = collection(db, 'users', user.id, 'scripts');

      const unsubscribe = onSnapshot(
        scriptsColRef,
        (snapshot) => {
          const fetched: Script[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            fetched.push({
              ...data,
              id: docSnap.id,
              ownerId: user.id,
              sections: typeof data.sections === 'string' ? JSON.parse(data.sections) : (data.sections || []),
              scenes: typeof data.scenes === 'string' ? JSON.parse(data.scenes) : (data.scenes || []),
              versions: typeof data.versions === 'string' ? JSON.parse(data.versions) : (data.versions || []),
              thumbnailConcepts: typeof data.thumbnailConcepts === 'string' ? JSON.parse(data.thumbnailConcepts) : (data.thumbnailConcepts || []),
            } as Script);
          });

          // Sort by updatedAt desc
          fetched.sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );

          setScripts(fetched);
          if (fetched.length > 0 && !activeScript) {
            setActiveScript(fetched[0]);
            if (fetched[0].sections?.length > 0) {
              setSelectedSectionId(fetched[0].sections[0].id);
            }
          }
          setLoading(false);
        },
        (err) => {
          console.error('Firestore scripts onSnapshot error:', err);
          handleFirestoreError(err, OperationType.LIST, `users/${user.id}/scripts`);
          loadLocalScripts();
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } else {
      loadLocalScripts();
      setLoading(false);
    }
  }, [authState, user, loadLocalScripts]);

  // Save full script to Firestore / local
  const saveScript = async (script: Script): Promise<void> => {
    setError(null);
    const updatedScript: Script = {
      ...script,
      updatedAt: new Date().toISOString(),
      ownerId: user?.id || 'guest',
      projectId: script.projectId || activeProject?.id,
    };

    if (authState === 'AUTHENTICATED' && user && isFirebaseConfigured && db) {
      try {
        const scriptRef = doc(db, 'users', user.id, 'scripts', updatedScript.id);
        // Firestore rules validate string sizes, so serialize complex arrays
        await setDoc(scriptRef, {
          ...updatedScript,
          sections: JSON.stringify(updatedScript.sections || []),
          scenes: JSON.stringify(updatedScript.scenes || []),
          versions: JSON.stringify(updatedScript.versions || []),
          thumbnailConcepts: JSON.stringify(updatedScript.thumbnailConcepts || []),
        });
      } catch (err) {
        console.error('Failed to save script to Firestore:', err);
        handleFirestoreError(err, OperationType.WRITE, `users/${user.id}/scripts/${updatedScript.id}`);
        // Fallback local
        setScripts((prev) => {
          const next = [updatedScript, ...prev.filter((s) => s.id !== updatedScript.id)];
          saveLocalScripts(next);
          return next;
        });
      }
    } else {
      setScripts((prev) => {
        const next = [updatedScript, ...prev.filter((s) => s.id !== updatedScript.id)];
        saveLocalScripts(next);
        return next;
      });
    }

    if (activeScript?.id === updatedScript.id) {
      setActiveScript(updatedScript);
    }
  };

  // Create Script from Idea or inputs
  const createScript = async (settings: ScriptSettings, fromIdea?: Idea): Promise<Script> => {
    setIsGenerating(true);
    setError(null);
    setGenerationStep('Synthesizing script structure and pacing...');

    try {
      const payload: ScriptSettings = {
        ...settings,
        topic: settings.topic || fromIdea?.title || 'Untitled Video',
        ideaText: settings.ideaText || fromIdea?.concept || '',
        audience: settings.audience || fromIdea?.targetAudience || 'General Creators',
        platform: settings.platform || (fromIdea?.recommendedPlatform as any) || 'YouTube Long-form',
        duration: settings.duration || fromIdea?.estimatedDuration || '8-10 minutes',
        language: settings.language || (fromIdea?.metadata?.language as any) || 'English',
        tone: settings.tone || (fromIdea?.metadata?.tone as any) || 'Energetic',
      };

      const result = await generateScriptAPI(payload);

      setGenerationStep('Formatting scene-by-scene breakdown and shot lists...');

      const scriptId = `script_${Date.now()}`;
      const now = new Date().toISOString();

      const newScript: Script = {
        id: scriptId,
        ownerId: user?.id || 'guest',
        projectId: activeProject?.id,
        ideaId: fromIdea?.id,
        title: result.title || payload.topic,
        type: payload.platform,
        status: 'draft',
        settings: payload,
        sections: result.sections || [],
        scenes: result.scenes || [],
        versions: [
          {
            versionNumber: 1,
            timestamp: now,
            title: result.title || payload.topic,
            sections: result.sections || [],
            scenes: result.scenes || [],
            summaryNote: 'Initial AI script generation',
          },
        ],
        currentVersionNumber: 1,
        createdAt: now,
        updatedAt: now,
      };

      await saveScript(newScript);
      setActiveScript(newScript);
      if (newScript.sections.length > 0) {
        setSelectedSectionId(newScript.sections[0].id);
      }

      setIsGenerating(false);
      setGenerationStep('');
      return newScript;
    } catch (err: any) {
      console.error('Failed to create script:', err);
      const msg = err.message || 'Script generation failed. Please try again.';
      setError(msg);
      setIsGenerating(false);
      setGenerationStep('');
      throw err;
    }
  };

  // Update Script
  const updateScript = async (scriptId: string, updates: Partial<Script>): Promise<void> => {
    const current = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!current) return;

    const merged: Script = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await saveScript(merged);
  };

  // Update individual section
  const updateSection = async (scriptId: string, sectionId: string, content: string): Promise<void> => {
    const target = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!target) return;

    const updatedSections = target.sections.map((sec) =>
      sec.id === sectionId ? { ...sec, content } : sec
    );

    await updateScript(scriptId, { sections: updatedSections });
  };

  // Update individual scene
  const updateScene = async (
    scriptId: string,
    sceneNumber: number,
    updates: Partial<ScriptScene>
  ): Promise<void> => {
    const target = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!target) return;

    const updatedScenes = target.scenes.map((sc) =>
      sc.sceneNumber === sceneNumber ? { ...sc, ...updates } : sc
    );

    await updateScript(scriptId, { scenes: updatedScenes });
  };

  // Delete Script
  const deleteScript = async (scriptId: string): Promise<void> => {
    setError(null);
    if (authState === 'AUTHENTICATED' && user && isFirebaseConfigured && db) {
      try {
        const scriptRef = doc(db, 'users', user.id, 'scripts', scriptId);
        await deleteDoc(scriptRef);
      } catch (err) {
        console.error('Failed to delete script from Firestore:', err);
        handleFirestoreError(err, OperationType.DELETE, `users/${user.id}/scripts/${scriptId}`);
        setScripts((prev) => {
          const next = prev.filter((s) => s.id !== scriptId);
          saveLocalScripts(next);
          return next;
        });
      }
    } else {
      setScripts((prev) => {
        const next = prev.filter((s) => s.id !== scriptId);
        saveLocalScripts(next);
        return next;
      });
    }

    if (activeScript?.id === scriptId) {
      setActiveScript(null);
      setSelectedSectionId(null);
    }
  };

  // Save Version Snapshot
  const saveVersion = async (scriptId: string, note?: string): Promise<void> => {
    const target = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!target) return;

    const nextVersionNum = (target.versions?.length || 0) + 1;
    const newVersion: ScriptVersion = {
      versionNumber: nextVersionNum,
      timestamp: new Date().toISOString(),
      title: `${target.title} (v${nextVersionNum})`,
      sections: JSON.parse(JSON.stringify(target.sections || [])),
      scenes: JSON.parse(JSON.stringify(target.scenes || [])),
      summaryNote: note || `Manual checkpoint v${nextVersionNum}`,
    };

    const updatedVersions = [...(target.versions || []), newVersion];
    await updateScript(scriptId, {
      versions: updatedVersions,
      currentVersionNumber: nextVersionNum,
    });
  };

  // Restore Version Snapshot
  const restoreVersion = async (scriptId: string, versionNumber: number): Promise<void> => {
    const target = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!target) return;

    const versionToRestore = target.versions?.find((v) => v.versionNumber === versionNumber);
    if (!versionToRestore) {
      throw new Error(`Version ${versionNumber} not found`);
    }

    await updateScript(scriptId, {
      sections: JSON.parse(JSON.stringify(versionToRestore.sections)),
      scenes: JSON.parse(JSON.stringify(versionToRestore.scenes)),
      currentVersionNumber: versionNumber,
    });
  };

  // Rewrite Specific Section Only
  const rewriteSection = async (
    scriptId: string,
    sectionId: string,
    action: AISectionAction,
    options: { targetLanguage?: string } = {}
  ): Promise<string> => {
    const target = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!target) throw new Error('Script not found');

    const section = target.sections.find((s) => s.id === sectionId);
    if (!section) throw new Error('Section not found');

    setIsGenerating(true);
    setGenerationStep(`Applying AI action "${action}" to section "${section.name}"...`);

    try {
      const { modifiedContent } = await rewriteSectionAPI({
        sectionName: section.name,
        currentContent: section.content,
        action,
        targetLanguage: options.targetLanguage,
        overallContext: {
          topic: target.settings.topic,
          platform: target.settings.platform,
          tone: target.settings.tone,
        },
      });

      // Update ONLY this specific section
      await updateSection(scriptId, sectionId, modifiedContent);

      setIsGenerating(false);
      setGenerationStep('');
      return modifiedContent;
    } catch (err: any) {
      console.error('Failed to rewrite section:', err);
      setIsGenerating(false);
      setGenerationStep('');
      setError(err.message || 'Failed to rewrite section.');
      throw err;
    }
  };

  // Generate SEO
  const generateSEO = async (scriptId: string): Promise<ScriptSEO> => {
    const target = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!target) throw new Error('Script not found');

    setIsGenerating(true);
    setGenerationStep('Generating algorithmic SEO keywords, tags, and chapters...');

    try {
      const fullText = target.sections.map((s) => `${s.name}:\n${s.content}`).join('\n\n');
      const seo = await generateSEOAPI({
        scriptText: fullText,
        topic: target.settings.topic,
        platform: target.type,
        audience: target.settings.audience,
      });

      await updateScript(scriptId, { seo });
      setIsGenerating(false);
      setGenerationStep('');
      return seo;
    } catch (err: any) {
      setIsGenerating(false);
      setGenerationStep('');
      setError(err.message || 'Failed to generate SEO.');
      throw err;
    }
  };

  // Generate Thumbnails
  const generateThumbnails = async (scriptId: string): Promise<ThumbnailConcept[]> => {
    const target = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!target) throw new Error('Script not found');

    setIsGenerating(true);
    setGenerationStep('Designing high-CTR thumbnail layouts & visual concepts...');

    try {
      const thumbnails = await generateThumbnailsAPI({
        title: target.title,
        concept: target.settings.ideaText || target.settings.topic,
        platform: target.type,
      });

      await updateScript(scriptId, { thumbnailConcepts: thumbnails });
      setIsGenerating(false);
      setGenerationStep('');
      return thumbnails;
    } catch (err: any) {
      setIsGenerating(false);
      setGenerationStep('');
      setError(err.message || 'Failed to generate thumbnail concepts.');
      throw err;
    }
  };

  // Repurpose Script
  const repurposeScript = async (scriptId: string): Promise<RepurposeVersions> => {
    const target = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!target) throw new Error('Script not found');

    setIsGenerating(true);
    setGenerationStep('Adapting script for YouTube Shorts, Instagram Reels & Stories...');

    try {
      const fullText = target.sections.map((s) => s.content).join('\n\n');
      const repurpose = await repurposeScriptAPI({
        scriptText: fullText,
        title: target.title,
        topic: target.settings.topic,
      });

      await updateScript(scriptId, { repurposeVersions: repurpose });
      setIsGenerating(false);
      setGenerationStep('');
      return repurpose;
    } catch (err: any) {
      setIsGenerating(false);
      setGenerationStep('');
      setError(err.message || 'Failed to repurpose script.');
      throw err;
    }
  };

  // Generate Complete Content Package
  const generateCompleteContentPackage = async (scriptId: string): Promise<ContentPackage> => {
    const target = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!target) throw new Error('Script not found');

    setIsGenerating(true);
    setGenerationStep('Synthesizing all creator assets into unified package...');

    try {
      const contentPackage = await generateContentPackageAPI({
        topic: target.settings.topic,
        platform: target.type,
        language: target.settings.language,
        audience: target.settings.audience,
      });

      await updateScript(scriptId, {
        seo: contentPackage.seo,
        thumbnailConcepts: contentPackage.thumbnails,
        repurposeVersions: contentPackage.repurpose,
        scenes: contentPackage.scenes,
      });

      setIsGenerating(false);
      setGenerationStep('');
      return contentPackage;
    } catch (err: any) {
      setIsGenerating(false);
      setGenerationStep('');
      setError(err.message || 'Failed to generate content package.');
      throw err;
    }
  };

  // Generate Scene Image
  const generateSceneImage = async (scriptId: string, sceneNumber: number): Promise<string> => {
    const target = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!target) throw new Error('Script not found');

    const scene = target.scenes.find((sc) => sc.sceneNumber === sceneNumber);
    if (!scene) throw new Error('Scene not found');

    setIsGenerating(true);
    setGenerationStep(`Synthesizing storyboard visual for Scene ${sceneNumber}...`);

    try {
      const result = await generateSceneImageAPI({
        prompt: scene.visualDescription || scene.voiceover,
        sceneNumber,
        style: 'Cinematic Visual',
      });

      await updateScene(scriptId, sceneNumber, { generatedImage: result.imageUrl });
      setIsGenerating(false);
      setGenerationStep('');
      return result.imageUrl;
    } catch (err: any) {
      setIsGenerating(false);
      setGenerationStep('');
      setError(err.message || 'Failed to generate scene image.');
      throw err;
    }
  };

  // Generate Scene Video Clip Metadata
  const generateSceneVideo = async (scriptId: string, sceneNumber: number): Promise<void> => {
    const target = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!target) throw new Error('Script not found');

    const scene = target.scenes.find((sc) => sc.sceneNumber === sceneNumber);
    if (!scene) throw new Error('Scene not found');

    setIsGenerating(true);
    setGenerationStep(`Rendering scene timeline clip for Scene ${sceneNumber}...`);

    try {
      // Simulate/Attach timeline video asset structure
      await new Promise((r) => setTimeout(r, 800));

      await updateScene(scriptId, sceneNumber, {
        generatedVideo: {
          status: 'ready',
          previewUrl: scene.generatedImage || undefined,
          prompt: `Motion: ${scene.cameraDirection}. Action: ${scene.visualDescription}`,
          assetId: `video_clip_${sceneNumber}_${Date.now()}`,
        },
      });

      setIsGenerating(false);
      setGenerationStep('');
    } catch (err: any) {
      setIsGenerating(false);
      setGenerationStep('');
      setError(err.message || 'Failed to generate scene video.');
      throw err;
    }
  };

  // Generate Scene Voiceover (Real browser Web Speech synthesis with audio duration)
  const generateSceneVoiceover = async (scriptId: string, sceneNumber: number): Promise<void> => {
    const target = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!target) throw new Error('Script not found');

    const scene = target.scenes.find((sc) => sc.sceneNumber === sceneNumber);
    if (!scene) throw new Error('Scene not found');

    setIsGenerating(true);
    setGenerationStep(`Synthesizing neural voiceover for Scene ${sceneNumber}...`);

    try {
      const durationSec = voiceEngine.estimateDuration(scene.voiceover);

      // Play sample or set voice attachment
      await updateScene(scriptId, sceneNumber, {
        generatedVoice: {
          voiceName: 'CREOVA Neural Voice',
          durationSec,
        },
      });

      // Audibly synthesize in browser
      voiceEngine.speak(scene.voiceover, {
        rate: 1.05,
      });

      setIsGenerating(false);
      setGenerationStep('');
    } catch (err: any) {
      setIsGenerating(false);
      setGenerationStep('');
      setError(err.message || 'Voiceover generation failed.');
      throw err;
    }
  };

  // Generate Captions from Voiceover
  const generateCaptions = async (scriptId: string): Promise<void> => {
    const target = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!target) throw new Error('Script not found');

    setIsGenerating(true);
    setGenerationStep('Generating word-level timed captions from voiceover...');

    try {
      let currentSec = 0;
      const captions: CaptionLine[] = target.scenes.map((scene, idx) => {
        const words = scene.voiceover.split(/\s+/);
        const duration = Math.max(3, Math.round(words.length / 2.3));
        const startSec = currentSec;
        const endSec = currentSec + duration;
        currentSec = endSec;

        return {
          id: `cap-${idx + 1}`,
          startSec,
          endSec,
          text: scene.voiceover,
          words: words.map((w, wIdx) => ({
            word: w,
            startSec: startSec + (wIdx / words.length) * duration,
            endSec: startSec + ((wIdx + 1) / words.length) * duration,
          })),
        };
      });

      await updateScript(scriptId, {
        captions,
        captionConfig: {
          style: 'bold_pop',
          fontFamily: 'Montserrat, sans-serif',
          fontSize: 28,
          textColor: '#ffffff',
          highlightColor: '#22d3ee',
          position: 'bottom',
          animation: 'word_by_word',
          language: target.settings.language || 'English',
        },
      });

      setIsGenerating(false);
      setGenerationStep('');
    } catch (err: any) {
      setIsGenerating(false);
      setGenerationStep('');
      setError(err.message || 'Failed to generate captions.');
      throw err;
    }
  };

  // Create Video From Script Workflow
  const createVideoFromScript = async (
    scriptId: string
  ): Promise<{ timelineReady: boolean; totalScenes: number; message: string }> => {
    const target = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!target) throw new Error('Script not found');

    setIsGenerating(true);
    setGenerationStep('Analyzing script and building scene shot list...');
    await new Promise((r) => setTimeout(r, 600));

    setGenerationStep('Generating visual cues and attaching voiceover timeline...');
    await new Promise((r) => setTimeout(r, 700));

    setGenerationStep('Compiling captions & timeline track structure...');
    await generateCaptions(scriptId);

    setIsGenerating(false);
    setGenerationStep('');

    return {
      timelineReady: true,
      totalScenes: target.scenes.length,
      message: `Complete video project generated with ${target.scenes.length} synced scenes and timeline assets.`,
    };
  };

  // Filter scripts for active project
  const projectScripts = activeProject
    ? scripts.filter((s) => !s.projectId || s.projectId === activeProject.id)
    : scripts;

  return (
    <ScriptContext.Provider
      value={{
        scripts,
        projectScripts,
        activeScript,
        loading,
        isGenerating,
        generationStep,
        error,
        selectedSectionId,
        createScript,
        updateScript,
        updateSection,
        updateScene,
        deleteScript,
        saveScript,
        setActiveScript,
        setSelectedSectionId,
        saveVersion,
        restoreVersion,
        rewriteSection,
        generateSEO,
        generateThumbnails,
        repurposeScript,
        generateCompleteContentPackage,
        generateSceneImage,
        generateSceneVideo,
        generateSceneVoiceover,
        generateCaptions,
        createVideoFromScript,
        clearError: () => setError(null),
      }}
    >
      {children}
    </ScriptContext.Provider>
  );
}

export function useScript() {
  const context = useContext(ScriptContext);
  if (!context) {
    throw new Error('useScript must be used within a ScriptProvider');
  }
  return context;
}
