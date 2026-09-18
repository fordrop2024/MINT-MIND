import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Mic,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Sparkles,
  Download,
  Copy,
  Check,
  Clock,
  Globe,
  Sliders,
  AudioWaveform,
  Upload,
  RefreshCw,
  FileText,
  ChevronRight,
  Info,
  Radio,
  Share2,
} from 'lucide-react';
import type { Script, ScriptScene } from '../../types/script';
import type {
  VoiceoverSettings,
  VoiceModelProfile,
  VoiceLanguage,
  VoiceEmotion,
  VoiceoverTimelineData,
} from '../../types/voice';
import {
  VOICE_MODELS_CATALOG,
  DEFAULT_VOICEOVER_SETTINGS,
  calculateExactSpeechCadence,
  generateSceneTTSMetadata,
  syncScenesToVoiceTimeline,
  voiceoverPlayer,
  downloadSubtitleFile,
  cleanSpokenText,
  formatClockMinutesSeconds,
} from '../../services/voicePipelineService';
import { parseAudioFileMetadata } from '../../services/audioTimingSyncService';
import { voiceEngine } from '../../services/voiceService';

interface VoiceoverStudioProps {
  script: Script;
  onUpdateVoiceSettings: (settings: Partial<VoiceoverSettings>) => Promise<void>;
  onSyncTimeline: (settings?: VoiceoverSettings) => Promise<{ updatedScenes: ScriptScene[]; timelineData: VoiceoverTimelineData }>;
  onGenerateSceneVoice: (sceneNumber: number, settings?: Partial<VoiceoverSettings>) => Promise<void>;
  onGenerateAllVoices: (settings?: Partial<VoiceoverSettings>) => Promise<void>;
  onExportSubtitles: (format: 'srt' | 'vtt') => string;
  onSyncToAudioFile?: (durationSec: number, meta: { fileName: string; audioUrl: string; fileSize: number }) => Promise<void>;
}

export const VoiceoverStudio: React.FC<VoiceoverStudioProps> = ({
  script,
  onUpdateVoiceSettings,
  onSyncTimeline,
  onGenerateSceneVoice,
  onGenerateAllVoices,
  onExportSubtitles,
  onSyncToAudioFile,
}) => {
  // Current voice settings
  const [settings, setSettings] = useState<VoiceoverSettings>(
    script.voiceoverSettings || DEFAULT_VOICEOVER_SETTINGS
  );

  // Selected Scene for detail inspector
  const [selectedSceneNumber, setSelectedSceneNumber] = useState<number>(
    script.scenes?.[0]?.sceneNumber || 1
  );

  // Filtered voice catalog by language
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState<string>('All');

  // Playback States
  const [isPlayingSingle, setIsPlayingSingle] = useState<boolean>(false);
  const [isPlayingSequence, setIsPlayingSequence] = useState<boolean>(false);
  const [activePlaybackSceneNum, setActivePlaybackSceneNum] = useState<number | null>(null);
  const [previewingVoiceModelId, setPreviewingVoiceModelId] = useState<string | null>(null);

  // Operation States
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isBatchGenerating, setIsBatchGenerating] = useState<boolean>(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'models' | 'settings' | 'subtitles'>('timeline');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up playback on unmount
  useEffect(() => {
    return () => {
      voiceoverPlayer.stop();
      voiceEngine.stop();
    };
  }, []);

  // Show Toast
  const notify = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Synchronize local settings when script changes
  useEffect(() => {
    if (script.voiceoverSettings) {
      setSettings(script.voiceoverSettings);
    }
  }, [script.voiceoverSettings]);

  // Current selected scene
  const activeScene = useMemo(() => {
    return script.scenes?.find((s) => s.sceneNumber === selectedSceneNumber) || script.scenes?.[0];
  }, [script.scenes, selectedSceneNumber]);

  // Timeline computation
  const timelineData: VoiceoverTimelineData = useMemo(() => {
    const res = syncScenesToVoiceTimeline(script.scenes || [], settings, script.audioTrack?.durationSec);
    return res.timelineData;
  }, [script.scenes, settings, script.audioTrack?.durationSec]);

  // Active scene TTS metadata
  const activeSceneMetadata = useMemo(() => {
    if (!activeScene) return null;
    return generateSceneTTSMetadata(activeScene, settings);
  }, [activeScene, settings]);

  // Filtered voice catalog
  const filteredVoiceModels = useMemo(() => {
    if (selectedLanguageFilter === 'All') return VOICE_MODELS_CATALOG;
    return VOICE_MODELS_CATALOG.filter((m) => m.language === selectedLanguageFilter);
  }, [selectedLanguageFilter]);

  // Distinct languages in catalog
  const availableLanguages = useMemo(() => {
    const langs = new Set(VOICE_MODELS_CATALOG.map((m) => m.language));
    return ['All', ...Array.from(langs)];
  }, []);

  // Update a single setting
  const handleSettingChange = async (key: keyof VoiceoverSettings, value: any) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    try {
      await onUpdateVoiceSettings(updated);
    } catch (err: any) {
      notify(err.message || 'Failed to update voice settings');
    }
  };

  // Select Voice Model
  const handleSelectVoiceModel = async (model: VoiceModelProfile) => {
    const updated: VoiceoverSettings = {
      ...settings,
      voiceModelId: model.id,
      voiceName: model.displayName,
      language: model.language,
      gender: model.gender,
      emotion: model.recommendedTone,
    };
    setSettings(updated);
    try {
      await onUpdateVoiceSettings(updated);
      notify(`Selected voice: ${model.displayName}`);
    } catch (err: any) {
      notify(err.message || 'Failed to update voice model');
    }
  };

  // Preview Voice Model Sample
  const handlePreviewVoiceModel = (model: VoiceModelProfile) => {
    if (previewingVoiceModelId === model.id) {
      voiceEngine.stop();
      setPreviewingVoiceModelId(null);
      return;
    }

    voiceEngine.stop();
    setPreviewingVoiceModelId(model.id);

    voiceEngine.speak(model.sampleText, {
      lang: model.localeCode,
      rate: 1.0,
      pitch: 1.0,
      onEnd: () => setPreviewingVoiceModelId(null),
      onError: () => setPreviewingVoiceModelId(null),
    });
  };

  // Play Single Scene
  const handlePlaySingleScene = (scene?: ScriptScene) => {
    const target = scene || activeScene;
    if (!target) return;

    if (isPlayingSingle && activePlaybackSceneNum === target.sceneNumber) {
      voiceoverPlayer.stop();
      setIsPlayingSingle(false);
      setActivePlaybackSceneNum(null);
      return;
    }

    voiceoverPlayer.stop();
    setIsPlayingSequence(false);
    setIsPlayingSingle(true);
    setActivePlaybackSceneNum(target.sceneNumber);

    voiceoverPlayer.playSingleScene(target, settings, {
      onStart: () => {
        setIsPlayingSingle(true);
        setActivePlaybackSceneNum(target.sceneNumber);
      },
      onEnd: () => {
        setIsPlayingSingle(false);
        setActivePlaybackSceneNum(null);
      },
      onError: (err) => {
        setIsPlayingSingle(false);
        setActivePlaybackSceneNum(null);
        notify(err.message || 'Speech preview error');
      },
    });
  };

  // Play Entire Sequence
  const handleTogglePlaySequence = () => {
    if (isPlayingSequence) {
      voiceoverPlayer.stop();
      setIsPlayingSequence(false);
      setActivePlaybackSceneNum(null);
      return;
    }

    voiceoverPlayer.stop();
    setIsPlayingSingle(false);
    setIsPlayingSequence(true);

    voiceoverPlayer.playSequence(script.scenes || [], settings, {
      onSceneStart: (sceneNum) => {
        setActivePlaybackSceneNum(sceneNum);
        setSelectedSceneNumber(sceneNum);
      },
      onSceneEnd: () => {
        // Handled in sequence
      },
      onComplete: () => {
        setIsPlayingSequence(false);
        setActivePlaybackSceneNum(null);
        notify('Voiceover sequence playback completed.');
      },
      onError: (err) => {
        setIsPlayingSequence(false);
        setActivePlaybackSceneNum(null);
        notify(err.message || 'Playback error');
      },
    });
  };

  // Stop All Audio
  const handleStopAll = () => {
    voiceoverPlayer.stop();
    voiceEngine.stop();
    setIsPlayingSingle(false);
    setIsPlayingSequence(false);
    setActivePlaybackSceneNum(null);
    setPreviewingVoiceModelId(null);
  };

  // Sync Timeline to Current Voice Settings
  const handleSyncTimeline = async () => {
    setIsSyncing(true);
    try {
      await onSyncTimeline(settings);
      notify('Audio timing & scene durations synchronized to voice cadence!');
    } catch (err: any) {
      notify(err.message || 'Failed to sync audio timing');
    } finally {
      setIsSyncing(false);
    }
  };

  // Batch Generate Voice for All Scenes
  const handleGenerateAll = async () => {
    setIsBatchGenerating(true);
    try {
      await onGenerateAllVoices(settings);
      notify('Synthesized voice cadence & synchronized audio across all scenes!');
    } catch (err: any) {
      notify(err.message || 'Failed to batch synthesize voice');
    } finally {
      setIsBatchGenerating(false);
    }
  };

  // Generate Voice for Single Scene
  const handleGenerateSingle = async (sceneNumber: number) => {
    try {
      await onGenerateSceneVoice(sceneNumber, settings);
      notify(`Scene #${sceneNumber} audio synchronized!`);
    } catch (err: any) {
      notify(err.message || 'Failed to sync scene audio');
    }
  };

  // Copy Subtitles
  const handleCopySubtitles = (format: 'srt' | 'vtt') => {
    const text = onExportSubtitles(format);
    navigator.clipboard.writeText(text);
    setCopiedKey(format);
    notify(`Copied ${format.toUpperCase()} subtitles to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Download Subtitles
  const handleDownloadSubtitles = (format: 'srt' | 'vtt') => {
    const text = onExportSubtitles(format);
    const safeTitle = (script.title || 'script').toLowerCase().replace(/[^a-z0-9]/g, '_');
    downloadSubtitleFile(text, `${safeTitle}_subtitles.${format}`, format);
    notify(`Downloaded ${format.toUpperCase()} subtitle file`);
  };

  // Upload External Voiceover Audio Track
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onSyncToAudioFile) return;

    setIsUploadingAudio(true);
    try {
      const meta = await parseAudioFileMetadata(file);
      await onSyncToAudioFile(meta.durationSec, {
        fileName: meta.fileName,
        audioUrl: meta.audioUrl,
        fileSize: meta.fileSize,
      });
      notify(`Audio file parsed (${meta.durationSec}s). Scenes synchronized proportionally!`);
    } catch (err: any) {
      notify(err.message || 'Failed to parse audio file');
    } finally {
      setIsUploadingAudio(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div id="voiceover-studio-root" className="flex flex-col gap-5 text-slate-100 min-h-[600px]">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="voiceover-toast"
          className="fixed bottom-6 right-6 z-50 bg-cyan-500 text-slate-950 px-4 py-2.5 rounded-xl font-semibold shadow-2xl shadow-cyan-500/30 flex items-center gap-2 text-sm border border-cyan-300 animate-in fade-in slide-in-from-bottom-3"
        >
          <Sparkles className="w-4 h-4 text-slate-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Hero Bar: Engine Summary & Primary Triggers */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <AudioWaveform className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100 tracking-tight">
                  Voiceover & TTS Audio Studio
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  {settings.language} • {settings.voiceName}
                </span>
                {script.isAudioSynced && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Audio Synced
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Exact WPM cadence timing, multi-lingual TTS voiceover models, and automated SRT/VTT synchronization.
              </p>
            </div>
          </div>

          {/* Global Playback & Sync Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Play/Pause Entire Sequence */}
            <button
              id="voiceover-play-sequence-btn"
              onClick={handleTogglePlaySequence}
              className={`px-4 py-2 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all shadow-lg ${
                isPlayingSequence
                  ? 'bg-amber-500 text-slate-950 shadow-amber-500/20 hover:bg-amber-400'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500'
              }`}
            >
              {isPlayingSequence ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause Sequence</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Play Full Voiceover</span>
                </>
              )}
            </button>

            {/* Stop Audio Button */}
            {(isPlayingSequence || isPlayingSingle) && (
              <button
                id="voiceover-stop-audio-btn"
                onClick={handleStopAll}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Stop Audio"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
            )}

            {/* Sync & Recalculate Timeline */}
            <button
              id="voiceover-sync-timeline-btn"
              onClick={handleSyncTimeline}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Recalculate Timing'}</span>
            </button>

            {/* Batch Generate All Voices */}
            <button
              id="voiceover-batch-generate-btn"
              onClick={handleGenerateAll}
              disabled={isBatchGenerating}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 text-cyan-400 ${isBatchGenerating ? 'animate-spin' : ''}`} />
              <span>{isBatchGenerating ? 'Synthesizing...' : 'Sync All Scenes'}</span>
            </button>

            {/* Upload External Audio Track */}
            {onSyncToAudioFile && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAudioUpload}
                  accept="audio/*"
                  className="hidden"
                />
                <button
                  id="voiceover-upload-audio-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAudio}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                  title="Upload recorded voiceover or MP3 to sync scene timings"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  <span>{isUploadingAudio ? 'Uploading...' : 'Upload Track'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Global Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-2.5">
            <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block">
              Total Duration
            </span>
            <div className="text-base font-bold text-slate-100 flex items-center gap-1.5 mt-0.5">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>{timelineData.formattedTotalTime}</span>
              <span className="text-xs text-slate-400 font-normal">({timelineData.totalDurationSec}s)</span>
            </div>
          </div>

          <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-2.5">
            <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block">
              Total Words
            </span>
            <div className="text-base font-bold text-slate-100 flex items-center gap-1.5 mt-0.5">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>{timelineData.totalWords}</span>
              <span className="text-xs text-slate-400 font-normal">words</span>
            </div>
          </div>

          <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-2.5">
            <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block">
              Speech Cadence
            </span>
            <div className="text-base font-bold text-slate-100 flex items-center gap-1.5 mt-0.5">
              <Mic className="w-4 h-4 text-emerald-400" />
              <span>{settings.speechRateWPM}</span>
              <span className="text-xs text-slate-400 font-normal">WPM</span>
            </div>
          </div>

          <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-2.5">
            <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block">
              Scenes In Sync
            </span>
            <div className="text-base font-bold text-slate-100 flex items-center gap-1.5 mt-0.5">
              <Radio className="w-4 h-4 text-amber-400" />
              <span>{script.scenes?.length || 0}</span>
              <span className="text-xs text-slate-400 font-normal">blocks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            activeTab === 'timeline'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <AudioWaveform className="w-3.5 h-3.5" />
          <span>Voiceover Timeline & Waveform</span>
        </button>

        <button
          onClick={() => setActiveTab('models')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            activeTab === 'models'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Voice Models Catalog ({filteredVoiceModels.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            activeTab === 'settings'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Cadence & Pitch Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('subtitles')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            activeTab === 'subtitles'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>SRT / VTT Subtitles</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: TIMELINE & SCENE INSPECTOR
          ========================================================================= */}
      {activeTab === 'timeline' && (
        <div className="flex flex-col gap-5">
          {/* Horizontal Visual Timeline Deck */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase text-cyan-400">
                  Visual Audio Track Timeline
                </span>
                <span className="text-[11px] text-slate-400">
                  (Click any block to inspect, adjust cadence, or audition)
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                00:00 — {timelineData.formattedTotalTime}
              </div>
            </div>

            {/* Timeline Scrollable Track */}
            <div className="overflow-x-auto pb-2 custom-scrollbar">
              <div className="min-w-[800px] flex items-stretch gap-1.5 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
                {timelineData.items.map((item) => {
                  const isSelected = item.sceneNumber === selectedSceneNumber;
                  const isPlayingThis = activePlaybackSceneNum === item.sceneNumber;
                  const durationPercent = Math.max(
                    8,
                    Math.round((item.durationSec / Math.max(1, timelineData.totalDurationSec)) * 100)
                  );

                  return (
                    <div
                      key={item.sceneNumber}
                      onClick={() => setSelectedSceneNumber(item.sceneNumber)}
                      style={{ flex: `${durationPercent} 0 0%` }}
                      className={`cursor-pointer group relative p-3 rounded-lg border transition-all select-none min-w-[120px] ${
                        isPlayingThis
                          ? 'bg-cyan-500/20 border-cyan-400 ring-2 ring-cyan-500/40 shadow-lg shadow-cyan-500/20'
                          : isSelected
                          ? 'bg-slate-800/90 border-cyan-500/70 shadow-md'
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                      }`}
                    >
                      {/* Top Header */}
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[10px] font-mono font-bold text-cyan-400">
                          #{item.sceneNumber}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-950/80">
                          {Math.round(item.durationSec)}s
                        </span>
                      </div>

                      {/* Snippet text */}
                      <p className="text-[11px] text-slate-300 line-clamp-2 leading-tight font-sans">
                        {item.spokenText || 'No voiceover dialogue'}
                      </p>

                      {/* Timecode Pill */}
                      <div className="mt-2 flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-800">
                        <span>{item.timecode}</span>
                        {isPlayingThis && (
                          <div className="flex items-center gap-0.5">
                            <span className="w-1 h-3 bg-cyan-400 rounded-full animate-pulse" />
                            <span className="w-1 h-2 bg-cyan-400 rounded-full animate-pulse delay-75" />
                            <span className="w-1 h-3.5 bg-cyan-400 rounded-full animate-pulse delay-150" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Split Detail Panel: Active Scene Inspector & Quick Audio Controls */}
          {activeScene && activeSceneMetadata && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Scene Spoken Script & Metadata (2 Columns) */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-mono font-bold">
                        Scene #{activeScene.sceneNumber}
                      </span>
                      <h3 className="text-sm font-bold text-slate-200">
                        {activeScene.title || `Scene ${activeScene.sceneNumber}`}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePlaySingleScene(activeScene)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          isPlayingSingle && activePlaybackSceneNum === activeScene.sceneNumber
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold'
                        }`}
                      >
                        {isPlayingSingle && activePlaybackSceneNum === activeScene.sceneNumber ? (
                          <>
                            <Pause className="w-3.5 h-3.5 fill-current" />
                            <span>Pause Audition</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Listen Scene</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleGenerateSingle(activeScene.sceneNumber)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Sync This Scene</span>
                      </button>
                    </div>
                  </div>

                  {/* Voiceover Spoken Text Display */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-slate-400 font-semibold uppercase flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-cyan-400" />
                      Voiceover / Dialogue Narration:
                    </label>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-sans leading-relaxed min-h-[80px]">
                      {activeScene.voiceover || activeScene.dialogue || (
                        <span className="text-slate-400 italic">
                          No voiceover text set for this scene. Using visual description for timing estimation.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* SSML Payload & Emphasis Chips */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                        Emphasis Keywords
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {activeSceneMetadata.emphasisWords.length > 0 ? (
                          activeSceneMetadata.emphasisWords.map((word, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-mono font-medium"
                            >
                              {word}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No strong emphasis detected</span>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
                        Speech Cadence Readout
                      </span>
                      <div className="text-xs text-slate-300 flex items-center justify-between">
                        <span>Word Count:</span>
                        <span className="font-mono text-slate-100 font-bold">{activeSceneMetadata.wordCount} words</span>
                      </div>
                      <div className="text-xs text-slate-300 flex items-center justify-between mt-1">
                        <span>Estimated Audio:</span>
                        <span className="font-mono text-cyan-400 font-bold">{activeSceneMetadata.estimatedDurationSec}s</span>
                      </div>
                      <div className="text-xs text-slate-300 flex items-center justify-between mt-1">
                        <span>Natural Punctuation Pauses:</span>
                        <span className="font-mono text-amber-400 font-bold">+{activeSceneMetadata.pauseDurationSec}s</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SSML Preview Container */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="text-[11px] font-mono text-slate-400 truncate max-w-md">
                    SSML: <span className="text-slate-400">{activeSceneMetadata.ssmlText}</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(activeSceneMetadata.ssmlText || '');
                      notify('Copied SSML payload to clipboard!');
                    }}
                    className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy SSML</span>
                  </button>
                </div>
              </div>

              {/* Quick Voiceover Config & Model Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold uppercase text-slate-400">
                      Assigned Voice Talent
                    </span>
                    <button
                      onClick={() => setActiveTab('models')}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                    >
                      <span>Switch Model</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Active Model Badge */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-100 text-sm">{settings.voiceName}</div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        {settings.gender}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {VOICE_MODELS_CATALOG.find((m) => m.id === settings.voiceModelId)?.description ||
                        'Universal synthetic voice.'}
                    </p>
                  </div>

                  {/* Tone / Emotion Selector */}
                  <div className="space-y-1.5 mb-3">
                    <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                      Delivery Emotion:
                    </label>
                    <select
                      value={settings.emotion}
                      onChange={(e) => handleSettingChange('emotion', e.target.value as VoiceEmotion)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Authoritative">Authoritative (Documentary / News)</option>
                      <option value="Conversational">Conversational (Warm / Podcast)</option>
                      <option value="Dramatic">Dramatic (Cinematic / Cinema)</option>
                      <option value="Energetic">Energetic (YouTube / Shorts / Fast)</option>
                      <option value="Calm">Calm (Luxury / Meditative)</option>
                      <option value="Intriguing">Intriguing (Mystery / Thriller)</option>
                      <option value="Inspirational">Inspirational (Keynote / Anthem)</option>
                    </select>
                  </div>

                  {/* WPM Quick Control */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-400 uppercase text-[10px] font-bold">Speech Rate (WPM):</span>
                      <span className="font-mono text-cyan-400 font-bold">{settings.speechRateWPM} WPM</span>
                    </div>
                    <input
                      type="range"
                      min={100}
                      max={200}
                      step={5}
                      value={settings.speechRateWPM}
                      onChange={(e) => handleSettingChange('speechRateWPM', parseInt(e.target.value, 10))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>100 (Deliberate)</span>
                      <span>145 (Standard)</span>
                      <span>200 (Viral)</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  <span>Cadence adjusts scene timings automatically on sync.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: VOICE MODELS CATALOG
          ========================================================================= */}
      {activeTab === 'models' && (
        <div className="flex flex-col gap-4">
          {/* Language Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-mono text-slate-400 uppercase font-semibold mr-1">
              Language Filter:
            </span>
            {availableLanguages.map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguageFilter(lang)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedLanguageFilter === lang
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Voice Models Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredVoiceModels.map((model) => {
              const isSelected = settings.voiceModelId === model.id;
              const isAuditioning = previewingVoiceModelId === model.id;

              return (
                <div
                  key={model.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500 shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold text-xs">
                          {model.language.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-100">{model.displayName}</h4>
                          <span className="text-[10px] font-mono text-slate-400">
                            {model.language} • {model.gender}
                          </span>
                        </div>
                      </div>

                      {isSelected ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500 text-slate-950">
                          Active
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSelectVoiceModel(model)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors"
                        >
                          Select
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mt-1">
                      {model.description}
                    </p>

                    {/* Sample text block */}
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400 italic">
                      "{model.sampleText}"
                    </div>
                  </div>

                  {/* Bottom Action bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] font-mono text-slate-400">
                      Tone: <strong className="text-slate-300">{model.recommendedTone}</strong>
                    </span>

                    <button
                      onClick={() => handlePreviewVoiceModel(model)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        isAuditioning
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
                      }`}
                    >
                      {isAuditioning ? (
                        <>
                          <Pause className="w-3 h-3 fill-current" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3 text-cyan-400" />
                          <span>Audition</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: CADENCE, SPEED & PITCH SETTINGS
          ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-3xl mx-auto w-full space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-100">Audio Timing & Cadence Engine Settings</h3>
            <p className="text-xs text-slate-400 mt-1">
              Fine-tune the speech cadence multiplier, natural pause intervals, and voice pitch.
            </p>
          </div>

          {/* Settings Sliders */}
          <div className="space-y-5">
            {/* WPM */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase font-bold text-slate-300">
                  Speech Rate (Words Per Minute):
                </label>
                <span className="text-sm font-mono font-bold text-cyan-400">{settings.speechRateWPM} WPM</span>
              </div>
              <input
                type="range"
                min={110}
                max={210}
                step={5}
                value={settings.speechRateWPM}
                onChange={(e) => handleSettingChange('speechRateWPM', parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Standard documentary is 140–150 WPM. YouTube viral and Shorts typically target 165–185 WPM.
              </p>
            </div>

            {/* Pitch */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase font-bold text-slate-300">
                  Voice Pitch Multiplier:
                </label>
                <span className="text-sm font-mono font-bold text-cyan-400">{settings.pitch.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min={0.8}
                max={1.3}
                step={0.1}
                value={settings.pitch}
                onChange={(e) => handleSettingChange('pitch', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                1.0x is natural pitch. Lower values create deeper cinematic tones; higher values yield lighter delivery.
              </p>
            </div>

            {/* Pause Between Scenes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase font-bold text-slate-300">
                  Inter-Scene Transition Pause:
                </label>
                <span className="text-sm font-mono font-bold text-cyan-400">
                  {settings.pauseBetweenScenesSec.toFixed(1)}s
                </span>
              </div>
              <input
                type="range"
                min={0.2}
                max={1.8}
                step={0.1}
                value={settings.pauseBetweenScenesSec}
                onChange={(e) => handleSettingChange('pauseBetweenScenesSec', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Breathing room between scenes to allow visual shot transitions and SFX to settle.
              </p>
            </div>

            {/* Natural Breaths toggle */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-200">Compensate for Punctuation & Breaths</div>
                <div className="text-[11px] text-slate-400">
                  Adds subtle duration padding for commas (0.2s), periods (0.5s), and ellipses (0.8s).
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.addNaturalBreaths}
                onChange={(e) => handleSettingChange('addNaturalBreaths', e.target.checked)}
                className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={handleSyncTimeline}
              disabled={isSyncing}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Apply & Recalculate Timeline</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: SUBTITLES (SRT & VTT)
          ========================================================================= */}
      {activeTab === 'subtitles' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Synchronized Subtitle Cues (SRT & WebVTT)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically calculated timecodes matching exact scene speech cadences.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopySubtitles('srt')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                {copiedKey === 'srt' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Copy SRT</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleDownloadSubtitles('srt')}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-cyan-500/10"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .SRT</span>
              </button>

              <button
                onClick={() => handleDownloadSubtitles('vtt')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .VTT</span>
              </button>
            </div>
          </div>

          {/* Subtitle Preview Codeblock */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-[11px] text-slate-300 leading-relaxed overflow-y-auto max-h-[360px] custom-scrollbar whitespace-pre-wrap">
            {timelineData.srtContent || 'No dialogue or voiceover content available to generate subtitles.'}
          </div>
        </div>
      )}
    </div>
  );
};
