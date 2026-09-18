import React, { useState } from 'react';
import {
  Clapperboard,
  BookOpen,
  Users,
  Film,
  ShieldCheck,
  Compass,
  AlertTriangle,
  Sparkles,
  Plus,
  Check,
  ChevronRight,
  MapPin,
  Clock,
  Shirt,
  Package,
  Layers,
  Activity,
  HeartHandshake,
  Globe,
  Tag,
} from 'lucide-react';
import type { Script } from '../../types/script';
import type {
  FilmStoryBible,
  CharacterProfile,
  StoryBeat,
  SceneContinuityItem,
  WorldBuildingRule,
} from '../../types/film';
import { buildFilmStoryBible } from '../../services/filmIntelligenceService';

interface FilmIntelligenceStudioProps {
  script: Script;
  onSaveBible?: (bible: FilmStoryBible) => Promise<void>;
  onNotification?: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const FilmIntelligenceStudio: React.FC<FilmIntelligenceStudioProps> = ({
  script,
  onSaveBible,
  onNotification,
}) => {
  const [bible, setBible] = useState<FilmStoryBible>(() => buildFilmStoryBible(script));
  const [activeTab, setActiveTab] = useState<'beats' | 'characters' | 'continuity' | 'world_rules' | 'copyright'>('beats');
  const [selectedCharId, setSelectedCharId] = useState<string>(bible.characters[0]?.id || '');
  const [isSaving, setIsSaving] = useState(false);

  const selectedChar = bible.characters.find((c) => c.id === selectedCharId) || bible.characters[0];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSaveBible) {
        await onSaveBible(bible);
      }
      onNotification?.('Film Story Bible saved to project database', 'success');
    } catch (err: any) {
      onNotification?.('Failed to save Story Bible: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* TOP HEADER */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Clapperboard className="w-3 h-3" /> Cinematic Film & Narrative Bible
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Format: {bible.format}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Film className="w-5 h-5 text-amber-400" />
              Film Intelligence & Story Bible Mode
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl">
              Synthesize 3-Act narrative beat sheets, track character memory banks and relationship tensions, audit scene continuity, and inspect copyright risk boundaries.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Check className="w-3.5 h-3.5" />
              {isSaving ? 'Saving Bible...' : 'Save Story Bible'}
            </button>
          </div>
        </div>

        {/* LOGLINE CARD */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400 uppercase font-bold">Narrative Premise & Logline:</span>
            <span className="text-amber-400">{bible.genres.join(' • ')}</span>
          </div>
          <p className="text-xs text-slate-200 italic font-sans leading-relaxed">
            "{bible.logline}"
          </p>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 overflow-x-auto">
          {[
            { id: 'beats', label: '3-Act Beat Sheet', icon: Activity },
            { id: 'characters', label: 'Character Memory Bank', icon: Users },
            { id: 'continuity', label: 'Scene Continuity Tracker', icon: Clock },
            { id: 'world_rules', label: 'World-Building Rules', icon: Globe },
            { id: 'copyright', label: 'IP & Copyright Review', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: 3-ACT BEAT SHEET */}
      {activeTab === 'beats' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Hollywood 3-Act Structure / Save the Cat Beat Sheet
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              10 Macro Story Turning Points
            </span>
          </div>

          <div className="space-y-3">
            {bible.beats.map((beat) => (
              <div
                key={beat.id}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      ACT {beat.act}
                    </span>
                    <span className="text-xs font-mono text-amber-400 font-bold">
                      {beat.timecodePercent}% mark
                    </span>
                    {beat.keyTurningPoint && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        KEY TURNING POINT
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    {beat.beatName}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {beat.description}
                  </p>
                </div>

                <div className="flex md:flex-col items-center md:items-end justify-between gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    Dramatic Tension:
                  </span>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 10 }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 h-4 rounded-sm ${
                          idx < beat.dramaticTension
                            ? beat.dramaticTension >= 8
                              ? 'bg-rose-500'
                              : 'bg-amber-400'
                            : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: CHARACTER MEMORY BANK */}
      {activeTab === 'characters' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Characters List (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 px-1">
              Characters ({bible.characters.length})
            </div>
            {bible.characters.map((char) => {
              const isSelected = char.id === selectedChar?.id;
              return (
                <button
                  key={char.id}
                  onClick={() => setSelectedCharId(char.id)}
                  className={`w-full p-4 rounded-xl border text-left transition-all space-y-1.5 ${
                    isSelected
                      ? 'bg-amber-950/20 border-amber-500/60 ring-1 ring-amber-500/40 shadow-md'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{char.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700 font-bold">
                      {char.archetype}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {char.logline}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Character Dossier (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {selectedChar && (
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedChar.name}</h3>
                    <span className="text-xs font-mono text-amber-400 uppercase">
                      Archetype: {selectedChar.archetype}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                    Arc: {selectedChar.arcStatus}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                      Core Desire:
                    </span>
                    <p className="text-xs text-slate-200">{selectedChar.coreDesire}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-rose-400 font-bold">
                      Internal Flaw:
                    </span>
                    <p className="text-xs text-slate-200">{selectedChar.internalFlaw}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold">
                      External Goal:
                    </span>
                    <p className="text-xs text-slate-200">{selectedChar.externalGoal}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                      Voice Cadence:
                    </span>
                    <p className="text-xs text-slate-200">{selectedChar.voiceCadence}</p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <span className="text-xs font-semibold text-slate-300">Backstory Lore:</span>
                  <p className="text-xs text-slate-300 p-3.5 rounded-xl bg-slate-950 border border-slate-800 leading-relaxed">
                    {selectedChar.backstory}
                  </p>
                </div>

                {/* Relationships */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-xs font-bold text-white font-mono uppercase">
                    Interpersonal Relationship Dynamics:
                  </span>
                  <div className="space-y-2">
                    {bible.relationships.map((rel) => (
                      <div
                        key={rel.id}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-mono text-amber-400 font-bold uppercase">
                            [{rel.dynamic}]
                          </span>
                          <span className="text-slate-300 ml-2">{rel.description}</span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-rose-400 font-bold">
                          Tension: {rel.tensionScore}/10
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SCENE CONTINUITY */}
      {activeTab === 'continuity' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Production Scene Continuity Matrix
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Tracks time of day, props, and wardrobe regressions
            </span>
          </div>

          <div className="space-y-3">
            {bible.continuity.map((item) => (
              <div
                key={item.sceneNumber}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-amber-400">
                      SCENE {item.sceneNumber}:
                    </span>
                    <span className="font-bold text-white text-xs">{item.sceneHeading}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {item.timeOfDay}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-slate-500 text-[9px] uppercase flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Location
                    </div>
                    <div className="text-slate-200 mt-0.5 truncate">{item.location}</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-slate-500 text-[9px] uppercase flex items-center gap-1">
                      <Package className="w-3 h-3" /> Props Logged
                    </div>
                    <div className="text-slate-200 mt-0.5 truncate">
                      {item.propContinuity.join(', ')}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-slate-500 text-[9px] uppercase flex items-center gap-1">
                      <Shirt className="w-3 h-3" /> Wardrobe
                    </div>
                    <div className="text-slate-200 mt-0.5 truncate">
                      {item.costumeContinuity.join(', ')}
                    </div>
                  </div>
                </div>

                {item.flaggedErrors && item.flaggedErrors.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{item.flaggedErrors.join(' • ')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: WORLD BUILDING RULES */}
      {activeTab === 'world_rules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              World-Building Canon & Inviolable Rules
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Internal logic preventing plot holes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bible.worldRules.map((rule) => (
              <div
                key={rule.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700 font-bold">
                    {rule.domain.replace('_', ' ')}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{rule.ruleTitle}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  "{rule.ruleStatement}"
                </p>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
                  <strong className="text-slate-300">Story Impact: </strong>
                  {rule.narrativeImpact}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: COPYRIGHT & IP RISK REVIEW */}
      {activeTab === 'copyright' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Cinematic Copyright & IP Risk Audit
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Overall Status: {bible.copyrightAudit.overallRiskLevel.toUpperCase()}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">Similarity Index:</div>
              <p className="text-xs text-slate-400">{bible.copyrightAudit.fairUseVerdict}</p>
            </div>
            <span className="text-lg font-mono font-black text-emerald-400">
              {bible.copyrightAudit.similarityIndexPercent}%
            </span>
          </div>

          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-white font-mono uppercase">
              Detected Narrative Tropes & Fair-Use Analysis:
            </span>
            <div className="space-y-3">
              {bible.copyrightAudit.detectedParallels.map((parallel, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-mono">
                      Parallel Reference: {parallel.parallelTitle}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      {parallel.riskType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    <strong>Analyzed Element:</strong> {parallel.elementOrTrope}
                  </p>
                  <p className="text-xs text-emerald-400/90 font-mono">
                    <strong>Mitigation Guidance:</strong> {parallel.mitigationAdvice}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
