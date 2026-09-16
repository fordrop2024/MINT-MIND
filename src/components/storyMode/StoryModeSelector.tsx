import React, { useState } from 'react';
import type { StoryMode, StoryModeProfile } from '../../types/storyMode';
import {
  getAllStoryModes,
  getStoryModeProfile,
} from '../../services/storyModeEngine';
import {
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Info,
  Check,
} from 'lucide-react';

interface StoryModeSelectorProps {
  primaryMode: StoryMode;
  secondaryModes?: StoryMode[];
  confidence?: number;
  reasoning?: string;
  onPrimaryChange: (mode: StoryMode) => void;
  onSecondaryChange?: (modes: StoryMode[]) => void;
  onAutoDetect?: () => void;
  isDetecting?: boolean;
  compact?: boolean;
  className?: string;
}

export const StoryModeSelector: React.FC<StoryModeSelectorProps> = ({
  primaryMode,
  secondaryModes = [],
  confidence,
  reasoning,
  onPrimaryChange,
  onSecondaryChange,
  onAutoDetect,
  isDetecting = false,
  compact = false,
  className = '',
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showSecondarySelect, setShowSecondarySelect] = useState(false);

  const allProfiles = getAllStoryModes();
  const currentProfile = getStoryModeProfile(primaryMode);

  // Group modes by category
  const categories: Array<StoryModeProfile['category']> = [
    'Narrative',
    'Informative',
    'Genre',
    'Lifestyle',
  ];

  const toggleSecondaryMode = (modeId: StoryMode) => {
    if (!onSecondaryChange || modeId === primaryMode) return;

    if (secondaryModes.includes(modeId)) {
      onSecondaryChange(secondaryModes.filter((m) => m !== modeId));
    } else {
      if (secondaryModes.length >= 2) {
        onSecondaryChange([secondaryModes[1], modeId]);
      } else {
        onSecondaryChange([...secondaryModes, modeId]);
      }
    }
  };

  return (
    <div
      className={`rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 text-slate-200 transition-all ${className}`}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold tracking-wide text-slate-200 uppercase font-mono">
            Story Mode Engine
          </span>
          {typeof confidence === 'number' && (
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
              title="Estimated AI classification confidence"
            >
              ~{confidence}% match
            </span>
          )}
        </div>

        {onAutoDetect && (
          <button
            type="button"
            onClick={onAutoDetect}
            disabled={isDetecting}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all disabled:opacity-50"
          >
            <Sparkles className={`w-3 h-3 ${isDetecting ? 'animate-spin text-cyan-300' : 'text-cyan-400'}`} />
            {isDetecting ? 'Detecting...' : 'Auto-Detect'}
          </button>
        )}
      </div>

      {/* Primary Mode Dropdown & Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2.5">
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Primary Mode
          </label>
          <div className="relative">
            <select
              value={primaryMode}
              onChange={(e) => onPrimaryChange(e.target.value as StoryMode)}
              className="w-full appearance-none rounded-lg bg-slate-950/80 border border-slate-700/80 px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 pr-8"
            >
              {categories.map((cat) => (
                <optgroup key={cat} label={`── ${cat} ──`}>
                  {allProfiles
                    .filter((p) => p.category === cat)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label} ({p.pacing} pace)
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Secondary Modes Summary / Button */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-medium text-slate-400">
              Secondary Accents (Max 2)
            </label>
            {onSecondaryChange && (
              <button
                type="button"
                onClick={() => setShowSecondarySelect(!showSecondarySelect)}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 underline"
              >
                {showSecondarySelect ? 'Done' : 'Customize'}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1 min-h-[30px] items-center p-1 rounded-lg bg-slate-950/40 border border-slate-800/60">
            {secondaryModes.length === 0 ? (
              <span className="text-[11px] text-slate-500 italic px-1.5">
                None (Single mode)
              </span>
            ) : (
              secondaryModes.map((sec) => (
                <span
                  key={sec}
                  className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700"
                >
                  {sec}
                  {onSecondaryChange && (
                    <button
                      type="button"
                      onClick={() => toggleSecondaryMode(sec)}
                      className="text-slate-400 hover:text-red-400"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Secondary Mode Choice Picker Drawer */}
      {showSecondarySelect && onSecondaryChange && (
        <div className="mb-3 p-2.5 rounded-lg bg-slate-950/90 border border-slate-800 space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Select up to 2 secondary influence styles:</span>
            <span className="text-slate-500 font-mono">
              {secondaryModes.length}/2 chosen
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 custom-scrollbar">
            {allProfiles
              .filter((p) => p.id !== primaryMode)
              .map((p) => {
                const isSelected = secondaryModes.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleSecondaryMode(p.id)}
                    className={`text-[10px] px-2 py-1 rounded-md border transition-all flex items-center gap-1 ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-medium'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 text-cyan-400" />}
                    {p.label}
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* Reasoning Note if present */}
      {reasoning && (
        <p className="text-[11px] text-slate-400 leading-relaxed mb-2 bg-slate-950/40 rounded-lg p-2 border border-slate-800/60">
          <span className="text-cyan-400 font-medium">Why this mode: </span>
          {reasoning}
        </p>
      )}

      {/* Collapsible Profile Directive Preview */}
      {!compact && (
        <div>
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-200 py-1 transition-colors border-t border-slate-800/60 pt-2"
          >
            <span className="flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
              <span>
                {currentProfile.label} Profile Directives (
                <span className="capitalize">{currentProfile.pacing}</span> pacing)
              </span>
            </span>
            {showDetails ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>

          {showDetails && (
            <div className="mt-2 text-[11px] text-slate-300 space-y-2 bg-slate-950/70 p-3 rounded-lg border border-slate-800 animate-fadeIn">
              <p className="text-slate-300 italic">
                "{currentProfile.description}"
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
                <div>
                  <span className="text-slate-400 font-medium block">
                    Hook Strategy:
                  </span>
                  <span className="text-slate-300">
                    {currentProfile.hookStyle}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">
                    Narration Tone:
                  </span>
                  <span className="text-slate-300">
                    {currentProfile.narrationStyle}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">
                    Visual & Camera Style:
                  </span>
                  <span className="text-slate-300">
                    {currentProfile.visualStyle} ({currentProfile.cameraStyle})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">
                    Music & Audio Design:
                  </span>
                  <span className="text-slate-300">
                    {currentProfile.musicDirection} • {currentProfile.soundDirection}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
