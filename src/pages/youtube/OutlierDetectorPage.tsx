import React from 'react';
import {
  Flame,
  Zap,
  TrendingUp,
  Eye,
  Award,
  FileQuestion,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import { IntelligenceEmptyState } from '../../components/youtube/IntelligenceEmptyState';

export function OutlierDetectorPage() {
  return (
    <div id="outlier-detector-page" className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-display">
              Outlier Detector
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Isolate statistical breakthrough uploads exceeding a creator channel's normal median baseline
            </p>
          </div>
        </div>
      </div>

      {/* Purpose Explanation Callout */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 bg-slate-950/60 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400">
          <Zap className="w-4 h-4" />
          <span>Algorithmic Objective</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Standard analytics only show absolute views. The MintMind Outlier Engine calculates the ratio between an upload's velocity and its channel's 90-day baseline median. A video with 50,000 views on a 2,000-view channel is a 25x outlier — signaling an exceptional title hook, thumbnail packaging breakthrough, or algorithmic recommendation shift.
        </p>
      </div>

      {/* Global Status Banner with Explicit Required Wording */}
      <IntelligenceEmptyState
        title="Outlier detection will activate after historical YouTube data is connected."
        description="Data connection not configured yet. Outlier scoring requires minimum 90-day baseline upload histories per channel to establish mathematical medians. No fake outliers or synthetic multipliers are generated."
      />

      {/* Prepared Outlier Table UI with Exact Columns */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Outlier Anomaly Radar (Awaiting Data Feed)
          </h2>
          <span className="text-[10px] font-mono text-slate-500">
            7 Analytical Metrics
          </span>
        </div>

        <div className="rounded-2xl glass-panel border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 font-mono uppercase text-[10px] text-slate-400">
                <tr>
                  <th scope="col" className="px-5 py-4">
                    Channel
                  </th>
                  <th scope="col" className="px-5 py-4">
                    Video
                  </th>
                  <th scope="col" className="px-5 py-4">
                    Views
                  </th>
                  <th scope="col" className="px-5 py-4">
                    Channel Avg Views
                  </th>
                  <th scope="col" className="px-5 py-4">
                    Performance Multiplier
                  </th>
                  <th scope="col" className="px-5 py-4">
                    Outlier Score
                  </th>
                  <th scope="col" className="px-5 py-4">
                    Detected Pattern
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center">
                    <div className="max-w-md mx-auto space-y-3 font-sans">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 mx-auto flex items-center justify-center text-slate-500">
                        <Flame className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-300">
                        No outlier anomalies detected
                      </p>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-mono">
                        Outlier detection will activate after historical YouTube data is connected. Data connection not configured yet.
                      </p>
                      <div className="pt-2">
                        <span className="inline-block px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400">
                          Multiplier Formula: videoViews / channelBaselineMedian
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
