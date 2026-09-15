import React, { useState } from 'react';
import {
  Tv,
  Search,
  RotateCcw,
  Users,
  Eye,
  Video,
  Clock,
  ThumbsUp,
  MessageSquare,
  TrendingUp,
  Calendar,
  Sparkles,
  PieChart,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { youtubeDataService } from '../../services/youtubeDataService';
import { IntelligenceEmptyState } from '../../components/youtube/IntelligenceEmptyState';

export function ChannelAnalyzerPage() {
  const [query, setQuery] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzedTarget, setAnalyzedTarget] = useState<string | null>(null);

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setAnalyzing(true);
    // Real call to service abstraction
    await youtubeDataService.getChannel(query.trim());
    setAnalyzedTarget(query.trim());
    setAnalyzing(false);
  };

  const handleClear = () => {
    setQuery('');
    setAnalyzedTarget(null);
  };

  return (
    <div id="channel-analyzer-page" className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-display">
              Channel Analyzer
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Deep channel diagnostics, audience engagement ratios, upload cadence, and growth velocity
            </p>
          </div>
        </div>
      </div>

      {/* Channel Query Form */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 bg-slate-950/60 space-y-4">
        <form onSubmit={handleAnalyze} className="space-y-4">
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-300">
            Target Channel
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="channel-analyzer-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="YouTube channel URL, channel ID, or channel name"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                id="analyze-channel-btn"
                disabled={analyzing || !query.trim()}
                className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20 shrink-0"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{analyzing ? 'Checking...' : 'Analyze Channel'}</span>
              </button>

              <button
                type="button"
                id="clear-channel-btn"
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
        description="Data connection not configured yet. When the official YouTube Data API is connected, this module will fetch real subscriber counts, video metadata, historical upload logs, and engagement stats without fabrication."
      />

      {/* Comprehensive Results Layout with Structured Placeholders (No Fake Numbers) */}
      <div className="space-y-6 opacity-90">
        <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400">
          Channel Analysis Framework
        </h2>

        {/* 1. Channel Overview Card */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                <Tv className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-200">
                  Channel Overview
                </h3>
                <p className="text-xs text-slate-400">
                  {analyzedTarget ? `Target: ${analyzedTarget}` : 'No target selected'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-900 text-slate-400 border border-slate-800">
              Data connection not configured yet
            </span>
          </div>

          {/* Key Metrics Grid: Subscribers, Total Views, Video Count, Recent Uploads */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>Subscribers</span>
              </div>
              <div className="text-sm font-mono text-slate-400">--</div>
              <div className="text-[10px] text-slate-400 mt-1">Awaiting API connection</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                <span>Total Views</span>
              </div>
              <div className="text-sm font-mono text-slate-400">--</div>
              <div className="text-[10px] text-slate-400 mt-1">Awaiting API connection</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Video className="w-3.5 h-3.5 text-emerald-400" />
                <span>Video Count</span>
              </div>
              <div className="text-sm font-mono text-slate-400">--</div>
              <div className="text-[10px] text-slate-400 mt-1">Awaiting API connection</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Recent Uploads</span>
              </div>
              <div className="text-sm font-mono text-slate-400">--</div>
              <div className="text-[10px] text-slate-400 mt-1">Awaiting API connection</div>
            </div>
          </div>
        </div>

        {/* Engagement & Pacing: Average Views, Average Likes, Average Comments, Upload Frequency */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl glass-panel border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Average Views</span>
            </div>
            <div className="text-base font-mono text-slate-400">--</div>
            <p className="text-[10px] text-slate-400">Baseline 30-day view median</p>
          </div>

          <div className="p-4 rounded-2xl glass-panel border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Average Likes</span>
            </div>
            <div className="text-base font-mono text-slate-400">--</div>
            <p className="text-[10px] text-slate-400">Median positive reactions</p>
          </div>

          <div className="p-4 rounded-2xl glass-panel border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span>Average Comments</span>
            </div>
            <div className="text-base font-mono text-slate-400">--</div>
            <p className="text-[10px] text-slate-400">Audience conversation depth</p>
          </div>

          <div className="p-4 rounded-2xl glass-panel border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Upload Frequency</span>
            </div>
            <div className="text-base font-mono text-slate-400">--</div>
            <p className="text-[10px] text-slate-400">Uploads / month cadence</p>
          </div>
        </div>

        {/* Growth Trend & Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl glass-panel border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-slate-200">
                  Growth Trend (30-Day Velocity)
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Standby</span>
            </div>
            <div className="h-28 rounded-xl bg-slate-900/40 border border-slate-800/60 flex items-center justify-center text-xs text-slate-400 font-mono">
              Chart awaits YouTube historical snapshots
            </div>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold text-slate-200">
                  Content Categories & Topic Distribution
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Standby</span>
            </div>
            <div className="h-28 rounded-xl bg-slate-900/40 border border-slate-800/60 flex items-center justify-center text-xs text-slate-400 font-mono">
              Topic clustering requires channel video catalog
            </div>
          </div>
        </div>

        {/* Top Videos & Recent Videos Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl glass-panel border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Top Videos</span>
              </h4>
              <span className="text-[10px] font-mono text-slate-400">0 items</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/60 text-xs text-slate-400 text-center">
              Data connection not configured yet. Top performing uploads will be ranked here.
            </div>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Recent Videos</span>
              </h4>
              <span className="text-[10px] font-mono text-slate-400">0 items</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/60 text-xs text-slate-400 text-center">
              Data connection not configured yet. Chronological uploads will appear here.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
