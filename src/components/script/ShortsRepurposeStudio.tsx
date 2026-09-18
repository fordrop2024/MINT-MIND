import React, { useState, useEffect, useMemo } from 'react';
import {
  Smartphone,
  Sparkles,
  Copy,
  Check,
  Zap,
  Play,
  Scissors,
  FileText,
  Clock,
  Flame,
  ArrowRight,
  TrendingUp,
  Download,
  Plus,
  RefreshCw,
  Heart,
  MessageCircle,
  Share2,
  Disc,
} from 'lucide-react';
import type { Script } from '../../types/script';
import type { RepurposedShort } from '../../types/repurposing';
import {
  extractShortsAlgorithmically,
  extractShortsFromScript,
  convertShortToScript,
  exportShortAsEditorCues,
} from '../../services/repurposingService';

interface ShortsRepurposeStudioProps {
  script: Script;
  onCreateNewScript?: (newScript: Script) => Promise<void>;
  onNotification?: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const ShortsRepurposeStudio: React.FC<ShortsRepurposeStudioProps> = ({
  script,
  onCreateNewScript,
  onNotification,
}) => {
  const [shortsList, setShortsList] = useState<RepurposedShort[]>(() =>
    extractShortsAlgorithmically(script, { duration: 45 })
  );
  const [selectedShortIdx, setSelectedShortIdx] = useState(0);
  const [targetDuration, setTargetDuration] = useState<15 | 30 | 45 | 60>(45);
  const [isExtracting, setIsExtracting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const activeShort = shortsList[selectedShortIdx] || shortsList[0];

  // Editable fields
  const [editHook, setEditHook] = useState(activeShort?.hookText || '');
  const [editBody, setEditBody] = useState(activeShort?.bodyText || '');
  const [editCta, setEditCta] = useState(activeShort?.ctaText || '');

  // Keep editor state in sync when active short changes
  useEffect(() => {
    if (activeShort) {
      setEditHook(activeShort.hookText);
      setEditBody(activeShort.bodyText);
      setEditCta(activeShort.ctaText);
    }
  }, [activeShort]);

  // Extract fresh shorts with AI
  const handleExtractWithAI = async () => {
    setIsExtracting(true);
    try {
      const extracted = await extractShortsFromScript(script, { duration: targetDuration });
      setShortsList(extracted);
      setSelectedShortIdx(0);
      onNotification?.(`Extracted ${extracted.length} viral Shorts angles`, 'success');
    } catch (err: any) {
      onNotification?.('Failed to extract shorts with AI, using algorithmic engine', 'warning');
    } finally {
      setIsExtracting(false);
    }
  };

  // Copy helper
  const handleCopy = (text: string, key: string, label = 'Copied to clipboard') => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onNotification?.(label, 'success');
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  // Save changes to current short in local list
  const handleSaveLocalEdits = () => {
    const updated = shortsList.map((s, idx) => {
      if (idx === selectedShortIdx) {
        return {
          ...s,
          hookText: editHook,
          bodyText: editBody,
          ctaText: editCta,
          fullScript: `${editHook}\n\n${editBody}\n\n${editCta}`,
        };
      }
      return s;
    });
    setShortsList(updated);
    onNotification?.('Short script edits updated', 'success');
  };

  // Create as new MintMind Script
  const handleConvertToMintMindScript = async () => {
    if (!onCreateNewScript || !activeShort) return;
    try {
      const newScript = convertShortToScript(activeShort, script);
      await onCreateNewScript(newScript);
      onNotification?.(`Created new standalone script: "${activeShort.title}"`, 'success');
    } catch (err: any) {
      onNotification?.('Failed to create script from Short', 'error');
    }
  };

  // Pacing calculation
  const totalWords = useMemo(() => {
    const text = `${editHook} ${editBody} ${editCta}`;
    return text.trim().split(/\s+/).filter(Boolean).length;
  }, [editHook, editBody, editCta]);

  const estimatedWPM = Math.round((totalWords / (targetDuration / 60)));

  return (
    <div className="space-y-6">
      {/* TOP HEADER */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                Viral Repurposing Engine
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Source: {script.title}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Scissors className="w-5 h-5 text-rose-400" />
              Long-Form to Shorts & Reels Repurposing Studio
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl">
              Extract high-density 9:16 vertical scripts from your full long-form video. Engineered with multi-hook psychology, 4-second pattern interrupts, and instant standalone script export.
            </p>
          </div>

          {/* Action Controls */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Target Duration Selector */}
            <div className="p-1 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-1">
              {([15, 30, 45, 60] as const).map((dur) => (
                <button
                  key={dur}
                  onClick={() => {
                    setTargetDuration(dur);
                    setShortsList(extractShortsAlgorithmically(script, { duration: dur }));
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    targetDuration === dur
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {dur}s
                </button>
              ))}
            </div>

            <button
              onClick={handleExtractWithAI}
              disabled={isExtracting}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white transition-all flex items-center gap-2 shadow-lg shadow-rose-500/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isExtracting ? 'animate-spin' : ''}`} />
              {isExtracting ? 'Extracting Hooks...' : 'Extract with Gemini'}
            </button>
          </div>
        </div>

        {/* SHORTS ANGLE DECK */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80">
          {shortsList.map((item, idx) => {
            const isSelected = idx === selectedShortIdx;
            return (
              <button
                key={item.id || idx}
                onClick={() => setSelectedShortIdx(idx)}
                className={`p-3.5 rounded-xl border text-left transition-all space-y-2 ${
                  isSelected
                    ? 'bg-rose-950/20 border-rose-500/60 ring-1 ring-rose-500/50 shadow-lg'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-rose-400">
                    Hook #{idx + 1}: {item.hookType}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                    {item.estimatedRetentionScore || 90}% Retention
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white truncate">
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  "{item.hookText}"
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* PHONE SIMULATOR (5 COLS) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  9:16 Feed Preview
                </h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                Pacing: ~{estimatedWPM} WPM ({totalWords} words)
              </span>
            </div>

            {/* VERTICAL PHONE FRAME */}
            <div className="flex justify-center items-center py-2">
              <div className="relative w-64 aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-black p-4 flex flex-col justify-between">
                {/* Visual Ambient glow */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,#f43f5e_0%,transparent_70%)] pointer-events-none" />

                {/* Top Bar Indicator */}
                <div className="relative z-10 flex items-center justify-between text-[9px] font-mono text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-white/10">
                    {targetDuration}s Short
                  </span>
                  <span className="flex items-center gap-1 text-rose-400 font-bold">
                    <Flame className="w-3 h-3" /> High Virality
                  </span>
                </div>

                {/* Center Kinetic Hook Text Simulation */}
                <div className="relative z-10 text-center space-y-3 my-auto px-2">
                  <div className="inline-block px-3 py-1.5 rounded-lg bg-rose-600 text-white font-black uppercase text-xs tracking-wider shadow-xl leading-tight">
                    {editHook.slice(0, 48)}...
                  </div>
                  <div className="text-[11px] font-bold text-slate-200 leading-snug drop-shadow-md">
                    {editBody.slice(0, 90)}...
                  </div>
                </div>

                {/* Simulated Right-Side Shorts UI Buttons */}
                <div className="absolute right-2 bottom-20 z-20 flex flex-col items-center gap-3 text-white text-[10px] font-mono">
                  <div className="flex flex-col items-center">
                    <div className="p-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/20">
                      <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
                    </div>
                    <span className="text-[9px] mt-0.5">84.2K</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="p-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/20">
                      <MessageCircle className="w-4 h-4 text-slate-200" />
                    </div>
                    <span className="text-[9px] mt-0.5">1.4K</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="p-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/20">
                      <Share2 className="w-4 h-4 text-slate-200" />
                    </div>
                    <span className="text-[9px] mt-0.5">Share</span>
                  </div>
                  <div className="p-2 rounded-full bg-black/60 border border-rose-500/40 animate-spin-slow">
                    <Disc className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                </div>

                {/* Bottom Metadata & Sound Track */}
                <div className="relative z-10 space-y-1 text-[10px] text-white pr-10">
                  <div className="font-bold flex items-center gap-1 text-rose-300">
                    @mintmind.creator • Follow
                  </div>
                  <div className="text-slate-300 truncate">
                    {editCta || 'Follow for part 2!'}
                  </div>
                  <div className="text-[9px] font-mono text-cyan-400 truncate">
                    🎵 {activeShort?.audioRecommendation || '128 BPM Fast Synth'}
                  </div>
                </div>
              </div>
            </div>

            {/* EXPORT ACTIONS */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() =>
                  handleCopy(activeShort.fullScript, 'full-script', 'Short script copied to clipboard')
                }
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center justify-center gap-2"
              >
                {copiedKey === 'full-script' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copied Full Voice Script!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-rose-400" />
                    Copy Shorts Voice Script
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  const cues = exportShortAsEditorCues(activeShort);
                  handleCopy(cues, 'capcut-cues', 'CapCut / Premiere markers copied');
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-all flex items-center justify-center gap-2"
              >
                {copiedKey === 'capcut-cues' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copied CapCut / Premiere Markers!
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    Copy CapCut / Premiere Cut Markers
                  </>
                )}
              </button>

              {onCreateNewScript && (
                <button
                  onClick={handleConvertToMintMindScript}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create As Standalone Script in MintMind
                </button>
              )}
            </div>
          </div>
        </div>

        {/* SCRIPT EDITOR & PATTERN INTERRUPTS (7 COLS) */}
        <div className="lg:col-span-7 space-y-5">
          {/* SCRIPT SECTION EDITORS */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Short-Form Script Structure
                </h3>
              </div>
              <button
                onClick={handleSaveLocalEdits}
                className="text-xs font-mono font-bold text-rose-400 hover:underline"
              >
                Save Edits
              </button>
            </div>

            {/* 1. Psychological Hook */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Hook (0 - 5 seconds):
                </span>
                <span className="font-mono text-[10px] text-slate-500 uppercase">
                  Angle: {activeShort.hookType}
                </span>
              </div>
              <textarea
                value={editHook}
                onChange={(e) => setEditHook(e.target.value)}
                rows={2}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-bold tracking-wide focus:outline-none focus:border-rose-500 resize-none leading-relaxed"
                placeholder="Hook sentence..."
              />
            </div>

            {/* 2. Body Breakdown */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                Body Insight & Core Value (5 - 35 seconds):
              </span>
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={4}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-rose-500 resize-y leading-relaxed"
                placeholder="High-density body explanation..."
              />
            </div>

            {/* 3. Call to Action */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Call to Action (CTA) & Debate Trigger (Last 5 seconds):
              </span>
              <textarea
                value={editCta}
                onChange={(e) => setEditCta(e.target.value)}
                rows={2}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-rose-500 resize-none leading-relaxed"
                placeholder="CTA trigger..."
              />
            </div>
          </div>

          {/* 4-SECOND PATTERN INTERRUPT TIMELINE */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Retention Pattern Interrupts ({activeShort.patternInterrupts?.length || 0})
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Paced every 4-5s to prevent swipe-away
              </span>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {activeShort.patternInterrupts?.map((pi, pIdx) => (
                <div
                  key={pIdx}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {pi.timecode}
                    </span>
                    <span className="font-mono text-[10px] uppercase font-bold text-slate-400 px-1.5 py-0.5 rounded bg-slate-900">
                      {pi.type.replace('_', ' ')}
                    </span>
                    <span className="text-slate-200 truncate">{pi.cueDescription}</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono uppercase font-bold ${
                      pi.intensity === 'high'
                        ? 'text-rose-400'
                        : pi.intensity === 'medium'
                        ? 'text-amber-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {pi.intensity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
