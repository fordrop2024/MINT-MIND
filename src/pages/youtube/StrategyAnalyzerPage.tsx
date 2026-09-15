import React, { useState } from 'react';
import {
  Lightbulb,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Compass,
  FileText,
  Calendar,
  Type,
  Image as ImageIcon,
  Users,
  Target,
  FileSpreadsheet,
} from 'lucide-react';
import { useRouter } from '../../context/RouterContext';
import { useCompetitors } from '../../context/CompetitorContext';
import { IntelligenceEmptyState } from '../../components/youtube/IntelligenceEmptyState';

export function StrategyAnalyzerPage() {
  const { navigate } = useRouter();
  const { competitors } = useCompetitors();

  const [targetInput, setTargetInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzedTarget, setAnalyzedTarget] = useState<string | null>(null);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInput.trim()) return;
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzedTarget(targetInput.trim());
      setAnalyzing(false);
    }, 400);
  };

  return (
    <div id="strategy-analyzer-page" className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-display">
                Strategy Analyzer
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Market pattern synthesis, audience retention mechanics, and competitive differentiation
              </p>
            </div>
          </div>

          {/* Action button linking to Script Studio */}
          <button
            id="build-content-strategy-btn"
            onClick={() => navigate('/script')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-cyan-500/20 flex items-center gap-2 self-start sm:self-auto shrink-0"
          >
            <span>Build My Content Strategy</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>
        </div>
      </div>

      {/* Ethical Creator Directive Callout (Exact required wording) */}
      <div className="p-6 rounded-3xl glass-panel border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-slate-950/60 relative overflow-hidden space-y-2">
        <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>MintMind Creator Creed</span>
        </div>
        <p className="text-base md:text-lg font-bold text-white font-display">
          &ldquo;Learn from market patterns and create an original strategy.&rdquo;
        </p>
        <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
          We synthesize categorical momentum and thumbnail linguistics so you can carve an authentic, differentiated niche. Copying another creator destroys algorithmic trust and audience loyalty.
        </p>
      </div>

      {/* Input: Target Channel or Competitor Group */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 bg-slate-950/60 space-y-4">
        <form onSubmit={handleAnalyze} className="space-y-4">
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-300">
            Target Channel or Competitor Cohort
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="strategy-analyzer-input"
                type="text"
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                placeholder="Enter channel name/URL or select from your tracked competitors"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={analyzing || !targetInput.trim()}
              className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20 shrink-0"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>{analyzing ? 'Synthesizing...' : 'Analyze Strategy'}</span>
            </button>
          </div>
        </form>

        {competitors.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-mono text-slate-400">Tracked Channels:</span>
            {competitors.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setTargetInput(c.name);
                }}
                className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 transition-colors"
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Global Status Banner */}
      <IntelligenceEmptyState
        title="Strategy synthesis data connection not configured yet."
        description="When YouTube Data API access is active, MintMind AI will run clustering across titles, release schedules, and video retention curves to distill an original content blueprint."
      />

      {/* Prepared Output Sections (9 Comprehensive Modules) */}
      <div className="space-y-5">
        <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400">
          Strategy Synthesis Framework
        </h2>

        {/* 1. Winning Topics & 2. Content Formats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Winning Topics</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Recurring content themes consistently pulling disproportionate views relative to category norms.
            </p>
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 text-xs font-mono text-slate-400">
              Data connection not configured yet
            </div>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
              <span>Content Formats</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Video structural archetypes (e.g. Deep Dives, Visual Breakdowns, Experiments, Direct Debates).
            </p>
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 text-xs font-mono text-slate-400">
              Data connection not configured yet
            </div>
          </div>
        </div>

        {/* 3. Publishing Pattern & 4. Title Patterns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Publishing Pattern</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Optimal upload timing, cadence consistency, and temporal distribution across weekdays.
            </p>
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 text-xs font-mono text-slate-400">
              Data connection not configured yet
            </div>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Type className="w-4 h-4 text-purple-400" />
              <span>Title Patterns</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Linguistic syntactic structures, character lengths, and curiosity tension formulations.
            </p>
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 text-xs font-mono text-slate-400">
              Data connection not configured yet
            </div>
          </div>
        </div>

        {/* 5. Thumbnail Patterns & 6. Audience Signals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <ImageIcon className="w-4 h-4 text-cyan-400" />
              <span>Thumbnail Patterns</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Visual composition rules: focal hierarchy, color saturation, and face-to-background contrast ratios.
            </p>
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 text-xs font-mono text-slate-400">
              Data connection not configured yet
            </div>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Audience Signals</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Audience sentiment triggers, comment questions, and unmet viewer requests extracted from comments.
            </p>
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 text-xs font-mono text-slate-400">
              Data connection not configured yet
            </div>
          </div>
        </div>

        {/* 7. Content Gaps & 8. Opportunities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Target className="w-4 h-4 text-rose-400" />
              <span>Content Gaps</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              High search-demand questions that competitor uploads fail to thoroughly answer or resolve.
            </p>
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 text-xs font-mono text-slate-400">
              Data connection not configured yet
            </div>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Opportunities</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Underserved audience niches where quality production value can establish dominant authority.
            </p>
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 text-xs font-mono text-slate-400">
              Data connection not configured yet
            </div>
          </div>
        </div>

        {/* 9. Recommended Original Strategy (Prominent Showcase) */}
        <div className="p-6 rounded-2xl glass-panel border border-indigo-500/40 bg-indigo-950/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-indigo-200">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Recommended Original Strategy</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/50">
              Synthesis Output
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            A comprehensive, personalized blueprint pairing high-velocity market demand signals with your unique creator voice, ensuring your scripts stand out instead of blending in.
          </p>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400">
            Data connection not configured yet. Run Strategy Analyzer once the YouTube Data API is connected.
          </div>

          <div className="pt-2 flex items-center justify-end">
            <button
              onClick={() => navigate('/script')}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <span>Build My Content Strategy in Script Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
