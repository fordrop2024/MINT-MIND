import React, { useState, useMemo } from 'react';
import {
  Film,
  Camera,
  Wand2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  RefreshCw,
  Copy,
  Check,
  Volume2,
  Square,
  Sliders,
  UploadCloud,
  FileDown,
  Sparkles,
  Music,
  CheckCircle,
  Clock,
  Layers,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Mic,
  Unlink,
  X,
  Activity,
  RotateCw,
} from 'lucide-react';
import { useScript } from '../../context/ScriptContext';
import { MediaAssetLibrary } from '../media/MediaAssetLibrary';
import { GenerationJobsPanel } from '../media/GenerationJobsPanel';
import type { MediaAsset, MediaAssetType } from '../../types/mediaAsset';
import {
  Script,
  ScriptScene,
  StoryMode,
  CameraShotType,
  CameraMovement,
} from '../../types/script';
import { StoryModeBadge } from '../storyMode/StoryModeBadge';
import { StoryModeSelector } from '../storyMode/StoryModeSelector';
import { getStoryModeProfile } from '../../services/storyModeEngine';
import { voiceEngine } from '../../services/voiceService';
import { formatTimecode } from '../../services/audioTimingSyncService';
import {
  exportScenesToJSON,
  exportScenesToCSV,
  exportScenesToText,
  reindexScenes,
} from '../../services/sceneBreakdownService';

const SHOT_TYPES: CameraShotType[] = [
  'Extreme Wide Shot',
  'Wide Shot',
  'Medium Shot',
  'Close-Up',
  'Extreme Close-Up',
  'Drone Aerial',
  'Over-the-Shoulder',
  'POV',
  'Dutch Angle',
];

const CAMERA_MOVEMENTS: CameraMovement[] = [
  'Slow Push-In / Dolly',
  'Pan Left/Right',
  'Tilt Up/Down',
  'Tracking / Gimbal',
  'Handheld Organic',
  'Static',
  'Pull-Out',
];

const TRANSITIONS = [
  'Cut',
  'Match Cut',
  'Whip Pan',
  'Cross Dissolve',
  'J-Cut',
  'L-Cut',
  'Flash to White',
  'Zoom In Cut',
];

interface SceneBreakdownStudioProps {
  script: Script;
  onNotification?: (msg: string) => void;
}

export const SceneBreakdownStudio: React.FC<SceneBreakdownStudioProps> = ({
  script,
  onNotification,
}) => {
  const {
    isGenerating,
    generationStep,
    generateSceneBreakdown,
    addScene,
    deleteScene,
    reorderScenes,
    regenerateScene,
    updateScene,
    saveSceneBreakdown,
    syncScriptToAudio,
    updateScript,
    mediaAssets,
    getAssetsForScene,
    attachAssetToScene,
    detachAssetFromScene,
    generationJobs,
    createGenerationJob,
    cancelGenerationJob,
    retryGenerationJob,
    getJobsForScene,
    getActiveJobsCount,
    enhanceScenePrompts,
  } = useScript();

  // Local state
  const [scenes, setScenes] = useState<ScriptScene[]>(script.scenes || []);
  const [enhancingSceneNum, setEnhancingSceneNum] = useState<number | null>(null);
  const [selectedStoryMode, setSelectedStoryMode] = useState<StoryMode>(
    script.primaryMode || 'Documentary'
  );
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedShotTypeFilter, setSelectedShotTypeFilter] = useState<string>('All');
  const [expandedScenes, setExpandedScenes] = useState<Record<number, boolean>>({});
  const [playingSceneNum, setPlayingSceneNum] = useState<number | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isUploadingAudio, setIsUploadingAudio] = useState<boolean>(false);
  const [cadencePresetWPM, setCadencePresetWPM] = useState<number>(145);

  // Media Asset Pipeline Modal States
  const [isMediaLibraryModalOpen, setIsMediaLibraryModalOpen] = useState<boolean>(false);
  const [attachModalSceneNumber, setAttachModalSceneNumber] = useState<number | null>(null);

  // Generation Pipeline Drawer State
  const [isJobsDrawerOpen, setIsJobsDrawerOpen] = useState<boolean>(false);
  const [queueingJobSceneNum, setQueueingJobSceneNum] = useState<number | null>(null);

  // Handle queueing a generation job for a scene
  const handleQueueSceneJob = async (
    scene: ScriptScene,
    type: MediaAssetType,
    promptOverride?: string
  ) => {
    let prompt = promptOverride;
    if (!prompt) {
      if (type === 'image') prompt = scene.imageGenerationPrompt || scene.visualDescription;
      else if (type === 'video' || type === 'b-roll') prompt = scene.videoGenerationPrompt || scene.visualDescription;
      else if (type === 'voiceover') prompt = scene.dialogue || scene.voiceover;
      else if (type === 'music') prompt = scene.music || scene.sfxMusic || 'Cinematic background music score';
      else if (type === 'sound-effect' || type === 'audio') prompt = scene.soundEffects || scene.sfx || 'Crisp foley sound effect';
    }

    if (!prompt || !prompt.trim()) {
      onNotification?.(`Cannot queue ${type} job: No prompt or requirement specified for Scene #${scene.sceneNumber}.`);
      return;
    }

    try {
      setQueueingJobSceneNum(scene.sceneNumber);
      await createGenerationJob({
        scriptId: script.id,
        projectId: script.projectId,
        sceneId: `scene_${scene.sceneNumber}`,
        sceneNumber: scene.sceneNumber,
        type,
        prompt: prompt.trim(),
        metadata: {
          sceneDurationSec: scene.durationSec,
          shotType: scene.shotType,
          cameraMovement: scene.cameraMovement,
        },
      });
      onNotification?.(`Queued ${type} generation job for Scene #${scene.sceneNumber}.`);
    } catch (err: any) {
      onNotification?.(`Failed to queue job: ${err.message || 'Unknown error'}`);
    } finally {
      setQueueingJobSceneNum(null);
    }
  };

  // Regeneration Modal state
  const [regenModalScene, setRegenModalScene] = useState<ScriptScene | null>(null);
  const [regenInstruction, setRegenInstruction] = useState<string>('');
  const [isRegeneratingScene, setIsRegeneratingScene] = useState<boolean>(false);

  // Keep local state synchronized if script changes externally and we don't have unsaved edits
  React.useEffect(() => {
    if (!isDirty && script.scenes) {
      setScenes(script.scenes);
    }
    if (script.primaryMode) {
      setSelectedStoryMode(script.primaryMode);
    }
  }, [script.scenes, script.primaryMode, isDirty]);

  const notify = (msg: string) => {
    if (onNotification) onNotification(msg);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    notify('Copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Toggle expand/collapse of shot plan studio drawer
  const toggleExpand = (sceneNumber: number) => {
    setExpandedScenes((prev) => ({
      ...prev,
      [sceneNumber]: !prev[sceneNumber],
    }));
  };

  const expandAll = () => {
    const allExpanded: Record<number, boolean> = {};
    scenes.forEach((s) => {
      allExpanded[s.sceneNumber] = true;
    });
    setExpandedScenes(allExpanded);
  };

  const collapseAll = () => {
    setExpandedScenes({});
  };

  // Local field update for real-time responsiveness
  const handleSceneChange = (sceneNumber: number, field: keyof ScriptScene, value: any) => {
    setScenes((prev) =>
      prev.map((s) => {
        if (s.sceneNumber !== sceneNumber) return s;
        const updated = { ...s, [field]: value };

        // Automatically update dialogue if voiceover changes, and vice-versa
        if (field === 'voiceover') {
          updated.dialogue = value;
        } else if (field === 'dialogue') {
          updated.voiceover = value;
        }

        // Keep shotPlan in sync
        if (field === 'shotType' || field === 'cameraMovement') {
          updated.shotPlan = {
            ...(updated.shotPlan || ({} as any)),
            [field === 'shotType' ? 'shotType' : 'movement']: value,
          };
        }

        return updated;
      })
    );
    setIsDirty(true);
  };

  // Save all current scene edits
  const handleSaveAll = async () => {
    try {
      await saveSceneBreakdown(script.id, scenes);
      setIsDirty(false);
      notify('Scene Breakdown & Shot Plan saved successfully!');
    } catch (err: any) {
      notify(err.message || 'Failed to save scenes');
    }
  };

  // Trigger full breakdown generation with active Story Mode
  const handleGenerateFullBreakdown = async () => {
    if (
      scenes.length > 0 &&
      !window.confirm(
        'Generate a fresh scene breakdown? This will reorganize the script into new scenes matching the selected Story Mode.'
      )
    ) {
      return;
    }

    try {
      const generated = await generateSceneBreakdown(script.id, {
        primaryMode: selectedStoryMode,
      });
      setScenes(generated);
      setIsDirty(false);
      notify(`Scene breakdown created: ${generated.length} scenes structured!`);
    } catch (err: any) {
      notify(err.message || 'Generation failed');
    }
  };

  // Add new scene
  const handleAddScene = async (index?: number) => {
    try {
      await addScene(script.id, index);
      setIsDirty(false);
      notify('New scene added');
    } catch (err: any) {
      notify(err.message || 'Failed to add scene');
    }
  };

  // Delete scene
  const handleDeleteScene = async (sceneNumber: number) => {
    if (
      !window.confirm(
        `Are you sure you want to delete Scene #${sceneNumber}? Remaining scenes will be re-indexed.`
      )
    ) {
      return;
    }

    try {
      await deleteScene(script.id, sceneNumber);
      setIsDirty(false);
      notify(`Scene #${sceneNumber} removed`);
    } catch (err: any) {
      notify(err.message || 'Failed to delete scene');
    }
  };

  // Move scene up/down
  const handleMoveScene = async (fromIndex: number, toIndex: number) => {
    try {
      await reorderScenes(script.id, fromIndex, toIndex);
      setIsDirty(false);
      notify('Scene reordered');
    } catch (err: any) {
      notify(err.message || 'Failed to reorder scene');
    }
  };

  // Targeted Single Scene Regeneration
  const openRegenModal = (scene: ScriptScene) => {
    setRegenModalScene(scene);
    setRegenInstruction('');
  };

  const handleConfirmRegen = async () => {
    if (!regenModalScene) return;
    setIsRegeneratingScene(true);
    try {
      await regenerateScene(script.id, regenModalScene.sceneNumber, regenInstruction);
      notify(`Scene #${regenModalScene.sceneNumber} regenerated successfully!`);
      setRegenModalScene(null);
      setIsDirty(false);
    } catch (err: any) {
      notify(err.message || 'Regeneration failed');
    } finally {
      setIsRegeneratingScene(false);
    }
  };

  // Enhance scene prompts with Gemini
  const handleEnhanceScenePrompts = async (sceneNumber: number) => {
    setEnhancingSceneNum(sceneNumber);
    try {
      const enhanced = await enhanceScenePrompts(script.id, sceneNumber);
      setScenes((prev) =>
        prev.map((s) =>
          s.sceneNumber === sceneNumber
            ? {
                ...s,
                enhancedPrompts: enhanced,
                imageGenerationPrompt: enhanced.midjourneyPrompt || s.imageGenerationPrompt,
                videoGenerationPrompt: enhanced.runwayPrompt || s.videoGenerationPrompt,
                mediaStatus: 'Prompt Ready',
              }
            : s
        )
      );
      notify(`Scene #${sceneNumber} media prompts enhanced with Gemini!`);
    } catch (err: any) {
      notify(err.message || 'Failed to enhance scene prompts');
    } finally {
      setEnhancingSceneNum(null);
    }
  };

  // Audio Playback
  const handlePlayVoiceover = (scene: ScriptScene) => {
    if (playingSceneNum === scene.sceneNumber) {
      voiceEngine.stop();
      setPlayingSceneNum(null);
      return;
    }

    const textToSpeak = scene.voiceover || scene.dialogue || '';
    if (!textToSpeak.trim()) {
      notify('No spoken text in this scene');
      return;
    }

    voiceEngine.stop();
    setPlayingSceneNum(scene.sceneNumber);
    voiceEngine.speak(textToSpeak, {
      onEnd: () => setPlayingSceneNum(null),
      onError: () => setPlayingSceneNum(null),
    });
  };

  // Audio Cadence Presets
  const handleApplyCadencePreset = async (targetWPM: number) => {
    setCadencePresetWPM(targetWPM);
    const updated = scenes.map((sc) => {
      const words = (sc.voiceover || '').trim().split(/\s+/).filter(Boolean).length;
      const estimatedSec = Math.max(3, Math.round((words / targetWPM) * 60)) || 5;
      return {
        ...sc,
        duration: `${estimatedSec}s`,
        durationSec: estimatedSec,
      };
    });

    const targetAspect =
      script.aspectRatio === '9:16' || script.type?.toLowerCase().includes('short')
        ? '9:16'
        : '16:9';
    const reindexed = reindexScenes(updated, selectedStoryMode, targetAspect);
    setScenes(reindexed);
    setIsDirty(true);
    notify(`Cadence recalibrated to ${targetWPM} WPM. Click 'Save Plan' to persist.`);
  };

  // Audio file upload
  const handleAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAudio(true);
    try {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);
      audio.src = objectUrl;

      await new Promise<void>((resolve, reject) => {
        audio.onloadedmetadata = () => resolve();
        audio.onerror = () => reject(new Error('Failed to read audio duration'));
      });

      const audioDuration = audio.duration;
      await syncScriptToAudio(script.id, audioDuration, {
        fileName: file.name,
        fileSize: file.size,
      });

      notify(`Synced ${scenes.length} scenes to audio track (${formatTimecode(audioDuration)})`);
    } catch (err: any) {
      notify(err.message || 'Audio sync failed');
    } finally {
      setIsUploadingAudio(false);
    }
  };

  // Story Mode Change
  const handleStoryModeChange = async (mode: StoryMode) => {
    setSelectedStoryMode(mode);
    await updateScript(script.id, { primaryMode: mode });
    notify(`Story Mode switched to ${mode}. You can now regenerate scenes or shot plans in this aesthetic.`);
  };

  // Export handlers
  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify(`Exported ${filename}`);
  };

  const handleExportJSON = () => {
    const json = exportScenesToJSON(scenes, script.title);
    downloadFile(json, `${script.title.replace(/\s+/g, '_')}_shot_plan.json`, 'application/json');
  };

  const handleExportCSV = () => {
    const csv = exportScenesToCSV(scenes);
    downloadFile(csv, `${script.title.replace(/\s+/g, '_')}_shot_list.csv`, 'text/csv');
  };

  const handleExportCallSheet = () => {
    const text = exportScenesToText(scenes, script.title);
    downloadFile(text, `${script.title.replace(/\s+/g, '_')}_call_sheet.txt`, 'text/plain');
  };

  const handleCopyAllPrompts = () => {
    const prompts = scenes
      .map(
        (s) =>
          `[Scene ${s.sceneNumber} - ${s.title || 'Shot'}]\nImage: ${s.imageGenerationPrompt || s.visualDescription}\nVideo: ${s.videoGenerationPrompt || s.visualDescription}\n`
      )
      .join('\n');
    handleCopy(prompts, 'all_prompts');
  };

  // Telemetry Calculations
  const totalDurationSec = useMemo(
    () => scenes.reduce((acc, s) => acc + (s.audioTiming?.durationSec || s.durationSec || 5), 0),
    [scenes]
  );

  const totalWords = useMemo(
    () =>
      scenes.reduce((acc, s) => {
        const words = (s.voiceover || '').trim().split(/\s+/).filter(Boolean).length;
        return acc + words;
      }, 0),
    [scenes]
  );

  const activeModeProfile = useMemo(
    () => getStoryModeProfile(selectedStoryMode),
    [selectedStoryMode]
  );

  // Filtered scenes
  const filteredScenes = useMemo(() => {
    return scenes.filter((scene) => {
      const matchesSearch =
        !searchQuery ||
        (scene.title && scene.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (scene.voiceover && scene.voiceover.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (scene.visualDescription &&
          scene.visualDescription.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (scene.bRoll && scene.bRoll.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesShotType =
        selectedShotTypeFilter === 'All' || scene.shotType === selectedShotTypeFilter;

      return matchesSearch && matchesShotType;
    });
  }, [scenes, searchQuery, selectedShotTypeFilter]);

  return (
    <div className="space-y-6">
      {/* 1. TOP CONTROL & TELEMETRY HUB */}
      <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-display">
                  Scene Breakdown & Shot Planning Studio
                </h3>
                <StoryModeBadge mode={selectedStoryMode} size="sm" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Breakdown your script into production scenes, camera movements, and cinematic visual prompts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Generate / Regenerate Entire Breakdown */}
            <button
              onClick={handleGenerateFullBreakdown}
              disabled={isGenerating}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              <Wand2 className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{scenes.length > 0 ? 'Regenerate Breakdown' : 'Generate Breakdown'}</span>
            </button>

            {/* Add Scene Button */}
            <button
              onClick={() => handleAddScene()}
              disabled={isGenerating}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Add Scene</span>
            </button>

            {/* Save Button (when dirty) */}
            <button
              onClick={handleSaveAll}
              disabled={!isDirty || isGenerating}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isDirty
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 animate-pulse'
                  : 'bg-slate-800/80 text-slate-400 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isDirty ? 'Save Plan *' : 'Saved'}</span>
            </button>

            {/* Media Generation Pipeline Jobs Button */}
            <button
              onClick={() => setIsJobsDrawerOpen(true)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Open Media Generation Pipeline Jobs"
            >
              <Activity
                className={`w-3.5 h-3.5 ${
                  getActiveJobsCount() > 0 ? 'text-cyan-400 animate-pulse' : 'text-slate-400'
                }`}
              />
              <span>Jobs Pipeline</span>
              {getActiveJobsCount() > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {getActiveJobsCount()}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Story Mode Selector Integration */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="font-medium">Active Story Mode Aesthetic:</span>
            <StoryModeSelector
              selectedMode={selectedStoryMode}
              onSelectMode={handleStoryModeChange}
              size="sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400">
              Style: <strong className="text-slate-300">{activeModeProfile.visualStyle.slice(0, 45)}...</strong>
            </span>
          </div>
        </div>

        {/* Production Telemetry Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
              <Layers className="w-3 h-3 text-cyan-400" /> Total Scenes
            </div>
            <div className="text-base font-bold text-white font-mono mt-0.5">
              {scenes.length} <span className="text-[11px] font-normal text-slate-400">scenes</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-400" /> Runtime Duration
            </div>
            <div className="text-base font-bold text-cyan-400 font-mono mt-0.5">
              {formatTimecode(totalDurationSec)}{' '}
              <span className="text-[11px] font-normal text-slate-400">
                (~{Math.round(totalDurationSec)}s)
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
              <Volume2 className="w-3 h-3 text-purple-400" /> Spoken Words
            </div>
            <div className="text-base font-bold text-white font-mono mt-0.5">
              {totalWords} <span className="text-[11px] font-normal text-slate-400">words</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
              <Camera className="w-3 h-3 text-amber-400" /> Aspect Framing
            </div>
            <div className="text-base font-bold text-amber-400 font-mono mt-0.5">
              {script.aspectRatio === '9:16' || script.type?.toLowerCase().includes('short')
                ? '9:16 Vertical'
                : '16:9 Cinema'}
            </div>
          </div>
        </div>

        {/* Audio Sync & Cadence Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-850">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span>Cadence:</span>
              <button
                onClick={() => handleApplyCadencePreset(125)}
                className={`px-2 py-0.5 rounded font-mono text-[11px] border transition-colors ${
                  cadencePresetWPM === 125
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                125 WPM (Dramatic)
              </button>
              <button
                onClick={() => handleApplyCadencePreset(145)}
                className={`px-2 py-0.5 rounded font-mono text-[11px] border transition-colors ${
                  cadencePresetWPM === 145
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                145 WPM (Natural)
              </button>
              <button
                onClick={() => handleApplyCadencePreset(165)}
                className={`px-2 py-0.5 rounded font-mono text-[11px] border transition-colors ${
                  cadencePresetWPM === 165
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                165 WPM (Fast)
              </button>
            </div>

            {script.audioTrack && (
              <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>
                  Track: {script.audioTrack.fileName} ({formatTimecode(script.audioTrack.durationSec)})
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer">
              <UploadCloud
                className={`w-3.5 h-3.5 text-cyan-400 ${isUploadingAudio ? 'animate-bounce' : ''}`}
              />
              <span>{isUploadingAudio ? 'Syncing...' : 'Sync Audio File'}</span>
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioFileUpload}
                disabled={isUploadingAudio}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Toolbar: Search, Filter, Expand/Collapse & Exports */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-850">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dialogue, visuals, B-roll..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <select
              value={selectedShotTypeFilter}
              onChange={(e) => setSelectedShotTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="All">All Shot Types</option>
              {SHOT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={expandAll}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono"
            >
              Collapse All
            </button>

            <div className="h-4 w-px bg-slate-800 mx-1" />

            {/* Export Dropdowns / Buttons */}
            <button
              onClick={handleCopyAllPrompts}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs flex items-center gap-1 transition-colors"
              title="Copy all Image & Video prompts"
            >
              {copiedKey === 'all_prompts' ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3 text-cyan-400" />
              )}
              <span>Copy Prompts</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs flex items-center gap-1 transition-colors"
              title="Export Shot List as CSV"
            >
              <FileDown className="w-3 h-3 text-emerald-400" />
              <span>CSV</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs flex items-center gap-1 transition-colors"
              title="Export as JSON"
            >
              <FileDown className="w-3 h-3 text-indigo-400" />
              <span>JSON</span>
            </button>

            <button
              onClick={handleExportCallSheet}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs flex items-center gap-1 transition-colors"
              title="Export Director Call Sheet"
            >
              <FileDown className="w-3 h-3 text-amber-400" />
              <span>Call Sheet</span>
            </button>

            <button
              onClick={() => setIsMediaLibraryModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs flex items-center gap-1.5 font-medium transition-colors"
              title="Open Media Asset Library"
            >
              <Layers className="w-3 h-3 text-cyan-400" />
              <span>Media Assets ({mediaAssets.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading Overlay when generating entire breakdown */}
      {isGenerating && generationStep && (
        <div className="p-8 rounded-2xl bg-slate-900 border border-cyan-500/30 text-center space-y-3 animate-pulse">
          <Wand2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
          <h4 className="text-sm font-bold text-white font-display">
            MintMind AI Storyboard Engine
          </h4>
          <p className="text-xs text-cyan-300 font-mono">{generationStep}</p>
        </div>
      )}

      {/* 2. SCENES LIST */}
      {filteredScenes.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">No Scenes Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              {searchQuery
                ? 'No scenes match your search filter.'
                : 'Your script has not been broken down into production scenes yet. Click below to generate.'}
            </p>
          </div>
          {!searchQuery && (
            <button
              onClick={handleGenerateFullBreakdown}
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Generate Scene Breakdown</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredScenes.map((scene, idx) => {
            const isExpanded = expandedScenes[scene.sceneNumber] ?? true;
            const isPlaying = playingSceneNum === scene.sceneNumber;
            const realIdx = scenes.findIndex((s) => s.sceneNumber === scene.sceneNumber);

            // Media Asset Pipeline: Attached assets for this scene
            const sceneMediaAssets = getAssetsForScene(scene.sceneNumber, script.id);
            const attachedImages = sceneMediaAssets.filter((a) => a.type === 'image');
            const attachedVideos = sceneMediaAssets.filter((a) => a.type === 'video' || a.type === 'b-roll');
            const attachedVoice = sceneMediaAssets.filter((a) => a.type === 'voiceover');
            const attachedAudio = sceneMediaAssets.filter(
              (a) => a.type === 'audio' || a.type === 'music' || a.type === 'sound-effect'
            );

            // Generation Pipeline jobs for this scene
            const sceneJobs = getJobsForScene(scene.sceneNumber, script.id);
            const isQueueingThisScene = queueingJobSceneNum === scene.sceneNumber;

            return (
              <div
                key={scene.sceneId || `scene_${scene.sceneNumber}_${idx}`}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-sm"
              >
                {/* Scene Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-xs font-bold flex items-center justify-center">
                      #{scene.sceneNumber}
                    </span>

                    {/* Scene Title (Editable Inline) */}
                    <input
                      type="text"
                      value={scene.title || `Scene ${scene.sceneNumber}`}
                      onChange={(e) =>
                        handleSceneChange(scene.sceneNumber, 'title', e.target.value)
                      }
                      className="bg-transparent font-bold text-sm text-white focus:outline-none focus:bg-slate-950 px-2 py-0.5 rounded border border-transparent focus:border-cyan-500 max-w-[200px] sm:max-w-xs"
                      placeholder={`Scene ${scene.sceneNumber}`}
                    />

                    {/* Duration Badge & Timecode */}
                    <div className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-500/30">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span>{scene.audioTiming?.timecode || `${scene.durationSec || 5}s`}</span>
                    </div>

                    {/* Shot Type & Movement Badges */}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      🎬 {scene.shotType || 'Medium Shot'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      🎥 {scene.cameraMovement || 'Slow Push-In'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      ✂️ {scene.transition || 'Cut'}
                    </span>
                  </div>

                  {/* Scene Actions Toolbar */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Voiceover Playback */}
                    <button
                      onClick={() => handlePlayVoiceover(scene)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                        isPlaying
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                    >
                      {isPlaying ? (
                        <>
                          <Square className="w-3 h-3 text-rose-400 fill-current" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3 text-cyan-400" />
                          <span>Voice</span>
                        </>
                      )}
                    </button>

                    {/* Targeted Regenerate Scene Button */}
                    <button
                      onClick={() => openRegenModal(scene)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 flex items-center gap-1 transition-colors"
                      title="Regenerate this specific scene with AI"
                    >
                      <RefreshCw className="w-3 h-3 text-amber-400" />
                      <span>Regen Scene</span>
                    </button>

                    {/* Move Up */}
                    <button
                      onClick={() => handleMoveScene(realIdx, realIdx - 1)}
                      disabled={realIdx === 0}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition-colors"
                      title="Move Scene Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Move Down */}
                    <button
                      onClick={() => handleMoveScene(realIdx, realIdx + 1)}
                      disabled={realIdx === scenes.length - 1}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition-colors"
                      title="Move Scene Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Insert Scene After */}
                    <button
                      onClick={() => handleAddScene(realIdx + 1)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors"
                      title="Insert Scene After"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Scene */}
                    <button
                      onClick={() => handleDeleteScene(scene.sceneNumber)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 transition-colors"
                      title="Delete Scene"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Toggle Drawer */}
                    <button
                      onClick={() => toggleExpand(scene.sceneNumber)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
                      title={isExpanded ? 'Collapse Shot Plan' : 'Expand Shot Plan'}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 2-Column Core Layout: Dialogue / Voiceover on Left, Visual Directives on Right */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Spoken Voiceover / Dialogue */}
                  <div className="md:col-span-7 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-mono font-bold uppercase text-cyan-400 flex items-center gap-1">
                        <Volume2 className="w-3 h-3" />
                        Voiceover / Spoken Dialogue:
                      </label>
                      <span className="text-[10px] font-mono text-slate-400">
                        {(scene.voiceover || '').trim().split(/\s+/).filter(Boolean).length} words · ~{scene.durationSec || 5}s
                      </span>
                    </div>

                    <textarea
                      rows={3}
                      value={scene.voiceover}
                      onChange={(e) =>
                        handleSceneChange(scene.sceneNumber, 'voiceover', e.target.value)
                      }
                      className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 leading-relaxed resize-y"
                      placeholder="Spoken dialogue or voiceover narration..."
                    />

                    {/* Duration Editor + On-Screen Text Input */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      <div>
                        <span className="block text-[10px] font-mono uppercase text-slate-400 mb-0.5">
                          Duration (Sec)
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={120}
                          value={scene.durationSec || 5}
                          onChange={(e) => {
                            const val = Math.max(1, parseInt(e.target.value, 10) || 5);
                            handleSceneChange(scene.sceneNumber, 'durationSec', val);
                            handleSceneChange(scene.sceneNumber, 'duration', `${val}s`);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <span className="block text-[10px] font-mono uppercase text-slate-400 mb-0.5">
                          On-Screen Text (Overlay)
                        </span>
                        <input
                          type="text"
                          value={scene.onScreenText || ''}
                          onChange={(e) =>
                            handleSceneChange(scene.sceneNumber, 'onScreenText', e.target.value)
                          }
                          placeholder="Punchy text overlay on screen..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Visual Directives & B-Roll */}
                  <div className="md:col-span-5 space-y-2">
                    <div>
                      <label className="text-[11px] font-mono font-bold uppercase text-indigo-400 flex items-center gap-1 mb-1">
                        <Camera className="w-3 h-3" />
                        Visual Description & Action:
                      </label>
                      <textarea
                        rows={3}
                        value={scene.visualDescription}
                        onChange={(e) =>
                          handleSceneChange(scene.sceneNumber, 'visualDescription', e.target.value)
                        }
                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed resize-y"
                        placeholder="Detailed visual composition, subject action, environment..."
                      />
                    </div>

                    <div>
                      <span className="block text-[10px] font-mono uppercase text-amber-400 mb-0.5">
                        B-Roll Suggestion
                      </span>
                      <input
                        type="text"
                        value={scene.bRoll || scene.bRollSuggestion || ''}
                        onChange={(e) => {
                          handleSceneChange(scene.sceneNumber, 'bRoll', e.target.value);
                          handleSceneChange(scene.sceneNumber, 'bRollSuggestion', e.target.value);
                        }}
                        placeholder="Cutaway footage suggestion..."
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded Shot Plan & Visual Prompt Studio */}
                {isExpanded && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/20 space-y-4 mt-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-bold text-white font-display">
                          Cinematic Shot Plan Studio — Scene #{scene.sceneNumber}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400">
                        Framing:{' '}
                        {script.aspectRatio === '9:16' || script.type?.toLowerCase().includes('short')
                          ? '9:16 Vertical'
                          : '16:9 Widescreen'}
                      </span>
                    </div>

                    {/* Selectors: Shot Type, Camera Movement, Transition, Music, SFX */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {/* Shot Type */}
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                          Camera Shot Type
                        </label>
                        <select
                          value={scene.shotType || 'Medium Shot'}
                          onChange={(e) =>
                            handleSceneChange(scene.sceneNumber, 'shotType', e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                        >
                          {SHOT_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Camera Movement */}
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                          Camera Movement
                        </label>
                        <select
                          value={scene.cameraMovement || 'Slow Push-In / Dolly'}
                          onChange={(e) =>
                            handleSceneChange(scene.sceneNumber, 'cameraMovement', e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                        >
                          {CAMERA_MOVEMENTS.map((mov) => (
                            <option key={mov} value={mov}>
                              {mov}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Transition */}
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                          Transition
                        </label>
                        <select
                          value={scene.transition || 'Cut'}
                          onChange={(e) =>
                            handleSceneChange(scene.sceneNumber, 'transition', e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                        >
                          {TRANSITIONS.map((trans) => (
                            <option key={trans} value={trans}>
                              {trans}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Music Suggestion */}
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                          Music Cue
                        </label>
                        <input
                          type="text"
                          value={scene.music || scene.sfxMusic || ''}
                          onChange={(e) => {
                            handleSceneChange(scene.sceneNumber, 'music', e.target.value);
                            handleSceneChange(scene.sceneNumber, 'sfxMusic', e.target.value);
                          }}
                          placeholder="e.g. Ambient synth drone..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      {/* Sound Effects (SFX) */}
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                          Sound Effects (SFX)
                        </label>
                        <input
                          type="text"
                          value={scene.soundEffects || scene.sfx || ''}
                          onChange={(e) => {
                            handleSceneChange(scene.sceneNumber, 'soundEffects', e.target.value);
                            handleSceneChange(scene.sceneNumber, 'sfx', e.target.value);
                          }}
                          placeholder="e.g. Whoosh transition, impact..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    {/* Image Generation Prompt */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Image Generation Prompt (Midjourney / Flux / DALL-E):
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleEnhanceScenePrompts(scene.sceneNumber)}
                            disabled={enhancingSceneNum === scene.sceneNumber}
                            className="px-2 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-[10px] font-mono flex items-center gap-1 transition-colors border border-cyan-500/30 disabled:opacity-50"
                            title="Auto-enhance prompts with Midjourney v6 & Runway parameters via Gemini"
                          >
                            <Sparkles className={`w-3 h-3 ${enhancingSceneNum === scene.sceneNumber ? 'animate-spin' : ''}`} />
                            <span>{enhancingSceneNum === scene.sceneNumber ? 'Enhancing...' : 'AI Enhance'}</span>
                          </button>
                          <button
                            onClick={() =>
                              handleCopy(
                                scene.imageGenerationPrompt || scene.visualDescription,
                                `img_prompt_${scene.sceneNumber}`
                              )
                            }
                            className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] font-mono flex items-center gap-1 transition-colors border border-slate-800"
                          >
                            {copiedKey === `img_prompt_${scene.sceneNumber}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-cyan-400" />
                                <span>Copy Prompt</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      <textarea
                        rows={2}
                        value={scene.imageGenerationPrompt || ''}
                        onChange={(e) =>
                          handleSceneChange(scene.sceneNumber, 'imageGenerationPrompt', e.target.value)
                        }
                        className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 focus:outline-none focus:border-cyan-500 leading-relaxed resize-y"
                        placeholder="Detailed cinematic prompt for image generation..."
                      />
                    </div>

                    {/* Video Generation Prompt */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold flex items-center gap-1">
                          <Film className="w-3 h-3" /> Video Generation Prompt (Runway / Sora / Luma / Pika):
                        </span>
                        <button
                          onClick={() =>
                            handleCopy(
                              scene.videoGenerationPrompt || scene.visualDescription,
                              `vid_prompt_${scene.sceneNumber}`
                            )
                          }
                          className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] font-mono flex items-center gap-1 transition-colors border border-slate-800"
                        >
                          {copiedKey === `vid_prompt_${scene.sceneNumber}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-indigo-400" />
                              <span>Copy Prompt</span>
                            </>
                          )}
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={scene.videoGenerationPrompt || ''}
                        onChange={(e) =>
                          handleSceneChange(scene.sceneNumber, 'videoGenerationPrompt', e.target.value)
                        }
                        className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 focus:outline-none focus:border-indigo-500 leading-relaxed resize-y"
                        placeholder="Detailed continuous motion prompt for video generation..."
                      />
                    </div>

                    {/* Media Requirements & Attached Pipeline Assets */}
                    <div className="pt-3 border-t border-slate-800/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-cyan-400" />
                          Media Requirements & Pipeline Assets
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setAttachModalSceneNumber(scene.sceneNumber)}
                            className="px-2.5 py-1 rounded bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-[11px] font-medium flex items-center gap-1 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Attach Asset</span>
                          </button>
                        </div>
                      </div>

                      {/* Requirements Breakdown Summary Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {/* Image Requirement */}
                        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs space-y-1">
                          <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                            <span className="flex items-center gap-1">
                              <ImageIcon className="w-3 h-3 text-sky-400" /> Image
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded font-semibold ${
                                attachedImages.length > 0 || scene.generatedImage
                                  ? 'text-emerald-400 bg-emerald-500/10'
                                  : 'text-amber-400 bg-amber-500/10'
                              }`}
                            >
                              {attachedImages.length > 0 || scene.generatedImage ? 'Linked' : 'Required'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-300 truncate font-medium">
                            {attachedImages.length > 0
                              ? attachedImages[0].filename
                              : scene.generatedImage
                              ? 'Legacy Image Linked'
                              : scene.imageGenerationPrompt
                              ? 'Prompt Defined'
                              : 'Pending Prompt'}
                          </div>
                          <button
                            onClick={() => handleQueueSceneJob(scene, 'image')}
                            disabled={isQueueingThisScene}
                            className="mt-1 w-full py-0.5 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/20 text-[10px] font-mono flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                            title="Queue AI Image Generation Job"
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>Queue Image</span>
                          </button>
                        </div>

                        {/* Video / B-Roll Requirement */}
                        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs space-y-1">
                          <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                            <span className="flex items-center gap-1">
                              <Film className="w-3 h-3 text-violet-400" /> Video / B-Roll
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded font-semibold ${
                                attachedVideos.length > 0 || scene.generatedVideo?.previewUrl
                                  ? 'text-emerald-400 bg-emerald-500/10'
                                  : 'text-amber-400 bg-amber-500/10'
                              }`}
                            >
                              {attachedVideos.length > 0 || scene.generatedVideo?.previewUrl
                                ? 'Linked'
                                : 'Required'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-300 truncate font-medium">
                            {attachedVideos.length > 0
                              ? attachedVideos[0].filename
                              : scene.generatedVideo?.previewUrl
                              ? 'Video Ready'
                              : scene.bRoll || 'B-Roll specified'}
                          </div>
                          <button
                            onClick={() => handleQueueSceneJob(scene, 'video')}
                            disabled={isQueueingThisScene}
                            className="mt-1 w-full py-0.5 rounded bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/20 text-[10px] font-mono flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                            title="Queue AI Video Generation Job"
                          >
                            <Film className="w-2.5 h-2.5" />
                            <span>Queue Video</span>
                          </button>
                        </div>

                        {/* Voiceover Requirement */}
                        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs space-y-1">
                          <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                            <span className="flex items-center gap-1">
                              <Mic className="w-3 h-3 text-amber-400" /> Voiceover
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded font-semibold ${
                                attachedVoice.length > 0 || scene.generatedVoice?.audioUrl
                                  ? 'text-emerald-400 bg-emerald-500/10'
                                  : 'text-slate-400 bg-slate-500/10'
                              }`}
                            >
                              {attachedVoice.length > 0 || scene.generatedVoice?.audioUrl
                                ? 'Linked'
                                : 'Required'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-300 truncate font-medium">
                            {attachedVoice.length > 0
                              ? attachedVoice[0].filename
                              : scene.generatedVoice?.audioUrl
                              ? 'Audio track synced'
                              : `${(scene.dialogue || scene.voiceover || '').split(/\s+/).filter(Boolean).length} words spoken`}
                          </div>
                          <button
                            onClick={() => handleQueueSceneJob(scene, 'voiceover')}
                            disabled={isQueueingThisScene}
                            className="mt-1 w-full py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-[10px] font-mono flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                            title="Queue AI Voiceover Synthesis Job"
                          >
                            <Mic className="w-2.5 h-2.5" />
                            <span>Queue Voice</span>
                          </button>
                        </div>

                        {/* Music & SFX Requirement */}
                        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs space-y-1">
                          <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                            <span className="flex items-center gap-1">
                              <Music className="w-3 h-3 text-rose-400" /> Music / SFX
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded font-semibold ${
                                attachedAudio.length > 0
                                  ? 'text-emerald-400 bg-emerald-500/10'
                                  : 'text-slate-400 bg-slate-500/10'
                              }`}
                            >
                              {attachedAudio.length > 0 ? `${attachedAudio.length} Linked` : 'Cue only'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-300 truncate font-medium">
                            {attachedAudio.length > 0
                              ? attachedAudio[0].filename
                              : scene.music || scene.soundEffects || 'Atmospheric background'}
                          </div>
                          <button
                            onClick={() => handleQueueSceneJob(scene, 'music')}
                            disabled={isQueueingThisScene}
                            className="mt-1 w-full py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-[10px] font-mono flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                            title="Queue AI Music / Audio Cue Job"
                          >
                            <Music className="w-2.5 h-2.5" />
                            <span>Queue Audio</span>
                          </button>
                        </div>
                      </div>

                      {/* Scene Generation Pipeline Jobs */}
                      {sceneJobs.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-400 font-semibold">
                            <span className="flex items-center gap-1 text-cyan-400">
                              <Activity className="w-3 h-3" />
                              Scene Generation Pipeline ({sceneJobs.length}):
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {sceneJobs.map((job) => (
                              <div
                                key={job.id}
                                className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="flex items-center gap-1.5 font-semibold text-slate-300 text-[11px]">
                                    <span className="capitalize">{job.type}</span>
                                    <span className="text-[10px] font-mono text-slate-500">• {job.provider}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate max-w-xs font-mono">
                                    {job.prompt}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                                      job.status === 'completed'
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        : job.status === 'failed'
                                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                        : job.status === 'cancelled'
                                        ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                        : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse'
                                    }`}
                                  >
                                    {job.status}
                                  </span>
                                  {job.status === 'failed' && (
                                    <button
                                      onClick={() => retryGenerationJob(job.id)}
                                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
                                      title="Retry Job"
                                    >
                                      <RotateCw className="w-3 h-3" />
                                    </button>
                                  )}
                                  {(job.status === 'queued' || job.status === 'processing') && (
                                    <button
                                      onClick={() => cancelGenerationJob(job.id)}
                                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                                      title="Cancel Job"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Attached Media Asset Items */}
                      {sceneMediaAssets.length > 0 ? (
                        <div className="space-y-2 pt-1">
                          <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                            Attached Media Assets ({sceneMediaAssets.length}):
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {sceneMediaAssets.map((asset) => (
                              <div
                                key={asset.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs hover:border-slate-700 transition-colors"
                              >
                                <div className="flex items-center gap-2 min-w-0 pr-2">
                                  {asset.thumbnailUrl || (asset.type === 'image' && asset.url) ? (
                                    <img
                                      src={asset.thumbnailUrl || asset.url}
                                      alt={asset.filename}
                                      className="w-8 h-8 rounded object-cover border border-slate-800 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 shrink-0 font-mono text-[10px]">
                                      {asset.type.substring(0, 3).toUpperCase()}
                                    </div>
                                  )}
                                  <div className="truncate">
                                    <span className="font-semibold text-slate-200 block truncate text-[11px]">
                                      {asset.filename}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400">
                                      <span className="capitalize">{asset.type}</span>
                                      <span>•</span>
                                      <span
                                        className={
                                          asset.status === 'ready'
                                            ? 'text-emerald-400'
                                            : asset.status === 'generating'
                                            ? 'text-cyan-400'
                                            : 'text-amber-400'
                                        }
                                      >
                                        {asset.status}
                                      </span>
                                      {asset.duration && <span>• {asset.duration}s</span>}
                                    </div>
                                  </div>
                                </div>

                                <button
                                  onClick={() =>
                                    detachAssetFromScene(asset.id, scene.sceneNumber, script.id)
                                  }
                                  className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition-colors shrink-0"
                                  title="Detach asset from this scene"
                                >
                                  <Unlink className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-lg bg-slate-950/40 border border-dashed border-slate-850 text-center text-slate-500 text-[11px]">
                          No pipeline assets attached yet. Click "Attach Asset" to link an image, video, or audio track.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 3. TARGETED REGENERATE SCENE MODAL */}
      {regenModalScene && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-slate-900 border border-cyan-500/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Regenerate Scene #{regenModalScene.sceneNumber}
                </h3>
              </div>
              <button
                onClick={() => setRegenModalScene(null)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-slate-300">
                <span className="text-slate-500 font-mono">Current Scene:</span>{' '}
                <strong>{regenModalScene.title || `Scene ${regenModalScene.sceneNumber}`}</strong>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Provide custom instructions for Gemini to refine this scene's camera movement, visual composition, pacing, or prompts. Other scenes will remain completely untouched.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase text-slate-300">
                Director Instruction (Optional):
              </label>
              <textarea
                rows={3}
                value={regenInstruction}
                onChange={(e) => setRegenInstruction(e.target.value)}
                placeholder="e.g. Make it a dramatic drone shot pulling out over the ocean with golden hour lighting and high-tempo music..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 leading-relaxed resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setRegenModalScene(null)}
                disabled={isRegeneratingScene}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRegen}
                disabled={isRegeneratingScene}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-opacity disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingScene ? 'animate-spin' : ''}`} />
                <span>{isRegeneratingScene ? 'Regenerating...' : 'Regenerate Scene'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MEDIA ASSET LIBRARY MODAL */}
      {isMediaLibraryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Media Asset Pipeline Library</h3>
                  <p className="text-xs text-slate-400">
                    Track, manage, and link visual, audio, and video assets across all scenes
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsMediaLibraryModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              <MediaAssetLibrary
                scriptId={script.id}
                projectId={script.projectId}
                onSelectAsset={() => {
                  setIsMediaLibraryModalOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. ATTACH ASSET TO SCENE MODAL */}
      {attachModalSceneNumber !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  Attach Asset to Scene #{attachModalSceneNumber}
                </h3>
              </div>
              <button
                onClick={() => setAttachModalSceneNumber(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              <p className="text-slate-400">
                Choose an asset from your project media assets to attach to Scene #{attachModalSceneNumber}:
              </p>

              {mediaAssets.filter((a) => a.sceneNumber !== attachModalSceneNumber).length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <p className="text-slate-400">No unattached media assets in this project.</p>
                  <button
                    onClick={() => {
                      setAttachModalSceneNumber(null);
                      setIsMediaLibraryModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold inline-flex items-center gap-1.5 text-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Register New Asset</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {mediaAssets
                    .filter((a) => a.sceneNumber !== attachModalSceneNumber)
                    .map((asset) => (
                      <div
                        key={asset.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          {asset.thumbnailUrl || (asset.type === 'image' && asset.url) ? (
                            <img
                              src={asset.thumbnailUrl || asset.url}
                              alt={asset.filename}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-800 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 shrink-0 font-mono text-[10px]">
                              {asset.type.substring(0, 3).toUpperCase()}
                            </div>
                          )}

                          <div className="truncate">
                            <span className="font-semibold text-slate-200 block truncate text-xs">
                              {asset.filename}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                              <span className="capitalize">{asset.type}</span>
                              <span>•</span>
                              <span className="capitalize">{asset.status}</span>
                              {typeof asset.sceneNumber === 'number' && (
                                <span className="text-amber-400">
                                  (Currently Scene {asset.sceneNumber})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={async () => {
                            if (attachModalSceneNumber !== null) {
                              await attachAssetToScene(
                                asset.id,
                                attachModalSceneNumber,
                                script.id
                              );
                              setAttachModalSceneNumber(null);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-semibold text-xs border border-cyan-500/30 shrink-0 transition-colors"
                        >
                          Attach
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <button
                onClick={() => {
                  setAttachModalSceneNumber(null);
                  setIsMediaLibraryModalOpen(true);
                }}
                className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Open Full Media Library</span>
              </button>

              <button
                onClick={() => setAttachModalSceneNumber(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MEDIA GENERATION PIPELINE JOBS MODAL */}
      {isJobsDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <GenerationJobsPanel
              scriptId={script.id}
              onClose={() => setIsJobsDrawerOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
