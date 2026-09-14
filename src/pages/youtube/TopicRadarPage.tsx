import React, { useState } from 'react';
import {
  Compass,
  Filter,
  Globe,
  Languages,
  Layers,
  Calendar,
  Sparkles,
  TrendingUp,
  ShieldAlert,
  ArrowUpRight,
} from 'lucide-react';
import { IntelligenceEmptyState } from '../../components/youtube/IntelligenceEmptyState';

const COUNTRIES = ['Worldwide', 'USA', 'India', 'UK', 'Canada', 'Australia', 'Japan'];
const LANGUAGES = ['All Languages', 'English', 'Spanish', 'Hindi', 'Japanese', 'French', 'German'];
const CATEGORIES = ['All', 'Gaming', 'Technology', 'Education', 'Entertainment', 'News', 'Travel', 'Food', 'Music', 'Sports'];
const PERIODS = ['24 Hours', '7 Days', '30 Days', '90 Days'];

export function TopicRadarPage() {
  const [country, setCountry] = useState('Worldwide');
  const [language, setLanguage] = useState('English');
  const [category, setCategory] = useState('All');
  const [period, setPeriod] = useState('7 Days');

  return (
    <div id="topic-radar-page" className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-display">
              Topic Radar
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              High-growth content themes, search volume inflection points, and creator opportunity scores
            </p>
          </div>
        </div>
      </div>

      {/* Topic Filters */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 bg-slate-950/60 space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-300">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          <span>Topic Cluster Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-slate-400 block flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-cyan-400" />
              <span>Country</span>
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-slate-400 block flex items-center gap-1.5">
              <Languages className="w-3 h-3 text-indigo-400" />
              <span>Language</span>
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-slate-400 block flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-emerald-400" />
              <span>Category</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-slate-400 block flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-amber-400" />
              <span>Period</span>
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
            >
              {PERIODS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Global Status Banner */}
      <IntelligenceEmptyState
        title="Topic intelligence requires YouTube data."
        description="Data connection not configured yet. Topic trend discovery and demand scoring require YouTube search volume index and video tag co-occurrence matrices."
      />

      {/* Topic Card Specification Layout Preview (Architectural Model) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Topic Card Schema Structure (Awaiting Data Feed)
          </h2>
          <span className="text-[10px] font-mono text-slate-500">
            {country} &bull; {language} &bull; {category}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card Blueprint 1 */}
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4 relative opacity-85">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono uppercase text-slate-500">
                Topic Schema
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800">
                Standby
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-200">
                Topic Name
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Cluster Keyword Definition
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
              <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Demand</span>
                <span className="text-slate-400">-- / 100</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Growth</span>
                <span className="text-slate-400">-- %</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Competition</span>
                <span className="text-slate-400">Pending</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Content Gap</span>
                <span className="text-slate-400">Pending</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-center justify-between text-xs">
              <span className="text-[11px] text-cyan-300 font-semibold">Opportunity Score</span>
              <span className="font-mono text-cyan-400">--</span>
            </div>
          </div>

          {/* Card Blueprint 2 */}
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4 relative opacity-85">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono uppercase text-slate-500">
                Topic Schema
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800">
                Standby
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-200">
                Emerging Sub-Niche
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Velocity Inversion Signal
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
              <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Demand</span>
                <span className="text-slate-400">-- / 100</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Growth</span>
                <span className="text-slate-400">-- %</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Competition</span>
                <span className="text-slate-400">Pending</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Content Gap</span>
                <span className="text-slate-400">Pending</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-center justify-between text-xs">
              <span className="text-[11px] text-cyan-300 font-semibold">Opportunity Score</span>
              <span className="font-mono text-cyan-400">--</span>
            </div>
          </div>

          {/* Card Blueprint 3 */}
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4 relative opacity-85">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono uppercase text-slate-500">
                Topic Schema
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800">
                Standby
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-200">
                Seasonal Spike
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Predictive Calendar Opportunity
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
              <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Demand</span>
                <span className="text-slate-400">-- / 100</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Growth</span>
                <span className="text-slate-400">-- %</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Competition</span>
                <span className="text-slate-400">Pending</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Content Gap</span>
                <span className="text-slate-400">Pending</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-center justify-between text-xs">
              <span className="text-[11px] text-cyan-300 font-semibold">Opportunity Score</span>
              <span className="font-mono text-cyan-400">--</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
