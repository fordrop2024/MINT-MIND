import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  SlidersHorizontal,
  Clock,
  Play,
  Square,
  Volume2,
  Image as ImageIcon,
  Video,
  Layers,
  Search,
  Check,
  Copy,
  ChevronDown,
  ChevronRight,
  Plus,
  RefreshCw,
  FolderGit2,
  Trash2,
  History,
  GitCompare,
  ArrowRight,
  Wand2,
  Hash,
  Download,
  Share2,
  Subtitles,
  Smartphone,
  Flame,
  CheckCircle2,
  AlertCircle,
  Type,
  Palette,
  Eye,
  UploadCloud,
  Music,
  Camera,
  Film,
  Sliders,
  CheckCircle,
  Mic,
} from 'lucide-react';
import { useScript } from '../../context/ScriptContext';
import { useIdea } from '../../context/IdeaContext';
import { useProject } from '../../context/ProjectContext';
import { useRouter } from '../../context/RouterContext';
import type {
  Script,
  ScriptSettings,
  ScriptSection,
  ScriptScene,
  AISectionAction,
  CaptionStyle,
  PlatformFormat,
  CameraShotType,
  CameraMovement,
  ShotPlan,
} from '../../types/script';
import { voiceEngine } from '../../services/voiceService';
import { CompareVersionsModal } from '../../components/script/CompareVersionsModal';
import { KineticCaptionStudio } from '../../components/script/KineticCaptionStudio';
import { SceneBreakdownStudio } from '../../components/script/SceneBreakdownStudio';
import { MediaPipelineStudio } from '../../components/script/MediaPipelineStudio';
import { MediaAssetLibrary } from '../../components/media/MediaAssetLibrary';
import { VoiceoverStudio } from '../../components/script/VoiceoverStudio';
import { SeoStudio } from '../../components/script/SeoStudio';
import { ThumbnailStudio } from '../../components/script/ThumbnailStudio';
import { ShortsRepurposeStudio } from '../../components/script/ShortsRepurposeStudio';
import { YouTubePublishStudio } from '../../components/youtube/YouTubePublishStudio';
import { FilmIntelligenceStudio } from '../../components/film/FilmIntelligenceStudio';
import type { StoryMode } from '../../types/storyMode';
import { StoryModeBadge } from '../../components/storyMode/StoryModeBadge';
import { StoryModeSelector } from '../../components/storyMode/StoryModeSelector';
import { getStoryModeProfile } from '../../services/storyModeEngine';
import { detectStoryModeAPI } from '../../services/aiService';
import {
  parseAudioFileMetadata,
  formatTimecode,
  calculateAudioTimingForScenes,
  generateProductionShotPlan,
} from '../../services/audioTimingSyncService';

const AI_SECTION_ACTIONS: { action: AISectionAction; label: string; icon: string }[] = [
  { action: 'rewrite', label: 'Rewrite Section', icon: '✨' },
  { action: 'shorten', label: 'Make Shorter', icon: '✂️' },
  { action: 'expand', label: 'Expand & Deepen', icon: '📖' },
  { action: 'improve_hook', label: 'Sharpen Hook', icon: '⚡' },
  { action: 'conversational', label: 'Conversational', icon: '🗣️' },
  { action: 'professional', label: 'Professional', icon: '💼' },
  { action: 'energetic', label: 'High Energy', icon: '🔥' },
  { action: 'simplify', label: 'Simplify (ELI5)', icon: '💡' },
  { action: 'add_examples', label: 'Add Real Example', icon: '🎯' },
  { action: 'remove_repetition', label: 'Remove Fluff', icon: '🧹' },
  { action: 'improve_flow', label: 'Improve Rhythm', icon: '🌊' },
  { action: 'alternative_angle', label: 'Alternative Angle', icon: '🔀' },
];

export function ScriptStudioPage() {
  const { navigate } = useRouter();
  const { activeProject } = useProject();
  const { ideas } = useIdea();
  const {
    scripts,
    activeScript,
    loading,
    isGenerating,
    generationStep,
    error,
    selectedSectionId,
    setSelectedSectionId,
    setActiveScript,
    createScript,
    updateScript,
    updateSection,
    updateScene,
    updateSceneShotPlan,
    syncScriptToAudio,
    updateVoiceoverSettings,
    syncScriptToVoiceSettings,
    generateSceneVoice,
    generateAllScenesVoice,
    exportScriptSubtitles,
    saveVersion,
    restoreVersion,
    rewriteSection,
    generateSEO,
    saveScriptSEO,
    generateThumbnails,
    saveScriptThumbnails,
    repurposeScript,
    saveScriptRepurposedShorts,
    saveFilmStoryBible,
    generateCompleteContentPackage,
    generateSceneImage,
    generateSceneVideo,
    generateSceneVoiceover,
    generateCaptions,
    createVideoFromScript,
    deleteScript,
    clearError,
    mediaAssets,
  } = useScript();

  // Active view tab
  const [activeTab, setActiveTab] = useState<
    'editor' | 'scenes' | 'media' | 'voice' | 'captions' | 'seo' | 'thumbnails' | 'repurpose' | 'publish' | 'film_bible'
  >('editor');
  const [mediaSubTab, setMediaSubTab] = useState<'pipeline' | 'library'>('pipeline');

  // Audio Sync & Shot Plan State
  const [isUploadingAudio, setIsUploadingAudio] = useState<boolean>(false);
  const [expandedShotPlanScene, setExpandedShotPlanScene] = useState<number | null>(null);
  const [cadencePresetWPM, setCadencePresetWPM] = useState<number>(145);

  // New Script Modal
  const [isNewScriptModalOpen, setIsNewScriptModalOpen] = useState<boolean>(false);
  const [creationMode, setCreationMode] = useState<'idea' | 'scratch' | 'paste'>('idea');
  const [selectedIdeaId, setSelectedIdeaId] = useState<string>('');

  // Settings form
  const [formTopic, setFormTopic] = useState('');
  const [formIdeaText, setFormIdeaText] = useState('');
  const [formAudience, setFormAudience] = useState('Founders, creators and developers');
  const [formPlatform, setFormPlatform] = useState<PlatformFormat>('YouTube Long-form');
  const [formDuration, setFormDuration] = useState('8-10 minutes');
  const [formLanguage, setFormLanguage] = useState('English');
  const [formTone, setFormTone] = useState('Energetic');
  const [formNarration, setFormNarration] = useState('Conversational storytelling expert');
  const [formCta, setFormCta] = useState('Subscribe and comment your thoughts');
  const [pastedScriptText, setPastedScriptText] = useState('');

  // Story Mode form state
  const [formPrimaryMode, setFormPrimaryMode] = useState<StoryMode>('Documentary');
  const [formSecondaryModes, setFormSecondaryModes] = useState<StoryMode[]>(['Explainer']);
  const [formModeConfidence, setFormModeConfidence] = useState<number | undefined>(undefined);
  const [formModeReasoning, setFormModeReasoning] = useState<string | undefined>(undefined);
  const [isDetectingScriptMode, setIsDetectingScriptMode] = useState<boolean>(false);

  // Version diff modal
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);
  const [versionNote, setVersionNote] = useState<string>('');
  const [isAddingVersionNote, setIsAddingVersionNote] = useState<boolean>(false);

  // Audio preview state
  const [playingSceneNum, setPlayingSceneNum] = useState<number | null>(null);

  // Copy helpers
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAutoDetectScriptMode = async () => {
    setIsDetectingScriptMode(true);
    try {
      const chosenIdea =
        creationMode === 'idea' && selectedIdeaId
          ? ideas.find((i) => i.id === selectedIdeaId)
          : undefined;

      const detection = await detectStoryModeAPI({
        topic: formTopic || chosenIdea?.title || '',
        idea:
          creationMode === 'paste'
            ? pastedScriptText
            : formIdeaText || chosenIdea?.concept || '',
        audience: formAudience || chosenIdea?.targetAudience || '',
        platform: formPlatform,
      });

      if (detection) {
        setFormPrimaryMode(detection.primaryMode);
        setFormSecondaryModes(detection.secondaryModes || []);
        setFormModeConfidence(detection.confidence);
        setFormModeReasoning(detection.reasoning);
      }
    } catch (err) {
      console.warn('Script auto-detect story mode failed:', err);
    } finally {
      setIsDetectingScriptMode(false);
    }
  };

  // Handle Create Script Submit
  const handleCreateScript = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let chosenIdea = undefined;
      if (creationMode === 'idea' && selectedIdeaId) {
        chosenIdea = ideas.find((i) => i.id === selectedIdeaId);
      }

      await createScript(
        {
          topic: formTopic || chosenIdea?.title || 'Untitled Script',
          ideaText: creationMode === 'paste' ? pastedScriptText : formIdeaText || chosenIdea?.concept,
          audience: formAudience || chosenIdea?.targetAudience || 'General Creators',
          platform: formPlatform,
          duration: formDuration,
          language: formLanguage,
          tone: formTone,
          narrationStyle: formNarration,
          ctaStyle: formCta,
          primaryMode: formPrimaryMode,
          secondaryModes: formSecondaryModes,
          modeDetectionConfidence: formModeConfidence,
          modeReasoning: formModeReasoning,
        },
        chosenIdea
      );

      setIsNewScriptModalOpen(false);
      showNotification('Script generated successfully with scenes and sections!');
    } catch (err) {
      // Handled
    }
  };

  // Handle Section AI Action
  const handleAISectionAction = async (action: AISectionAction) => {
    if (!activeScript || !selectedSectionId) return;
    try {
      await rewriteSection(activeScript.id, selectedSectionId, action);
      showNotification(`Applied "${action.replace('_', ' ')}" to section!`);
    } catch {
      // Handled
    }
  };

  // Handle Save Snapshot
  const handleSaveSnapshot = async () => {
    if (!activeScript) return;
    await saveVersion(activeScript.id, versionNote || undefined);
    setVersionNote('');
    setIsAddingVersionNote(false);
    showNotification(`Created version checkpoint v${(activeScript.versions?.length || 1) + 1}!`);
  };

  // Handle Scene Audio Playback
  const handlePlaySceneAudio = (scene: ScriptScene) => {
    if (playingSceneNum === scene.sceneNumber) {
      voiceEngine.stop();
      setPlayingSceneNum(null);
      return;
    }

    voiceEngine.speak(scene.voiceover, {
      rate: 1.05,
      onStart: () => setPlayingSceneNum(scene.sceneNumber),
      onEnd: () => setPlayingSceneNum(null),
      onError: () => setPlayingSceneNum(null),
    });
  };

  // Handle uploaded audio file synchronization
  const handleAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeScript) return;
    setIsUploadingAudio(true);
    try {
      const meta = await parseAudioFileMetadata(file);
      await syncScriptToAudio(activeScript.id, meta.durationSec, {
        fileName: meta.fileName,
        audioUrl: meta.audioUrl,
        fileSize: meta.fileSize,
      });
      showNotification(
        `Audio synchronized! ${activeScript.scenes.length} scenes mapped to ${formatTimecode(meta.durationSec)} (${meta.fileName}).`
      );
    } catch (err: any) {
      alert(err.message || 'Failed to process audio file');
    } finally {
      setIsUploadingAudio(false);
      e.target.value = '';
    }
  };

  // Handle cadence preset change
  const handleApplyCadencePreset = async (wpm: number) => {
    if (!activeScript) return;
    setCadencePresetWPM(wpm);
    const syncResult = calculateAudioTimingForScenes(activeScript.scenes, undefined, wpm);
    await updateScene(activeScript.id, 1, {}); // trigger refresh or update scenes directly
    // Update all scenes in active script with new audio timings
    const updatedScenes = syncResult.scenes;
    await updateScript(activeScript.id, {
      scenes: updatedScenes,
      isAudioSynced: false,
    });
    showNotification(`Recalibrated scene cadence to ${wpm} WPM (~${syncResult.timecodeFormatted} total runtime)`);
  };

  // Master Action 1: Create Video from Script
  const handleCreateVideo = async () => {
    if (!activeScript) return;
    try {
      const res = await createVideoFromScript(activeScript.id);
      showNotification(res.message);
      setActiveTab('scenes');
    } catch {
      // Handled
    }
  };

  // Master Action 2: Generate Content Package
  const handleGeneratePackage = async () => {
    if (!activeScript) return;
    try {
      await generateCompleteContentPackage(activeScript.id);
      showNotification('Complete Content Package synthesized: SEO, Thumbnails, Captions & Repurposing ready!');
    } catch {
      // Handled
    }
  };

  // Active section helper
  const selectedSection = activeScript?.sections?.find((s) => s.id === selectedSectionId) || activeScript?.sections?.[0];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1 font-bold">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              MODULE 2 • SCRIPT STUDIO
            </span>
            {activeProject && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                <FolderGit2 className="w-3 h-3 text-slate-400" />
                Project: {activeProject.name}
              </span>
            )}
            {activeScript && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                v{activeScript.currentVersionNumber || 1} ({activeScript.versions?.length || 1} Revisions)
              </span>
            )}
            {activeScript?.primaryMode && (
              <StoryModeBadge
                mode={activeScript.primaryMode}
                confidence={activeScript.modeDetectionConfidence}
                size="sm"
              />
            )}
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-display font-extrabold text-white">
              {activeScript?.title || 'Script Studio'}
            </h1>
            {activeScript && (
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                {activeScript.type}
              </span>
            )}
          </div>
        </div>

        {/* Master Actions Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* New Script Button */}
          <button
            onClick={() => setIsNewScriptModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>New Script</span>
          </button>

          {/* Scripts Selector Dropdown */}
          {scripts.length > 0 && (
            <select
              value={activeScript?.id || ''}
              onChange={(e) => {
                const found = scripts.find((s) => s.id === e.target.value);
                if (found) {
                  setActiveScript(found);
                  if (found.sections?.length > 0) {
                    setSelectedSectionId(found.sections[0].id);
                  }
                }
              }}
              className="text-xs font-mono px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {scripts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          )}

          {activeScript && (
            <>
              {/* All-In-One Content Package */}
              <button
                onClick={handleGeneratePackage}
                disabled={isGenerating}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Full Content Package</span>
              </button>

              {/* Create Video From Script */}
              <button
                onClick={handleCreateVideo}
                disabled={isGenerating}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-slate-950 flex items-center gap-1.5 shadow-md shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-50"
              >
                <Video className="w-3.5 h-3.5 text-slate-950" />
                <span>Create Video</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start justify-between gap-3 text-rose-300 text-xs">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div>
              <p className="font-semibold">{error}</p>
              <p className="text-rose-300/80 text-[11px] mt-0.5">Please check parameters and retry.</p>
            </div>
          </div>
          <button onClick={clearError} className="p-1 text-rose-400 hover:text-rose-200 rounded">
            Dismiss
          </button>
        </div>
      )}

      {/* Generating Progress State */}
      {isGenerating && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-cyan-500/40 shadow-xl shadow-cyan-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
            <div>
              <p className="text-xs font-mono font-semibold text-cyan-300">
                {generationStep || 'CREOVA AI synthesizing content...'}
              </p>
              <p className="text-[11px] text-slate-400">
                Direct Gemini 3.8 Flash model generation in progress.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State when no active script */}
      {!activeScript && !isGenerating && (
        <div className="p-16 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-white">No Script Active in Studio</h3>
            <p className="text-xs text-slate-400 mt-1">
              Create a new script from an Idea Blueprint, scratch topic, or paste an existing script to start scene breakdown and AI editing.
            </p>
          </div>
          <button
            onClick={() => setIsNewScriptModalOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 inline-flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Your First Script
          </button>
        </div>
      )}

      {/* Studio Workspace Content */}
      {activeScript && (
        <div className="space-y-6">
          {/* Navigation Workflow Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-xl overflow-x-auto">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shrink-0 transition-all ${
                activeTab === 'editor'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Script Sections ({activeScript.sections?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('scenes')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shrink-0 transition-all ${
                activeTab === 'scenes'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              Scene Breakdown ({activeScript.scenes?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('media')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shrink-0 transition-all ${
                activeTab === 'media'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Media Assets ({mediaAssets.length})
            </button>

            <button
              onClick={() => setActiveTab('voice')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shrink-0 transition-all ${
                activeTab === 'voice'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              Voiceover & Audio Sync
            </button>

            <button
              onClick={() => {
                setActiveTab('captions');
                if (!activeScript.captions || activeScript.captions.length === 0) {
                  generateCaptions(activeScript.id);
                }
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shrink-0 transition-all ${
                activeTab === 'captions'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Subtitles className="w-3.5 h-3.5" />
              Captions & Typography
            </button>

            <button
              onClick={() => {
                setActiveTab('seo');
                if (!activeScript.seo) {
                  generateSEO(activeScript.id);
                }
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shrink-0 transition-all ${
                activeTab === 'seo'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              SEO & Metadata
            </button>

            <button
              onClick={() => {
                setActiveTab('thumbnails');
                if (!activeScript.thumbnailConcepts || activeScript.thumbnailConcepts.length === 0) {
                  generateThumbnails(activeScript.id);
                }
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shrink-0 transition-all ${
                activeTab === 'thumbnails'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Thumbnail Concepts
            </button>

            <button
              onClick={() => {
                setActiveTab('repurpose');
                if (!activeScript.repurposeVersions) {
                  repurposeScript(activeScript.id);
                }
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shrink-0 transition-all ${
                activeTab === 'repurpose'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Repurpose to Reels/Shorts
            </button>

            <button
              onClick={() => setActiveTab('publish')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shrink-0 transition-all ${
                activeTab === 'publish'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Publish to YouTube
            </button>

            <button
              onClick={() => setActiveTab('film_bible')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shrink-0 transition-all ${
                activeTab === 'film_bible'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              Story Bible & Film Intel
            </button>
          </div>

          {/* TAB 1: SCRIPT SECTIONS EDITOR */}
          {activeTab === 'editor' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: Sections List & Version Controls (4 cols) */}
              <div className="lg:col-span-4 space-y-4">
                {/* Version Controls Card */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-slate-400 font-bold flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-cyan-400" />
                      Version History
                    </span>
                    <button
                      onClick={() => setIsCompareModalOpen(true)}
                      className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <GitCompare className="w-3 h-3" />
                      Compare
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsAddingVersionNote(!isAddingVersionNote)}
                      className="w-full py-1.5 px-3 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors text-center"
                    >
                      + Save Version Checkpoint
                    </button>
                  </div>

                  {isAddingVersionNote && (
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                      <input
                        type="text"
                        placeholder="Checkpoint note (e.g. Added better examples)"
                        value={versionNote}
                        onChange={(e) => setVersionNote(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setIsAddingVersionNote(false)}
                          className="text-[11px] text-slate-400 hover:text-white px-2 py-1"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveSnapshot}
                          className="text-[11px] font-semibold bg-cyan-500 text-slate-950 px-2.5 py-1 rounded"
                        >
                          Save Snapshot
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Versions Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {activeScript.versions?.map((v) => (
                      <button
                        key={v.versionNumber}
                        onClick={() => restoreVersion(activeScript.id, v.versionNumber)}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                          activeScript.currentVersionNumber === v.versionNumber
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                        title={v.summaryNote || `Version ${v.versionNumber}`}
                      >
                        v{v.versionNumber}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sections Directory */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-mono uppercase text-slate-400 font-bold">
                      Script Blocks ({activeScript.sections?.length || 0})
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Total ~
                      {activeScript.sections?.reduce(
                        (acc, s) => acc + (s.content?.split(/\s+/).length || 0),
                        0
                      )}{' '}
                      words
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                    {activeScript.sections?.map((sec, idx) => {
                      const isSelected = (selectedSectionId || activeScript.sections[0]?.id) === sec.id;
                      const wordCount = sec.content?.split(/\s+/).filter(Boolean).length || 0;
                      return (
                        <button
                          key={sec.id}
                          onClick={() => setSelectedSectionId(sec.id)}
                          className={`w-full p-2.5 rounded-lg text-left transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-cyan-500/10 border border-cyan-500/40 text-cyan-300'
                              : 'bg-slate-950/60 border border-slate-800/80 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <span className="text-[10px] font-mono font-bold uppercase block opacity-75">
                              {idx + 1}. {sec.name}
                            </span>
                            <span className="text-xs truncate block text-slate-300">
                              {sec.content?.slice(0, 45)}...
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 shrink-0">
                            {wordCount}w
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active Story Mode Profile Directives Panel */}
                {activeScript?.primaryMode && (() => {
                  const profile = getStoryModeProfile(activeScript.primaryMode);
                  return (
                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase text-slate-400 font-bold flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                          Story Directives
                        </span>
                        <StoryModeBadge mode={activeScript.primaryMode} size="sm" />
                      </div>
                      <p className="text-[11px] text-slate-300 italic">
                        "{profile.description}"
                      </p>
                      <div className="text-[11px] space-y-1.5 pt-2 border-t border-slate-800/80">
                        <div>
                          <span className="text-slate-400 font-medium">Hook Strategy: </span>
                          <span className="text-slate-300">{profile.hookStyle}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium">Pacing: </span>
                          <span className="text-cyan-300 capitalize">{profile.pacing}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium">Visual Mood: </span>
                          <span className="text-slate-300">{profile.visualStyle}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium">Audio Signature: </span>
                          <span className="text-slate-300">{profile.soundDirection}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Right: Active Section Live Editor & Targeted AI Actions (8 cols) */}
              <div className="lg:col-span-8 space-y-4">
                {selectedSection ? (
                  <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
                    {/* Section Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase text-cyan-400">
                          Active Section
                        </span>
                        <h3 className="text-base font-bold text-white">{selectedSection.name}</h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-400">
                          {selectedSection.content?.split(/\s+/).filter(Boolean).length || 0} words
                        </span>
                        <button
                          onClick={() => handleCopy(selectedSection.content, selectedSection.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                          title="Copy section"
                        >
                          {copiedKey === selectedSection.id ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* TARGETED AI ACTIONS TOOLBAR (Applies ONLY to this section) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                          <Wand2 className="w-3 h-3 text-cyan-400" />
                          Targeted AI Section Actions (Modifies ONLY This Section)
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {AI_SECTION_ACTIONS.map((item) => (
                          <button
                            key={item.action}
                            onClick={() => handleAISectionAction(item.action)}
                            disabled={isGenerating}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-950 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 transition-all flex items-center gap-1 disabled:opacity-50"
                          >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Section Textarea */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-400">
                        Section Content (Editable in Real-Time):
                      </label>
                      <textarea
                        rows={10}
                        value={selectedSection.content}
                        onChange={(e) =>
                          updateSection(activeScript.id, selectedSection.id, e.target.value)
                        }
                        className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors leading-relaxed font-sans resize-y"
                        placeholder="Write or refine this section's spoken script..."
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-12">Select a section to edit.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SCENE BREAKDOWN & PRODUCTION SHOT PLAN */}
          {activeTab === 'scenes' && (
            <SceneBreakdownStudio
              script={activeScript}
              onNotification={showNotification}
            />
          )}

          {/* TAB 2.5: MEDIA ASSET PIPELINE & LIBRARY */}
          {activeTab === 'media' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    Media Pipeline & Asset System
                  </h3>
                  <p className="text-xs text-slate-400">
                    Auto-generate AI visual prompts (Midjourney, Flux, Runway, Sora) and manage linked scene assets.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
                  <button
                    onClick={() => setMediaSubTab('pipeline')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      mediaSubTab === 'pipeline'
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Prompt & Generation Studio
                  </button>
                  <button
                    onClick={() => setMediaSubTab('library')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      mediaSubTab === 'library'
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Asset Library ({mediaAssets.length})
                  </button>
                </div>
              </div>

              {mediaSubTab === 'pipeline' ? (
                <MediaPipelineStudio
                  script={activeScript}
                  onNotification={showNotification}
                  onOpenSceneBreakdown={() => setActiveTab('scenes')}
                />
              ) : (
                <MediaAssetLibrary
                  scriptId={activeScript.id}
                  projectId={activeScript.projectId}
                />
              )}
            </div>
          )}

          {/* TAB 2.8: VOICEOVER & AUDIO TIMING SYNCHRONIZATION */}
          {activeTab === 'voice' && (
            <VoiceoverStudio
              script={activeScript}
              onUpdateVoiceSettings={(settings) => updateVoiceoverSettings(activeScript.id, settings)}
              onSyncTimeline={(settings) => syncScriptToVoiceSettings(activeScript.id, settings)}
              onGenerateSceneVoice={(sceneNum, settings) => generateSceneVoice(activeScript.id, sceneNum, settings)}
              onGenerateAllVoices={(settings) => generateAllScenesVoice(activeScript.id, settings)}
              onExportSubtitles={(format) => exportScriptSubtitles(activeScript.id, format)}
              onSyncToAudioFile={async (durationSec, meta) => {
                await syncScriptToAudio(activeScript.id, durationSec, meta);
              }}
            />
          )}

          {/* TAB 3: CAPTIONS & KINETIC TYPOGRAPHY */}
          {activeTab === 'captions' && (
            <KineticCaptionStudio
              script={activeScript}
              onNotification={showNotification}
            />
          )}

          {/* TAB 4: SCRIPT SEO & PACKAGING */}
          {activeTab === 'seo' && (
            <SeoStudio
              script={activeScript}
              onSaveSeo={async (seo) => {
                await saveScriptSEO(activeScript.id, seo);
              }}
              onRegenerateSeo={async () => {
                await generateSEO(activeScript.id);
              }}
              isGenerating={isGenerating}
              onNotification={showNotification}
            />
          )}

          {/* TAB 5: THUMBNAIL CONCEPTS & STUDIO */}
          {activeTab === 'thumbnails' && (
            <ThumbnailStudio
              script={activeScript}
              onSaveThumbnails={async (thumbnails) => {
                await saveScriptThumbnails(activeScript.id, thumbnails);
              }}
              onRegenerateThumbnails={async () => {
                await generateThumbnails(activeScript.id);
              }}
              isGenerating={isGenerating}
              onNotification={showNotification}
            />
          )}

          {/* TAB 6: REPURPOSE TO SHORTS & REELS */}
          {activeTab === 'repurpose' && (
            <ShortsRepurposeStudio
              script={activeScript}
              onSaveShorts={async (shorts) => {
                await saveScriptRepurposedShorts(activeScript.id, shorts);
              }}
              onNotification={showNotification}
            />
          )}

          {/* TAB 7: PUBLISH TO YOUTUBE */}
          {activeTab === 'publish' && (
            <YouTubePublishStudio
              script={activeScript}
              seo={activeScript.seo}
              thumbnailConcepts={activeScript.thumbnailConcepts}
              onNotification={showNotification}
            />
          )}

          {/* TAB 8: FILM INTELLIGENCE & STORY BIBLE */}
          {activeTab === 'film_bible' && (
            <FilmIntelligenceStudio
              script={activeScript}
              onSaveBible={async (bible) => {
                await saveFilmStoryBible(activeScript.id, bible);
              }}
              onNotification={showNotification}
            />
          )}
        </div>
      )}

      {/* CREATE NEW SCRIPT MODAL */}
      {isNewScriptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Initialize Script Production
              </h3>
              <button
                onClick={() => setIsNewScriptModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Creation Mode Tabs */}
            <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-950/60 p-2 gap-2 text-center">
              <button
                type="button"
                onClick={() => setCreationMode('idea')}
                className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                  creationMode === 'idea'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                From Idea Blueprint
              </button>
              <button
                type="button"
                onClick={() => setCreationMode('scratch')}
                className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                  creationMode === 'scratch'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                From Scratch
              </button>
              <button
                type="button"
                onClick={() => setCreationMode('paste')}
                className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                  creationMode === 'paste'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Paste Script
              </button>
            </div>

            <form onSubmit={handleCreateScript} className="p-6 overflow-y-auto space-y-4">
              {/* If From Idea: Pick Idea */}
              {creationMode === 'idea' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Select Generated Idea:
                  </label>
                  {ideas.length > 0 ? (
                    <select
                      value={selectedIdeaId}
                      onChange={(e) => {
                        setSelectedIdeaId(e.target.value);
                        const sel = ideas.find((i) => i.id === e.target.value);
                        if (sel) {
                          setFormTopic(sel.title);
                          setFormIdeaText(sel.concept);
                          setFormAudience(sel.targetAudience);
                          setFormPlatform(sel.recommendedPlatform as any);
                          if (sel.primaryMode) setFormPrimaryMode(sel.primaryMode);
                          if (sel.secondaryModes) setFormSecondaryModes(sel.secondaryModes);
                          if (sel.modeDetectionConfidence) setFormModeConfidence(sel.modeDetectionConfidence);
                          if (sel.modeReasoning) setFormModeReasoning(sel.modeReasoning);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
                    >
                      <option value="">-- Choose an idea --</option>
                      {ideas.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.title} ({i.recommendedPlatform})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-slate-400 p-3 rounded-lg bg-slate-950 border border-slate-800">
                      No ideas found in library. Switch to "From Scratch" or generate ideas first.
                    </p>
                  )}
                </div>
              )}

              {/* If Paste Mode */}
              {creationMode === 'paste' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Paste Your Existing Script:
                  </label>
                  <textarea
                    rows={6}
                    value={pastedScriptText}
                    onChange={(e) => setPastedScriptText(e.target.value)}
                    placeholder="Paste full raw script here. CREOVA AI will break it down into scenes, hooks, and kinetic timing..."
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
                    required
                  />
                </div>
              )}

              {/* Topic */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Video Topic / Title:
                </label>
                <input
                  type="text"
                  value={formTopic}
                  onChange={(e) => setFormTopic(e.target.value)}
                  placeholder="e.g. 5 AI Agents That Will Replace Junior Developers in 2026"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              {/* Platform & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Platform Format:
                  </label>
                  <select
                    value={formPlatform}
                    onChange={(e) => setFormPlatform(e.target.value as PlatformFormat)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  >
                    <option value="YouTube Long-form">YouTube Long-form</option>
                    <option value="YouTube Shorts">YouTube Shorts</option>
                    <option value="Instagram Reels">Instagram Reels</option>
                    <option value="Instagram Stories">Instagram Stories</option>
                    <option value="General Social Video">General Social Video</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Target Duration:
                  </label>
                  <input
                    type="text"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    placeholder="e.g. 8-10 minutes"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  />
                </div>
              </div>

              {/* Audience & Tone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Target Audience:
                  </label>
                  <input
                    type="text"
                    value={formAudience}
                    onChange={(e) => setFormAudience(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tone / Energy:
                  </label>
                  <input
                    type="text"
                    value={formTone}
                    onChange={(e) => setFormTone(e.target.value)}
                    placeholder="Energetic, Informative, Cinematic"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  />
                </div>
              </div>

              {/* Story Mode Selection for New Script */}
              <div className="pt-2">
                <StoryModeSelector
                  primaryMode={formPrimaryMode}
                  secondaryModes={formSecondaryModes}
                  confidence={formModeConfidence}
                  reasoning={formModeReasoning}
                  onPrimaryChange={(m) => setFormPrimaryMode(m)}
                  onSecondaryChange={(ms) => setFormSecondaryModes(ms)}
                  onAutoDetect={handleAutoDetectScriptMode}
                  isDetecting={isDetectingScriptMode}
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewScriptModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/25 transition-all cursor-pointer"
                >
                  Synthesize Script
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPARE VERSIONS MODAL */}
      {activeScript && (
        <CompareVersionsModal
          isOpen={isCompareModalOpen}
          onClose={() => setIsCompareModalOpen(false)}
          script={activeScript}
          onRestore={(vNum) => restoreVersion(activeScript.id, vNum)}
        />
      )}
    </div>
  );
}
