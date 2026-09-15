import React, { useState } from 'react';
import {
  Radio,
  Filter,
  Globe,
  Layers,
  Users,
  Clock,
  TrendingUp,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { IntelligenceEmptyState } from '../../components/youtube/IntelligenceEmptyState';

const CATEGORIES = ['All', 'Gaming', 'News', 'Technology', 'Music', 'Entertainment', 'Sports'];
const REGIONS = ['Worldwide', 'United States', 'India', 'Japan', 'United Kingdom', 'Brazil'];

export function LiveRadarPage() {
  const [category, setCategory] = useState('All');
  const [region, setRegion] = useState('Worldwide');

  return (
    <div id="live-radar-page" className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-display">
              Live Radar
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Concurrent streaming viewer telemetry, superchat velocity, and active broadcast monitoring
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 bg-slate-950/60 space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-300">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          <span>Live Stream Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-slate-400 block flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-cyan-400" />
              <span>Category</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-slate-400 block flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-indigo-400" />
              <span>Region</span>
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Global Status Banner */}
      <IntelligenceEmptyState
        title="No live data available — YouTube API not connected."
        description="Data connection not configured yet. Live streaming signals, real-time concurrent viewership, and chat volume will activate once the YouTube Data API liveStreamingDetails integration is established."
      />

      {/* Live Stream Card Architecture Blueprint (All 7 Fields Prepared) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Live Stream Card Blueprint (Awaiting Data Feed)
          </h2>
          <span className="text-[10px] font-mono text-slate-500">
            Schema verification &bull; 7 Metrics
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card Schema Blueprint 1 */}
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4 opacity-85">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500/60" />
                Live Feed Standby
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Category
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-200 truncate">
                Live Broadcast Title
              </h3>
              <p className="text-xs font-mono text-cyan-400">
                Live Channel Name
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
              <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5">
                  <Users className="w-3 h-3 text-cyan-400" />
                  <span>Current Viewers</span>
                </div>
                <div className="text-slate-400">--</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>Duration</span>
                </div>
                <div className="text-slate-400">--:--:--</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5">
                  <Globe className="w-3 h-3 text-indigo-400" />
                  <span>Country</span>
                </div>
                <div className="text-slate-400">Pending</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span>Growth Rate</span>
                </div>
                <div className="text-slate-400">-- %</div>
              </div>
            </div>
          </div>

          {/* Card Schema Blueprint 2 */}
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4 opacity-85">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500/60" />
                Live Feed Standby
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Category
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-200 truncate">
                Interactive Q&A Session
              </h3>
              <p className="text-xs font-mono text-cyan-400">
                Live Channel Name
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
              <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5">
                  <Users className="w-3 h-3 text-cyan-400" />
                  <span>Current Viewers</span>
                </div>
                <div className="text-slate-400">--</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>Duration</span>
                </div>
                <div className="text-slate-400">--:--:--</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5">
                  <Globe className="w-3 h-3 text-indigo-400" />
                  <span>Country</span>
                </div>
                <div className="text-slate-400">Pending</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span>Growth Rate</span>
                </div>
                <div className="text-slate-400">-- %</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
