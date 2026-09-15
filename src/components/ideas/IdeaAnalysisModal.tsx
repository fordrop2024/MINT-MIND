import React from 'react';
import { X, Sparkles, Target, AlertTriangle, Lightbulb, Clock, Share2, Compass, CheckCircle2 } from 'lucide-react';
import type { IdeaAnalysis, Idea } from '../../types/idea';

interface IdeaAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  idea: Idea | null;
  analysis: IdeaAnalysis | null;
  loading: boolean;
  onApplyTitle?: (title: string) => void;
  onApplyHook?: (hook: string) => void;
}

export function IdeaAnalysisModal({
  isOpen,
  onClose,
  idea,
  analysis,
  loading,
  onApplyTitle,
  onApplyHook,
}: IdeaAnalysisModalProps) {
  if (!isOpen || !idea) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Idea Strategic Intelligence Audit
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  MintMind Engine
                </span>
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-md">{idea.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-white">Running Strategic Creator Audit...</p>
              <p className="text-xs text-slate-400 max-w-sm">
                Analyzing viewer psychology, retention bottlenecks, competitor white-space, and algorithmic hooks.
              </p>
            </div>
          ) : analysis ? (
            <>
              {/* Why It Works & Audience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    Why Viewers Will Watch
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{analysis.whyItWorks}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-cyan-400">
                    <Target className="w-4 h-4" />
                    Audience Psychographics
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{analysis.targetAudienceAnalysis}</p>
                </div>
              </div>

              {/* Differentiation & Weaknesses */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-indigo-400">
                  <Compass className="w-4 h-4" />
                  What Makes It Unique (Differentiator)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{analysis.differentiation}</p>
              </div>

              {analysis.potentialWeaknesses?.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    Potential Pitfalls & Drop-off Risks
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {analysis.potentialWeaknesses.map((w, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400">•</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sharpened Angle & Hook Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold uppercase text-cyan-400 flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5" />
                      Sharpened Angle
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">{analysis.betterAngle}</p>
                </div>

                <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold uppercase text-indigo-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      High-Retention Hook
                    </span>
                    {onApplyHook && (
                      <button
                        onClick={() => onApplyHook(analysis.betterHook)}
                        className="text-[10px] font-mono text-cyan-400 hover:underline"
                      >
                        Apply Hook
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed italic">"{analysis.betterHook}"</p>
                </div>
              </div>

              {/* Content Gap & Strongest Angle */}
              {(analysis.strongestAngle || analysis.contentGapOpportunity) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.strongestAngle && (
                    <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-purple-400">
                        <Sparkles className="w-4 h-4" />
                        Strongest Hook Angle
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">{analysis.strongestAngle}</p>
                    </div>
                  )}
                  {analysis.contentGapOpportunity && (
                    <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-cyan-400">
                        <Target className="w-4 h-4" />
                        Content Gap & Market White Space
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">{analysis.contentGapOpportunity}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Thumbnail & SEO Direction */}
              {(analysis.thumbnailDirection || analysis.seoDirection) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.thumbnailDirection && (
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                      <div className="text-xs font-mono font-semibold uppercase text-slate-400">
                        Thumbnail Packaging Direction
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{analysis.thumbnailDirection}</p>
                    </div>
                  )}
                  {analysis.seoDirection && (
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                      <div className="text-xs font-mono font-semibold uppercase text-slate-400">
                        SEO & Algorithmic Search Strategy
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{analysis.seoDirection}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Suggested Titles */}
              {analysis.suggestedTitles?.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="text-xs font-mono font-semibold uppercase text-slate-400">
                    Alternative High-CTR Titles
                  </div>
                  <div className="space-y-2">
                    {analysis.suggestedTitles.map((title, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-colors"
                      >
                        <span className="text-xs text-slate-200 font-medium">{title}</span>
                        {onApplyTitle && (
                          <button
                            onClick={() => onApplyTitle(title)}
                            className="text-[11px] font-mono px-2.5 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-colors"
                          >
                            Use Title
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Platform & Duration Alignment */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[10px] font-mono uppercase">Optimal Duration</span>
                    <span className="text-slate-200 font-semibold">{analysis.recommendedDuration}</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[10px] font-mono uppercase">Primary Platform</span>
                    <span className="text-slate-200 font-semibold">{analysis.recommendedPlatform}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-400 text-center py-8">No analysis available.</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
}
