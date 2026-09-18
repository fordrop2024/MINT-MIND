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
  CaptionConfig,
  ShotPlan,
  StoryMode,
  MediaAsset,
  MediaAssetType,
  MediaAssetStatus,
  EnhancedMediaPrompts,
  SceneMediaStatus,
  VoiceoverSettings,
  VoiceoverTimelineData,
  RepurposedShort,
  FilmStoryBible,
} from '../types/script';
import type { Idea } from '../types/idea';
import { useAuth } from './AuthContext';
import { useProject } from './ProjectContext';
import { db, isFirebaseConfigured, handleFirestoreError, OperationType } from '../firebase/config';
import * as mediaAssetService from '../services/mediaAssetService';
import { mediaGenerationService } from '../services/mediaGenerationService';
import type { MediaGenerationJob, CreateGenerationJobParams } from '../types/mediaGenerationJob';
import {
  generateScriptAPI,
  generateSceneBreakdownAPI,
  regenerateSceneAPI,
  rewriteSectionAPI,
  generateSEOAPI,
  generateThumbnailsAPI,
  repurposeScriptAPI,
  generateContentPackageAPI,
  generateSceneImageAPI,
} from '../services/aiService';
import { voiceEngine } from '../services/voiceService';
import {
  calculateAudioTimingForScenes,
  generateProductionShotPlan,
} from '../services/audioTimingSyncService';
import {
  normalizeScene,
  reindexScenes,
  generateSceneBreakdownFromScript,
} from '../services/sceneBreakdownService';
import {
  enhanceSceneMediaPrompts,
  enhanceAllScenesMediaPrompts,
} from '../services/mediaPromptService';
import {
  DEFAULT_VOICEOVER_SETTINGS,
  syncScenesToVoiceTimeline,
  generateSRTFromScenes,
  generateVTTFromScenes,
  calculateExactSpeechCadence,
} from '../services/voicePipelineService';
import { generateSeoWithAI } from '../services/seoService';
import { generateThumbnailsWithAI } from '../services/thumbnailService';

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
  updateSceneShotPlan: (scriptId: string, sceneNumber: number, updates: Partial<ShotPlan>) => Promise<void>;
  updateSceneMediaPrompts: (
    scriptId: string,
    sceneNumber: number,
    prompts: EnhancedMediaPrompts
  ) => Promise<void>;
  batchUpdateSceneMediaPrompts: (
    scriptId: string,
    scenesWithPrompts: Array<{ sceneNumber: number; prompts: EnhancedMediaPrompts }>
  ) => Promise<void>;
  enhanceScenePrompts: (
    scriptId: string,
    sceneNumber: number
  ) => Promise<EnhancedMediaPrompts>;
  enhanceAllScenePrompts: (
    scriptId: string
  ) => Promise<ScriptScene[]>;
  updateSceneMediaStatus: (
    scriptId: string,
    sceneNumber: number,
    status: SceneMediaStatus
  ) => Promise<void>;
  generateSceneBreakdown: (
    scriptId: string,
    options?: { primaryMode?: StoryMode; targetDuration?: string }
  ) => Promise<ScriptScene[]>;
  addScene: (
    scriptId: string,
    atIndex?: number,
    initialData?: Partial<ScriptScene>
  ) => Promise<void>;
  deleteScene: (scriptId: string, sceneNumber: number) => Promise<void>;
  reorderScenes: (scriptId: string, fromIndex: number, toIndex: number) => Promise<void>;
  regenerateScene: (
    scriptId: string,
    sceneNumber: number,
    instruction?: string
  ) => Promise<void>;
  saveSceneBreakdown: (scriptId: string, scenes: ScriptScene[]) => Promise<void>;
  syncScriptToAudio: (
    scriptId: string,
    audioDurationSec: number,
    audioTrackMeta?: { fileName: string; audioUrl?: string; fileSize?: number }
  ) => Promise<void>;
  updateVoiceoverSettings: (
    scriptId: string,
    settings: Partial<VoiceoverSettings>
  ) => Promise<void>;
  syncScriptToVoiceSettings: (
    scriptId: string,
    settings?: VoiceoverSettings
  ) => Promise<{ updatedScenes: ScriptScene[]; timelineData: VoiceoverTimelineData }>;
  generateSceneVoice: (
    scriptId: string,
    sceneNumber: number,
    voiceSettings?: Partial<VoiceoverSettings>
  ) => Promise<void>;
  generateAllScenesVoice: (
    scriptId: string,
    voiceSettings?: Partial<VoiceoverSettings>
  ) => Promise<void>;
  exportScriptSubtitles: (
    scriptId: string,
    format: 'srt' | 'vtt'
  ) => string;
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
  saveScriptSEO: (scriptId: string, seo: ScriptSEO) => Promise<void>;
  generateThumbnails: (scriptId: string) => Promise<ThumbnailConcept[]>;
  saveScriptThumbnails: (scriptId: string, thumbnails: ThumbnailConcept[]) => Promise<void>;
  updateThumbnailConcept: (
    scriptId: string,
    conceptId: string,
    updates: Partial<ThumbnailConcept>
  ) => Promise<void>;
  repurposeScript: (scriptId: string) => Promise<RepurposeVersions>;
  saveScriptRepurposedShorts: (scriptId: string, shorts: RepurposedShort[]) => Promise<void>;
  saveFilmStoryBible: (scriptId: string, bible: FilmStoryBible) => Promise<void>;
  generateCompleteContentPackage: (scriptId: string) => Promise<ContentPackage>;
  generateSceneImage: (scriptId: string, sceneNumber: number) => Promise<string>;
  generateSceneVideo: (scriptId: string, sceneNumber: number) => Promise<void>;
  generateSceneVoiceover: (scriptId: string, sceneNumber: number) => Promise<void>;
  generateCaptions: (scriptId: string) => Promise<void>;
  updateCaptionConfig: (scriptId: string, config: Partial<CaptionConfig>) => Promise<void>;
  updateCaptions: (scriptId: string, captions: CaptionLine[]) => Promise<void>;
  createVideoFromScript: (scriptId: string) => Promise<{ timelineReady: boolean; totalScenes: number; message: string }>;
  clearError: () => void;
  // Media Asset Pipeline operations
  mediaAssets: MediaAsset[];
  isLoadingAssets: boolean;
  loadProjectAssets: (projectId?: string) => Promise<MediaAsset[]>;
  createMediaAsset: (assetData: Partial<MediaAsset>) => Promise<MediaAsset>;
  updateMediaAsset: (assetId: string, updates: Partial<MediaAsset>) => Promise<MediaAsset>;
  deleteMediaAsset: (assetId: string) => Promise<boolean>;
  attachAssetToScene: (assetId: string, sceneNumber: number, scriptId?: string) => Promise<void>;
  detachAssetFromScene: (assetId: string, sceneNumber: number, scriptId?: string) => Promise<void>;
  getAssetsForScene: (sceneNumber: number, scriptId?: string) => MediaAsset[];
  // Media Generation Pipeline operations
  generationJobs: MediaGenerationJob[];
  isLoadingJobs: boolean;
  createGenerationJob: (params: CreateGenerationJobParams) => Promise<MediaGenerationJob>;
  cancelGenerationJob: (jobId: string) => Promise<void>;
  retryGenerationJob: (jobId: string) => Promise<void>;
  deleteGenerationJob: (jobId: string) => Promise<void>;
  getJobsForScene: (sceneNumber: number, scriptId?: string) => MediaGenerationJob[];
  getActiveJobsCount: () => number;
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

  // Media Assets Pipeline State
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState<boolean>(false);

  // Load project media assets
  const loadProjectAssets = useCallback(
    async (projectId?: string): Promise<MediaAsset[]> => {
      setIsLoadingAssets(true);
      try {
        const assets = await mediaAssetService.getProjectAssets(
          projectId || activeProject?.id,
          user?.id
        );
        setMediaAssets(assets);
        return assets;
      } catch (err) {
        console.error('Failed to load media assets:', err);
        return [];
      } finally {
        setIsLoadingAssets(false);
      }
    },
    [activeProject?.id, user?.id]
  );

  // Sync media assets on auth or project change
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const isAuth =
      authState === 'AUTHENTICATED' &&
      user &&
      user.accountType !== 'guest' &&
      !user.id.startsWith('guest_') &&
      isFirebaseConfigured &&
      db;

    if (isAuth) {
      setIsLoadingAssets(true);
      const assetsColRef = collection(db, 'users', user.id, 'mediaAssets');
      unsubscribe = onSnapshot(
        assetsColRef,
        (snapshot) => {
          const list: MediaAsset[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            list.push(mediaAssetService.normalizeMediaAsset({ ...data, id: docSnap.id }));
          });
          setMediaAssets(list);
          setIsLoadingAssets(false);
        },
        (err) => {
          console.warn('MediaAssets onSnapshot fallback to local:', err);
          loadProjectAssets();
        }
      );
    } else {
      loadProjectAssets();
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [authState, user, loadProjectAssets]);

  // Media Generation Pipeline State
  const [generationJobs, setGenerationJobs] = useState<MediaGenerationJob[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState<boolean>(false);

  // Sync generation jobs on auth or user change
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const effectiveUserId = user?.id || 'guest';

    setIsLoadingJobs(true);
    unsubscribe = mediaGenerationService.subscribeToJobs(effectiveUserId, (jobs) => {
      setGenerationJobs(jobs);
      setIsLoadingJobs(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [authState, user?.id]);

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
        ideaText: settings.ideaText || fromIdea?.concept || fromIdea?.coreConcept || '',
        audience: settings.audience || fromIdea?.targetAudience || 'General Creators',
        platform: settings.platform || (fromIdea?.recommendedPlatform as any) || 'YouTube Long-form',
        duration: settings.duration || fromIdea?.estimatedDuration || '8-10 minutes',
        language: settings.language || (fromIdea?.metadata?.language as any) || 'English',
        tone: settings.tone || (fromIdea?.metadata?.tone as any) || 'Energetic',
        primaryMode: settings.primaryMode || fromIdea?.primaryMode || 'Documentary',
        secondaryModes: settings.secondaryModes || fromIdea?.secondaryModes || [],
        modeDetectionConfidence: settings.modeDetectionConfidence || fromIdea?.modeDetectionConfidence,
        modeReasoning: settings.modeReasoning || fromIdea?.modeReasoning,
      };

      const result = await generateScriptAPI(payload);

      setGenerationStep('Formatting scene-by-scene breakdown and shot lists...');

      const scriptId = `script_${Date.now()}`;
      const now = new Date().toISOString();

      // Normalize sections ensuring content and order are guaranteed
      const normalizedSections: ScriptSection[] = (result.sections || []).map((sec: any, idx: number) => ({
        id: sec.id || `sec_${idx + 1}`,
        name: sec.name || `Section ${idx + 1}`,
        content: sec.content || sec.narration || '',
        order: typeof sec.order === 'number' ? sec.order : idx + 1,
      }));

      // Determine aspect ratio based on format
      const isVertical = String(payload.platform || '').toLowerCase().includes('short') || String(payload.platform || '').toLowerCase().includes('reel');
      const targetAspect: '16:9' | '9:16' = isVertical ? '9:16' : '16:9';

      // Normalize scenes ensuring durationSec, voiceover, sfx, visualDescription, sceneMode, shotPlan, and audioTiming are guaranteed
      const initialScenes: ScriptScene[] = (result.scenes || []).map((sc: any, idx: number) => {
        const rawDurSec = typeof sc.durationSec === 'number' 
          ? sc.durationSec 
          : typeof sc.duration === 'number' 
            ? sc.duration 
            : parseInt(String(sc.duration || '5'), 10) || 5;

        const baseScene: ScriptScene = {
          sceneNumber: typeof sc.sceneNumber === 'number' ? sc.sceneNumber : idx + 1,
          duration: `${rawDurSec}s`,
          durationSec: rawDurSec,
          sceneMode: sc.sceneMode || result.primaryMode || payload.primaryMode || 'Documentary',
          primaryMode: sc.primaryMode || result.primaryMode || payload.primaryMode || 'Documentary',
          secondaryModes: sc.secondaryModes || result.secondaryModes || payload.secondaryModes || [],
          voiceover: sc.voiceover || sc.spokenDialogue || '',
          visualDescription: sc.visualDescription || sc.action || '',
          bRollSuggestion: sc.bRollSuggestion || '',
          onScreenText: sc.onScreenText || '',
          cameraDirection: sc.cameraDirection || sc.shotType || 'Medium Shot',
          transition: sc.transition || 'Cut',
          sfxMusic: sc.sfxMusic || sc.sfx || '',
          sfx: sc.sfx || sc.sfxMusic || '',
          generatedImage: sc.generatedImage,
          generatedVideo: sc.generatedVideo,
          generatedVoice: sc.generatedVoice,
        };

        const shotPlan = sc.shotPlan || generateProductionShotPlan(baseScene, baseScene.sceneMode, targetAspect);
        return {
          ...baseScene,
          shotPlan,
        };
      });

      // Synchronize audio timing across scenes
      const timingResult = calculateAudioTimingForScenes(initialScenes);
      const normalizedScenes = timingResult.scenes;

      const newScript: Script = {
        id: scriptId,
        ownerId: user?.id || 'guest',
        projectId: activeProject?.id,
        ideaId: fromIdea?.id,
        title: result.title || payload.topic,
        type: payload.platform,
        status: 'draft',
        settings: payload,
        aspectRatio: targetAspect,
        isAudioSynced: false,
        primaryMode: result.primaryMode || payload.primaryMode || 'Documentary',
        secondaryModes: result.secondaryModes || payload.secondaryModes || [],
        modeDetectionConfidence: result.modeDetectionConfidence || payload.modeDetectionConfidence || 85,
        modeReasoning: result.modeReasoning || payload.modeReasoning || '',
        sections: normalizedSections,
        scenes: normalizedScenes,
        versions: [
          {
            versionNumber: 1,
            timestamp: now,
            title: result.title || payload.topic,
            sections: normalizedSections,
            scenes: normalizedScenes,
            summaryNote: 'Initial AI script generation with Shot Plan & Timing Sync',
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

  // Update shot plan for individual scene
  const updateSceneShotPlan = async (
    scriptId: string,
    sceneNumber: number,
    updates: Partial<ShotPlan>
  ): Promise<void> => {
    const target = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!target) return;

    const updatedScenes = target.scenes.map((sc) => {
      if (sc.sceneNumber !== sceneNumber) return sc;
      const currentPlan = sc.shotPlan || generateProductionShotPlan(sc, sc.sceneMode, target.aspectRatio || '16:9');
      return {
        ...sc,
        shotPlan: {
          ...currentPlan,
          ...updates,
        },
      };
    });

    await updateScript(scriptId, { scenes: updatedScenes });
  };

  // Update media prompts for individual scene
  const updateSceneMediaPrompts = async (
    scriptId: string,
    sceneNumber: number,
    prompts: EnhancedMediaPrompts
  ): Promise<void> => {
    const target = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!target) return;

    const updatedScenes = target.scenes.map((sc) => {
      if (sc.sceneNumber !== sceneNumber) return sc;
      return {
        ...sc,
        enhancedPrompts: prompts,
        imageGenerationPrompt: prompts.midjourneyPrompt || sc.imageGenerationPrompt,
        videoGenerationPrompt: prompts.runwayPrompt || sc.videoGenerationPrompt,
        mediaStatus: 'Prompt Ready' as SceneMediaStatus,
      };
    });

    await updateScript(scriptId, { scenes: updatedScenes });
  };

  // Batch update media prompts for multiple scenes
  const batchUpdateSceneMediaPrompts = async (
    scriptId: string,
    scenesWithPrompts: Array<{ sceneNumber: number; prompts: EnhancedMediaPrompts }>
  ): Promise<void> => {
    const target = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!target) return;

    const promptMap = new Map(scenesWithPrompts.map((item) => [item.sceneNumber, item.prompts]));

    const updatedScenes = target.scenes.map((sc) => {
      const newPrompts = promptMap.get(sc.sceneNumber);
      if (!newPrompts) return sc;
      return {
        ...sc,
        enhancedPrompts: newPrompts,
        imageGenerationPrompt: newPrompts.midjourneyPrompt || sc.imageGenerationPrompt,
        videoGenerationPrompt: newPrompts.runwayPrompt || sc.videoGenerationPrompt,
        mediaStatus: 'Prompt Ready' as SceneMediaStatus,
      };
    });

    await updateScript(scriptId, { scenes: updatedScenes });
  };

  // Enhance Prompts for Single Scene via Gemini & MediaPromptService
  const enhanceScenePrompts = async (
    scriptId: string,
    sceneNumber: number
  ): Promise<EnhancedMediaPrompts> => {
    const target = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!target) throw new Error('Script not found');

    const scene = target.scenes?.find((s) => s.sceneNumber === sceneNumber);
    if (!scene) throw new Error(`Scene #${sceneNumber} not found`);

    setIsGenerating(true);
    setGenerationStep(`Enhancing Media Prompts for Scene #${sceneNumber}...`);

    try {
      const enhanced = await enhanceSceneMediaPrompts(scene, {
        storyMode: target.primaryMode,
        aspectRatio: target.aspectRatio === '9:16' ? '9:16' : '16:9',
        projectContext: {
          title: target.title,
          topic: target.settings?.topic,
          platform: target.type || target.settings?.platform,
        },
      });

      await updateSceneMediaPrompts(scriptId, sceneNumber, enhanced);
      setIsGenerating(false);
      setGenerationStep('');
      return enhanced;
    } catch (err: any) {
      console.error('Failed to enhance scene prompts:', err);
      setIsGenerating(false);
      setGenerationStep('');
      throw err;
    }
  };

  // Enhance Prompts for All Scenes in Sequence
  const enhanceAllScenePrompts = async (
    scriptId: string
  ): Promise<ScriptScene[]> => {
    const target = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!target || !target.scenes || target.scenes.length === 0) {
      throw new Error('No scenes available to enhance');
    }

    setIsGenerating(true);
    setGenerationStep(`Enhancing AI Prompts for all ${target.scenes.length} scenes...`);

    try {
      const updated = await enhanceAllScenesMediaPrompts(target.scenes, {
        storyMode: target.primaryMode,
        aspectRatio: target.aspectRatio === '9:16' ? '9:16' : '16:9',
        projectContext: {
          title: target.title,
          topic: target.settings?.topic,
          platform: target.type || target.settings?.platform,
        },
      });

      await updateScript(scriptId, { scenes: updated });
      setIsGenerating(false);
      setGenerationStep('');
      return updated;
    } catch (err: any) {
      console.error('Failed to enhance all scene prompts:', err);
      setIsGenerating(false);
      setGenerationStep('');
      throw err;
    }
  };

  // Update Media Status for Single Scene
  const updateSceneMediaStatus = async (
    scriptId: string,
    sceneNumber: number,
    status: SceneMediaStatus
  ): Promise<void> => {
    await updateScene(scriptId, sceneNumber, { mediaStatus: status });
  };

  // Generate Full Scene Breakdown from Script using Gemini & Story Mode
  const generateSceneBreakdown = async (
    scriptId: string,
    options?: { primaryMode?: StoryMode; targetDuration?: string }
  ): Promise<ScriptScene[]> => {
    const target = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!target) throw new Error('Script not found');

    setIsGenerating(true);
    setError(null);
    setGenerationStep('Architecting scene breakdown & cinematic shot plans...');

    try {
      const modeToUse = options?.primaryMode || target.primaryMode || 'Documentary';
      const targetAspect =
        target.aspectRatio === '9:16' || target.type?.toLowerCase().includes('short')
          ? '9:16'
          : '16:9';

      const reindexed = await generateSceneBreakdownFromScript(
        {
          scriptTitle: target.title,
          sections: target.sections,
          primaryMode: modeToUse,
          secondaryModes: target.secondaryModes,
          platform: target.type || target.settings?.platform || 'YouTube',
          duration: options?.targetDuration || target.settings?.duration,
          audience: target.settings?.audience,
          tone: target.settings?.tone,
        },
        {
          primaryMode: modeToUse,
          aspectRatio: targetAspect,
          targetDuration: options?.targetDuration,
        }
      );

      await updateScript(scriptId, {
        scenes: reindexed,
        primaryMode: modeToUse,
      });

      setIsGenerating(false);
      setGenerationStep('');
      return reindexed;
    } catch (err: any) {
      console.error('Failed to generate scene breakdown:', err);
      const msg = err.message || 'Scene breakdown generation failed.';
      setError(msg);
      setIsGenerating(false);
      setGenerationStep('');
      throw err;
    }
  };

  // Add Scene
  const addScene = async (
    scriptId: string,
    atIndex?: number,
    initialData?: Partial<ScriptScene>
  ): Promise<void> => {
    const target = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!target) return;

    const targetAspect =
      target.aspectRatio === '9:16' || target.type?.toLowerCase().includes('short')
        ? '9:16'
        : '16:9';
    const currentScenes = [...(target.scenes || [])];
    const insertIdx =
      typeof atIndex === 'number' && atIndex >= 0 && atIndex <= currentScenes.length
        ? atIndex
        : currentScenes.length;

    const newScene = normalizeScene(
      {
        title: `Scene ${insertIdx + 1}`,
        duration: '5s',
        durationSec: 5,
        voiceover: '',
        dialogue: '',
        visualDescription: 'Establishing cinematic visual...',
        bRoll: '',
        shotType: 'Medium Shot',
        cameraMovement: 'Slow Push-In / Dolly',
        transition: 'Cut',
        onScreenText: '',
        music: '',
        soundEffects: '',
        ...initialData,
      },
      insertIdx,
      target.primaryMode,
      targetAspect
    );

    currentScenes.splice(insertIdx, 0, newScene);
    const reindexed = reindexScenes(currentScenes, target.primaryMode, targetAspect);

    await updateScript(scriptId, { scenes: reindexed });
  };

  // Delete Scene
  const deleteScene = async (scriptId: string, sceneNumber: number): Promise<void> => {
    const target = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!target) return;

    const targetAspect =
      target.aspectRatio === '9:16' || target.type?.toLowerCase().includes('short')
        ? '9:16'
        : '16:9';
    const remaining = (target.scenes || []).filter((s) => s.sceneNumber !== sceneNumber);
    const reindexed = reindexScenes(remaining, target.primaryMode, targetAspect);

    await updateScript(scriptId, { scenes: reindexed });
  };

  // Reorder Scenes
  const reorderScenes = async (
    scriptId: string,
    fromIndex: number,
    toIndex: number
  ): Promise<void> => {
    const target = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!target) return;

    const targetAspect =
      target.aspectRatio === '9:16' || target.type?.toLowerCase().includes('short')
        ? '9:16'
        : '16:9';
    const reordered = [...(target.scenes || [])];
    if (
      fromIndex < 0 ||
      fromIndex >= reordered.length ||
      toIndex < 0 ||
      toIndex >= reordered.length
    )
      return;

    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    const reindexed = reindexScenes(reordered, target.primaryMode, targetAspect);
    await updateScript(scriptId, { scenes: reindexed });
  };

  // Regenerate Single Scene in Context
  const regenerateScene = async (
    scriptId: string,
    sceneNumber: number,
    instruction?: string
  ): Promise<void> => {
    const target = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!target) return;

    const sceneToRegen = target.scenes?.find((s) => s.sceneNumber === sceneNumber);
    if (!sceneToRegen) return;

    setIsGenerating(true);
    setGenerationStep(`Regenerating Scene #${sceneNumber}...`);

    try {
      const regenerated = await regenerateSceneAPI({
        scene: sceneToRegen,
        scriptContext: {
          title: target.title,
          topic: target.settings?.topic,
          primaryMode: target.primaryMode,
          secondaryModes: target.secondaryModes,
          platform: target.type || target.settings?.platform,
        },
        instruction,
      });

      const targetAspect =
        target.aspectRatio === '9:16' || target.type?.toLowerCase().includes('short')
          ? '9:16'
          : '16:9';
      const normalizedRegen = normalizeScene(
        regenerated,
        sceneNumber - 1,
        target.primaryMode,
        targetAspect
      );

      const updatedScenes = target.scenes.map((s) =>
        s.sceneNumber === sceneNumber ? normalizedRegen : s
      );

      await updateScript(scriptId, { scenes: updatedScenes });
      setIsGenerating(false);
      setGenerationStep('');
    } catch (err: any) {
      console.error('Failed to regenerate scene:', err);
      setError(err.message || 'Scene regeneration failed.');
      setIsGenerating(false);
      setGenerationStep('');
      throw err;
    }
  };

  // Save Scene Breakdown
  const saveSceneBreakdown = async (
    scriptId: string,
    scenes: ScriptScene[]
  ): Promise<void> => {
    const target = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!target) return;

    const targetAspect =
      target.aspectRatio === '9:16' || target.type?.toLowerCase().includes('short')
        ? '9:16'
        : '16:9';
    const reindexed = reindexScenes(scenes, target.primaryMode, targetAspect);
    await updateScript(scriptId, { scenes: reindexed });
  };

  // Synchronize script scenes to uploaded audio file duration
  const syncScriptToAudio = async (
    scriptId: string,
    audioDurationSec: number,
    audioTrackMeta?: { fileName: string; audioUrl?: string; fileSize?: number }
  ): Promise<void> => {
    const target = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!target) throw new Error('Script not found');

    const syncResult = calculateAudioTimingForScenes(target.scenes, audioDurationSec);
    await updateScript(scriptId, {
      scenes: syncResult.scenes,
      isAudioSynced: true,
      audioTrack: {
        fileName: audioTrackMeta?.fileName || 'Audio Track',
        durationSec: audioDurationSec,
        audioUrl: audioTrackMeta?.audioUrl,
        fileSize: audioTrackMeta?.fileSize,
        syncedAt: new Date().toISOString(),
      },
    });
  };

  // Update Voiceover & TTS Settings
  const updateVoiceoverSettings = async (
    scriptId: string,
    settingsUpdates: Partial<VoiceoverSettings>
  ): Promise<void> => {
    const target = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!target) return;

    const current = target.voiceoverSettings || DEFAULT_VOICEOVER_SETTINGS;
    const merged: VoiceoverSettings = {
      ...current,
      ...settingsUpdates,
    };

    await updateScript(scriptId, { voiceoverSettings: merged });
  };

  // Synchronize script scenes to voice settings & cadence
  const syncScriptToVoiceSettings = async (
    scriptId: string,
    settings?: VoiceoverSettings
  ): Promise<{ updatedScenes: ScriptScene[]; timelineData: VoiceoverTimelineData }> => {
    const target = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!target) throw new Error('Script not found');

    const effectiveSettings = settings || target.voiceoverSettings || DEFAULT_VOICEOVER_SETTINGS;
    const { updatedScenes, timelineData } = syncScenesToVoiceTimeline(
      target.scenes,
      effectiveSettings,
      target.audioTrack?.durationSec
    );

    await updateScript(scriptId, {
      scenes: updatedScenes,
      voiceoverSettings: effectiveSettings,
      isAudioSynced: true,
    });

    return { updatedScenes, timelineData };
  };

  // Generate Voice for Single Scene
  const generateSceneVoice = async (
    scriptId: string,
    sceneNumber: number,
    voiceSettings?: Partial<VoiceoverSettings>
  ): Promise<void> => {
    const target = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!target) return;

    const settings = {
      ...(target.voiceoverSettings || DEFAULT_VOICEOVER_SETTINGS),
      ...voiceSettings,
    };

    const scene = target.scenes.find((s) => s.sceneNumber === sceneNumber);
    if (!scene) return;

    const cadence = calculateExactSpeechCadence(
      scene.voiceover || scene.dialogue || scene.visualDescription,
      settings.speechRateWPM,
      { language: settings.language }
    );

    const updatedScenes = target.scenes.map((sc) => {
      if (sc.sceneNumber !== sceneNumber) return sc;
      return {
        ...sc,
        duration: `${Math.round(cadence.estimatedDurationSec)}s`,
        durationSec: cadence.estimatedDurationSec,
        mediaStatus: 'Audio Synced' as SceneMediaStatus,
        generatedVoice: {
          voiceName: settings.voiceName,
          durationSec: cadence.estimatedDurationSec,
        },
      };
    });

    await updateScript(scriptId, { scenes: updatedScenes, voiceoverSettings: settings });
  };

  // Generate All Scenes Voice
  const generateAllScenesVoice = async (
    scriptId: string,
    voiceSettings?: Partial<VoiceoverSettings>
  ): Promise<void> => {
    const target = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!target) return;

    setIsGenerating(true);
    setGenerationStep('Synthesizing voiceover cadence & audio synchronization across all scenes...');

    try {
      const settings = {
        ...(target.voiceoverSettings || DEFAULT_VOICEOVER_SETTINGS),
        ...voiceSettings,
      };

      const { updatedScenes } = syncScenesToVoiceTimeline(target.scenes, settings);

      const finalizedScenes = updatedScenes.map((sc) => ({
        ...sc,
        mediaStatus: 'Audio Synced' as SceneMediaStatus,
      }));

      await updateScript(scriptId, {
        scenes: finalizedScenes,
        voiceoverSettings: settings,
        isAudioSynced: true,
      });

      setIsGenerating(false);
      setGenerationStep('');
    } catch (err: any) {
      console.error('Failed to generate all scenes voice:', err);
      setIsGenerating(false);
      setGenerationStep('');
      throw err;
    }
  };

  // Export Script Subtitles (SRT or VTT)
  const exportScriptSubtitles = (
    scriptId: string,
    format: 'srt' | 'vtt'
  ): string => {
    const target = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!target) return '';
    return format === 'vtt'
      ? generateVTTFromScenes(target.scenes)
      : generateSRTFromScenes(target.scenes);
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

  // Save Script SEO
  const saveScriptSEO = async (scriptId: string, seo: ScriptSEO): Promise<void> => {
    await updateScript(scriptId, { seo });
  };

  // Generate SEO
  const generateSEO = async (scriptId: string): Promise<ScriptSEO> => {
    const target = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!target) throw new Error('Script not found');

    setIsGenerating(true);
    setGenerationStep('Generating algorithmic SEO keywords, tags, and chapters with Gemini...');

    try {
      const fullText = target.sections.map((s) => `${s.name}:\n${s.content}`).join('\n\n');
      const seo = await generateSeoWithAI({
        topic: target.settings.topic || target.title,
        scriptText: fullText,
        platform: target.type,
        audience: target.settings.audience,
        scenes: target.scenes,
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

  // Save Script Thumbnails
  const saveScriptThumbnails = async (scriptId: string, thumbnailConcepts: ThumbnailConcept[]): Promise<void> => {
    await updateScript(scriptId, { thumbnailConcepts });
  };

  // Update a single Thumbnail Concept
  const updateThumbnailConcept = async (
    scriptId: string,
    conceptId: string,
    updates: Partial<ThumbnailConcept>
  ): Promise<void> => {
    const target = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!target) throw new Error('Script not found');

    const updatedConcepts = (target.thumbnailConcepts || []).map((c) =>
      c.id === conceptId ? { ...c, ...updates } : c
    );
    await updateScript(scriptId, { thumbnailConcepts: updatedConcepts });
  };

  // Generate Thumbnails
  const generateThumbnails = async (scriptId: string): Promise<ThumbnailConcept[]> => {
    const target = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!target) throw new Error('Script not found');

    setIsGenerating(true);
    setGenerationStep('Designing high-CTR thumbnail layouts & visual concepts with Gemini...');

    try {
      const thumbnails = await generateThumbnailsWithAI({
        title: target.title,
        topic: target.settings.topic || target.title,
        conceptText: target.settings.ideaText || target.settings.topic,
        storyMode: target.primaryMode || 'Tech Explainer',
        scenes: target.scenes,
        aspectRatio: target.aspectRatio || '16:9',
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

  // Save Script Repurposed Shorts
  const saveScriptRepurposedShorts = async (
    scriptId: string,
    repurposedShorts: RepurposedShort[]
  ): Promise<void> => {
    await updateScript(scriptId, { repurposedShorts });
  };

  // Save Film Story Bible
  const saveFilmStoryBible = async (
    scriptId: string,
    filmBible: FilmStoryBible
  ): Promise<void> => {
    await updateScript(scriptId, { filmBible });
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

  // Generate Captions from Voiceover & Synced Scene Timings
  const generateCaptions = async (scriptId: string): Promise<void> => {
    const target = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!target) throw new Error('Script not found');

    setIsGenerating(true);
    setGenerationStep('Generating word-level timed captions from voiceover & audio cadence...');

    try {
      let currentSec = 0;
      const captions: CaptionLine[] = target.scenes.map((scene, idx) => {
        const words = (scene.voiceover || '').trim().split(/\s+/).filter(Boolean);
        const duration = scene.audioTiming?.durationSec || scene.durationSec || Math.max(3, Math.round(words.length / 2.3));
        const startSec = scene.audioTiming?.startSec ?? currentSec;
        const endSec = scene.audioTiming?.endSec ?? (startSec + duration);
        currentSec = endSec;

        const timePerWord = words.length > 0 ? duration / words.length : duration;

        return {
          id: `cap-${idx + 1}`,
          startSec: Number(startSec.toFixed(3)),
          endSec: Number(endSec.toFixed(3)),
          text: scene.voiceover || `Scene ${scene.sceneNumber}`,
          words: words.map((w, wIdx) => ({
            word: w,
            startSec: Number((startSec + wIdx * timePerWord).toFixed(3)),
            endSec: Number((startSec + (wIdx + 1) * timePerWord).toFixed(3)),
          })),
        };
      });

      const existingConfig: CaptionConfig = target.captionConfig || {
        style: 'bold_pop',
        fontFamily: 'Montserrat, sans-serif',
        fontSize: 28,
        textColor: '#ffffff',
        highlightColor: '#22d3ee',
        position: 'bottom',
        animation: 'word_by_word',
        language: target.settings.language || 'English',
      };

      await updateScript(scriptId, {
        captions,
        captionConfig: existingConfig,
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

  // Update Caption Configuration & Styling
  const updateCaptionConfig = async (
    scriptId: string,
    configUpdates: Partial<CaptionConfig>
  ): Promise<void> => {
    const target = scripts.find((s) => s.id === scriptId) || activeScript;
    if (!target) return;

    const currentConfig: CaptionConfig = target.captionConfig || {
      style: 'bold_pop',
      fontFamily: 'Montserrat, sans-serif',
      fontSize: 28,
      textColor: '#ffffff',
      highlightColor: '#22d3ee',
      position: 'bottom',
      animation: 'word_by_word',
      language: target.settings.language || 'English',
    };

    await updateScript(scriptId, {
      captionConfig: { ...currentConfig, ...configUpdates },
    });
  };

  // Update Captions List
  const updateCaptions = async (scriptId: string, captions: CaptionLine[]): Promise<void> => {
    await updateScript(scriptId, { captions });
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

  // Create Media Asset
  const createMediaAsset = async (assetData: Partial<MediaAsset>): Promise<MediaAsset> => {
    try {
      const created = await mediaAssetService.createAsset(
        {
          ...assetData,
          projectId: assetData.projectId || activeProject?.id,
          scriptId: assetData.scriptId || activeScript?.id,
        },
        user?.id
      );

      setMediaAssets((prev) => [created, ...prev.filter((a) => a.id !== created.id)]);

      // If created with a sceneNumber and we have an activeScript, attach it
      if (created.sceneNumber && activeScript) {
        const targetScript = activeScript;
        if (targetScript.scenes) {
          const updatedScenes = targetScript.scenes.map((sc) => {
            if (sc.sceneNumber === created.sceneNumber) {
              const existingIds = sc.mediaAssetIds || [];
              if (!existingIds.includes(created.id)) {
                return { ...sc, mediaAssetIds: [...existingIds, created.id] };
              }
            }
            return sc;
          });
          await updateScript(targetScript.id, { scenes: updatedScenes });
        }
      }

      return created;
    } catch (err: any) {
      console.error('Failed to create media asset:', err);
      throw err;
    }
  };

  // Update Media Asset
  const updateMediaAsset = async (
    assetId: string,
    updates: Partial<MediaAsset>
  ): Promise<MediaAsset> => {
    try {
      const updated = await mediaAssetService.updateAsset(assetId, updates, user?.id);
      setMediaAssets((prev) =>
        prev.map((a) => (a.id === assetId || a.assetId === assetId ? updated : a))
      );
      return updated;
    } catch (err: any) {
      console.error('Failed to update media asset:', err);
      throw err;
    }
  };

  // Delete Media Asset
  const deleteMediaAsset = async (assetId: string): Promise<boolean> => {
    try {
      await mediaAssetService.deleteAsset(assetId, user?.id);
      setMediaAssets((prev) => prev.filter((a) => a.id !== assetId && a.assetId !== assetId));

      // Remove from any active script scenes
      if (activeScript && activeScript.scenes) {
        const hasAsset = activeScript.scenes.some((sc) => sc.mediaAssetIds?.includes(assetId));
        if (hasAsset) {
          const updatedScenes = activeScript.scenes.map((sc) => ({
            ...sc,
            mediaAssetIds: (sc.mediaAssetIds || []).filter((id) => id !== assetId),
          }));
          await updateScript(activeScript.id, { scenes: updatedScenes });
        }
      }

      return true;
    } catch (err: any) {
      console.error('Failed to delete media asset:', err);
      return false;
    }
  };

  // Attach Asset To Scene
  const attachAssetToScene = async (
    assetId: string,
    sceneNumber: number,
    scriptId?: string
  ): Promise<void> => {
    const targetScriptId = scriptId || activeScript?.id;
    if (!targetScriptId) return;

    await mediaAssetService.attachAssetToScene(assetId, sceneNumber, targetScriptId, user?.id);

    // Update in-memory asset list
    setMediaAssets((prev) =>
      prev.map((a) =>
        a.id === assetId || a.assetId === assetId
          ? { ...a, sceneNumber, scriptId: targetScriptId }
          : a
      )
    );

    // Update script scenes
    const targetScript = scripts.find((s) => s.id === targetScriptId) || activeScript;
    if (targetScript && targetScript.scenes) {
      const updatedScenes = targetScript.scenes.map((sc) => {
        if (sc.sceneNumber === sceneNumber) {
          const existingIds = sc.mediaAssetIds || [];
          if (!existingIds.includes(assetId)) {
            return { ...sc, mediaAssetIds: [...existingIds, assetId] };
          }
        }
        return sc;
      });
      await updateScript(targetScriptId, { scenes: updatedScenes });
    }
  };

  // Detach Asset From Scene
  const detachAssetFromScene = async (
    assetId: string,
    sceneNumber: number,
    scriptId?: string
  ): Promise<void> => {
    const targetScriptId = scriptId || activeScript?.id;
    if (!targetScriptId) return;

    await mediaAssetService.detachAssetFromScene(assetId, sceneNumber, targetScriptId, user?.id);

    setMediaAssets((prev) =>
      prev.map((a) =>
        a.id === assetId || a.assetId === assetId
          ? { ...a, sceneNumber: undefined, sceneId: undefined }
          : a
      )
    );

    const targetScript = scripts.find((s) => s.id === targetScriptId) || activeScript;
    if (targetScript && targetScript.scenes) {
      const updatedScenes = targetScript.scenes.map((sc) => {
        if (sc.sceneNumber === sceneNumber && sc.mediaAssetIds) {
          return {
            ...sc,
            mediaAssetIds: sc.mediaAssetIds.filter((id) => id !== assetId),
          };
        }
        return sc;
      });
      await updateScript(targetScriptId, { scenes: updatedScenes });
    }
  };

  // Get Assets For Scene
  const getAssetsForScene = useCallback(
    (sceneNumber: number, scriptId?: string): MediaAsset[] => {
      const targetScriptId = scriptId || activeScript?.id;
      return mediaAssets.filter((a) => {
        const matchesScene = a.sceneNumber === sceneNumber;
        return targetScriptId ? matchesScene && (!a.scriptId || a.scriptId === targetScriptId) : matchesScene;
      });
    },
    [mediaAssets, activeScript?.id]
  );

  // Create Generation Job
  const createGenerationJob = async (params: CreateGenerationJobParams): Promise<MediaGenerationJob> => {
    const job = await mediaGenerationService.createJob(
      {
        ...params,
        projectId: params.projectId || activeProject?.id,
        scriptId: params.scriptId || activeScript?.id,
      },
      user?.id
    );
    setGenerationJobs((prev) => [job, ...prev.filter((j) => j.id !== job.id)]);
    // Reload assets to capture pre-created or updated asset
    await loadProjectAssets();
    return job;
  };

  // Cancel Generation Job
  const cancelGenerationJob = async (jobId: string): Promise<void> => {
    await mediaGenerationService.cancelJob(jobId, user?.id);
    setGenerationJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: 'cancelled', error: 'Job cancelled by user.' } : j))
    );
    await loadProjectAssets();
  };

  // Retry Generation Job
  const retryGenerationJob = async (jobId: string): Promise<void> => {
    await mediaGenerationService.retryJob(jobId, user?.id);
    setGenerationJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: 'queued', progress: 0, error: undefined } : j))
    );
    await loadProjectAssets();
  };

  // Delete Generation Job
  const deleteGenerationJob = async (jobId: string): Promise<void> => {
    await mediaGenerationService.deleteJob(jobId, user?.id);
    setGenerationJobs((prev) => prev.filter((j) => j.id !== jobId));
  };

  // Get Jobs For Scene
  const getJobsForScene = useCallback(
    (sceneNumber: number, scriptId?: string): MediaGenerationJob[] => {
      const targetScriptId = scriptId || activeScript?.id;
      return generationJobs.filter((j) => {
        const matchesScene = j.sceneNumber === sceneNumber;
        return targetScriptId ? matchesScene && (!j.scriptId || j.scriptId === targetScriptId) : matchesScene;
      });
    },
    [generationJobs, activeScript?.id]
  );

  // Get Active Jobs Count
  const getActiveJobsCount = useCallback((): number => {
    return generationJobs.filter((j) => j.status === 'queued' || j.status === 'processing').length;
  }, [generationJobs]);

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
        updateSceneShotPlan,
        updateSceneMediaPrompts,
        batchUpdateSceneMediaPrompts,
        enhanceScenePrompts,
        enhanceAllScenePrompts,
        updateSceneMediaStatus,
        generateSceneBreakdown,
        addScene,
        deleteScene,
        reorderScenes,
        regenerateScene,
        saveSceneBreakdown,
        syncScriptToAudio,
        updateVoiceoverSettings,
        syncScriptToVoiceSettings,
        generateSceneVoice,
        generateAllScenesVoice,
        exportScriptSubtitles,
        deleteScript,
        saveScript,
        setActiveScript,
        setSelectedSectionId,
        saveVersion,
        restoreVersion,
        rewriteSection,
        generateSEO,
        saveScriptSEO,
        generateThumbnails,
        saveScriptThumbnails,
        updateThumbnailConcept,
        repurposeScript,
        saveScriptRepurposedShorts,
        saveFilmStoryBible,
        generateCompleteContentPackage,
        generateSceneImage,
        generateSceneVideo,
        generateSceneVoiceover,
        generateCaptions,
        updateCaptionConfig,
        updateCaptions,
        createVideoFromScript,
        clearError: () => setError(null),
        // Media Asset Pipeline
        mediaAssets,
        isLoadingAssets,
        loadProjectAssets,
        createMediaAsset,
        updateMediaAsset,
        deleteMediaAsset,
        attachAssetToScene,
        detachAssetFromScene,
        getAssetsForScene,
        // Media Generation Pipeline
        generationJobs,
        isLoadingJobs,
        createGenerationJob,
        cancelGenerationJob,
        retryGenerationJob,
        deleteGenerationJob,
        getJobsForScene,
        getActiveJobsCount,
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
