import React, { useState, useMemo, useRef } from 'react';
import {
  Image as ImageIcon,
  Film,
  Mic,
  Music,
  Volume2,
  Clapperboard,
  Search,
  Filter,
  Plus,
  Trash2,
  ExternalLink,
  Info,
  Link as LinkIcon,
  Unlink,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Play,
  Pause,
  X,
  Layers,
  Upload,
} from 'lucide-react';
import type {
  MediaAsset,
  MediaAssetType,
  MediaAssetStatus,
  MediaAssetSource,
} from '../../types/mediaAsset';
import { useScript } from '../../context/ScriptContext';

interface MediaAssetLibraryProps {
  scriptId?: string;
  projectId?: string;
  selectedSceneNumber?: number;
  onSelectAsset?: (asset: MediaAsset) => void;
  compact?: boolean;
}

const TYPE_CONFIG: Record<
  MediaAssetType,
  { label: string; icon: React.ReactNode; color: string; badgeBg: string; badgeBorder: string }
> = {
  image: {
    label: 'Image',
    icon: <ImageIcon className="w-3.5 h-3.5" />,
    color: 'text-sky-400',
    badgeBg: 'bg-sky-500/10',
    badgeBorder: 'border-sky-500/30',
  },
  video: {
    label: 'Video',
    icon: <Film className="w-3.5 h-3.5" />,
    color: 'text-violet-400',
    badgeBg: 'bg-violet-500/10',
    badgeBorder: 'border-violet-500/30',
  },
  voiceover: {
    label: 'Voiceover',
    icon: <Mic className="w-3.5 h-3.5" />,
    color: 'text-amber-400',
    badgeBg: 'bg-amber-500/10',
    badgeBorder: 'border-amber-500/30',
  },
  audio: {
    label: 'Audio',
    icon: <Volume2 className="w-3.5 h-3.5" />,
    color: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10',
    badgeBorder: 'border-emerald-500/30',
  },
  music: {
    label: 'Music',
    icon: <Music className="w-3.5 h-3.5" />,
    color: 'text-rose-400',
    badgeBg: 'bg-rose-500/10',
    badgeBorder: 'border-rose-500/30',
  },
  'sound-effect': {
    label: 'Sound Effect',
    icon: <Volume2 className="w-3.5 h-3.5" />,
    color: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/10',
    badgeBorder: 'border-cyan-500/30',
  },
  'b-roll': {
    label: 'B-Roll',
    icon: <Clapperboard className="w-3.5 h-3.5" />,
    color: 'text-indigo-400',
    badgeBg: 'bg-indigo-500/10',
    badgeBorder: 'border-indigo-500/30',
  },
};

const STATUS_CONFIG: Record<
  MediaAssetStatus,
  { label: string; icon: React.ReactNode; color: string; badgeBg: string; badgeBorder: string }
> = {
  ready: {
    label: 'Ready',
    icon: <CheckCircle2 className="w-3 h-3" />,
    color: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/15',
    badgeBorder: 'border-emerald-500/30',
  },
  generating: {
    label: 'Generating',
    icon: <Clock className="w-3 h-3 animate-spin" />,
    color: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/15',
    badgeBorder: 'border-cyan-500/30',
  },
  pending: {
    label: 'Pending',
    icon: <Clock className="w-3 h-3" />,
    color: 'text-amber-400',
    badgeBg: 'bg-amber-500/15',
    badgeBorder: 'border-amber-500/30',
  },
  required: {
    label: 'Required',
    icon: <AlertCircle className="w-3 h-3" />,
    color: 'text-rose-400',
    badgeBg: 'bg-rose-500/15',
    badgeBorder: 'border-rose-500/30',
  },
  failed: {
    label: 'Failed',
    icon: <AlertCircle className="w-3 h-3" />,
    color: 'text-red-400',
    badgeBg: 'bg-red-500/15',
    badgeBorder: 'border-red-500/30',
  },
  missing: {
    label: 'Missing',
    icon: <HelpCircle className="w-3 h-3" />,
    color: 'text-slate-400',
    badgeBg: 'bg-slate-500/15',
    badgeBorder: 'border-slate-500/30',
  },
};

export function MediaAssetLibrary({
  scriptId,
  projectId,
  selectedSceneNumber,
  onSelectAsset,
  compact = false,
}: MediaAssetLibraryProps) {
  const {
    mediaAssets,
    activeScript,
    createMediaAsset,
    deleteMediaAsset,
    attachAssetToScene,
    detachAssetFromScene,
  } = useScript();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<MediaAssetType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<MediaAssetStatus | 'all'>('all');
  const [sceneFilter, setSceneFilter] = useState<number | 'all'>(
    typeof selectedSceneNumber === 'number' ? selectedSceneNumber : 'all'
  );

  // Modals / Details
  const [activeDetailAsset, setActiveDetailAsset] = useState<MediaAsset | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [attachModalAsset, setAttachModalAsset] = useState<MediaAsset | null>(null);
  const [targetSceneInput, setTargetSceneInput] = useState<number>(1);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Register Form State
  const [regFilename, setRegFilename] = useState('');
  const [regType, setRegType] = useState<MediaAssetType>('image');
  const [regSource, setRegSource] = useState<MediaAssetSource>('manual');
  const [regStatus, setRegStatus] = useState<MediaAssetStatus>('ready');
  const [regSceneNumber, setRegSceneNumber] = useState<number | ''>(
    typeof selectedSceneNumber === 'number' ? selectedSceneNumber : ''
  );
  const [regUrl, setRegUrl] = useState('');
  const [regPrompt, setRegPrompt] = useState('');
  const [regAspectRatio, setRegAspectRatio] = useState('16:9');
  const [regDuration, setRegDuration] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Target Script
  const effectiveScriptId = scriptId || activeScript?.id;
  const scriptScenes = activeScript?.scenes || [];

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return mediaAssets.filter((asset) => {
      // Script scope: match if asset belongs to current script or has no script constraint
      if (effectiveScriptId && asset.scriptId && asset.scriptId !== effectiveScriptId) {
        return false;
      }
      if (projectId && asset.projectId && asset.projectId !== projectId) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = asset.filename.toLowerCase().includes(q);
        const matchPrompt = asset.prompt?.toLowerCase().includes(q);
        const matchId = asset.id.toLowerCase().includes(q);
        const matchScene = asset.sceneNumber?.toString() === q;
        if (!matchName && !matchPrompt && !matchId && !matchScene) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== 'all' && asset.type !== typeFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && asset.status !== statusFilter) {
        return false;
      }

      // Scene filter
      if (sceneFilter !== 'all' && asset.sceneNumber !== sceneFilter) {
        return false;
      }

      return true;
    });
  }, [
    mediaAssets,
    effectiveScriptId,
    projectId,
    searchQuery,
    typeFilter,
    statusFilter,
    sceneFilter,
  ]);

  // Handle Audio Playback
  const togglePlayAudio = (asset: MediaAsset) => {
    if (!asset.url) return;

    if (playingAudioId === asset.id) {
      audioPlayerRef.current?.pause();
      setPlayingAudioId(null);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = asset.url;
        audioPlayerRef.current.play().catch(console.error);
        setPlayingAudioId(asset.id);
      }
    }
  };

  // Handle Local File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRegFilename(file.name);

    // Guess type from MIME
    if (file.type.startsWith('image/')) {
      setRegType('image');
    } else if (file.type.startsWith('video/')) {
      setRegType('video');
    } else if (file.type.startsWith('audio/')) {
      setRegType('audio');
    }

    setRegSource('uploaded');
    setRegStatus('ready');

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      setRegUrl(result);

      // Extract duration or dimensions if media
      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.onload = () => {
          if (img.width && img.height) {
            const ratio = (img.width / img.height).toFixed(2);
            setRegAspectRatio(ratio === '1.78' ? '16:9' : ratio === '0.56' ? '9:16' : '1:1');
          }
        };
        img.src = result;
      } else if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
        const mediaElem = document.createElement(file.type.startsWith('audio/') ? 'audio' : 'video');
        mediaElem.preload = 'metadata';
        mediaElem.onloadedmetadata = () => {
          if (mediaElem.duration && !isNaN(mediaElem.duration)) {
            setRegDuration(Math.round(mediaElem.duration));
          }
        };
        mediaElem.src = result;
      }
    };
    reader.readAsDataURL(file);
  };

  // Register Asset Form Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFilename.trim()) return;

    setIsSubmitting(true);
    try {
      await createMediaAsset({
        filename: regFilename.trim(),
        type: regType,
        source: regSource,
        status: regStatus,
        sceneNumber: typeof regSceneNumber === 'number' ? regSceneNumber : undefined,
        scriptId: effectiveScriptId,
        projectId: projectId || activeScript?.projectId,
        url: regUrl.trim() || undefined,
        prompt: regPrompt.trim() || undefined,
        aspectRatio: regAspectRatio,
        duration: typeof regDuration === 'number' ? regDuration : undefined,
        metadata: {
          registeredVia: 'MediaAssetLibraryUI',
          customCreated: true,
        },
      });

      // Reset
      setRegFilename('');
      setRegUrl('');
      setRegPrompt('');
      setRegDuration('');
      setIsRegisterModalOpen(false);
    } catch (err) {
      console.error('Failed to register asset:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Attach Asset Submit
  const handleAttachSubmit = async () => {
    if (!attachModalAsset || !effectiveScriptId) return;
    try {
      await attachAssetToScene(attachModalAsset.id, targetSceneInput, effectiveScriptId);
      setAttachModalAsset(null);
    } catch (err) {
      console.error('Failed to attach asset:', err);
    }
  };

  // Detach Asset
  const handleDetach = async (asset: MediaAsset) => {
    if (!effectiveScriptId || typeof asset.sceneNumber !== 'number') return;
    try {
      await detachAssetFromScene(asset.id, asset.sceneNumber, effectiveScriptId);
    } catch (err) {
      console.error('Failed to detach asset:', err);
    }
  };

  // Delete Asset
  const handleDelete = async (asset: MediaAsset) => {
    if (!window.confirm(`Delete media asset "${asset.filename}"?`)) return;
    try {
      await deleteMediaAsset(asset.id);
      if (activeDetailAsset?.id === asset.id) {
        setActiveDetailAsset(null);
      }
    } catch (err) {
      console.error('Failed to delete asset:', err);
    }
  };

  return (
    <div className={`space-y-4 ${compact ? 'text-xs' : ''}`}>
      {/* Hidden audio element for previews */}
      <audio
        ref={audioPlayerRef}
        onEnded={() => setPlayingAudioId(null)}
        className="hidden"
      />

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search assets by name, ID, prompt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-500 ml-1" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="voiceover">Voiceovers</option>
              <option value="audio">Audio</option>
              <option value="music">Music</option>
              <option value="sound-effect">SFX</option>
              <option value="b-roll">B-Roll</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Statuses</option>
            <option value="ready">Ready</option>
            <option value="pending">Pending</option>
            <option value="generating">Generating</option>
            <option value="required">Required</option>
            <option value="failed">Failed</option>
            <option value="missing">Missing</option>
          </select>

          {/* Scene Filter */}
          {scriptScenes.length > 0 && (
            <select
              value={sceneFilter}
              onChange={(e) =>
                setSceneFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Scenes</option>
              {scriptScenes.map((sc) => (
                <option key={sc.sceneNumber} value={sc.sceneNumber}>
                  Scene {sc.sceneNumber}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Register Asset Button */}
        <button
          onClick={() => setIsRegisterModalOpen(true)}
          className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shadow-sm shadow-cyan-500/20 transition-all shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Register Media Asset</span>
        </button>
      </div>

      {/* Asset Count & Active Filter Indicator */}
      <div className="flex items-center justify-between px-1 text-[11px] font-mono text-slate-400">
        <span>
          Showing {filteredAssets.length} of {mediaAssets.length} media assets
        </span>
        {(typeFilter !== 'all' || statusFilter !== 'all' || sceneFilter !== 'all' || searchQuery) && (
          <button
            onClick={() => {
              setTypeFilter('all');
              setStatusFilter('all');
              setSceneFilter('all');
              setSearchQuery('');
            }}
            className="text-cyan-400 hover:text-cyan-300 underline"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <div className="p-10 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-400">
            <Layers className="w-6 h-6 text-slate-500" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-slate-200">No media assets found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search filters or add a new media requirement.'
                : 'Register image, video, voiceover, music, or SFX assets to build your scene asset pipeline.'}
            </p>
          </div>
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Register First Asset</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredAssets.map((asset) => {
            const typeConf = TYPE_CONFIG[asset.type] || TYPE_CONFIG.image;
            const statusConf = STATUS_CONFIG[asset.status] || STATUS_CONFIG.ready;
            const isAudioType =
              asset.type === 'audio' ||
              asset.type === 'voiceover' ||
              asset.type === 'music' ||
              asset.type === 'sound-effect';

            return (
              <div
                key={asset.id}
                className="group relative flex flex-col rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 overflow-hidden transition-all shadow-sm"
              >
                {/* Media Preview Box */}
                <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-800/60">
                  {asset.type === 'image' && asset.url ? (
                    <img
                      src={asset.url}
                      alt={asset.filename}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : asset.type === 'video' && asset.url ? (
                    <video
                      src={asset.url}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                      onMouseLeave={(e) => {
                        e.currentTarget.pause();
                        e.currentTarget.currentTime = 0;
                      }}
                    />
                  ) : isAudioType ? (
                    <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                      <div className={`p-3 rounded-full ${typeConf.badgeBg} ${typeConf.color}`}>
                        {typeConf.icon}
                      </div>
                      {asset.url && (
                        <button
                          onClick={() => togglePlayAudio(asset)}
                          className="px-2.5 py-1 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[10px] font-semibold flex items-center gap-1 border border-cyan-500/30 transition-colors"
                        >
                          {playingAudioId === asset.id ? (
                            <>
                              <Pause className="w-3 h-3" /> Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3" /> Preview
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1.5 text-slate-500">
                      <div className={`p-2.5 rounded-lg ${typeConf.badgeBg} ${typeConf.color}`}>
                        {typeConf.icon}
                      </div>
                      <span className="text-[10px] uppercase font-mono tracking-wider">
                        {asset.status === 'required' ? 'Asset Required' : 'No Preview'}
                      </span>
                    </div>
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium border flex items-center gap-1 backdrop-blur-md ${typeConf.badgeBg} ${typeConf.badgeBorder} ${typeConf.color}`}
                    >
                      {typeConf.icon}
                      <span>{typeConf.label}</span>
                    </span>
                  </div>

                  <div className="absolute top-2 right-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium border flex items-center gap-1 backdrop-blur-md ${statusConf.badgeBg} ${statusConf.badgeBorder} ${statusConf.color}`}
                    >
                      {statusConf.icon}
                      <span>{statusConf.label}</span>
                    </span>
                  </div>

                  {/* Scene Badge */}
                  {typeof asset.sceneNumber === 'number' && (
                    <div className="absolute bottom-2 left-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-900/90 text-cyan-300 border border-cyan-500/30 backdrop-blur-md flex items-center gap-1">
                        <LinkIcon className="w-2.5 h-2.5 text-cyan-400" />
                        Scene {asset.sceneNumber}
                      </span>
                    </div>
                  )}

                  {/* Duration tag */}
                  {typeof asset.duration === 'number' && asset.duration > 0 && (
                    <div className="absolute bottom-2 right-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/70 text-slate-300">
                        {asset.duration}s
                      </span>
                    </div>
                  )}
                </div>

                {/* Content & Actions */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-2.5">
                  <div className="space-y-1">
                    <h5
                      className="text-xs font-semibold text-slate-200 truncate cursor-pointer hover:text-cyan-400 transition-colors"
                      onClick={() => setActiveDetailAsset(asset)}
                      title={asset.filename}
                    >
                      {asset.filename}
                    </h5>
                    {asset.prompt ? (
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {asset.prompt}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic">No prompt or description</p>
                    )}
                  </div>

                  {/* Card Footer Bar */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      {/* Attach / Change Scene */}
                      <button
                        onClick={() => {
                          setAttachModalAsset(asset);
                          setTargetSceneInput(asset.sceneNumber || 1);
                        }}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors flex items-center gap-1"
                        title="Link to Scene"
                      >
                        <LinkIcon className="w-3 h-3 text-cyan-400" />
                        <span>{typeof asset.sceneNumber === 'number' ? 'Re-link' : 'Link'}</span>
                      </button>

                      {/* Detach */}
                      {typeof asset.sceneNumber === 'number' && (
                        <button
                          onClick={() => handleDetach(asset)}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
                          title="Detach from Scene"
                        >
                          <Unlink className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {/* View Details */}
                      <button
                        onClick={() => setActiveDetailAsset(asset)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
                        title="View Asset Details"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>

                      {/* Select Asset callback if parent requested */}
                      {onSelectAsset && (
                        <button
                          onClick={() => onSelectAsset(asset)}
                          className="px-2 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[11px] font-medium border border-cyan-500/30"
                        >
                          Select
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(asset)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Asset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* REGISTER ASSET MODAL */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Register Media Asset</h3>
                  <p className="text-xs text-slate-400">
                    Track or link asset requirements in your media pipeline
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              {/* File Picker or Drag */}
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-300">
                  Local File (Optional Immediate Upload / Preview)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,video/*,audio/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-3 border border-dashed border-slate-700 hover:border-cyan-500/50 rounded-xl bg-slate-950/60 flex items-center justify-center gap-2 text-slate-400 hover:text-cyan-300 transition-colors"
                >
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Choose file to auto-populate metadata & preview</span>
                </button>
              </div>

              {/* Asset Name */}
              <div className="space-y-1">
                <label className="block font-semibold text-slate-300">
                  Asset Filename / Label *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. hero_hook_neon_city.png"
                  value={regFilename}
                  onChange={(e) => setRegFilename(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Type & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-300">Asset Type *</label>
                  <select
                    value={regType}
                    onChange={(e) => setRegType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="voiceover">Voiceover</option>
                    <option value="audio">Audio</option>
                    <option value="music">Music</option>
                    <option value="sound-effect">Sound Effect</option>
                    <option value="b-roll">B-Roll</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-300">Pipeline Status *</label>
                  <select
                    value={regStatus}
                    onChange={(e) => setRegStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="ready">Ready (Available)</option>
                    <option value="pending">Pending</option>
                    <option value="generating">Generating</option>
                    <option value="required">Required (Not yet generated)</option>
                    <option value="missing">Missing</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>

              {/* Source & Scene Number */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-300">Source</label>
                  <select
                    value={regSource}
                    onChange={(e) => setRegSource(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="manual">Manual Entry</option>
                    <option value="uploaded">Uploaded File</option>
                    <option value="ai-generated">AI Generated</option>
                    <option value="stock">Stock Footage</option>
                    <option value="placeholder">Placeholder</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-300">Target Scene</label>
                  <select
                    value={regSceneNumber}
                    onChange={(e) =>
                      setRegSceneNumber(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">Unassigned (Project Library)</option>
                    {scriptScenes.map((sc) => (
                      <option key={sc.sceneNumber} value={sc.sceneNumber}>
                        Scene {sc.sceneNumber}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Direct URL */}
              <div className="space-y-1">
                <label className="block font-semibold text-slate-300">
                  Asset URL or Data URI (Optional)
                </label>
                <input
                  type="text"
                  placeholder="https://... or data:image/..."
                  value={regUrl}
                  onChange={(e) => setRegUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 truncate"
                />
              </div>

              {/* Prompt / Description */}
              <div className="space-y-1">
                <label className="block font-semibold text-slate-300">
                  Visual Prompt / Creative Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Cinematic 4K shot, soft directional lighting..."
                  value={regPrompt}
                  onChange={(e) => setRegPrompt(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              {/* Aspect Ratio & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-300">Aspect Ratio</label>
                  <select
                    value={regAspectRatio}
                    onChange={(e) => setRegAspectRatio(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="16:9">16:9 (Landscape / YouTube)</option>
                    <option value="9:16">9:16 (Portrait / Reels & Shorts)</option>
                    <option value="1:1">1:1 (Square)</option>
                    <option value="4:5">4:5 (Social Feed)</option>
                    <option value="21:9">21:9 (Ultrawide Cinematic)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-300">
                    Duration in Sec (Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 5"
                    value={regDuration}
                    onChange={(e) =>
                      setRegDuration(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !regFilename.trim()}
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>Registering...</span>
                    </>
                  ) : (
                    <span>Register Asset</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ATTACH TO SCENE MODAL */}
      {attachModalAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <LinkIcon className="w-4 h-4 text-cyan-400" />
                Link Asset to Scene
              </h4>
              <button
                onClick={() => setAttachModalAsset(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-400">
                Select the target scene to attach{' '}
                <strong className="text-cyan-300">"{attachModalAsset.filename}"</strong>:
              </p>

              <select
                value={targetSceneInput}
                onChange={(e) => setTargetSceneInput(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {scriptScenes.map((sc) => (
                  <option key={sc.sceneNumber} value={sc.sceneNumber}>
                    Scene {sc.sceneNumber}
                  </option>
                ))}
              </select>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setAttachModalAsset(null)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAttachSubmit}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold"
                >
                  Confirm Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW ASSET DETAILS MODAL */}
      {activeDetailAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100">{activeDetailAsset.filename}</h3>
                <span className="text-[10px] font-mono text-slate-500">
                  ID: {activeDetailAsset.id}
                </span>
              </div>
              <button
                onClick={() => setActiveDetailAsset(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Asset Preview */}
            <div className="aspect-video w-full rounded-xl bg-slate-950 overflow-hidden border border-slate-800 flex items-center justify-center">
              {activeDetailAsset.type === 'image' && activeDetailAsset.url ? (
                <img
                  src={activeDetailAsset.url}
                  alt={activeDetailAsset.filename}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              ) : activeDetailAsset.type === 'video' && activeDetailAsset.url ? (
                <video src={activeDetailAsset.url} controls className="w-full h-full object-contain" />
              ) : activeDetailAsset.url ? (
                <audio src={activeDetailAsset.url} controls className="w-4/5" />
              ) : (
                <span className="text-xs text-slate-500">No media preview available</span>
              )}
            </div>

            {/* Metadata Specs */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Type</span>
                <span className="font-semibold text-slate-200 capitalize">
                  {activeDetailAsset.type}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Status</span>
                <span className="font-semibold text-slate-200 capitalize">
                  {activeDetailAsset.status}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="text-[10px] uppercase font-mono text-slate-500 block">
                  Associated Scene
                </span>
                <span className="font-semibold text-cyan-400">
                  {typeof activeDetailAsset.sceneNumber === 'number'
                    ? `Scene ${activeDetailAsset.sceneNumber}`
                    : 'Unassigned'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Source</span>
                <span className="font-semibold text-slate-200 capitalize">
                  {activeDetailAsset.source}
                </span>
              </div>
              {activeDetailAsset.aspectRatio && (
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">
                    Aspect Ratio
                  </span>
                  <span className="font-mono text-slate-200">{activeDetailAsset.aspectRatio}</span>
                </div>
              )}
              {typeof activeDetailAsset.duration === 'number' && (
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">
                    Duration
                  </span>
                  <span className="font-mono text-slate-200">{activeDetailAsset.duration}s</span>
                </div>
              )}
            </div>

            {/* Prompt details */}
            {activeDetailAsset.prompt && (
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-500 block">
                  Generation Prompt / Description
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeDetailAsset.prompt}
                </p>
              </div>
            )}

            {/* URL if available */}
            {activeDetailAsset.url && (
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-slate-400 truncate max-w-[320px]">
                  {activeDetailAsset.url}
                </span>
                <a
                  href={activeDetailAsset.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 rounded hover:bg-slate-800 text-cyan-400 flex items-center gap-1 text-xs shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => handleDelete(activeDetailAsset)}
                className="px-3 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 text-xs font-medium"
              >
                Delete Asset
              </button>
              <button
                onClick={() => setActiveDetailAsset(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
