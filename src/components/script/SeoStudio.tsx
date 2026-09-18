import React, { useState, useMemo } from 'react';
import {
  Search,
  Sparkles,
  Copy,
  Check,
  TrendingUp,
  FileVideo,
  Clock,
  Tag,
  Hash,
  ListOrdered,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sliders,
  ExternalLink,
  ChevronDown,
  Layers,
  ArrowRight,
  Flame,
  Smartphone,
  Tv,
} from 'lucide-react';
import type { Script, ScriptSEO, ScriptScene } from '../../types/script';
import {
  auditSeoHealth,
  formatTagsForYouTube,
  generateSeoFilename,
  deriveChaptersFromScenes,
  generateTitleVariations,
} from '../../services/seoService';

interface SeoStudioProps {
  script: Script;
  onSaveSeo: (seo: ScriptSEO) => Promise<void>;
  onRegenerateSeo: () => Promise<void>;
  isGenerating?: boolean;
  onNotification?: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const SeoStudio: React.FC<SeoStudioProps> = ({
  script,
  onSaveSeo,
  onRegenerateSeo,
  isGenerating = false,
  onNotification,
}) => {
  // Current working state (fallbacks if no SEO object exists yet)
  const currentSeo = useMemo<ScriptSEO>(() => {
    if (script.seo) return script.seo;
    return {
      title: script.title || 'Untitled Video',
      description: `Watch this deep-dive guide to uncover the key insights, framework, and strategy behind ${script.settings.topic || 'the topic'}.`,
      keywords: [script.settings.topic || 'content creation', 'tutorial', 'strategy', 'guide 2026'],
      tags: [script.settings.topic || 'content creation', 'tutorial', 'guide', 'youtube growth', 'tips'],
      hashtags: [`#${(script.settings.topic || 'Creator').replace(/\s+/g, '')}`, '#Tutorial', '#ViralTips'],
      thumbnailText: 'STOP DOING THIS!',
      filename: generateSeoFilename(script.settings.topic || script.title),
      chapters: deriveChaptersFromScenes(script.scenes),
      shortFormSEO: {
        hookCaption: `Stop doing ${script.settings.topic || 'this'} like this! 👇`,
        hashtags: ['#shorts', '#creator', '#viral'],
        audioRecommendation: 'Upbeat Tech / 128 BPM tempo',
        engagementQuestion: 'Which step surprised you most?',
      },
    };
  }, [script]);

  const [activeFormat, setActiveFormat] = useState<'longform' | 'shortform'>(
    script.type === 'YouTube Shorts' || script.type === 'Instagram Reel' ? 'shortform' : 'longform'
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(currentSeo.description);

  // Synchronize description if script updates externally
  React.useEffect(() => {
    setEditedDescription(currentSeo.description);
  }, [currentSeo.description]);

  // SEO Health Audit
  const auditReport = useMemo(() => auditSeoHealth(currentSeo), [currentSeo]);
  const tagMetrics = useMemo(() => formatTagsForYouTube(currentSeo.tags || []), [currentSeo.tags]);

  // Copy helper
  const handleCopy = (text: string, key: string, label = 'Copied to clipboard') => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onNotification?.(label, 'success');
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  // Title Selection
  const handleApplyTitle = async (title: string) => {
    const updated: ScriptSEO = {
      ...currentSeo,
      title,
    };
    await onSaveSeo(updated);
    onNotification?.('Applied optimized title', 'success');
  };

  // Add Tag
  const handleAddTag = async (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter' && e.key !== ',') return;
    e.preventDefault();

    const clean = newTagInput.trim().replace(/^,|,$/g, '');
    if (!clean) return;

    const existing = currentSeo.tags || [];
    if (existing.map((t) => t.toLowerCase()).includes(clean.toLowerCase())) {
      onNotification?.('Tag already exists', 'warning');
      return;
    }

    const nextTags = [...existing, clean];
    const testFormat = formatTagsForYouTube(nextTags);
    if (testFormat.charCount > 500) {
      onNotification?.('Cannot add tag: YouTube limits tags to 500 characters', 'error');
      return;
    }

    const updated: ScriptSEO = {
      ...currentSeo,
      tags: nextTags,
    };
    await onSaveSeo(updated);
    setNewTagInput('');
  };

  // Remove Tag
  const handleRemoveTag = async (indexToRemove: number) => {
    const nextTags = (currentSeo.tags || []).filter((_, i) => i !== indexToRemove);
    const updated: ScriptSEO = {
      ...currentSeo,
      tags: nextTags,
    };
    await onSaveSeo(updated);
  };

  // Save Description
  const handleSaveDescription = async () => {
    const updated: ScriptSEO = {
      ...currentSeo,
      description: editedDescription,
    };
    await onSaveSeo(updated);
    setIsEditingDescription(false);
    onNotification?.('Description updated', 'success');
  };

  // Sync Chapters from current scenes
  const handleSyncChaptersFromScenes = async () => {
    const derived = deriveChaptersFromScenes(script.scenes);
    const updated: ScriptSEO = {
      ...currentSeo,
      chapters: derived,
    };
    await onSaveSeo(updated);
    onNotification?.(`Synced ${derived.length} chapters from scene timing`, 'success');
  };

  // Bundle All Metadata for 1-Click YouTube Studio Export
  const handleCopyCompleteBundle = () => {
    const chaptersText = (currentSeo.chapters || []).map((c) => `${c.timestamp} - ${c.title}`).join('\n');
    const tagsText = (currentSeo.tags || []).join(', ');

    const bundle = `TITLE:
${currentSeo.title}

DESCRIPTION:
${currentSeo.description}

CHAPTERS:
${chaptersText}

SEARCH TAGS:
${tagsText}

HASHTAGS:
${(currentSeo.hashtags || []).join(' ')}

RECOMMENDED FILENAME:
${currentSeo.filename}`;

    handleCopy(bundle, 'bundle', 'Complete YouTube Package copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* TOP COMMAND BAR */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                SEO & Algorithmic Packaging
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Platform: {script.type || 'YouTube Long-form'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Search className="w-5 h-5 text-cyan-400" />
              YouTube Search & Recommendation Optimizer
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl">
              Engineered to maximize Click-Through Rate (CTR) and Average View Duration (AVD) by aligning titles, descriptions, chapters, and metadata with YouTube search intent.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={handleCopyCompleteBundle}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-all flex items-center gap-2 shadow-sm"
            >
              {copiedKey === 'bundle' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Package Copied!
                </>
              ) : (
                <>
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  Copy Full Studio Package
                </>
              )}
            </button>

            <button
              onClick={onRegenerateSeo}
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Synthesizing SEO...' : 'Regenerate with Gemini'}
            </button>
          </div>
        </div>

        {/* METRICS & FORMAT STRIP */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80">
          {/* SEO Health Score */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
                Algorithmic Health
              </span>
              <div className="text-2xl font-black text-white font-mono flex items-baseline gap-1.5">
                <span>{auditReport.score}</span>
                <span className="text-xs text-slate-500 font-normal">/ 100</span>
              </div>
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold font-mono ${
                auditReport.rating === 'Optimal'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : auditReport.rating === 'Good'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}
            >
              {auditReport.rating}
            </span>
          </div>

          {/* YouTube Tags Usage */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono font-semibold">
              <span className="text-slate-400 uppercase">Tags Capacity</span>
              <span
                className={
                  tagMetrics.isWithinLimit ? 'text-cyan-400' : 'text-rose-400 font-bold'
                }
              >
                {tagMetrics.charCount} / 500 chars
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  tagMetrics.charCount > 500
                    ? 'bg-rose-500'
                    : tagMetrics.charCount > 400
                    ? 'bg-emerald-500'
                    : 'bg-cyan-500'
                }`}
                style={{ width: `${Math.min(100, (tagMetrics.charCount / 500) * 100)}%` }}
              />
            </div>
          </div>

          {/* Chapters Count */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
            <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
              YouTube Chapters
            </span>
            <div className="text-2xl font-black text-white font-mono flex items-baseline gap-2">
              <span>{currentSeo.chapters?.length || 0}</span>
              <span className="text-xs text-emerald-400 font-sans font-medium">Google Key Moments</span>
            </div>
          </div>

          {/* Format Switcher */}
          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-1.5">
            <button
              onClick={() => setActiveFormat('longform')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeFormat === 'longform'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              Long-Form (16:9)
            </button>
            <button
              onClick={() => setActiveFormat('shortform')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeFormat === 'shortform'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Shorts / Reels
            </button>
          </div>
        </div>
      </div>

      {/* LONG-FORM VIEW */}
      {activeFormat === 'longform' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* MAIN COLUMN (TITLES & DESCRIPTION) */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. HIGH-CTR TITLES */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    High-CTR Title Strategies
                  </h3>
                </div>
                <button
                  onClick={() => handleCopy(currentSeo.title, 'active-title', 'Title copied')}
                  className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
                >
                  {copiedKey === 'active-title' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy Active Title
                </button>
              </div>

              {/* Active Selected Title */}
              <div className="p-4 rounded-xl bg-slate-950 border-2 border-cyan-500/50 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-cyan-400 font-bold uppercase tracking-wider">Active Title</span>
                  <span
                    className={
                      currentSeo.title.length <= 65
                        ? 'text-emerald-400 font-bold'
                        : 'text-amber-400 font-bold'
                    }
                  >
                    {currentSeo.title.length} / 70 characters (Recommended: &lt;65)
                  </span>
                </div>
                <div className="text-base font-extrabold text-white leading-snug">
                  {currentSeo.title}
                </div>
              </div>

              {/* Alternative Psychological Hook Titles */}
              <div className="space-y-2.5">
                <span className="text-xs font-semibold text-slate-400">
                  Alternative Algorithmic Angles:
                </span>
                <div className="space-y-2">
                  {(currentSeo.titleOptions || generateTitleVariations(script.settings.topic || script.title)).map(
                    (opt) => {
                      const isSelected = opt.title === currentSeo.title;
                      return (
                        <div
                          key={opt.id}
                          className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-cyan-950/30 border-cyan-500/40 text-white'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-bold">
                                {opt.hookType}
                              </span>
                              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                                Est. CTR: {opt.estimatedCTR}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500">
                                {opt.charCount} chars
                              </span>
                            </div>
                            <p className="text-xs font-semibold leading-relaxed truncate-2-lines">
                              {opt.title}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleCopy(opt.title, opt.id, 'Title copied')}
                              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                              title="Copy title"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            {!isSelected && (
                              <button
                                onClick={() => handleApplyTitle(opt.title)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 transition-colors"
                              >
                                Use
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>

            {/* 2. OPTIMIZED VIDEO DESCRIPTION */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Video Description & Retention Structure
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditingDescription(!isEditingDescription)}
                    className="text-xs font-mono text-slate-400 hover:text-white"
                  >
                    {isEditingDescription ? 'Cancel Edit' : 'Edit Text'}
                  </button>
                  <button
                    onClick={() =>
                      handleCopy(currentSeo.description, 'description', 'Description copied')
                    }
                    className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    {copiedKey === 'description' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    Copy Description
                  </button>
                </div>
              </div>

              {isEditingDescription ? (
                <div className="space-y-3">
                  <textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    rows={12}
                    className="w-full p-4 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 leading-relaxed resize-y"
                    placeholder="Enter comprehensive YouTube video description..."
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-500">
                      {editedDescription.length} / 5,000 chars
                    </span>
                    <button
                      onClick={handleSaveDescription}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950"
                    >
                      Save Description
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">
                    {currentSeo.description}
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 px-1">
                    <span>Hook positioned in top 2 lines above fold</span>
                    <span>{currentSeo.description.length} / 5,000 characters</span>
                  </div>
                </div>
              )}
            </div>

            {/* 3. YOUTUBE CHAPTERS */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    YouTube Chapters & Retention Timestamps
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSyncChaptersFromScenes}
                    className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1"
                    title="Derive timestamps from scenes"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Sync with Scenes
                  </button>
                  <button
                    onClick={() => {
                      const text = (currentSeo.chapters || [])
                        .map((c) => `${c.timestamp} - ${c.title}`)
                        .join('\n');
                      handleCopy(text, 'chapters', 'Chapters copied to clipboard');
                    }}
                    className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    {copiedKey === 'chapters' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    Copy Timestamps
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {(currentSeo.chapters || []).map((ch, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <span className="font-mono text-cyan-400 font-bold bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/30">
                      {ch.timestamp}
                    </span>
                    <span className="text-slate-200 font-medium truncate ml-3 flex-1">
                      {ch.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SIDEBAR COLUMN (TAGS, KEYWORDS, AUDIT CHECKLIST, FILENAME) */}
          <div className="space-y-6">
            {/* SEARCH TAGS & CAPACITY */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Search Tags ({currentSeo.tags?.length || 0})
                  </h3>
                </div>
                <button
                  onClick={() =>
                    handleCopy((currentSeo.tags || []).join(', '), 'tags', 'Tags copied (ready for YouTube)')
                  }
                  className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
                >
                  {copiedKey === 'tags' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  Copy Comma-Separated
                </button>
              </div>

              {/* Tag Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Add target tag..."
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleAddTag}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200"
                >
                  Add
                </button>
              </div>

              {/* Interactive Tag Badges */}
              <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto pr-1">
                {(currentSeo.tags || []).map((tag, idx) => (
                  <span
                    key={idx}
                    className="group inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-950 text-slate-300 border border-slate-800 hover:border-cyan-500/50 transition-colors"
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => handleRemoveTag(idx)}
                      className="text-slate-500 group-hover:text-rose-400 text-xs font-bold leading-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="text-[11px] font-mono text-slate-500 pt-1">
                YouTube ignores tags after 500 characters. Paste directly into the "Tags" box in YouTube Studio.
              </div>
            </div>

            {/* VIRAL HASHTAGS */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Hashtags ({currentSeo.hashtags?.length || 0})
                  </h3>
                </div>
                <button
                  onClick={() =>
                    handleCopy((currentSeo.hashtags || []).join(' '), 'hashtags', 'Hashtags copied')
                  }
                  className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
                >
                  {copiedKey === 'hashtags' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  Copy Hashtags
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {(currentSeo.hashtags || []).map((hash, hIdx) => (
                  <span
                    key={hIdx}
                    className="text-xs font-mono px-3 py-1.5 rounded-lg bg-cyan-950/40 text-cyan-300 border border-cyan-800/40 font-semibold"
                  >
                    {hash}
                  </span>
                ))}
              </div>
            </div>

            {/* ALGORITHMIC RAW FILE NAME */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <FileVideo className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Recommended Filename
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                YouTube reads the raw video file name on ingest. Naming your file with target keywords establishes an immediate search index signal.
              </p>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-emerald-300 font-bold truncate">
                  {currentSeo.filename || generateSeoFilename(script.settings.topic || script.title)}
                </span>
                <button
                  onClick={() =>
                    handleCopy(currentSeo.filename || generateSeoFilename(script.settings.topic || script.title), 'filename', 'Filename copied')
                  }
                  className="p-1.5 text-slate-400 hover:text-white"
                >
                  {copiedKey === 'filename' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* SEO HEALTH CHECKLIST */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                Optimization Audit Checklist
              </h3>
              <div className="space-y-3">
                {auditReport.checklist.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{item.label}</span>
                      {item.passed ? (
                        <span className="text-emerald-400 text-[11px] font-mono font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> PASS
                        </span>
                      ) : (
                        <span className="text-amber-400 text-[11px] font-mono font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> POLISH
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {item.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SHORT-FORM VIEW (SHORTS / REELS / TIKTOK) */}
      {activeFormat === 'shortform' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* HOOK CAPTION & ENGAGEMENT */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white tracking-tight">
                Shorts & Reels Hook Caption
              </h3>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400">
                1st-Line Hook Caption (Displays before "...more" button):
              </label>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm font-bold text-white flex items-center justify-between gap-3">
                <span>{currentSeo.shortFormSEO?.hookCaption || `Watch this before trying ${script.settings.topic}! 👇`}</span>
                <button
                  onClick={() =>
                    handleCopy(currentSeo.shortFormSEO?.hookCaption || '', 'hook-caption', 'Hook copied')
                  }
                  className="p-1.5 text-slate-400 hover:text-white"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400">
                Pinned Comment Debate Question (Triggers Viewer Comment Arguments):
              </label>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300 flex items-center justify-between gap-3">
                <span>{currentSeo.shortFormSEO?.engagementQuestion || 'Did you already know about this trick? Tell me below!'}</span>
                <button
                  onClick={() =>
                    handleCopy(currentSeo.shortFormSEO?.engagementQuestion || '', 'debate-q', 'Question copied')
                  }
                  className="p-1.5 text-slate-400 hover:text-white"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400">
                Trending Audio / Background Tempo Recommendation:
              </label>
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs font-mono text-cyan-300">
                {currentSeo.shortFormSEO?.audioRecommendation || 'Upbeat Fast Synth / 128 BPM'}
              </div>
            </div>
          </div>

          {/* VIRAL SHORT-FORM HASHTAG BUNDLE */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white tracking-tight">
                  Short-Form Viral Tag Bundle
                </h3>
              </div>
              <button
                onClick={() => {
                  const tags = (currentSeo.shortFormSEO?.hashtags || ['#shorts', '#viral', '#creator']).join(' ');
                  handleCopy(tags, 'shorts-tags', 'Shorts hashtags copied');
                }}
                className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
              >
                {copiedKey === 'shorts-tags' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Tag Bundle
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Shorts recommendation algorithm leans heavily on 3-5 hyper-focused hashtags combined with a fast swipe-up retention hook.
            </p>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap gap-2">
              {(currentSeo.shortFormSEO?.hashtags || ['#shorts', '#viral', '#creator', '#foryou']).map((t, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-950/40 text-emerald-300 border border-emerald-800/40"
                >
                  {t}
                </span>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs text-slate-400">
              <div className="font-bold text-white">Algorithm Recommendation Rules:</div>
              <ul className="list-disc pl-4 space-y-1">
                <li>Keep caption under 100 characters so full text is visible on-screen.</li>
                <li>Avoid more than 5 hashtags on Shorts/Reels to avoid spam penalties.</li>
                <li>Pin the debate question in comments within 60 seconds of publishing.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
