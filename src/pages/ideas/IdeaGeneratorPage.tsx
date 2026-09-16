import React, { useState } from 'react';
import {
  Lightbulb,
  Sparkles,
  SlidersHorizontal,
  Flame,
  TrendingUp,
  Target,
  Copy,
  Check,
  FileText,
  Layers,
  Search,
  Plus,
  RefreshCw,
  FolderGit2,
  Trash2,
  Share2,
  Bookmark,
  Eye,
  ArrowRight,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  Tag,
  Hash,
  ChevronDown,
} from 'lucide-react';
import { useIdea } from '../../context/IdeaContext';
import { useProject } from '../../context/ProjectContext';
import { useRouter } from '../../context/RouterContext';
import { useScript } from '../../context/ScriptContext';
import type {
  Idea,
  IdeaGenerationInputs,
  PlatformOption,
  ContentTypeOption,
  LanguageOption,
  ToneOption,
  GoalOption,
  IdeaStatus,
  IdeaVariation,
} from '../../types/idea';
import type { StoryMode } from '../../types/storyMode';
import { StoryModeSelector } from '../../components/storyMode/StoryModeSelector';
import { StoryModeBadge } from '../../components/storyMode/StoryModeBadge';
import { detectStoryModeAPI } from '../../services/aiService';
import { IdeaAnalysisModal } from '../../components/ideas/IdeaAnalysisModal';
import { IdeaVariationsModal } from '../../components/ideas/IdeaVariationsModal';

const NICHE_PRESETS = [
  'Tech & AI Tools',
  'Finance & Wealth',
  'Fitness & Health',
  'Software Development',
  'Creator Economy',
  'Business & Startups',
  'Personal Growth',
  'Gaming & Esports',
  'Travel & Nomad Life',
];

const PLATFORM_OPTIONS: PlatformOption[] = [
  'YouTube Long-form',
  'YouTube Shorts',
  'Instagram Reels',
  'Instagram Stories',
  'General Social Video',
];

const CONTENT_TYPE_OPTIONS: ContentTypeOption[] = [
  'Educational',
  'Entertainment',
  'News/Explainer',
  'Story',
  'Tutorial',
  'Review',
  'Commentary',
  'Travel',
  'Gaming',
  'Technology',
  'Product',
  'Personal Brand',
];

const LANGUAGE_OPTIONS: LanguageOption[] = [
  'English',
  'Hindi',
  'Hinglish',
  'Gujarati',
  'Tamil',
  'Bengali',
  'Telugu',
  'Marathi',
  'Punjabi',
  'Kannada',
  'Malayalam',
];

const TONE_OPTIONS: ToneOption[] = [
  'Professional',
  'Casual',
  'Energetic',
  'Educational',
  'Funny',
  'Dramatic',
  'Inspirational',
  'Storytelling',
  'News-style',
];

const GOAL_OPTIONS: GoalOption[] = [
  'High Views / Reach',
  'Viral Potential',
  'Education & Trust',
  'Brand Awareness',
  'Lead Generation',
  'Product Sales',
  'Authority Building',
  'Community Growth',
  'Entertainment',
];

const DURATION_PRESETS = [
  '30–60 seconds (Short/Reel)',
  '60–90 seconds (Explainer Short)',
  '3–5 minutes (Brisk Long-form)',
  '8–12 minutes (Standard YouTube)',
  '15–20 minutes (Deep Dive)',
  '30+ minutes (Masterclass)',
];

export function IdeaGeneratorPage() {
  const { navigate } = useRouter();
  const { activeProject, projects } = useProject();
  const { createScript } = useScript();
  const {
    ideas,
    projectIdeas,
    loading,
    isGenerating,
    generationStep,
    generationProgress,
    error,
    generateIdeas,
    saveIdea,
    updateIdea,
    deleteIdea,
    duplicateIdea,
    improveIdea,
    analyzeIdea,
    generateVariations,
    clearError,
  } = useIdea();

  const [activeTab, setActiveTab] = useState<'generate' | 'saved'>('generate');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Generator form inputs
  const [niche, setNiche] = useState('Tech & AI Tools');
  const [topic, setTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('Content creators, engineers, and tech entrepreneurs');
  const [platform, setPlatform] = useState<PlatformOption>('YouTube Long-form');
  const [contentType, setContentType] = useState<ContentTypeOption>('Educational');
  const [language, setLanguage] = useState<LanguageOption>('English');
  const [tone, setTone] = useState<ToneOption>('Energetic');
  const [videoDuration, setVideoDuration] = useState('8–12 minutes (Standard YouTube)');
  const [goal, setGoal] = useState<GoalOption>('High Views / Reach');
  const [referenceContext, setReferenceContext] = useState('');
  const [currentTrendContext, setCurrentTrendContext] = useState('');
  const [competitorReference, setCompetitorReference] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [userNotes, setUserNotes] = useState('');
  const [showAdvancedInputs, setShowAdvancedInputs] = useState(false);
  const [count, setCount] = useState<number>(4);

  // Adaptive Story Mode Engine state
  const [primaryMode, setPrimaryMode] = useState<StoryMode>('Documentary');
  const [secondaryModes, setSecondaryModes] = useState<StoryMode[]>(['Explainer']);
  const [modeConfidence, setModeConfidence] = useState<number | undefined>(undefined);
  const [modeReasoning, setModeReasoning] = useState<string | undefined>(undefined);
  const [isDetectingMode, setIsDetectingMode] = useState<boolean>(false);

  // Modals state
  const [selectedAuditIdea, setSelectedAuditIdea] = useState<Idea | null>(null);
  const [auditData, setAuditData] = useState<any>(null);
  const [auditLoading, setAuditLoading] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);

  const [selectedVariationsIdea, setSelectedVariationsIdea] = useState<Idea | null>(null);
  const [variationsData, setVariationsData] = useState<IdeaVariation[]>([]);
  const [variationsLoading, setVariationsLoading] = useState<boolean>(false);
  const [isVariationsModalOpen, setIsVariationsModalOpen] = useState<boolean>(false);

  // Status Filter in Saved Ideas Tab
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const handleAutoDetectMode = async () => {
    setIsDetectingMode(true);
    try {
      const detection = await detectStoryModeAPI({
        topic: topic.trim() || niche,
        audience: targetAudience,
        platform,
      });
      if (detection) {
        setPrimaryMode(detection.primaryMode);
        setSecondaryModes(detection.secondaryModes || []);
        setModeConfidence(detection.confidence);
        setModeReasoning(detection.reasoning);
      }
    } catch (err) {
      console.warn('Auto-detect story mode failed:', err);
    } finally {
      setIsDetectingMode(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGenerating) return;

    try {
      const parsedKeywords = keywordsInput
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);

      await generateIdeas({
        niche,
        topic: topic.trim(),
        targetAudience,
        platform,
        contentType,
        language,
        tone,
        videoDuration,
        goal,
        primaryMode,
        secondaryModes,
        currentTrendContext: currentTrendContext.trim() || undefined,
        competitorReference: competitorReference.trim() || undefined,
        keywords: parsedKeywords.length > 0 ? parsedKeywords : undefined,
        userNotes: userNotes.trim() || undefined,
        referenceContext: referenceContext.trim() || undefined,
        projectId: activeProject?.id,
        count,
      });
    } catch (err) {
      // Error handled in context
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAudit = async (idea: Idea) => {
    setSelectedAuditIdea(idea);
    setIsAuditModalOpen(true);
    setAuditLoading(true);
    try {
      const data = await analyzeIdea(idea);
      setAuditData(data);
    } catch {
      // Handled
    } finally {
      setAuditLoading(false);
    }
  };

  const handleVariations = async (idea: Idea) => {
    setSelectedVariationsIdea(idea);
    setIsVariationsModalOpen(true);
    setVariationsLoading(true);
    try {
      const vars = await generateVariations(idea);
      setVariationsData(vars);
    } catch {
      // Handled
    } finally {
      setVariationsLoading(false);
    }
  };

  const handleImprove = async (idea: Idea) => {
    try {
      await improveIdea(idea);
    } catch {
      // Handled
    }
  };

  const handleTransferToScript = async (idea: Idea) => {
    try {
      await createScript(
        {
          topic: idea.title,
          ideaText: idea.concept || idea.coreConcept,
          audience: idea.targetAudience,
          language: (idea.metadata?.language as any) || language,
          tone: (idea.metadata?.tone as any) || tone,
          duration: idea.estimatedDuration,
          platform: idea.recommendedPlatform as any,
          narrationStyle: 'Engaging conversational narrator',
          ctaStyle: idea.cta || 'Subscribe and comment',
          keyPoints: idea.keywords,
          primaryMode: idea.primaryMode || primaryMode,
          secondaryModes: idea.secondaryModes || secondaryModes,
          modeDetectionConfidence: idea.modeDetectionConfidence || modeConfidence,
          modeReasoning: idea.modeReasoning || modeReasoning,
        },
        idea
      );

      // Mark idea as scripted
      await updateIdea(idea.id, { status: 'scripted' });
      navigate('/script');
    } catch (err) {
      console.error('Failed to transfer idea to script studio', err);
    }
  };

  const handleAdoptVariationToScript = async (variation: IdeaVariation) => {
    if (!selectedVariationsIdea) return;
    try {
      await createScript(
        {
          topic: variation.title,
          ideaText: `${variation.concept}\n\nAngle: ${variation.angleType}`,
          audience: selectedVariationsIdea.targetAudience,
          language,
          tone,
          duration: selectedVariationsIdea.estimatedDuration,
          platform: selectedVariationsIdea.recommendedPlatform as any,
          narrationStyle: 'High engagement presenter',
          ctaStyle: selectedVariationsIdea.cta,
        },
        selectedVariationsIdea
      );
      navigate('/script');
    } catch (err) {
      console.error('Failed to create script from variation', err);
    }
  };

  const handleSaveVariationAsIdea = async (variation: IdeaVariation) => {
    if (!selectedVariationsIdea) return;
    const newIdea: Idea = {
      ...selectedVariationsIdea,
      id: `idea_${Date.now()}_var`,
      title: variation.title,
      hook: variation.hook,
      concept: variation.concept,
      angle: `${variation.angleType} Angle: ${variation.rationale}`,
      status: 'saved',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveIdea(newIdea);
  };

  const filteredSavedIdeas = ideas.filter((idea) => {
    if (statusFilter === 'all') return true;
    return idea.status === statusFilter;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5 font-bold">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              MODULE 1 • PIPELINE STAGE 03
            </span>
            {activeProject ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                <FolderGit2 className="w-3 h-3 text-slate-400" />
                Project: {activeProject.name}
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Workspace Scope (Unassigned)
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-extrabold text-white flex items-center gap-2.5">
            AI Idea Generator
            <span className="text-xs font-mono font-normal text-cyan-400 px-2 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-800/40">
              Gemini 3.5 Flash
            </span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl">
            Real working creator ideation engine. Synthesizes high-retention concepts, psychological hooks, and algorithmic scores tailored to your niche and audience.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'generate'
                ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            Generator Studio
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'saved'
                ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            Saved Blueprint Library
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 ml-0.5">
              {ideas.length}
            </span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start justify-between gap-3 text-rose-300 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div>
              <p className="font-semibold">{error}</p>
              <p className="text-rose-300/80 text-[11px] mt-0.5">
                Ensure GEMINI_API_KEY is configured in your project settings, or retry the request.
              </p>
            </div>
          </div>
          <button
            onClick={clearError}
            className="p-1 text-rose-400 hover:text-rose-200 rounded transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* GENERATOR TAB */}
      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Inputs Drawer / Panel (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 md:p-6 backdrop-blur-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Strategic Parameters
              </span>
              <span className="text-[10px] font-mono text-slate-400">10 Parameters</span>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Niche */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Niche / Domain
                </label>
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="e.g. AI Automation, Personal Finance, Travel"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                />
                {/* Quick Niche Presets */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {NICHE_PRESETS.slice(0, 5).map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setNiche(p)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                        niche === p
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-slate-950/50 text-slate-400 border-slate-800 hover:text-slate-300'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic / Keyword */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Topic / Seed Keyword <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Claude 3.7 vs Gemini, Index Funds 2026, Solo Travel Hacks"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g. Beginner creators looking to monetize on YouTube"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                />
              </div>

              {/* Platform & Content Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Platform
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as PlatformOption)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {PLATFORM_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Content Type
                  </label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value as ContentTypeOption)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {CONTENT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Language & Tone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as LanguageOption)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {LANGUAGE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tone / Persona
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as ToneOption)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {TONE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Duration & Primary Goal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Target Runtime
                  </label>
                  <select
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {DURATION_PRESETS.map((dur) => (
                      <option key={dur} value={dur}>
                        {dur}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Core Goal
                  </label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value as GoalOption)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {GOAL_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reference / Context */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Reference Context / Constraints <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={referenceContext}
                  onChange={(e) => setReferenceContext(e.target.value)}
                  placeholder="e.g. Focus on budget tools under $50, avoid mentioning tool X, include a live demo premise"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                />
              </div>

              {/* Collapsible Advanced / Optional Directives */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdvancedInputs(!showAdvancedInputs)}
                  className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-cyan-300 py-2 px-3 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <span className="flex items-center gap-1.5 font-medium text-slate-300">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                    Additional Directives & Strategic Context
                    <span className="text-[10px] text-slate-500 font-normal">(Optional)</span>
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      showAdvancedInputs ? 'rotate-180 text-cyan-400' : ''
                    }`}
                  />
                </button>

                {showAdvancedInputs && (
                  <div className="mt-3 space-y-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 animate-fadeIn">
                    {/* Current Trend / Context */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Current Trend / Context <span className="text-slate-500 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={currentTrendContext}
                        onChange={(e) => setCurrentTrendContext(e.target.value)}
                        placeholder="e.g. Q1 2026 tech layoffs, new agent frameworks, viral TikTok trend"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                    </div>

                    {/* Competitor / Reference */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Competitor / Reference Inspiration <span className="text-slate-500 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={competitorReference}
                        onChange={(e) => setCompetitorReference(e.target.value)}
                        placeholder="e.g. Cleo Abram explainer style, Ali Abdaal productivity format"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                    </div>

                    {/* Keywords */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Targeted Keywords <span className="text-slate-500 font-normal">(Comma-separated, Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={keywordsInput}
                        onChange={(e) => setKeywordsInput(e.target.value)}
                        placeholder="e.g. agentic workflows, deep research, prompt engineering"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                    </div>

                    {/* User Notes */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        User Notes & Constraints <span className="text-slate-500 font-normal">(Optional)</span>
                      </label>
                      <textarea
                        rows={2}
                        value={userNotes}
                        onChange={(e) => setUserNotes(e.target.value)}
                        placeholder="e.g. Focus on actionable non-technical steps; avoid talking about crypto"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Adaptive Story Mode Engine Selector */}
              <div className="pt-1">
                <StoryModeSelector
                  primaryMode={primaryMode}
                  secondaryModes={secondaryModes}
                  confidence={modeConfidence}
                  reasoning={modeReasoning}
                  onPrimaryChange={(m) => setPrimaryMode(m)}
                  onSecondaryChange={(ms) => setSecondaryModes(ms)}
                  onAutoDetect={handleAutoDetectMode}
                  isDetecting={isDetectingMode}
                />
              </div>

              {/* Count & Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full py-3 px-4 rounded-xl font-display font-bold text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      Synthesizing Ideas...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      Generate Content Ideas
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Output Cards Column (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Real-time Progress Bar State */}
            {isGenerating && (
              <div className="p-5 rounded-2xl bg-slate-900 border border-cyan-500/40 shadow-xl shadow-cyan-500/10 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-cyan-400 font-semibold flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    {generationStep || 'Analyzing algorithmic signals...'}
                  </span>
                  <span className="font-mono text-slate-400">{generationProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Generated Ideas Stream */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Generated Blueprint Feed
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => handleGenerate(e as any)}
                    disabled={isGenerating}
                    className="text-[11px] font-mono text-slate-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                    title="Regenerate with current parameters"
                  >
                    <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                    <span>Regenerate</span>
                  </button>
                  <span className="text-[11px] font-mono text-slate-500">
                    {ideas.length} total
                  </span>
                </div>
              </div>

              {ideas.length === 0 && !isGenerating ? (
                <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                    <Lightbulb className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white">No Ideas Generated Yet</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Configure your niche and target audience on the left and click "Generate Content Ideas" to synthesize high-velocity creator blueprints.
                  </p>
                </div>
              ) : (
                ideas.map((idea) => {
                  const isCopied = copiedId === idea.id;
                  return (
                    <div
                      key={idea.id}
                      className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all shadow-lg shadow-black/20 space-y-4 group"
                    >
                      {/* Top Badges & Metric Scores */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {idea.recommendedPlatform}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {idea.estimatedDuration}
                          </span>
                          {idea.primaryMode && (
                            <StoryModeBadge
                              mode={idea.primaryMode}
                              confidence={idea.modeDetectionConfidence}
                              size="sm"
                            />
                          )}
                        </div>

                        {/* Scores Grid */}
                        <div
                          className="flex items-center gap-1.5"
                          title="MintMind AI algorithmic estimates only. Virality is not guaranteed."
                        >
                          <div
                            title="Trend Velocity Index (0-100)"
                            className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold"
                          >
                            <TrendingUp className="w-3 h-3" />
                            Trend: {idea.trendScore}
                          </div>
                          <div
                            title="Audience Interest Score"
                            className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono text-cyan-400 flex items-center gap-1 font-bold"
                          >
                            <Eye className="w-3 h-3" />
                            Demand: {idea.audienceInterestScore}
                          </div>
                          <div
                            title="Opportunity Rating"
                            className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-[10px] font-mono text-indigo-400 flex items-center gap-1 font-bold"
                          >
                            <Zap className="w-3 h-3" />
                            Opp: {idea.opportunityScore}
                          </div>
                          <span className="text-[9px] font-mono text-slate-500 hidden sm:inline">
                            (Est.)
                          </span>
                        </div>
                      </div>

                      {/* Title & Copy */}
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-base font-bold text-white leading-snug group-hover:text-cyan-300 transition-colors">
                          {idea.title}
                        </h3>
                        <button
                          onClick={() => handleCopy(idea.title, idea.id)}
                          title="Copy title"
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors shrink-0"
                        >
                          {isCopied ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Hook & Concept */}
                      <div className="space-y-2 text-xs">
                        <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/20 text-cyan-300 font-mono">
                          <span className="text-[10px] text-cyan-500 font-bold uppercase block mb-0.5">
                            ⚡ First 3–5s Opening Hook:
                          </span>
                          "{idea.hook}"
                        </div>

                        <p className="text-slate-300 leading-relaxed">
                          <strong className="text-white">Concept: </strong>
                          {idea.concept}
                        </p>

                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          <strong className="text-indigo-300">Unique Angle: </strong>
                          {idea.angle}
                        </p>

                        {/* Why This Works */}
                        {(idea.whyThisIdea || idea.reason) && (
                          <p className="text-slate-400 text-[11px] leading-relaxed">
                            <strong className="text-cyan-300">Strategic Rationale: </strong>
                            {idea.whyThisIdea || idea.reason}
                          </p>
                        )}

                        {/* CTA */}
                        {idea.cta && (
                          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2">
                            <Target className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-cyan-400 font-semibold">Call to Action: </span>
                              "{idea.cta}"
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Thumbnail Concept */}
                      {idea.thumbnailConcept && (
                        <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-slate-300 font-semibold">Thumbnail Concept: </span>
                            {idea.thumbnailConcept}
                          </div>
                        </div>
                      )}

                      {/* Keywords & Hashtags */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {idea.keywords?.slice(0, 4).map((kw, kIdx) => (
                          <span
                            key={kIdx}
                            className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-400 border border-slate-700/60"
                          >
                            #{kw}
                          </span>
                        ))}
                        {idea.hashtags?.slice(0, 3).map((ht, hIdx) => (
                          <span
                            key={`ht-${hIdx}`}
                            className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-950/50 text-indigo-300 border border-indigo-800/50"
                          >
                            {ht.startsWith('#') ? ht : `#${ht}`}
                          </span>
                        ))}
                      </div>

                      {/* REAL WORKING ACTION BUTTONS */}
                      <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                        {/* Primary Workflow CTA: Generate Script */}
                        <button
                          onClick={() => handleTransferToScript(idea)}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-slate-950 flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-950" />
                          <span>Generate Script</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        {/* Secondary Actions */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {projects && projects.length > 0 && (
                            <select
                              value={idea.projectId || ''}
                              onChange={(e) => updateIdea(idea.id, { projectId: e.target.value || undefined })}
                              className="text-[10px] font-mono px-2 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 focus:outline-none"
                              title="Assign to project"
                            >
                              <option value="">No Project</option>
                              {projects.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          )}
                          <button
                            onClick={() => handleAudit(idea)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
                          >
                            <Target className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Audit Idea</span>
                          </button>

                          <button
                            onClick={() => handleVariations(idea)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
                          >
                            <Layers className="w-3.5 h-3.5 text-indigo-400" />
                            <span>5 Variations</span>
                          </button>

                          <button
                            onClick={() => handleImprove(idea)}
                            title="Sharpen hook & angle with AI"
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>Improve</span>
                          </button>

                          <button
                            onClick={() => saveIdea(idea)}
                            title="Save to library"
                            className={`p-1.5 rounded-lg border transition-colors ${
                              idea.status === 'saved'
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700'
                            }`}
                          >
                            <Bookmark className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => duplicateIdea(idea)}
                            title="Duplicate idea"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => deleteIdea(idea.id)}
                            title="Delete idea"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* SAVED BLUEPRINTS TAB */}
      {activeTab === 'saved' && (
        <div className="space-y-6">
          {/* Status Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase text-slate-400">Filter Lifecycle:</span>
              <div className="flex flex-wrap gap-1">
                {['all', 'draft', 'saved', 'scripted', 'produced', 'published'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`text-xs px-3 py-1 rounded-lg capitalize font-medium transition-colors ${
                      statusFilter === st
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-xs font-mono text-slate-400">
              Showing {filteredSavedIdeas.length} of {ideas.length} blueprints
            </span>
          </div>

          {/* Saved Ideas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSavedIdeas.length === 0 ? (
              <div className="col-span-2 p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 space-y-2">
                <Bookmark className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-white">No blueprints match this status</p>
                <p className="text-xs text-slate-400">Generate or save ideas to build your library.</p>
              </div>
            ) : (
              filteredSavedIdeas.map((idea) => (
                <div
                  key={idea.id}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                          {idea.recommendedPlatform}
                        </span>
                        {idea.primaryMode && (
                          <StoryModeBadge
                            mode={idea.primaryMode}
                            confidence={idea.modeDetectionConfidence}
                            size="sm"
                          />
                        )}
                      </div>
                      {/* Status Selector */}
                      <select
                        value={idea.status}
                        onChange={(e) =>
                          updateIdea(idea.id, { status: e.target.value as IdeaStatus })
                        }
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 focus:outline-none"
                      >
                        <option value="draft">Draft</option>
                        <option value="saved">Saved</option>
                        <option value="scripted">Scripted</option>
                        <option value="produced">Produced</option>
                        <option value="published">Published</option>
                      </select>
                    </div>

                    <h4 className="text-sm font-bold text-white">{idea.title}</h4>
                    <p className="text-xs text-slate-300 line-clamp-3">{idea.concept}</p>
                    <div className="p-2 rounded bg-slate-950 text-[11px] text-cyan-300 font-mono italic">
                      "{idea.hook}"
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <button
                      onClick={() => handleTransferToScript(idea)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Generate Script
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleAudit(idea)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                        title="Audit Idea"
                      >
                        <Target className="w-4 h-4 text-cyan-400" />
                      </button>
                      <button
                        onClick={() => deleteIdea(idea.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <IdeaAnalysisModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        idea={selectedAuditIdea}
        analysis={auditData}
        loading={auditLoading}
        onApplyTitle={(newTitle) => {
          if (selectedAuditIdea) {
            updateIdea(selectedAuditIdea.id, { title: newTitle });
          }
          setIsAuditModalOpen(false);
        }}
        onApplyHook={(newHook) => {
          if (selectedAuditIdea) {
            updateIdea(selectedAuditIdea.id, { hook: newHook });
          }
          setIsAuditModalOpen(false);
        }}
      />

      <IdeaVariationsModal
        isOpen={isVariationsModalOpen}
        onClose={() => setIsVariationsModalOpen(false)}
        idea={selectedVariationsIdea}
        variations={variationsData}
        loading={variationsLoading}
        onAdoptVariation={handleAdoptVariationToScript}
        onSaveAsNewIdea={handleSaveVariationAsIdea}
      />
    </div>
  );
}
