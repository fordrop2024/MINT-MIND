import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Copy,
  Check,
  Subtitles,
  Sliders,
  Palette,
  Type,
  Maximize2,
  Minimize2,
  Plus,
  Trash2,
  RefreshCw,
  Clock,
  Sparkles,
  Volume2,
} from 'lucide-react';
import type { Script, CaptionLine, CaptionConfig, CaptionWord } from '../../types/script';
import { useScript } from '../../context/ScriptContext';
import {
  generateSRT,
  generateVTT,
  generateJSONExport,
  downloadCaptionFile,
  recalculateWordsTiming,
} from '../../services/captionExportService';

interface KineticCaptionStudioProps {
  script: Script;
  onNotification?: (msg: string) => void;
}

export function KineticCaptionStudio({ script, onNotification }: KineticCaptionStudioProps) {
  const { updateCaptionConfig, updateCaptions, generateCaptions, isGenerating } = useScript();

  // Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>(
    script.aspectRatio === '9:16' || script.type?.toLowerCase().includes('short') ? '9:16' : '16:9'
  );
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);

  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const captions = script.captions || [];
  const config: CaptionConfig = script.captionConfig || {
    style: 'bold_pop',
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 28,
    textColor: '#ffffff',
    highlightColor: '#22d3ee',
    position: 'bottom',
    animation: 'word_by_word',
    language: script.settings?.language || 'English',
  };

  // Calculate total runtime from captions or scenes
  const totalDuration = Math.max(
    5,
    captions.length > 0
      ? captions[captions.length - 1].endSec
      : script.scenes?.reduce((acc, s) => acc + (s.audioTiming?.durationSec || s.durationSec || 5), 0) || 30
  );

  // Animation Loop for Smooth Playback
  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = null;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      return;
    }

    const animate = (time: number) => {
      if (lastTimeRef.current !== null) {
        const deltaSec = ((time - lastTimeRef.current) / 1000) * playbackSpeed;
        setCurrentTime((prev) => {
          const next = prev + deltaSec;
          if (next >= totalDuration) {
            if (isLooping) {
              return 0;
            } else {
              setIsPlaying(false);
              return totalDuration;
            }
          }
          return next;
        });
      }
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, playbackSpeed, totalDuration, isLooping]);

  // Find active caption block based on current playback time
  const activeCaption = captions.find(
    (cap) => currentTime >= cap.startSec && currentTime <= cap.endSec
  );

  // Find active scene image for backdrop
  const activeScene = script.scenes?.find((scene) => {
    const start = scene.audioTiming?.startSec ?? 0;
    const end = scene.audioTiming?.endSec ?? (start + (scene.durationSec || 5));
    return currentTime >= start && currentTime <= end;
  }) || script.scenes?.[0];

  // Format Time Helper MM:SS.S
  const formatPlaybackTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const tenths = Math.floor((sec % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${tenths}`;
  };

  // Handle Caption Styling Config Changes
  const handleConfigUpdate = async (updates: Partial<CaptionConfig>) => {
    await updateCaptionConfig(script.id, updates);
    if (onNotification && updates.style) {
      onNotification(`Updated caption style to ${updates.style}`);
    }
  };

  // Caption Editing Handlers
  const handleUpdateLineText = async (id: string, newText: string) => {
    const updated = captions.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          text: newText,
          words: recalculateWordsTiming(newText, c.startSec, c.endSec),
        };
      }
      return c;
    });
    await updateCaptions(script.id, updated);
  };

  const handleUpdateLineTiming = async (id: string, startSec: number, endSec: number) => {
    const safeStart = Math.max(0, startSec);
    const safeEnd = Math.max(safeStart + 0.5, endSec);
    const updated = captions.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          startSec: safeStart,
          endSec: safeEnd,
          words: recalculateWordsTiming(c.text, safeStart, safeEnd),
        };
      }
      return c;
    });
    await updateCaptions(script.id, updated);
  };

  const handleAddCaptionBlock = async () => {
    const lastCap = captions[captions.length - 1];
    const newStart = lastCap ? lastCap.endSec : 0;
    const newEnd = newStart + 4;
    const newText = 'New caption line here...';

    const newBlock: CaptionLine = {
      id: `cap-${Date.now()}`,
      startSec: newStart,
      endSec: newEnd,
      text: newText,
      words: recalculateWordsTiming(newText, newStart, newEnd),
    };

    await updateCaptions(script.id, [...captions, newBlock]);
    if (onNotification) onNotification('Added new caption block');
  };

  const handleDeleteCaptionBlock = async (id: string) => {
    const filtered = captions.filter((c) => c.id !== id);
    await updateCaptions(script.id, filtered);
    if (onNotification) onNotification('Deleted caption block');
  };

  // Export Handlers
  const handleExportSRT = () => {
    const srtContent = generateSRT(captions);
    const filename = `${script.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_captions.srt`;
    downloadCaptionFile(srtContent, filename, 'text/plain;charset=utf-8');
    if (onNotification) onNotification(`Exported ${filename} (SubRip format)`);
  };

  const handleExportVTT = () => {
    const vttContent = generateVTT(captions, script.title);
    const filename = `${script.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_captions.vtt`;
    downloadCaptionFile(vttContent, filename, 'text/vtt;charset=utf-8');
    if (onNotification) onNotification(`Exported ${filename} (WebVTT format)`);
  };

  const handleExportJSON = () => {
    const jsonContent = generateJSONExport(captions, config, script.title);
    const filename = `${script.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_captions.json`;
    downloadCaptionFile(jsonContent, filename, 'application/json;charset=utf-8');
    if (onNotification) onNotification(`Exported ${filename} (Word-Level JSON format)`);
  };

  const handleCopySRT = () => {
    const srtContent = generateSRT(captions);
    navigator.clipboard.writeText(srtContent);
    setCopiedFormat('srt');
    setTimeout(() => setCopiedFormat(null), 2000);
    if (onNotification) onNotification('Copied SRT caption track to clipboard');
  };

  // Render Caption Animation in Preview Player
  const renderKineticText = () => {
    if (!activeCaption) {
      return (
        <span className="text-xs font-mono text-slate-500 italic select-none">
          [Silence / Instrumental]
        </span>
      );
    }

    const words = activeCaption.words || [];

    // If no word-level timestamps, render full text
    if (words.length === 0) {
      return (
        <div
          style={{
            color: config.textColor,
            fontFamily: config.fontFamily,
            fontSize: `${config.fontSize}px`,
          }}
          className="font-extrabold text-center px-4 py-1.5 leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] tracking-wide"
        >
          {activeCaption.text}
        </div>
      );
    }

    // Render style variations
    switch (config.style) {
      case 'bold_pop':
        return (
          <div
            style={{
              fontFamily: config.fontFamily,
              fontSize: `${config.fontSize}px`,
            }}
            className="flex flex-wrap justify-center items-center gap-x-2 gap-y-1 px-4 py-2 font-black uppercase text-center leading-none tracking-tight drop-shadow-[0_4px_8px_rgba(0,0,0,0.95)]"
          >
            {words.map((w, idx) => {
              const isActive = currentTime >= w.startSec && currentTime <= w.endSec;
              const isPast = currentTime > w.endSec;

              return (
                <span
                  key={idx}
                  style={{
                    color: isActive ? config.highlightColor : config.textColor,
                    textShadow: isActive
                      ? `0 0 16px ${config.highlightColor}, 0 2px 4px rgba(0,0,0,0.9)`
                      : '0 2px 4px rgba(0,0,0,0.9)',
                    transform: isActive ? 'scale(1.15)' : 'scale(1)',
                    transition: 'transform 0.08s ease-out, color 0.08s ease-out',
                  }}
                  className={`inline-block ${
                    isActive ? 'font-black z-10' : isPast ? 'opacity-90' : 'opacity-70'
                  }`}
                >
                  {w.word}
                </span>
              );
            })}
          </div>
        );

      case 'cyber_neon':
        return (
          <div
            style={{
              fontFamily: 'monospace, "Courier New"',
              fontSize: `${Math.round(config.fontSize * 0.95)}px`,
            }}
            className="flex flex-wrap justify-center items-center gap-x-2 gap-y-1 px-5 py-2 font-mono font-bold tracking-widest text-center uppercase"
          >
            {words.map((w, idx) => {
              const isActive = currentTime >= w.startSec && currentTime <= w.endSec;

              return (
                <span
                  key={idx}
                  style={{
                    color: isActive ? config.highlightColor : '#e2e8f0',
                    textShadow: isActive
                      ? `0 0 10px ${config.highlightColor}, 0 0 20px ${config.highlightColor}`
                      : '0 0 2px rgba(255,255,255,0.4)',
                    borderBottom: isActive ? `2px solid ${config.highlightColor}` : 'none',
                  }}
                  className="inline-block px-0.5"
                >
                  {w.word}
                </span>
              );
            })}
          </div>
        );

      case 'karaoke_glow':
        return (
          <div
            style={{
              fontFamily: config.fontFamily,
              fontSize: `${config.fontSize}px`,
            }}
            className="flex flex-wrap justify-center items-center gap-x-2 gap-y-1 px-4 py-2 font-bold text-center leading-snug"
          >
            {words.map((w, idx) => {
              const isActive = currentTime >= w.startSec && currentTime <= w.endSec;
              const isPast = currentTime > w.endSec;

              return (
                <span
                  key={idx}
                  style={{
                    color: isPast || isActive ? config.highlightColor : 'rgba(255,255,255,0.4)',
                    textShadow: isActive
                      ? `0 0 14px ${config.highlightColor}`
                      : isPast
                      ? `0 0 6px ${config.highlightColor}`
                      : 'none',
                    transform: isActive ? 'scale(1.08)' : 'scale(1)',
                    transition: 'all 0.1s ease-in-out',
                  }}
                  className="inline-block"
                >
                  {w.word}
                </span>
              );
            })}
          </div>
        );

      case 'minimalist':
        return (
          <div
            style={{
              fontFamily: config.fontFamily,
              fontSize: `${Math.round(config.fontSize * 0.85)}px`,
            }}
            className="inline-flex flex-wrap justify-center items-center gap-x-1.5 px-4 py-1.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/10 text-center font-medium"
          >
            {words.map((w, idx) => {
              const isActive = currentTime >= w.startSec && currentTime <= w.endSec;
              return (
                <span
                  key={idx}
                  style={{
                    color: isActive ? config.highlightColor : config.textColor,
                    fontWeight: isActive ? 700 : 500,
                  }}
                  className="inline-block"
                >
                  {w.word}
                </span>
              );
            })}
          </div>
        );

      case 'classic_sub':
      default:
        return (
          <div
            style={{
              fontFamily: 'sans-serif',
              fontSize: `${Math.round(config.fontSize * 0.9)}px`,
              color: '#facc15',
            }}
            className="inline-block px-3 py-1 bg-black/80 font-bold text-center rounded leading-tight shadow-md"
          >
            {activeCaption.text}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner with Quick Telemetry & Actions */}
      <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Subtitles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white font-display">
              Captions & Kinetic Typography Studio
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              {captions.length} Timed Blocks · {totalDuration.toFixed(1)}s Runtime
            </span>
          </div>

          {/* Export & Regenerate Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportSRT}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Download standard .SRT for Premiere, DaVinci, or YouTube"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export .SRT</span>
            </button>

            <button
              onClick={handleExportVTT}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Download WebVTT .VTT for web video players"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export .VTT</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Download word-level JSON timestamps"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={handleCopySRT}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copiedFormat === 'srt' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied SRT!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Copy SRT</span>
                </>
              )}
            </button>

            <button
              onClick={() => generateCaptions(script.id)}
              disabled={isGenerating}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Re-synchronize captions from voiceover & audio cadence"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>Re-Sync</span>
            </button>
          </div>
        </div>

        {/* Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Active Style Preset</div>
            <div className="text-sm font-bold text-cyan-400 font-display mt-0.5 capitalize">
              {config.style.replace('_', ' ')}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Font & Size</div>
            <div className="text-sm font-bold text-white font-mono mt-0.5">
              {config.fontFamily.split(',')[0]} · {config.fontSize}px
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Highlight Glow</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="w-3.5 h-3.5 rounded-full border border-white/20"
                style={{ backgroundColor: config.highlightColor }}
              />
              <span className="text-xs font-bold font-mono text-slate-200">
                {config.highlightColor.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Vertical Anchor</div>
            <div className="text-sm font-bold text-indigo-400 font-mono mt-0.5 capitalize">
              {config.position} Anchor
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio Grid: Left = Live Video Player, Right = Typography & Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Video Preview Player (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-2xl glass-panel border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-mono font-bold uppercase text-slate-300">
                  Live Kinetic Overlay Preview
                </span>
                {activeScene && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    Scene #{activeScene.sceneNumber}
                  </span>
                )}
              </div>

              {/* Aspect Ratio Selector */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setAspectRatio('16:9')}
                  className={`px-2 py-1 rounded text-[11px] font-mono font-semibold transition-all ${
                    aspectRatio === '16:9'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  16:9 Cinema
                </button>
                <button
                  onClick={() => setAspectRatio('9:16')}
                  className={`px-2 py-1 rounded text-[11px] font-mono font-semibold transition-all ${
                    aspectRatio === '9:16'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  9:16 Shorts
                </button>
              </div>
            </div>

            {/* Video Canvas Stage */}
            <div
              className={`relative mx-auto rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 shadow-2xl flex items-center justify-center transition-all ${
                aspectRatio === '9:16'
                  ? 'w-[280px] h-[497px]'
                  : 'w-full aspect-video max-h-[420px]'
              }`}
            >
              {/* Scene Backdrop (Generated visual or cinematic atmospheric gradient) */}
              {activeScene?.generatedImage ? (
                <img
                  src={activeScene.generatedImage}
                  alt={`Scene ${activeScene.sceneNumber}`}
                  className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950/40 flex flex-col items-center justify-center select-none pointer-events-none">
                  <div className="w-24 h-24 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />
                  <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">
                    Cinematic Stage
                  </span>
                  <span className="text-xs font-mono text-cyan-400/80 mt-1">
                    {activeScene ? `Scene #${activeScene.sceneNumber}` : 'MintMind AI'}
                  </span>
                </div>
              )}

              {/* Darkening Scrim for High-Contrast Caption Legibility */}
              <div className="absolute inset-0 bg-black/35 pointer-events-none" />

              {/* Subtitle Positioning Wrapper */}
              <div
                className={`absolute inset-x-3 pointer-events-none flex flex-col items-center z-20 ${
                  config.position === 'top'
                    ? 'top-6'
                    : config.position === 'middle'
                    ? 'top-1/2 -translate-y-1/2'
                    : 'bottom-8'
                }`}
              >
                {renderKineticText()}
              </div>

              {/* Timecode Badge (Overlay) */}
              <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono text-cyan-300 border border-white/10 z-20">
                {formatPlaybackTime(currentTime)}
              </div>
            </div>

            {/* Playback Transport Bar */}
            <div className="space-y-2 pt-1">
              {/* Scrubber Bar */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-cyan-400 font-bold min-w-[50px]">
                  {formatPlaybackTime(currentTime)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={totalDuration}
                  step={0.05}
                  value={currentTime}
                  onChange={(e) => {
                    const newTime = parseFloat(e.target.value);
                    setCurrentTime(newTime);
                  }}
                  className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <span className="text-[11px] font-mono text-slate-400 min-w-[50px] text-right">
                  {formatPlaybackTime(totalDuration)}
                </span>
              </div>

              {/* Control Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                <div className="flex items-center gap-2">
                  {/* Play / Pause */}
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-md shadow-cyan-500/25 transition-all"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>

                  {/* Reset to 0 */}
                  <button
                    onClick={() => {
                      setCurrentTime(0);
                      setIsPlaying(false);
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                    title="Rewind to 0:00"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  {/* Loop Toggle */}
                  <button
                    onClick={() => setIsLooping(!isLooping)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-colors ${
                      isLooping
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Loop: {isLooping ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Speed Selector */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase mr-1">Speed:</span>
                  {[0.75, 1.0, 1.25, 1.5].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setPlaybackSpeed(spd)}
                      className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                        playbackSpeed === spd
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                          : 'bg-slate-850 hover:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Typography & Style Customization Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-mono uppercase text-cyan-400 font-bold flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                Kinetic Style Presets
              </span>
            </div>

            {/* Presets List */}
            <div className="space-y-2">
              {[
                {
                  style: 'bold_pop',
                  name: 'Bold Pop (MrBeast Style)',
                  desc: 'High contrast heavy fonts with vibrant cyan highlights',
                },
                {
                  style: 'cyber_neon',
                  name: 'Cyber Neon',
                  desc: 'Neon glowing borders with synthwave aesthetic',
                },
                {
                  style: 'karaoke_glow',
                  name: 'Karaoke Word Glow',
                  desc: 'Real-time glowing word-by-word progression',
                },
                {
                  style: 'minimalist',
                  name: 'Minimalist Clean',
                  desc: 'Understated Swiss typography with frosted glass pill',
                },
                {
                  style: 'classic_sub',
                  name: 'Classic Subtitles',
                  desc: 'Standard yellow/white television subtitles with dark box',
                },
              ].map((item) => (
                <button
                  key={item.style}
                  onClick={() => handleConfigUpdate({ style: item.style as any })}
                  className={`w-full p-3 rounded-xl text-left border transition-all ${
                    config.style === item.style
                      ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-sm shadow-cyan-500/20'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold block">{item.name}</span>
                    {config.style === item.style && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">{item.desc}</span>
                </button>
              ))}
            </div>

            {/* Granular Typography Tuning */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Type className="w-3.5 h-3.5 text-cyan-400" />
                <span>Typography Controls</span>
              </div>

              {/* Font Family Selector */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                  Font Family
                </label>
                <select
                  value={config.fontFamily}
                  onChange={(e) => handleConfigUpdate({ fontFamily: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Montserrat, sans-serif">Montserrat (Heavy Display)</option>
                  <option value="Inter, sans-serif">Inter (Modern Clean)</option>
                  <option value="'Cinzel', serif">Cinzel (Cinematic Drama)</option>
                  <option value="'Outfit', sans-serif">Outfit (Creator Modern)</option>
                  <option value="monospace, 'Courier New'">Courier (Cyber Monospace)</option>
                </select>
              </div>

              {/* Font Size Slider */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span className="uppercase">Font Size</span>
                  <span className="text-cyan-400 font-bold">{config.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min={18}
                  max={46}
                  value={config.fontSize}
                  onChange={(e) => handleConfigUpdate({ fontSize: parseInt(e.target.value, 10) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Vertical Position */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                  Vertical Positioning
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['top', 'middle', 'bottom'] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => handleConfigUpdate({ position: pos })}
                      className={`py-1.5 rounded-lg text-xs font-semibold capitalize border transition-colors ${
                        config.position === pos
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              {/* Highlight & Text Color Palettes */}
              <div className="space-y-2">
                <label className="block text-[10px] font-mono uppercase text-slate-400">
                  Highlight Color Swatch
                </label>
                <div className="flex items-center gap-2">
                  {[
                    { color: '#22d3ee', name: 'Electric Cyan' },
                    { color: '#facc15', name: 'Amber Gold' },
                    { color: '#10b981', name: 'Emerald' },
                    { color: '#ec4899', name: 'Neon Pink' },
                    { color: '#8b5cf6', name: 'Ultra Violet' },
                  ].map((swatch) => (
                    <button
                      key={swatch.color}
                      onClick={() => handleConfigUpdate({ highlightColor: swatch.color })}
                      title={swatch.name}
                      style={{ backgroundColor: swatch.color }}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        config.highlightColor === swatch.color
                          ? 'border-white scale-110 shadow-lg'
                          : 'border-transparent hover:scale-105'
                      }`}
                    />
                  ))}
                  <input
                    type="color"
                    value={config.highlightColor}
                    onChange={(e) => handleConfigUpdate({ highlightColor: e.target.value })}
                    className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer ml-auto"
                    title="Custom Color"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Timed Caption Track Editor (Full Width) */}
      <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-bold">
              Timed Caption Tracks & Word Alignments ({captions.length} Segments)
            </h4>
          </div>

          <button
            onClick={handleAddCaptionBlock}
            className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Caption Line</span>
          </button>
        </div>

        {/* Caption Blocks List */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {captions.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-slate-800 bg-slate-900/40 space-y-2">
              <Subtitles className="w-6 h-6 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-400">No captions generated yet for this script.</p>
              <button
                onClick={() => generateCaptions(script.id)}
                disabled={isGenerating}
                className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Generate Word-Timed Captions
              </button>
            </div>
          ) : (
            captions.map((cap, idx) => {
              const isActive = currentTime >= cap.startSec && currentTime <= cap.endSec;

              return (
                <div
                  key={cap.id || idx}
                  className={`p-4 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-slate-900 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-slate-800 text-[10px] font-mono text-cyan-400 flex items-center justify-center font-bold">
                        #{idx + 1}
                      </span>

                      {/* Timestamp Editor */}
                      <div className="flex items-center gap-1 text-[11px] font-mono">
                        <input
                          type="number"
                          step={0.1}
                          min={0}
                          value={cap.startSec}
                          onChange={(e) =>
                            handleUpdateLineTiming(cap.id, parseFloat(e.target.value) || 0, cap.endSec)
                          }
                          className="w-14 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-400 text-center focus:outline-none focus:border-cyan-500 font-bold"
                        />
                        <span className="text-slate-500">➔</span>
                        <input
                          type="number"
                          step={0.1}
                          min={0}
                          value={cap.endSec}
                          onChange={(e) =>
                            handleUpdateLineTiming(cap.id, cap.startSec, parseFloat(e.target.value) || 0)
                          }
                          className="w-14 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-400 text-center focus:outline-none focus:border-cyan-500 font-bold"
                        />
                        <span className="text-slate-500 text-[10px]">
                          ({(cap.endSec - cap.startSec).toFixed(1)}s window)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Jump to Time Button */}
                      <button
                        onClick={() => {
                          setCurrentTime(cap.startSec);
                          setIsPlaying(true);
                        }}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-mono flex items-center gap-1 border border-slate-700 transition-colors"
                        title="Seek to this caption"
                      >
                        <Play className="w-3 h-3 text-cyan-400" />
                        <span>Play</span>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteCaptionBlock(cap.id)}
                        className="p-1 rounded bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
                        title="Delete caption block"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Caption Text Area */}
                  <textarea
                    rows={2}
                    value={cap.text}
                    onChange={(e) => handleUpdateLineText(cap.id, e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-sans text-slate-200 focus:outline-none focus:border-cyan-500 leading-relaxed resize-none"
                    placeholder="Enter caption dialogue text..."
                  />

                  {/* Word Breakdown Badges */}
                  {cap.words && cap.words.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mt-2">
                      <span className="text-[10px] font-mono text-slate-500 mr-1">Words:</span>
                      {cap.words.map((w, wIdx) => {
                        const isWordActive =
                          currentTime >= w.startSec && currentTime <= w.endSec;
                        return (
                          <span
                            key={wIdx}
                            onClick={() => setCurrentTime(w.startSec)}
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                              isWordActive
                                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                            }`}
                            title={`${w.startSec.toFixed(2)}s - ${w.endSec.toFixed(2)}s`}
                          >
                            {w.word}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
