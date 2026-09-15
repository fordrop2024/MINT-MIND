import React from 'react';
import { X, CheckCircle2, Clock, GitBranch, ArrowRight, Sparkles } from 'lucide-react';
import { useRouter } from '../../context/RouterContext';
import type { AppRoute } from '../../types';

interface RoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StepItem {
  id: number;
  name: string;
  category: string;
  route?: AppRoute;
  status: 'foundation_ready' | 'phase_2_planned' | 'phase_3_planned';
  details: string;
}

const WORKFLOW_STEPS: StepItem[] = [
  { id: 1, name: 'Trend', category: 'Discovery', route: '/trends', status: 'phase_2_planned', details: 'Cross-platform viral signals & topic velocity radar' },
  { id: 2, name: 'Research', category: 'Discovery', route: '/research', status: 'phase_2_planned', details: 'Automated citations, competitor analysis & source ingestion' },
  { id: 3, name: 'Idea', category: 'Strategy', route: '/ai-command', status: 'phase_2_planned', details: 'Hook synthesis & angle diversification engine' },
  { id: 4, name: 'Script', category: 'Composition', route: '/script', status: 'phase_2_planned', details: 'Retention-optimized multi-format script studio' },
  { id: 5, name: 'Story', category: 'Composition', route: '/script', status: 'phase_2_planned', details: 'Storyboarding, narrative arcs & visual beats' },
  { id: 6, name: 'Image', category: 'Assets', route: '/image-studio', status: 'phase_2_planned', details: 'Character consistency, scene frames & concept renders' },
  { id: 7, name: 'Video', category: 'Assets', route: '/video-generator', status: 'phase_2_planned', details: 'Generative video scenes, camera motion & dynamics' },
  { id: 8, name: 'Voice', category: 'Audio', route: '/voice', status: 'phase_2_planned', details: 'Neural voice clone, studio narration & audio stems' },
  { id: 9, name: 'Editing', category: 'Post-Prod', route: '/editor', status: 'phase_2_planned', details: 'Browser-based magnetic multi-track timeline editor' },
  { id: 10, name: 'Captions', category: 'Post-Prod', route: '/editor', status: 'phase_2_planned', details: 'Kinetic typography, auto-transcription & highlight cuts' },
  { id: 11, name: 'Thumbnail', category: 'Packaging', route: '/thumbnail', status: 'phase_2_planned', details: 'High-CTR thumbnail generator & visual A/B analyzer' },
  { id: 12, name: 'SEO', category: 'Packaging', route: '/seo', status: 'phase_2_planned', details: 'Tag scoring, search volume modeling & title optimization' },
  { id: 13, name: 'Repurpose', category: 'Distribution', route: '/repurpose', status: 'phase_2_planned', details: 'Long-form to Shorts, Reels, TikTok & article atomization' },
  { id: 14, name: 'YouTube', category: 'Distribution', route: '/youtube', status: 'phase_3_planned', details: 'Direct channel synchronization, scheduled releases & cards' },
  { id: 15, name: 'Schedule', category: 'Operations', route: '/scheduler', status: 'phase_3_planned', details: 'Global broadcast calendar & optimal audience windowing' },
  { id: 16, name: 'Analytics', category: 'Intelligence', route: '/analytics', status: 'phase_3_planned', details: 'Retention drops, audience conversion & revenue analytics' },
];

export function RoadmapModal({ isOpen, onClose }: RoadmapModalProps) {
  const { navigate } = useRouter();

  if (!isOpen) return null;

  return (
    <div
      id="roadmap-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="roadmap-modal-dialog"
        className="w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl glass-panel border border-cyan-500/40 shadow-2xl shadow-cyan-950/60 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-100 font-display flex items-center gap-2">
                MintMind Creator Pipeline
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                  17-Step Roadmap
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Architectural blueprint of the AI Content Operating System
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Phase Status Notification */}
        <div className="px-6 py-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <strong className="text-emerald-400">Phase 1 (Active):</strong> Foundation, Project System, Design System, Themes & Express Server
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Phase 2: Generative Studios &bull; Phase 3: Connected APIs</span>
          </div>
        </div>

        {/* Steps Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {WORKFLOW_STEPS.map((step) => {
            const isPhase2 = step.status === 'phase_2_planned';

            return (
              <div
                key={step.id}
                className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/30 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-slate-800 text-cyan-400 text-xs font-mono font-bold flex items-center justify-center border border-slate-700">
                        {step.id.toString().padStart(2, '0')}
                      </span>
                      <h3 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                        {step.name}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50">
                      {step.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 pl-8 leading-relaxed">
                    {step.details}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-800/60 pl-8">
                  <span className="text-[11px] font-mono text-amber-400/90 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {isPhase2 ? 'Scheduled: Phase 2' : 'Scheduled: Phase 3'}
                  </span>

                  {step.route && (
                    <button
                      onClick={() => {
                        navigate(step.route!);
                        onClose();
                      }}
                      className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 group/btn"
                    >
                      Inspect Module
                      <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>MintMind AI &mdash; Content Operating System</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
          >
            Close Roadmap
          </button>
        </div>
      </div>
    </div>
  );
}
