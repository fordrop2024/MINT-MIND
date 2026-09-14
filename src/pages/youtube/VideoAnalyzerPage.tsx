import React, { useState } from 'react';
import {
  PlaySquare,
  Search,
  Eye,
  ThumbsUp,
  MessageSquare,
  Calendar,
  Clock,
  Zap,
  TrendingUp,
  Award,
  Type,
  Image as ImageIcon,
  Compass,
  FileQuestion,
  RotateCcw,
} from 'lucide-react';
import { youtubeDataService } from '../../services/youtubeDataService';
import { IntelligenceEmptyState } from '../../components/youtube/IntelligenceEmptyState';

export function VideoAnalyzerPage() {
  const [videoInput, setVideoInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzedTarget, setAnalyzedTarget] = useState<string | null>(null);

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!videoInput.trim()) return;

    setAnalyzing(true);
    await youtubeDataService.getVideo(videoInput.trim());
    setAnalyzedTarget(videoInput.trim());
    setAnalyzing(false);
  };

  const handleClear = () => {
    setVideoInput('');
    setAnalyzedTarget(null);
  };

  return (
    <div id="video-analyzer-page" className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <PlaySquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-display">
              Video Analyzer
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Deep video audit, algorithmic retention signals, title hook efficacy, and thumbnail clickability
            </p>
          </div>
        </div>
      </div>

      {/* Video Query Form */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 bg-slate-950/60 space-y-4">
        <form onSubmit={handleAnalyze} className="space-y-4">
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-300">
            Target Video
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="video-analyzer-input"
                type="text"
                value={videoInput}
                onChange={(e) => setVideoInput(e.target.value)}
                placeholder="YouTube video URL or video ID (e.g. dQw4w9WgXcQ or https://youtu.be/...)"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                id="analyze-video-btn"
                disabled={analyzing || !videoInput.trim()}
                className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20 shrink-0"
              >
                <PlaySquare className="w-3.5 h-3.5" />
                <span>{analyzing ? 'Checking...' : 'Analyze Video'}</span>
              </button>

              <button
                type="button"
                id="clear-video-btn"
                onClick={handleClear}
                className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        </form>

        {analyzedTarget && (
          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-300 flex items-center justify-between">
            <span>
              Target: <strong className="font-mono text-amber-200">{analyzedTarget}</strong> &bull; Waiting for YouTube API connection.
            </span>
            <span className="text-[10px] font-mono uppercase bg-amber-900/60 px-2 py-0.5 rounded border border-amber-700/50">
              Data connection not configured yet
            </span>
          </div>
        )}
      </div>

      {/* Global Status Banner */}
      <IntelligenceEmptyState
        title="Waiting for YouTube API connection."
        description="Data connection not configured yet. Detailed video metadata, view velocity, thumbnail OCR, and audience sentiment will display once YouTube API access is connected."
      />

      {/* All Requested Result Sections with Authentic Unavailable States */}
      <div className="space-y-6">
        <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400">
          Video Diagnostic Architecture
        </h2>

        {/* 1. Video Overview Card */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                <PlaySquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-200">
                  Video Overview
                </h3>
                <p className="text-xs text-slate-400">
                  {analyzedTarget ? `Target: ${analyzedTarget}` : 'Awaiting video URL input'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-slate-900 text-slate-400 border border-slate-800 self-start sm:self-auto">
              Data connection not configured yet
            </span>
          </div>

          {/* Primary Metrics: Views, Likes, Comments, Published Date, Duration */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>Views</span>
              </div>
              <div className="text-sm font-mono text-slate-400">--</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Unavailable</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Likes</span>
              </div>
              <div className="text-sm font-mono text-slate-400">--</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Unavailable</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                <span>Comments</span>
              </div>
              <div className="text-sm font-mono text-slate-400">--</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Unavailable</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Published Date</span>
              </div>
              <div className="text-sm font-mono text-slate-400">--</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Unavailable</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>Duration</span>
              </div>
              <div className="text-sm font-mono text-slate-400">--</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Unavailable</div>
            </div>
          </div>
        </div>

        {/* Algorithmic Velocity Metrics: Views Per Day, Engagement Rate, Performance Score */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl glass-panel border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>Views Per Day</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Velocity</span>
            </div>
            <div className="text-lg font-mono text-slate-400">--</div>
            <p className="text-[11px] text-slate-400">
              Calculates daily view momentum adjusted for days elapsed since publication.
            </p>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Engagement Rate</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Ratio</span>
            </div>
            <div className="text-lg font-mono text-slate-400">--</div>
            <p className="text-[11px] text-slate-400">
              (Likes + Comments) / Total Views normalized to benchmark averages.
            </p>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Award className="w-4 h-4 text-indigo-400" />
                <span>Performance Score</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">MintMind Metric</span>
            </div>
            <div className="text-lg font-mono text-slate-400">--</div>
            <p className="text-[11px] text-slate-400">
              Internal MintMind score (0-100) weighing baseline multiplier and viral curve.
            </p>
          </div>
        </div>

        {/* Content Diagnostics: Title Analysis, Thumbnail Analysis, Topic Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl glass-panel border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Type className="w-4 h-4 text-cyan-400" />
              <span>Title Analysis</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 text-xs text-slate-400">
              Character length, curiosity gap hook rating, and search keyword alignment await API data.
            </div>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <ImageIcon className="w-4 h-4 text-purple-400" />
              <span>Thumbnail Analysis</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 text-xs text-slate-400">
              Contrast ratio, face detection presence, and mobile readability index will appear here.
            </div>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>Topic Analysis</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 text-xs text-slate-400">
              Categorical taxonomy and audience intent clustering will evaluate topic saturation.
            </div>
          </div>
        </div>

        {/* Performance Explanation */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800/80 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <FileQuestion className="w-4 h-4 text-amber-400" />
            <span>Performance Explanation</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Data connection not configured yet. When connected to the YouTube Data API, MintMind AI will generate an algorithmic post-mortem analyzing why this video performed above or below expectations relative to peer videos in its category.
          </p>
        </div>
      </div>
    </div>
  );
}
