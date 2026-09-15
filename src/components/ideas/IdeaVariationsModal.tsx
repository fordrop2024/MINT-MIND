import React from 'react';
import { X, Layers, ArrowRight, Sparkles, Plus, Check } from 'lucide-react';
import type { IdeaVariation, Idea } from '../../types/idea';

interface IdeaVariationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  idea: Idea | null;
  variations: IdeaVariation[];
  loading: boolean;
  onAdoptVariation: (variation: IdeaVariation) => void;
  onSaveAsNewIdea: (variation: IdeaVariation) => void;
}

export function IdeaVariationsModal({
  isOpen,
  onClose,
  idea,
  variations,
  loading,
  onAdoptVariation,
  onSaveAsNewIdea,
}: IdeaVariationsModalProps) {
  const [savedIndex, setSavedIndex] = React.useState<number | null>(null);

  if (!isOpen || !idea) return null;

  const handleSave = (variation: IdeaVariation, idx: number) => {
    onSaveAsNewIdea(variation);
    setSavedIndex(idx);
    setTimeout(() => setSavedIndex(null), 2000);
  };

  const getAngleBadgeColor = (angle: string) => {
    switch (angle) {
      case 'Curiosity':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Problem/Solution':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Story':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Contrarian':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'Educational':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                5 Content Angle Multiplier
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Angle Engine
                </span>
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-md">Base Topic: {idea.title}</p>
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
        <div className="p-6 overflow-y-auto space-y-4">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-10 h-10 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-white">Synthesizing 5 Distinct Angles...</p>
              <p className="text-xs text-slate-400 max-w-sm">
                Engineering Curiosity, Problem/Solution, Story, Contrarian, and Masterclass angles to multiply your reach.
              </p>
            </div>
          ) : variations.length > 0 ? (
            <div className="space-y-4">
              {variations.map((v, idx) => {
                const isSaved = savedIndex === idx;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-md border ${getAngleBadgeColor(
                          v.angleType
                        )}`}
                      >
                        {v.angleType} Angle
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSave(v, idx)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
                        >
                          {isSaved ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              Saved
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              Save as Idea
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            onAdoptVariation(v);
                            onClose();
                          }}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 shadow-sm shadow-cyan-500/20 transition-all"
                        >
                          <span>Generate Script</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white mb-1">{v.title}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed mb-2">{v.concept}</p>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-cyan-300 font-mono italic">
                        <span className="text-slate-500 not-italic mr-1.5 font-bold uppercase text-[10px]">Hook:</span>
                        "{v.hook}"
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 border-t border-slate-800/60 pt-2 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
                      <span>{v.rationale}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-8">No variations available.</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
