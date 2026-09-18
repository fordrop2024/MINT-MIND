import React, { useState, useMemo, useEffect } from 'react';
import {
  Wand2,
  Sparkles,
  Copy,
  Check,
  Image as ImageIcon,
  Film,
  Mic,
  Music,
  Sliders,
  Camera,
  Layers,
  Upload,
  RefreshCw,
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  Maximize2,
  Eye,
  Info,
  ChevronRight,
  Volume2,
  Save,
  Filter,
} from 'lucide-react';
import type { Script, ScriptScene } from '../../types/script';
import type {
  EnhancedMediaPrompts,
  SceneMediaStatus,
  CameraSettings,
  AudioMetadataPrompt,
} from '../../types/scene';
import type { MediaAsset, MediaAssetType } from '../../types/mediaAsset';
import { useScript } from '../../context/ScriptContext';
import {
  copyPromptToClipboard,
  determineSceneMediaStatus,
  buildAlgorithmicEnhancedPrompts,
} from '../../services/mediaPromptService';
import { generateSceneImageAPI } from '../../services/aiService';

interface MediaPipelineStudioProps {
  script: Script;
  onNotification?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onOpenSceneBreakdown?: () => void;
}

type EngineSubTab = 'image' | 'video' | 'audio' | 'camera' | 'assets';

export const MediaPipelineStudio: React.FC<MediaPipelineStudioProps> = ({
  script,
  onNotification,
  onOpenSceneBreakdown,
}) => {
  const {
    updateSceneMediaPrompts,
    enhanceScenePrompts,
    enhanceAllScenePrompts,
    updateSceneMediaStatus,
    updateScene,
    mediaAssets,
    createMediaAsset,
    attachAssetToScene,
    detachAssetFromScene,
    getAssetsForScene,
    createGenerationJob,
    isGenerating,
    generationStep,
  } = useScript();

  const scenes = script.scenes || [];

  // Active scene selection
  const [selectedSceneNum, setSelectedSceneNum] = useState<number>(() => {
    return scenes.length > 0 ? scenes[0].sceneNumber : 1;
  });

  const [activeTab, setActiveTab] = useState<EngineSubTab>('image');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isEnhancingCurrent, setIsEnhancingCurrent] = useState<boolean>(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);

  // Local editable prompts for active scene
  const [localPrompts, setLocalPrompts] = useState<Record<number, EnhancedMediaPrompts>>({});
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Synchronize localPrompts when scene changes or scenes are updated
  useEffect(() => {
    const map: Record<number, EnhancedMediaPrompts> = {};
    scenes.forEach((sc) => {
      if (sc.enhancedPrompts) {
        map[sc.sceneNumber] = sc.enhancedPrompts;
      } else {
        // Provide algorithmic baseline if not yet enhanced
        map[sc.sceneNumber] = buildAlgorithmicEnhancedPrompts(
          sc,
          script.primaryMode,
          script.aspectRatio === '9:16' ? '9:16' : '16:9',
          {
            title: script.title,
            topic: script.settings?.topic,
            platform: script.type || script.settings?.platform,
          }
        );
      }
    });
    setLocalPrompts(map);
  }, [scenes, script.primaryMode, script.aspectRatio, script.title, script.settings?.topic, script.type, script.settings?.platform]);

  // Keep selectedSceneNum in bounds if scenes change
  useEffect(() => {
    if (scenes.length > 0 && !scenes.some((s) => s.sceneNumber === selectedSceneNum)) {
      setSelectedSceneNum(scenes[0].sceneNumber);
    }
  }, [scenes, selectedSceneNum]);

  const activeScene = useMemo(() => {
    return scenes.find((s) => s.sceneNumber === selectedSceneNum) || scenes[0] || null;
  }, [scenes, selectedSceneNum]);

  const activeSceneAssets = useMemo(() => {
    if (!activeScene) return [];
    return getAssetsForScene(activeScene.sceneNumber, script.id);
  }, [activeScene, script.id, getAssetsForScene, mediaAssets]);

  const currentPrompts: EnhancedMediaPrompts | undefined = useMemo(() => {
    if (!activeScene) return undefined;
    return localPrompts[activeScene.sceneNumber] || activeScene.enhancedPrompts;
  }, [activeScene, localPrompts]);

  // Compute stats across all scenes
  const pipelineStats = useMemo(() => {
    let promptsReady = 0;
    let imagesReady = 0;
    let videosReady = 0;
    let audioSynced = 0;

    scenes.forEach((sc) => {
      const assets = getAssetsForScene(sc.sceneNumber, script.id);
      const status = determineSceneMediaStatus(sc, assets);
      if (status === 'Prompt Ready' || sc.enhancedPrompts || sc.imageGenerationPrompt) {
        promptsReady++;
      }
      if (sc.generatedImage || assets.some((a) => a.type === 'image' && a.status === 'ready')) {
        imagesReady++;
      }
      if (sc.generatedVideo?.status === 'ready' || assets.some((a) => a.type === 'video' && a.status === 'ready')) {
        videosReady++;
      }
      if (
        status === 'Audio Synced' ||
        sc.audioTiming?.isSyncedToAudioFile ||
        assets.some((a) => (a.type === 'audio' || a.type === 'voiceover') && a.status === 'ready')
      ) {
        audioSynced++;
      }
    });

    return {
      total: scenes.length,
      promptsReady,
      imagesReady,
      videosReady,
      audioSynced,
    };
  }, [scenes, script.id, getAssetsForScene]);

  // Filter scenes for sidebar
  const filteredScenes = useMemo(() => {
    if (statusFilter === 'all') return scenes;
    return scenes.filter((sc) => {
      const assets = getAssetsForScene(sc.sceneNumber, script.id);
      const status = determineSceneMediaStatus(sc, assets);
      return status.toLowerCase().includes(statusFilter.toLowerCase());
    });
  }, [scenes, statusFilter, script.id, getAssetsForScene]);

  // Copy handler with visual feedback
  const handleCopy = async (text: string, key: string, label: string) => {
    const success = await copyPromptToClipboard(text);
    if (success) {
      setCopiedKey(key);
      onNotification?.(`${label} copied to clipboard!`, 'success');
      setTimeout(() => setCopiedKey(null), 2500);
    } else {
      onNotification?.('Failed to copy to clipboard', 'error');
    }
  };

  // Enhance single scene with Gemini
  const handleEnhanceSingleScene = async () => {
    if (!activeScene) return;
    setIsEnhancingCurrent(true);
    try {
      const enhanced = await enhanceScenePrompts(script.id, activeScene.sceneNumber);
      setLocalPrompts((prev) => ({
        ...prev,
        [activeScene.sceneNumber]: enhanced,
      }));
      setIsDirty(false);
      onNotification?.(
        `Enhanced AI prompts generated for Scene #${activeScene.sceneNumber}!`,
        'success'
      );
    } catch (err: any) {
      onNotification?.(err.message || 'Failed to enhance scene prompts', 'error');
    } finally {
      setIsEnhancingCurrent(false);
    }
  };

  // Enhance all scenes in sequence
  const handleEnhanceAllScenes = async () => {
    if (scenes.length === 0) {
      onNotification?.('No scenes found in script', 'error');
      return;
    }
    try {
      const updated = await enhanceAllScenePrompts(script.id);
      const map: Record<number, EnhancedMediaPrompts> = {};
      updated.forEach((sc) => {
        if (sc.enhancedPrompts) {
          map[sc.sceneNumber] = sc.enhancedPrompts;
        }
      });
      setLocalPrompts(map);
      setIsDirty(false);
      onNotification?.(
        `Successfully generated production media prompts for all ${scenes.length} scenes!`,
        'success'
      );
    } catch (err: any) {
      onNotification?.(err.message || 'Failed to enhance all scenes', 'error');
    }
  };

  // Save changes to active scene prompts
  const handleSaveActiveScenePrompts = async () => {
    if (!activeScene || !currentPrompts) return;
    try {
      await updateSceneMediaPrompts(script.id, activeScene.sceneNumber, currentPrompts);
      setIsDirty(false);
      onNotification?.(
        `Saved media prompts for Scene #${activeScene.sceneNumber} to script!`,
        'success'
      );
    } catch (err: any) {
      onNotification?.(err.message || 'Failed to save prompts', 'error');
    }
  };

  // Update specific prompt field in local state
  const handleUpdateField = (field: keyof EnhancedMediaPrompts, value: any) => {
    if (!activeScene || !currentPrompts) return;
    const updated = {
      ...currentPrompts,
      [field]: value,
    };
    setLocalPrompts((prev) => ({
      ...prev,
      [activeScene.sceneNumber]: updated,
    }));
    setIsDirty(true);
  };

  // Generate Image for Active Scene
  const handleGenerateImage = async () => {
    if (!activeScene || !currentPrompts) return;
    setIsGeneratingImage(true);
    try {
      const promptToUse = currentPrompts.midjourneyPrompt || currentPrompts.fluxPrompt || activeScene.visualDescription;
      const res = await generateSceneImageAPI({
        prompt: promptToUse,
        sceneNumber: activeScene.sceneNumber,
        style: script.primaryMode || 'Cinematic',
      });

      // Update scene with generated image
      await updateScene(script.id, activeScene.sceneNumber, {
        generatedImage: res.imageUrl,
        mediaStatus: 'Image Generated',
      });

      // Create asset record and attach to scene
      const asset = await createMediaAsset({
        projectId: script.projectId,
        scriptId: script.id,
        sceneNumber: activeScene.sceneNumber,
        type: 'image',
        source: 'ai-generated',
        status: 'ready',
        filename: `Scene_${activeScene.sceneNumber}_Render.png`,
        url: res.imageUrl,
        prompt: promptToUse,
      });

      await attachAssetToScene(asset.id, activeScene.sceneNumber, script.id);

      onNotification?.(`Preview image synthesized for Scene #${activeScene.sceneNumber}!`, 'success');
    } catch (err: any) {
      onNotification?.(err.message || 'Failed to generate image', 'error');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Queue Video Generation Job
  const handleQueueVideoJob = async () => {
    if (!activeScene || !currentPrompts) return;
    try {
      const job = await createGenerationJob({
        projectId: script.projectId,
        scriptId: script.id,
        sceneNumber: activeScene.sceneNumber,
        type: 'video',
        provider: 'Runway Gen-3 Alpha',
        prompt: currentPrompts.runwayPrompt,
        metadata: {
          aspectRatio: script.aspectRatio || '16:9',
          duration: activeScene.duration || '5s',
          cameraMotion: currentPrompts.cameraSettings?.movementStyle,
        },
      });

      await updateSceneMediaStatus(script.id, activeScene.sceneNumber, 'Video Pending');
      onNotification?.(`Video generation job #${job.jobId.slice(-6)} queued for Runway Gen-3!`, 'success');
    } catch (err: any) {
      onNotification?.(err.message || 'Failed to queue video generation job', 'error');
    }
  };

  // Mock-Hook Asset Upload: handles file selection / drop and attaches to scene
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeScene) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let assetType: MediaAssetType = 'image';
        if (file.type.startsWith('video/')) assetType = 'video';
        else if (file.type.startsWith('audio/')) assetType = 'audio';

        // Convert to data URI for immediate client preview
        const reader = new FileReader();
        await new Promise<void>((resolve) => {
          reader.onload = async () => {
            const dataUrl = reader.result as string;
            const asset = await createMediaAsset({
              projectId: script.projectId,
              scriptId: script.id,
              sceneNumber: activeScene.sceneNumber,
              type: assetType,
              source: 'uploaded',
              status: 'ready',
              filename: file.name,
              url: dataUrl,
              metadata: {
                size: file.size,
                mimeType: file.type,
              },
            });

            await attachAssetToScene(asset.id, activeScene.sceneNumber, script.id);
            resolve();
          };
          reader.readAsDataURL(file);
        });
      }

      onNotification?.(`Uploaded ${files.length} asset(s) linked to Scene #${activeScene.sceneNumber}!`, 'success');
    } catch (err: any) {
      onNotification?.(err.message || 'Failed to upload asset', 'error');
    } finally {
      setIsUploading(false);
      // Reset input value
      e.target.value = '';
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status: SceneMediaStatus) => {
    switch (status) {
      case 'Image Generated':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Image Generated
          </span>
        );
      case 'Video Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Film className="w-3 h-3" />
            Video Pending
          </span>
        );
      case 'Audio Synced':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <Mic className="w-3 h-3" />
            Audio Synced
          </span>
        );
      case 'Prompt Ready':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Sparkles className="w-3 h-3" />
            Prompt Ready
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
    }
  };

  if (scenes.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <Layers className="w-12 h-12 text-slate-600 mx-auto" />
        <h3 className="text-base font-bold text-white">No Scenes Available for Media Generation</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Please generate or architect a Scene Breakdown first before accessing the Media Pipeline & Prompt Studio.
        </p>
        {onOpenSceneBreakdown && (
          <button
            onClick={onOpenSceneBreakdown}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors"
          >
            Open Scene Breakdown Studio
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. TOP PIPELINE CONTROL BAR */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              Media Generation Pipeline & Asset Studio
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {script.primaryMode || 'Documentary'} Mode
            </span>
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {script.aspectRatio || '16:9'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Automated prompt engineering, multi-model AI synthesis (Midjourney, Flux, Runway, Sora), and asset binding across all scenes.
          </p>
        </div>

        {/* Global Action Buttons & Counters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Status Metrics Bar */}
          <div className="hidden sm:flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <div className="flex items-center gap-1 text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono text-cyan-300 font-bold">{pipelineStats.promptsReady}</span>
              <span className="text-[10px] text-slate-500">/{pipelineStats.total} Prompts</span>
            </div>
            <div className="h-3 w-px bg-slate-800" />
            <div className="flex items-center gap-1 text-slate-300">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-emerald-300 font-bold">{pipelineStats.imagesReady}</span>
              <span className="text-[10px] text-slate-500">/{pipelineStats.total} Images</span>
            </div>
            <div className="h-3 w-px bg-slate-800" />
            <div className="flex items-center gap-1 text-slate-300">
              <Mic className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-mono text-purple-300 font-bold">{pipelineStats.audioSynced}</span>
              <span className="text-[10px] text-slate-500">/{pipelineStats.total} Synced</span>
            </div>
          </div>

          <button
            onClick={handleEnhanceAllScenes}
            disabled={isGenerating}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-950/40 transition-all disabled:opacity-50"
            title="Auto-enhance Midjourney, Flux, Runway & Sora prompts for all scenes"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? generationStep || 'Enhancing All...' : 'Enhance All Scenes'}
          </button>
        </div>
      </div>

      {/* 2. SPLIT WORKSPACE: SCENE SELECTOR (LEFT) + ACTIVE SCENE STUDIO (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: SCENE SELECTION DECK */}
        <div className="lg:col-span-4 space-y-3">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Scenes Breakdown ({filteredScenes.length}/{scenes.length})
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-[11px] px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="prompt">Prompt Ready</option>
                <option value="image">Image Generated</option>
                <option value="video">Video Pending</option>
                <option value="audio">Audio Synced</option>
              </select>
            </div>

            {/* Scene Cards List */}
            <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
              {filteredScenes.map((scene) => {
                const isSelected = scene.sceneNumber === selectedSceneNum;
                const assets = getAssetsForScene(scene.sceneNumber, script.id);
                const status = determineSceneMediaStatus(scene, assets);

                return (
                  <div
                    key={scene.sceneNumber}
                    onClick={() => setSelectedSceneNum(scene.sceneNumber)}
                    className={`p-3 rounded-xl cursor-pointer border transition-all ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-500 shadow-md shadow-cyan-950/20'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                            isSelected
                              ? 'bg-cyan-500 text-slate-950'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {scene.sceneNumber}
                        </span>
                        <span className="text-xs font-semibold text-white truncate max-w-[130px]">
                          {scene.title || `Scene ${scene.sceneNumber}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {renderStatusBadge(status)}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                      {scene.visualDescription || scene.voiceover || 'No visual description available'}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                      <span className="font-mono text-slate-400">
                        {scene.audioTiming?.timecode || `${scene.duration || '5s'}`}
                      </span>
                      <div className="flex items-center gap-2">
                        {scene.shotType && (
                          <span className="text-slate-400">{scene.shotType}</span>
                        )}
                        {assets.length > 0 && (
                          <span className="text-cyan-400 font-semibold flex items-center gap-0.5">
                            <Layers className="w-2.5 h-2.5" />
                            {assets.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE SCENE MEDIA PROMPT & ASSET STUDIO */}
        <div className="lg:col-span-8 space-y-4">
          {activeScene && currentPrompts ? (
            <div className="space-y-4">
              {/* ACTIVE SCENE HEADER & QUICK ACTION BAR */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold font-mono">
                      Scene #{activeScene.sceneNumber}
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      {activeScene.title || `Scene ${activeScene.sceneNumber}`}
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400">
                      ({activeScene.audioTiming?.timecode || activeScene.duration || '5s'})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isDirty && (
                      <button
                        onClick={handleSaveActiveScenePrompts}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-all"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save Changes
                      </button>
                    )}
                    <button
                      onClick={handleEnhanceSingleScene}
                      disabled={isEnhancingCurrent}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all disabled:opacity-50"
                      title="Re-run Gemini AI prompt enhancement for this scene"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${isEnhancingCurrent ? 'animate-spin' : ''}`}
                      />
                      {isEnhancingCurrent ? 'Enhancing...' : 'Enhance with Gemini'}
                    </button>
                  </div>
                </div>

                {/* Spoken Voiceover snippet banner */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-300">
                  <Volume2 className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Spoken Narration:
                    </span>
                    <p className="italic text-slate-200">
                      "{activeScene.voiceover || activeScene.dialogue || 'No spoken dialogue'}"
                    </p>
                  </div>
                </div>

                {/* SUB-TABS NAVIGATION */}
                <div className="flex items-center gap-1 border-b border-slate-800 pt-1 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('image')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                      activeTab === 'image'
                        ? 'border-cyan-400 text-cyan-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    Image Prompts (Midjourney / Flux)
                  </button>
                  <button
                    onClick={() => setActiveTab('video')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                      activeTab === 'video'
                        ? 'border-cyan-400 text-cyan-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Film className="w-3.5 h-3.5" />
                    Video Prompts (Runway / Sora)
                  </button>
                  <button
                    onClick={() => setActiveTab('audio')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                      activeTab === 'audio'
                        ? 'border-cyan-400 text-cyan-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    Voiceover & Audio Metadata
                  </button>
                  <button
                    onClick={() => setActiveTab('camera')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                      activeTab === 'camera'
                        ? 'border-cyan-400 text-cyan-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Cinematography Physics
                  </button>
                  <button
                    onClick={() => setActiveTab('assets')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                      activeTab === 'assets'
                        ? 'border-cyan-400 text-cyan-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Attached Assets ({activeSceneAssets.length})
                  </button>
                </div>
              </div>

              {/* TAB 1: IMAGE PROMPTS (MIDJOURNEY V6 & FLUX.1) */}
              {activeTab === 'image' && (
                <div className="space-y-4">
                  {/* Midjourney v6 Card */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Midjourney v6 Photorealistic Prompt
                        </h4>
                        <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-slate-800 text-slate-300">
                          {script.aspectRatio === '9:16' ? '--ar 9:16' : '--ar 16:9'}
                        </span>
                        <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-slate-800 text-slate-300">
                          --v 6.0 --style raw
                        </span>
                      </div>

                      <button
                        onClick={() =>
                          handleCopy(
                            currentPrompts.midjourneyPrompt,
                            'midjourney',
                            'Midjourney Prompt'
                          )
                        }
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-medium transition-colors"
                      >
                        {copiedKey === 'midjourney' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Prompt</span>
                          </>
                        )}
                      </button>
                    </div>

                    <textarea
                      rows={4}
                      value={currentPrompts.midjourneyPrompt}
                      onChange={(e) => handleUpdateField('midjourneyPrompt', e.target.value)}
                      className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 leading-relaxed resize-y"
                    />
                  </div>

                  {/* Flux.1 Compositional Card */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Flux.1 Natural Realism Prompt
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          Textural precision & ambient occlusion
                        </span>
                      </div>

                      <button
                        onClick={() =>
                          handleCopy(currentPrompts.fluxPrompt, 'flux', 'Flux.1 Prompt')
                        }
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-medium transition-colors"
                      >
                        {copiedKey === 'flux' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Prompt</span>
                          </>
                        )}
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      value={currentPrompts.fluxPrompt}
                      onChange={(e) => handleUpdateField('fluxPrompt', e.target.value)}
                      className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500 leading-relaxed resize-y"
                    />
                  </div>

                  {/* Image Generation / Preview Action Deck */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {activeScene.generatedImage ? (
                        <div className="relative group w-20 h-12 rounded-lg overflow-hidden border border-slate-700">
                          <img
                            src={activeScene.generatedImage}
                            alt={`Scene ${activeScene.sceneNumber}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => setPreviewImageModal(activeScene.generatedImage!)}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          >
                            <Eye className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-20 h-12 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}

                      <div>
                        <h5 className="text-xs font-semibold text-white">
                          {activeScene.generatedImage ? 'Visual Storyboard Frame Synthesized' : 'Synthesize Visual Preview'}
                        </h5>
                        <p className="text-[11px] text-slate-400">
                          {activeScene.generatedImage
                            ? 'Ready for production pipeline or external Midjourney/Flux render'
                            : 'Generate high-fidelity frame using Gemini AI to preview composition'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleGenerateImage}
                        disabled={isGeneratingImage}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition-all disabled:opacity-50"
                      >
                        <Wand2 className={`w-3.5 h-3.5 ${isGeneratingImage ? 'animate-spin' : ''}`} />
                        {isGeneratingImage ? 'Synthesizing...' : activeScene.generatedImage ? 'Regenerate Frame' : 'Generate Visual Frame'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: VIDEO PROMPTS (RUNWAY GEN-3, LUMA, SORA) */}
              {activeTab === 'video' && (
                <div className="space-y-4">
                  {/* Runway Gen-3 Alpha Prompt */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-violet-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Runway Gen-3 Alpha Video Prompt
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Motion trajectory & 24fps blur
                        </span>
                      </div>

                      <button
                        onClick={() =>
                          handleCopy(currentPrompts.runwayPrompt, 'runway', 'Runway Prompt')
                        }
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-violet-400 text-xs font-medium transition-colors"
                      >
                        {copiedKey === 'runway' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Prompt</span>
                          </>
                        )}
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      value={currentPrompts.runwayPrompt}
                      onChange={(e) => handleUpdateField('runwayPrompt', e.target.value)}
                      className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-violet-500 leading-relaxed resize-y"
                    />
                  </div>

                  {/* Luma Dream Machine Prompt */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Luma Dream Machine Continuous Take
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          Continuous 3D camera path & physics
                        </span>
                      </div>

                      <button
                        onClick={() =>
                          handleCopy(currentPrompts.lumaPrompt, 'luma', 'Luma Prompt')
                        }
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-medium transition-colors"
                      >
                        {copiedKey === 'luma' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Prompt</span>
                          </>
                        )}
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      value={currentPrompts.lumaPrompt}
                      onChange={(e) => handleUpdateField('lumaPrompt', e.target.value)}
                      className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500 leading-relaxed resize-y"
                    />
                  </div>

                  {/* OpenAI Sora Prompt */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          OpenAI Sora Temporal Realism Prompt
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          Multi-character coherence & authentic physics
                        </span>
                      </div>

                      <button
                        onClick={() =>
                          handleCopy(currentPrompts.soraPrompt, 'sora', 'Sora Prompt')
                        }
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-medium transition-colors"
                      >
                        {copiedKey === 'sora' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Prompt</span>
                          </>
                        )}
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      value={currentPrompts.soraPrompt}
                      onChange={(e) => handleUpdateField('soraPrompt', e.target.value)}
                      className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500 leading-relaxed resize-y"
                    />
                  </div>

                  {/* Queue Video Generation Job Action */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-semibold text-white">
                        Runway Gen-3 Video Generation Pipeline
                      </h5>
                      <p className="text-[11px] text-slate-400">
                        Dispatch job with motion parameters directly to project generation queue.
                      </p>
                    </div>

                    <button
                      onClick={handleQueueVideoJob}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-xs shadow-md shadow-violet-950/40 transition-all"
                    >
                      <Film className="w-3.5 h-3.5" />
                      Queue Video Generation Job
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: VOICEOVER & AUDIO METADATA */}
              {activeTab === 'audio' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Voice Delivery & Cadence */}
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <Mic className="w-3.5 h-3.5 text-purple-400" />
                        Vocal Style & Cadence
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {currentPrompts.audioMetadata?.voiceStyle || 'Measured, natural documentary delivery'}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
                        <span className="text-slate-400">Recommended Voice:</span>
                        <span className="text-purple-300 font-medium">
                          {currentPrompts.audioMetadata?.recommendedVoice || 'Adam (Deep Baritone)'}
                        </span>
                      </div>
                    </div>

                    {/* Emotional Tone & Pacing */}
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                        Pacing & Emotion
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Target Pacing:</span>
                        <span className="font-mono text-cyan-400 font-bold">
                          {currentPrompts.audioMetadata?.pacingWPM || 140} WPM
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Emotional Dynamic:</span>
                        <span className="text-slate-200">
                          {currentPrompts.audioMetadata?.emotion || 'Solemn journalistic intrigue'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                        <span className="text-slate-400">Duration Target:</span>
                        <span className="font-mono text-slate-300">
                          {activeScene.durationSec || 5}s ({activeScene.audioTiming?.wordCount || 0} words)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sound Effects (SFX) Layering Checklist */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      Atmospheric SFX Layering Plan
                    </div>
                    <div className="space-y-1.5">
                      {(currentPrompts.audioMetadata?.sfxLayering || [
                        activeScene.soundEffects || 'Subtle atmospheric room tone',
                        'Organic foley texture',
                        'Sub-bass impact on scene transition',
                      ]).map((cue, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300"
                        >
                          <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[9px] font-bold">
                            {idx + 1}
                          </span>
                          <span>{cue}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Music Cue & Tempo */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Music className="w-3.5 h-3.5 text-amber-400" />
                      Background Music & Tempo Suggestion
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-amber-300 font-mono">
                      {currentPrompts.audioMetadata?.musicBpm || activeScene.music || '68 BPM - Minimalist acoustic cello and deep ambient synth pad'}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: CINEMATOGRAPHY & CAMERA SETTINGS */}
              {activeTab === 'camera' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {/* Camera Lens */}
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Optics / Lens</span>
                      <p className="text-xs font-semibold text-white font-mono">
                        {currentPrompts.cameraSettings?.lens || '35mm Cook Anamorphic Prime'}
                      </p>
                    </div>

                    {/* Aperture & Shutter */}
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Aperture / Shutter</span>
                      <p className="text-xs font-semibold text-white font-mono">
                        {currentPrompts.cameraSettings?.aperture || 'f/2.8'} • {currentPrompts.cameraSettings?.shutter || '1/50 sec 180°'}
                      </p>
                    </div>

                    {/* Sensor Type */}
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Cinema Sensor</span>
                      <p className="text-xs font-semibold text-white font-mono">
                        {currentPrompts.cameraSettings?.sensor || 'ARRI Alexa 35'}
                      </p>
                    </div>
                  </div>

                  {/* Lighting Mood & Color Grade */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Lighting Architecture</span>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {currentPrompts.lightingMood}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Color Grading / LUT Profile</span>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {currentPrompts.colorGrade}
                      </p>
                    </div>
                  </div>

                  {/* Subject Consistency Anchor */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        Subject Consistency Anchor
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Locks character/subject identity across multi-scene generations
                      </span>
                    </div>
                    <input
                      type="text"
                      value={currentPrompts.subjectConsistencyAnchor}
                      onChange={(e) =>
                        handleUpdateField('subjectConsistencyAnchor', e.target.value)
                      }
                      className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      placeholder="e.g., 35-year-old female lead scientist wearing graphite high-collar lab vest..."
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: ATTACHED ASSETS & DIRECT UPLOAD HOOK */}
              {activeTab === 'assets' && (
                <div className="space-y-4">
                  {/* Upload Dropzone Hook */}
                  <div className="p-6 rounded-2xl border-2 border-dashed border-slate-800 hover:border-cyan-500/50 bg-slate-950/40 text-center space-y-3 transition-colors">
                    <Upload className="w-8 h-8 text-cyan-400 mx-auto" />
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        Attach External Media Asset to Scene #{activeScene.sceneNumber}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Upload custom Midjourney render, Runway video clip, voiceover take, or B-roll footage.
                      </p>
                    </div>

                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      {isUploading ? 'Uploading & Binding...' : 'Browse & Upload Asset'}
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*,audio/*"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Attached Assets List */}
                  {activeSceneAssets.length > 0 ? (
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-slate-300">
                        Bound Media Assets ({activeSceneAssets.length})
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activeSceneAssets.map((asset) => (
                          <div
                            key={asset.id}
                            className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              {asset.url && asset.type === 'image' ? (
                                <img
                                  src={asset.url}
                                  alt={asset.filename}
                                  className="w-12 h-12 rounded-lg object-cover border border-slate-800 flex-shrink-0"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 flex-shrink-0">
                                  {asset.type === 'video' && <Film className="w-5 h-5 text-violet-400" />}
                                  {asset.type === 'audio' && <Mic className="w-5 h-5 text-purple-400" />}
                                  {asset.type === 'image' && <ImageIcon className="w-5 h-5 text-sky-400" />}
                                </div>
                              )}

                              <div className="overflow-hidden">
                                <h6 className="text-xs font-semibold text-white truncate">
                                  {asset.filename}
                                </h6>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                  <span className="uppercase">{asset.type}</span>
                                  <span>•</span>
                                  <span className="text-emerald-400 capitalize">{asset.status}</span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => detachAssetFromScene(asset.id, activeScene.sceneNumber, script.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                              title="Unlink asset from this scene"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-500">
                      No external assets bound to Scene #{activeScene.sceneNumber} yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
              Select a scene to configure media prompts and assets.
            </div>
          )}
        </div>
      </div>

      {/* LIGHTBOX MODAL FOR IMAGE PREVIEW */}
      {previewImageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImageModal(null)}
        >
          <div
            className="max-w-4xl max-h-[85vh] bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl p-2 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImageModal}
              alt="Visual Preview Frame"
              className="max-w-full max-h-[75vh] object-contain mx-auto rounded-lg"
            />
            <div className="p-3 flex items-center justify-between text-xs text-slate-400">
              <span>Scene #{selectedSceneNum} Storyboard Frame</span>
              <button
                onClick={() => setPreviewImageModal(null)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
