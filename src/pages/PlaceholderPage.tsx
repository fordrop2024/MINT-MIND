import React from 'react';
import {
  Clock,
  ArrowLeft,
  GitBranch,
  ShieldAlert,
  FolderGit2,
  Sparkles,
  Layers,
} from 'lucide-react';
import { NAV_ITEMS } from '../constants/routes';
import { useRouter } from '../context/RouterContext';
import type { AppRoute } from '../types';

interface PlaceholderPageProps {
  route: AppRoute;
  onOpenRoadmap: () => void;
}

export function PlaceholderPage({ route, onOpenRoadmap }: PlaceholderPageProps) {
  const { navigate } = useRouter();

  const meta = NAV_ITEMS.find((i) => i.path === route) || {
    path: route,
    label: 'Workspace Module',
    category: 'creation',
    icon: Sparkles,
    description: 'Creator operating system module.',
    phase: 'phase_2',
    phaseNote: 'Module not connected yet.',
  };

  const Icon = meta.icon;

  return (
    <div
      id={`module-page-${route.replace('/', '')}`}
      className="max-w-4xl space-y-6 animate-in fade-in duration-200"
    >
      {/* Back button */}
      <button
        onClick={() => navigate('/dashboard')}
        className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-300 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Dashboard</span>
      </button>

      {/* Hero Module Card */}
      <div className="rounded-3xl p-8 glass-panel border border-slate-800 bg-slate-950/60 relative overflow-hidden">
        {/* Subtle glow background */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-display">
                  {meta.label}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono text-slate-500">
                    {meta.path}
                  </span>
                  {meta.pipelineStage && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                      Stage {meta.pipelineStage.toString().padStart(2, '0')}: {meta.stageName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-300 text-xs font-mono self-start sm:self-center">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Coming in the next development phase</span>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
            {meta.description}
          </p>

          {/* Explicit Unconnected / Real State Box */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Architectural Status: Standby</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {meta.phaseNote || 'Module not connected yet.'} In accordance with development rules, no fake generations, simulated APIs, or mock success messages are rendered.
            </p>
          </div>

          {/* Working Action Controls */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all shadow-md shadow-cyan-500/20 flex items-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </button>

            <button
              onClick={onOpenRoadmap}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs transition-colors flex items-center gap-2"
            >
              <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
              <span>View Creator Pipeline Roadmap</span>
            </button>

            <button
              onClick={() => navigate('/projects')}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs transition-colors flex items-center gap-2"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Manage Projects</span>
            </button>
          </div>
        </div>
      </div>

      {/* Planned Feature Specifications Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl glass-panel border border-slate-800/80 space-y-2">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Phase 1 Foundation
          </h3>
          <p className="text-xs text-slate-300">
            Routing, navigation, project state containers, theme persistence, and Express backend endpoints are fully operational.
          </p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-slate-800/80 space-y-2">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Phase 2 Scope
          </h3>
          <p className="text-xs text-slate-300">
            Dedicated generative engine integration, custom pipeline prompts, WebAssembly video editing tools, and Firebase persistence.
          </p>
        </div>
      </div>
    </div>
  );
}
