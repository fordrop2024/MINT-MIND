import React, { useState, useMemo, useRef } from 'react';
import {
  Image as ImageIcon,
  Sparkles,
  Copy,
  Check,
  Download,
  Sliders,
  Maximize2,
  Tv,
  Smartphone,
  Eye,
  Type,
  Palette,
  Layout,
  RefreshCw,
  Flame,
  Zap,
  Info,
  Layers,
  ArrowRight,
} from 'lucide-react';
import type { Script, ThumbnailConcept } from '../../types/script';
import {
  generateAlgorithmicThumbnails,
  getThumbnailStyleProfile,
} from '../../services/thumbnailService';

interface ThumbnailStudioProps {
  script: Script;
  onSaveThumbnails: (thumbnails: ThumbnailConcept[]) => Promise<void>;
  onRegenerateThumbnails: () => Promise<void>;
  isGenerating?: boolean;
  onNotification?: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const ThumbnailStudio: React.FC<ThumbnailStudioProps> = ({
  script,
  onSaveThumbnails,
  onRegenerateThumbnails,
  isGenerating = false,
  onNotification,
}) => {
  // Ensure concepts exist
  const concepts = useMemo<ThumbnailConcept[]>(() => {
    if (script.thumbnailConcepts && script.thumbnailConcepts.length > 0) {
      return script.thumbnailConcepts;
    }
    return generateAlgorithmicThumbnails({
      topic: script.settings.topic || script.title,
      title: script.title,
      storyMode: script.primaryMode || 'Tech Explainer',
    });
  }, [script]);

  // Active selected concept
  const [selectedConceptIndex, setSelectedConceptIndex] = useState(0);
  const activeConcept = concepts[selectedConceptIndex] || concepts[0];

  // Canvas View Controls
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [showYoutubeOverlay, setShowYoutubeOverlay] = useState(true);
  const [showGridOverlay, setShowGridOverlay] = useState(false);
  const [copiedPromptType, setCopiedPromptType] = useState<string | null>(null);

  // Live Canvas Customization State
  const [canvasText, setCanvasText] = useState(activeConcept?.primaryTextOverlay || 'STOP DOING THIS!');
  const [canvasBadge, setCanvasBadge] = useState(activeConcept?.secondaryTextOverlay || '(WATCH THIS)');
  const [fontFamily, setFontFamily] = useState(activeConcept?.fontFamily || 'Impact');
  const [fontSize, setFontSize] = useState(activeConcept?.fontSize || 48);
  const [textColor, setTextColor] = useState(activeConcept?.textColor || '#ffffff');
  const [textBgColor, setTextBgColor] = useState(activeConcept?.textBgColor || '#dc2626');
  const [textPosition, setTextPosition] = useState<'top-left' | 'center' | 'bottom-left' | 'right-third'>('top-left');

  // When active concept changes, load its attributes
  const handleSelectConcept = (index: number) => {
    setSelectedConceptIndex(index);
    const concept = concepts[index];
    if (concept) {
      setCanvasText(concept.primaryTextOverlay || concept.overlayText || 'WATCH THIS');
      setCanvasBadge(concept.secondaryTextOverlay || '');
      if (concept.fontFamily) setFontFamily(concept.fontFamily);
      if (concept.fontSize) setFontSize(concept.fontSize);
      if (concept.textColor) setTextColor(concept.textColor);
      if (concept.textBgColor) setTextBgColor(concept.textBgColor);
    }
  };

  // Copy helper
  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptType(type);
    onNotification?.(`Copied ${type} prompt to clipboard`, 'success');
    setTimeout(() => {
      setCopiedPromptType(null);
    }, 2000);
  };

  // Save changes to current concept
  const handleSaveConceptChanges = async () => {
    const updated = concepts.map((c, i) => {
      if (i === selectedConceptIndex) {
        return {
          ...c,
          primaryTextOverlay: canvasText,
          overlayText: canvasText,
          secondaryTextOverlay: canvasBadge,
          fontFamily,
          fontSize,
          textColor,
          textBgColor,
          aspectRatio,
        };
      }
      return c;
    });

    await onSaveThumbnails(updated);
    onNotification?.('Saved customized thumbnail concept', 'success');
  };

  const styleProfile = useMemo(
    () => getThumbnailStyleProfile(script.primaryMode),
    [script.primaryMode]
  );

  return (
    <div className="space-y-6">
      {/* TOP HEADER */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Visual Packaging Studio
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Story Mode: {script.primaryMode || 'Tech Explainer'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-amber-400" />
              AI Thumbnail Concept & Packaging Studio
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl">
              High-CTR composition layouts, psychological text hooks, and production-ready Midjourney v6 / Flux prompts aligned with your script’s story mode.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Dimension Toggle */}
            <div className="p-1 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-1">
              <button
                onClick={() => setAspectRatio('16:9')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  aspectRatio === '16:9'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                16:9 Standard
              </button>
              <button
                onClick={() => setAspectRatio('9:16')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  aspectRatio === '9:16'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                9:16 Shorts
              </button>
            </div>

            <button
              onClick={onRegenerateThumbnails}
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Synthesizing...' : 'Regenerate Concepts'}
            </button>
          </div>
        </div>

        {/* CONCEPT SELECTOR CARDS STRIP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80">
          {concepts.map((concept, idx) => {
            const isSelected = idx === selectedConceptIndex;
            return (
              <button
                key={concept.id || idx}
                onClick={() => handleSelectConcept(idx)}
                className={`p-3.5 rounded-xl border text-left transition-all space-y-2 ${
                  isSelected
                    ? 'bg-amber-950/20 border-amber-500/60 ring-1 ring-amber-500/50 shadow-lg'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-amber-400">
                    Concept #{idx + 1}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                    {concept.predictedCTRRating?.split('-')[0] || '11.4% CTR'}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white truncate">
                  {concept.conceptTitle}
                </h4>
                <div className="text-[11px] font-extrabold text-amber-300 font-mono truncate">
                  "{concept.primaryTextOverlay || concept.overlayText}"
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN WORKSPACE: CANVAS ON LEFT, CONTROLS & PROMPTS ON RIGHT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CANVAS PREVIEW (7 COLS) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layout className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Live Canvas Layout
                </h3>
              </div>

              {/* Simulation toggles */}
              <div className="flex items-center gap-2 text-xs font-mono">
                <button
                  onClick={() => setShowGridOverlay(!showGridOverlay)}
                  className={`px-2.5 py-1 rounded-lg border transition-all ${
                    showGridOverlay
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  3x3 Grid
                </button>
                <button
                  onClick={() => setShowYoutubeOverlay(!showYoutubeOverlay)}
                  className={`px-2.5 py-1 rounded-lg border transition-all ${
                    showYoutubeOverlay
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  YouTube UI Safe
                </button>
              </div>
            </div>

            {/* INTERACTIVE CANVAS CONTAINER */}
            <div className="flex justify-center items-center py-2 bg-slate-950/60 rounded-xl p-4 border border-slate-800/80">
              <div
                className={`relative overflow-hidden rounded-xl shadow-2xl border-2 border-slate-800 flex flex-col justify-between transition-all ${
                  aspectRatio === '16:9'
                    ? 'w-full max-w-[560px] aspect-video'
                    : 'w-64 aspect-[9/16]'
                }`}
                style={{
                  background: `linear-gradient(135deg, #090d16 0%, #1e1b4b 50%, #0f172a 100%)`,
                }}
              >
                {/* Visual Composition Background Simulation */}
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_70%_50%,#06b6d4_0%,transparent_60%)]" />
                <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_30%_30%,#f59e0b_0%,transparent_50%)]" />

                {/* Optional 3x3 Rule-of-Thirds Grid */}
                {showGridOverlay && (
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none z-10">
                    <div className="border-r border-b border-white/20" />
                    <div className="border-r border-b border-white/20" />
                    <div className="border-b border-white/20" />
                    <div className="border-r border-b border-white/20" />
                    <div className="border-r border-b border-white/20" />
                    <div className="border-b border-white/20" />
                    <div className="border-r border-white/20" />
                    <div className="border-r border-white/20" />
                    <div />
                  </div>
                )}

                {/* TEXT OVERLAY POSITION CONTAINER */}
                <div
                  className={`relative z-20 p-5 flex flex-col ${
                    textPosition === 'top-left'
                      ? 'items-start justify-start'
                      : textPosition === 'center'
                      ? 'items-center justify-center my-auto'
                      : textPosition === 'right-third'
                      ? 'items-end justify-start text-right'
                      : 'items-start justify-end mt-auto'
                  }`}
                >
                  {/* Secondary Badge Pill */}
                  {canvasBadge && (
                    <span className="mb-2 px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-black/80 text-yellow-300 border border-yellow-400/40 shadow-lg">
                      {canvasBadge}
                    </span>
                  )}

                  {/* Primary Text Pill */}
                  <div
                    className="px-3.5 py-1.5 rounded-lg shadow-2xl font-black uppercase tracking-wider inline-block leading-tight select-none"
                    style={{
                      fontFamily,
                      fontSize: `${Math.min(aspectRatio === '9:16' ? 26 : 42, fontSize)}px`,
                      color: textColor,
                      backgroundColor: textBgColor,
                      textShadow: '0 4px 12px rgba(0,0,0,0.8)',
                    }}
                  >
                    {canvasText}
                  </div>
                </div>

                {/* Focal Subject Placeholder Representation */}
                <div className="relative z-10 p-4 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-black/50 backdrop-blur-sm border border-white/10">
                    Focal Point: {activeConcept?.focalPoint?.slice(0, 35) || 'Expressive Subject'}
                  </span>
                </div>

                {/* YOUTUBE UI OVERLAY SIMULATION */}
                {showYoutubeOverlay && (
                  <>
                    {/* Bottom-right video timestamp badge */}
                    <div className="absolute bottom-2.5 right-2.5 z-30 px-2 py-0.5 rounded bg-black/90 text-white font-mono text-[10px] font-bold border border-white/20 shadow-lg">
                      14:28
                    </div>

                    {/* YouTube mobile safe zone notification */}
                    <div className="absolute top-2 right-2 z-30 px-2 py-0.5 rounded bg-black/60 text-slate-300 font-mono text-[9px]">
                      Safe Zone Active
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ART PROMPT EXPORT BAR */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Image Model Generation Prompts
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Ready to paste into Midjourney, Flux, or DALL-E
                </span>
              </div>

              {/* Midjourney v6 Prompt */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-amber-400 uppercase">
                    Midjourney v6 Prompt (With Camera & Aspect Tags)
                  </span>
                  <button
                    onClick={() =>
                      handleCopy(activeConcept.midjourneyPrompt || '', 'Midjourney')
                    }
                    className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    {copiedPromptType === 'Midjourney' ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    Copy Prompt
                  </button>
                </div>
                <p className="text-xs text-slate-300 font-mono leading-relaxed select-all">
                  {activeConcept.midjourneyPrompt}
                </p>
              </div>

              {/* Flux / SDXL 8K Prompt */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase">
                    Flux / Stable Diffusion 8K Prompt
                  </span>
                  <button
                    onClick={() => handleCopy(activeConcept.fluxPrompt || '', 'Flux')}
                    className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    {copiedPromptType === 'Flux' ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    Copy Prompt
                  </button>
                </div>
                <p className="text-xs text-slate-300 font-mono leading-relaxed select-all">
                  {activeConcept.fluxPrompt}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CONTROLS & PSYCHOLOGICAL DETAILS (5 COLS) */}
        <div className="lg:col-span-5 space-y-5">
          {/* TEXT & TYPOGRAPHY CONTROLS */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Text & Typography Controls
                </h3>
              </div>
              <button
                onClick={handleSaveConceptChanges}
                className="text-xs font-mono font-bold text-amber-400 hover:underline"
              >
                Save Edits
              </button>
            </div>

            {/* Primary Text */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">
                Primary Text Overlay (Max 3-4 Words):
              </label>
              <input
                type="text"
                value={canvasText}
                onChange={(e) => setCanvasText(e.target.value)}
                maxLength={25}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-bold tracking-wider focus:outline-none focus:border-amber-500"
                placeholder="e.g. NEVER DO THIS!"
              />
            </div>

            {/* Secondary Badge Text */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">
                Secondary Badge Pill (Optional Proof / Timeframe):
              </label>
              <input
                type="text"
                value={canvasBadge}
                onChange={(e) => setCanvasBadge(e.target.value)}
                maxLength={20}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                placeholder="e.g. (10X RESULTS)"
              />
            </div>

            {/* Font Family & Position */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Font:</label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Impact">Impact Bold</option>
                  <option value="Montserrat, sans-serif">Montserrat Black</option>
                  <option value="'Bebas Neue', sans-serif">Bebas Neue</option>
                  <option value="'Oswald', sans-serif">Oswald Bold</option>
                  <option value="system-ui">Modern Sans</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Position:</label>
                <select
                  value={textPosition}
                  onChange={(e) => setTextPosition(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="top-left">Top-Left (Highest CTR)</option>
                  <option value="center">Center Punch</option>
                  <option value="bottom-left">Bottom-Left</option>
                  <option value="right-third">Right-Third</option>
                </select>
              </div>
            </div>

            {/* Colors Preset Row */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-slate-400">
                Pill Color Harmony Presets:
              </label>
              <div className="flex items-center gap-2">
                {[
                  { bg: '#dc2626', text: '#ffffff', label: 'Crimson Shock' },
                  { bg: '#10b981', text: '#ffffff', label: 'Emerald Proof' },
                  { bg: '#f59e0b', text: '#000000', label: 'Amber Alert' },
                  { bg: '#06b6d4', text: '#000000', label: 'Electric Cyan' },
                  { bg: '#000000', text: '#facc15', label: 'Dark Charcoal' },
                ].map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => {
                      setTextBgColor(preset.bg);
                      setTextColor(preset.text);
                    }}
                    className="flex-1 py-1.5 rounded-lg border border-slate-700 text-[10px] font-bold transition-transform hover:scale-105"
                    style={{ backgroundColor: preset.bg, color: preset.text }}
                  >
                    {preset.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CONCEPT PSYCHOLOGY & COMPOSITION BREAKDOWN */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Packaging Psychology & Composition
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-mono text-[10px] uppercase font-bold text-slate-400">
                  Visual Layout:
                </span>
                <p className="text-slate-200 leading-relaxed">
                  {activeConcept.layoutDescription}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-mono text-[10px] uppercase font-bold text-slate-400">
                  Color Contrast Theory:
                </span>
                <p className="text-slate-200 leading-relaxed">
                  {activeConcept.colorTheory}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-mono text-[10px] uppercase font-bold text-slate-400">
                  Story Mode Aesthetic Rules:
                </span>
                <p className="text-slate-200 leading-relaxed">
                  {styleProfile.lighting}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
