import React, { useState } from 'react';
import {
  Trophy,
  Filter,
  Globe,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  ShieldAlert,
  ArrowUpDown,
} from 'lucide-react';
import { IntelligenceEmptyState } from '../../components/youtube/IntelligenceEmptyState';

const RANKING_TYPES = [
  { id: 'most_popular', label: 'Most Popular' },
  { id: 'most_subscribed', label: 'Most Subscribed' },
  { id: 'most_viewed', label: 'Most Viewed' },
  { id: 'most_growth', label: 'Most Growth' },
  { id: 'most_decline', label: 'Most Decline' },
  { id: 'most_engaging', label: 'Most Engaging' },
  { id: 'most_live_viewers', label: 'Most Live Viewers' },
];

const COUNTRIES = [
  { id: 'worldwide', label: 'Worldwide' },
  { id: 'in', label: 'India' },
  { id: 'us', label: 'USA' },
  { id: 'gb', label: 'UK' },
  { id: 'ca', label: 'Canada' },
  { id: 'au', label: 'Australia' },
  { id: 'jp', label: 'Japan' },
];

const CATEGORIES = [
  'All',
  'Gaming',
  'Technology',
  'Education',
  'Entertainment',
  'News',
  'Travel',
  'Food',
  'Music',
  'Sports',
];

const PERIODS = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: '90days', label: '90 Days' },
  { id: 'yearly', label: 'Yearly' },
];

export function RankingsPage() {
  const [rankingType, setRankingType] = useState('most_popular');
  const [country, setCountry] = useState('worldwide');
  const [category, setCategory] = useState('All');
  const [period, setPeriod] = useState('weekly');

  const activeTypeLabel = RANKING_TYPES.find((t) => t.id === rankingType)?.label || rankingType;
  const activeCountryLabel = COUNTRIES.find((c) => c.id === country)?.label || country;
  const activePeriodLabel = PERIODS.find((p) => p.id === period)?.label || period;

  return (
    <div id="rankings-page" className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-display">
              YouTube Rankings
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Creator leaderboards categorized by velocity, subscriber volume, engagement, and live broadcast reach
            </p>
          </div>
        </div>
      </div>

      {/* Filter Control Matrix */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 bg-slate-950/60 space-y-5">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-300">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          <span>Ranking Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Ranking Type */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-slate-400 block flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Ranking Metric</span>
            </label>
            <select
              id="filter-ranking-type"
              value={rankingType}
              onChange={(e) => setRankingType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
            >
              {RANKING_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Country */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-slate-400 block flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-indigo-400" />
              <span>Region</span>
            </label>
            <select
              id="filter-country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
            >
              {COUNTRIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Category */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-slate-400 block flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-emerald-400" />
              <span>Content Category</span>
            </label>
            <select
              id="filter-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Period */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-slate-400 block flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-amber-400" />
              <span>Time Horizon</span>
            </label>
            <select
              id="filter-period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
            >
              {PERIODS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filter Query Summary */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-mono">Query:</span>
            <span className="font-semibold text-cyan-300">{activeTypeLabel}</span>
            <span>&bull;</span>
            <span className="text-slate-300">{activeCountryLabel}</span>
            <span>&bull;</span>
            <span className="text-slate-300">{category}</span>
            <span>&bull;</span>
            <span className="text-slate-300">{activePeriodLabel}</span>
          </div>
          <span className="text-[10px] font-mono text-amber-400">
            Data connection not configured yet
          </span>
        </div>
      </div>

      {/* Global Status Callout */}
      <IntelligenceEmptyState
        title="No rankings available — Data connection not configured yet."
        description={`Leaderboard compilation for ${activeTypeLabel} (${activeCountryLabel} &bull; ${category} &bull; ${activePeriodLabel}) requires connection to the YouTube Data API. In accordance with platform development rules, no simulated rankings or fabricated statistics are displayed.`}
      />

      {/* Clean Ranking Table UI with Exact Columns and Empty State */}
      <div className="rounded-2xl glass-panel border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 font-mono uppercase text-[11px] text-slate-400">
              <tr>
                <th scope="col" className="px-5 py-4 w-16 text-center">
                  Rank
                </th>
                <th scope="col" className="px-5 py-4">
                  Channel
                </th>
                <th scope="col" className="px-5 py-4">
                  Category
                </th>
                <th scope="col" className="px-5 py-4">
                  Subscribers
                </th>
                <th scope="col" className="px-5 py-4">
                  Views
                </th>
                <th scope="col" className="px-5 py-4">
                  Growth
                </th>
                <th scope="col" className="px-5 py-4">
                  Engagement
                </th>
                <th scope="col" className="px-5 py-4 text-center">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center">
                  <div className="max-w-md mx-auto space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 mx-auto flex items-center justify-center text-slate-500">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-300">
                      No leaderboard data populated
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Data connection not configured yet. When the YouTube API is activated, real-time aggregate rankings for {category} channels will be indexed across 24h, 7d, and 30d snapshots.
                    </p>
                    <div className="pt-1">
                      <span className="inline-block px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400">
                        Table Columns: Rank &bull; Channel &bull; Category &bull; Subscribers &bull; Views &bull; Growth &bull; Engagement &bull; Trend
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
  );
}
