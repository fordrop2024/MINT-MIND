import React, { useState, useMemo } from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  RotateCw,
  Trash2,
  X,
  Image as ImageIcon,
  Film,
  Mic,
  Music,
  Volume2,
  Filter,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useScript } from '../../context/ScriptContext';
import type { MediaGenerationJob, MediaJobStatus } from '../../types/mediaGenerationJob';
import type { MediaAssetType } from '../../types/mediaAsset';

interface GenerationJobsPanelProps {
  scriptId?: string;
  sceneNumber?: number;
  onClose?: () => void;
  compact?: boolean;
}

export const GenerationJobsPanel: React.FC<GenerationJobsPanelProps> = ({
  scriptId,
  sceneNumber,
  onClose,
  compact = false,
}) => {
  const {
    generationJobs,
    isLoadingJobs,
    cancelGenerationJob,
    retryGenerationJob,
    deleteGenerationJob,
  } = useScript();

  const [statusFilter, setStatusFilter] = useState<MediaJobStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<MediaAssetType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  // Filter jobs based on props and user controls
  const filteredJobs = useMemo(() => {
    return generationJobs.filter((job) => {
      if (scriptId && job.scriptId && job.scriptId !== scriptId) return false;
      if (typeof sceneNumber === 'number' && job.sceneNumber !== sceneNumber) return false;
      if (statusFilter !== 'all' && job.status !== statusFilter) return false;
      if (typeFilter !== 'all' && job.type !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesPrompt = job.prompt?.toLowerCase().includes(q);
        const matchesId = job.id?.toLowerCase().includes(q);
        const matchesProvider = job.provider?.toLowerCase().includes(q);
        if (!matchesPrompt && !matchesId && !matchesProvider) return false;
      }
      return true;
    });
  }, [generationJobs, scriptId, sceneNumber, statusFilter, typeFilter, searchQuery]);

  const activeCount = useMemo(
    () => generationJobs.filter((j) => j.status === 'queued' || j.status === 'processing').length,
    [generationJobs]
  );
  const completedCount = useMemo(
    () => generationJobs.filter((j) => j.status === 'completed').length,
    [generationJobs]
  );
  const failedCount = useMemo(
    () => generationJobs.filter((j) => j.status === 'failed').length,
    [generationJobs]
  );

  const getTypeIcon = (type: MediaAssetType) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-sky-400" />;
      case 'video':
      case 'b-roll':
        return <Film className="w-3.5 h-3.5 text-violet-400" />;
      case 'voiceover':
        return <Mic className="w-3.5 h-3.5 text-amber-400" />;
      case 'music':
        return <Music className="w-3.5 h-3.5 text-rose-400" />;
      case 'sound-effect':
      case 'audio':
        return <Volume2 className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  const getStatusBadge = (job: MediaGenerationJob) => {
    switch (job.status) {
      case 'queued':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3 animate-pulse" />
            Queued
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <RotateCw className="w-3 h-3 animate-spin" />
            Processing {job.progress > 0 ? `${job.progress}%` : ''}
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3 h-3" />
            Failed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      id="generation-jobs-panel"
      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 text-slate-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Media Generation Pipeline
              {activeCount > 0 && (
                <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {activeCount} Active
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              {sceneNumber !== undefined
                ? `Tracking synthesis tasks for Scene #${sceneNumber}`
                : 'Tracking asynchronous asset generation jobs and provider pipelines'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              title="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 border border-transparent'
            }`}
          >
            All ({generationJobs.length})
          </button>
          <button
            onClick={() => setStatusFilter('processing')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              statusFilter === 'processing'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 border border-transparent'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              statusFilter === 'completed'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 border border-transparent'
            }`}
          >
            Completed ({completedCount})
          </button>
          <button
            onClick={() => setStatusFilter('failed')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              statusFilter === 'failed'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 border border-transparent'
            }`}
          >
            Failed ({failedCount})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="voiceover">Voiceovers</option>
            <option value="music">Music</option>
            <option value="sound-effect">SFX</option>
          </select>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
        {filteredJobs.length === 0 ? (
          <div className="py-8 text-center rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-slate-400 text-xs space-y-1">
            <Activity className="w-6 h-6 mx-auto text-slate-600 mb-1" />
            <p className="font-medium text-slate-300">No generation jobs in queue</p>
            <p className="text-[11px] text-slate-500">
              Trigger an asset generation job directly from any scene card in the breakdown studio.
            </p>
          </div>
        ) : (
          filteredJobs.map((job) => {
            const isExpanded = expandedJobId === job.id;
            return (
              <div
                key={job.id}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                      {getTypeIcon(job.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-200 capitalize">
                          {job.type} Job
                        </span>
                        {typeof job.sceneNumber === 'number' && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                            Scene #{job.sceneNumber}
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-500">
                          {job.provider}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(job.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(job)}

                    {/* Action Controls */}
                    {(job.status === 'queued' || job.status === 'processing') && (
                      <button
                        onClick={() => cancelGenerationJob(job.id)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Cancel Job"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {(job.status === 'failed' || job.status === 'cancelled') && (
                      <button
                        onClick={() => retryGenerationJob(job.id)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
                        title="Retry Job"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => deleteGenerationJob(job.id)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete Job Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar for Active Jobs */}
                {job.status === 'processing' && (
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-cyan-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(5, job.progress)}%` }}
                    />
                  </div>
                )}

                {/* Prompt Preview */}
                <div
                  onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                  className="cursor-pointer text-[11px] text-slate-300 font-mono bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800/80"
                >
                  <span className="text-slate-500 mr-1.5 font-bold uppercase text-[9px]">
                    Prompt:
                  </span>
                  <span className={isExpanded ? '' : 'line-clamp-1'}>{job.prompt}</span>
                </div>

                {/* Error diagnostics banner */}
                {job.error && (
                  <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
                    <div className="leading-snug">
                      <span className="font-semibold block">Status Note:</span>
                      {job.error}
                    </div>
                  </div>
                )}

                {/* Asset reference */}
                {job.assetId && (
                  <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between pt-0.5">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-cyan-400/70" /> Linked Asset ID: {job.assetId}
                    </span>
                    <span className="text-slate-400 font-medium">
                      Status: {job.status === 'completed' ? 'ready' : job.status === 'failed' ? 'failed' : 'generating'}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
