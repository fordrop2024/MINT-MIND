import React, { useState } from 'react';
import {
  Video,
  Image as ImageIcon,
  FileText,
  Sparkles,
  TrendingUp,
  FolderGit2,
  Cpu,
  Youtube,
  SearchCheck,
  Zap,
  ArrowRight,
  FolderPlus,
  Layers,
  Clock,
  Radio,
  ExternalLink,
  Radar,
  Tv,
  PlaySquare,
  Crosshair,
  Lightbulb,
  ShieldAlert,
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { useRouter } from '../context/RouterContext';
import { useTheme } from '../context/ThemeContext';

interface DashboardPageProps {
  onOpenNewProject: () => void;
  onOpenRoadmap: () => void;
}

export function DashboardPage({ onOpenNewProject, onOpenRoadmap }: DashboardPageProps) {
  const { projects, openProject, activeProject } = useProjects();
  const { navigate } = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [commandPrompt, setCommandPrompt] = useState('');
  const [commandNotice, setCommandNotice] = useState(false);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandPrompt.trim()) return;
    navigate('/ideas');
  };

  const recentProjects = projects.slice(0, 3);

  return (
    <div id="dashboard-page" className="space-y-8 animate-in fade-in duration-200">
      {/* Hero Section */}
      <section
        id="dashboard-hero-section"
        className="relative overflow-hidden rounded-3xl p-8 md:p-10 glass-panel border border-cyan-500/30 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-cyan-950/30 shadow-2xl shadow-cyan-950/30"
      >
        {/* Background ambient lighting */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>MintMind AI OS &bull; AI Content Operating System</span>
          </div>

          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight font-display">
              Create something amazing.
            </h1>
            <p className="text-base md:text-lg text-slate-300 mt-2 font-sans font-normal">
              Your AI-powered creator workspace for ideas, scripts, videos, SEO and publishing.
            </p>
          </div>

          {/* Large Command Input */}
          <form onSubmit={handleCommandSubmit} className="pt-2">
            <div className="relative flex items-center">
              <input
                id="hero-command-input"
                type="text"
                value={commandPrompt}
                onChange={(e) => {
                  setCommandPrompt(e.target.value);
                  if (commandNotice) setCommandNotice(false);
                }}
                placeholder="What do you want to create? (e.g. AI tools breakdown, finance video)"
                className="w-full px-5 py-4 pr-32 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 text-sm md:text-base transition-all font-sans shadow-inner"
              />
              <button
                id="hero-command-submit-btn"
                type="submit"
                className="absolute right-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all shadow-md shadow-cyan-500/20 flex items-center gap-1.5"
              >
                <span>Generate</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="mt-2 text-[11px] font-mono text-slate-400 flex items-center gap-2">
              <span>Type a topic or concept to launch Idea Generator</span>
              <span>&bull;</span>
              <span>Direct studio launchers below</span>
            </p>
          </form>

          {/* 5 Launch Buttons */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
            <button
              id="hero-btn-generate-ideas"
              onClick={() => navigate('/ideas')}
              className="px-4 py-3 rounded-xl bg-slate-900/80 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 transition-all text-left group flex flex-col justify-between"
            >
              <Lightbulb className="w-5 h-5 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
              <div>
                <div className="text-xs font-bold text-slate-100 group-hover:text-cyan-300">
                  Generate Ideas
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  /ideas
                </div>
              </div>
            </button>

            <button
              id="hero-btn-write-script"
              onClick={() => navigate('/script')}
              className="px-4 py-3 rounded-xl bg-slate-900/80 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/40 transition-all text-left group flex flex-col justify-between"
            >
              <FileText className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
              <div>
                <div className="text-xs font-bold text-slate-100 group-hover:text-emerald-300">
                  Script Studio
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  /script
                </div>
              </div>
            </button>

            <button
              id="hero-btn-create-video"
              onClick={() => navigate('/video-generator')}
              className="px-4 py-3 rounded-xl bg-slate-900/80 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 transition-all text-left group flex flex-col justify-between"
            >
              <Video className="w-5 h-5 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
              <div>
                <div className="text-xs font-bold text-slate-100 group-hover:text-indigo-300">
                  Create Video
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  /video-generator
                </div>
              </div>
            </button>

            <button
              id="hero-btn-create-image"
              onClick={() => navigate('/image-studio')}
              className="px-4 py-3 rounded-xl bg-slate-900/80 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/40 transition-all text-left group flex flex-col justify-between"
            >
              <ImageIcon className="w-5 h-5 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
              <div>
                <div className="text-xs font-bold text-slate-100 group-hover:text-purple-300">
                  Create Image
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  /image-studio
                </div>
              </div>
            </button>

            <button
              id="hero-btn-create-thumbnail"
              onClick={() => navigate('/thumbnail')}
              className="px-4 py-3 rounded-xl bg-slate-900/80 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/40 transition-all text-left group flex flex-col justify-between"
            >
              <Sparkles className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
              <div>
                <div className="text-xs font-bold text-slate-100 group-hover:text-amber-300">
                  Thumbnail
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  /thumbnail
                </div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Dashboard 6 Cards Grid */}
      <section id="dashboard-cards-grid">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-100 font-display flex items-center gap-2">
            <span>Workspace Operations</span>
            <span className="text-xs font-mono font-normal text-slate-400">
              (6 Control Units)
            </span>
          </h2>
          <button
            onClick={onOpenRoadmap}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5"
          >
            <span>View 17-Step Pipeline</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: Trending Now */}
          <div
            id="card-trending-now"
            className="rounded-2xl p-5 glass-panel-interactive flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-100 font-display">
                    Trending Now
                  </h3>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  Stage 01
                </span>
              </div>

              {/* Labeled Empty State */}
              <div className="py-5 px-3 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-1.5">
                <Radio className="w-6 h-6 mx-auto text-slate-600" />
                <p className="text-xs font-semibold text-slate-300">
                  Trend radar not connected yet
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Real-time topic velocity and viral signal aggregation will be connected in Phase 2.
                </p>
              </div>
            </div>

            <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500">
                Status: Standby
              </span>
              <button
                id="btn-explore-trends"
                onClick={() => navigate('/trends')}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
              >
                <span>Explore Trends</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2: Recent Projects */}
          <div
            id="card-recent-projects"
            className="rounded-2xl p-5 glass-panel-interactive flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <FolderGit2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-100 font-display">
                    Recent Projects
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/40">
                  {projects.length} Saved
                </span>
              </div>

              {/* Real projects list or empty state */}
              {projects.length > 0 ? (
                <div className="space-y-2">
                  {recentProjects.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/30 transition-colors flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-slate-200 truncate">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Updated {new Date(p.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={() => openProject(p.id)}
                        className={`text-[11px] font-semibold px-2 py-1 rounded transition-colors ${
                          activeProject?.id === p.id
                            ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {activeProject?.id === p.id ? 'Active' : 'Open'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-5 px-3 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-1.5">
                  <FolderGit2 className="w-6 h-6 mx-auto text-slate-600" />
                  <p className="text-xs font-semibold text-slate-300">
                    No projects yet
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Initialize your first project container to organize scripts, prompts, and media.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between">
              <button
                id="btn-quick-new-project"
                onClick={onOpenNewProject}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>New Project</span>
              </button>
              <button
                id="btn-view-all-projects"
                onClick={() => navigate('/projects')}
                className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 3: Generation Queue */}
          <div
            id="card-generation-queue"
            className="rounded-2xl p-5 glass-panel-interactive flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-100 font-display">
                    Generation Queue
                  </h3>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
                  Idle
                </span>
              </div>

              {/* Labeled Empty State */}
              <div className="py-5 px-3 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-1.5">
                <Clock className="w-6 h-6 mx-auto text-slate-600" />
                <p className="text-xs font-semibold text-slate-300">
                  No generations yet
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Asynchronous render jobs and background generation queues will be tracked here once media synthesis modules connect.
                </p>
              </div>
            </div>

            <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500">
                Active Workers: 0
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Queue Clean
              </span>
            </div>
          </div>

          {/* Card 4: YouTube Channel */}
          <div
            id="card-youtube-channel"
            className="rounded-2xl p-5 glass-panel-interactive flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <Youtube className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-100 font-display">
                    YouTube Channel
                  </h3>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  Stage 14
                </span>
              </div>

              {/* Labeled Empty State */}
              <div className="py-5 px-3 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-1.5">
                <Youtube className="w-6 h-6 mx-auto text-slate-600" />
                <p className="text-xs font-semibold text-slate-300">
                  Connect YouTube later
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                  YouTube Data API v3 integration and OAuth publishing flows are planned for future development phases.
                </p>
              </div>
            </div>

            <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500">
                API: Not connected
              </span>
              <button
                id="btn-view-youtube-studio"
                onClick={() => navigate('/youtube')}
                className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <span>YouTube Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 5: SEO Score */}
          <div
            id="card-seo-score"
            className="rounded-2xl p-5 glass-panel-interactive flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <SearchCheck className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-100 font-display">
                    SEO Score
                  </h3>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  Stage 12
                </span>
              </div>

              {/* Labeled Empty State */}
              <div className="py-5 px-3 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-1.5">
                <SearchCheck className="w-6 h-6 mx-auto text-slate-600" />
                <p className="text-xs font-semibold text-slate-300">
                  SEO engine not connected yet
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Search volume predictor, algorithmic tag score, and title CTR optimization will compute after content metadata is drafted.
                </p>
              </div>
            </div>

            <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500">
                Score: Pending
              </span>
              <button
                id="btn-view-seo-studio"
                onClick={() => navigate('/seo')}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <span>SEO Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 6: Quick Actions */}
          <div
            id="card-quick-actions"
            className="rounded-2xl p-5 glass-panel-interactive flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-100 font-display">
                    Quick Actions
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                  Ready
                </span>
              </div>

              {/* Real working buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="qa-new-project-btn"
                  onClick={onOpenNewProject}
                  className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-cyan-950/50 border border-slate-800 hover:border-cyan-500/40 text-left transition-all group/b"
                >
                  <FolderPlus className="w-4 h-4 text-cyan-400 mb-1.5 group-hover/b:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-slate-200">
                    New Project
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Local container
                  </div>
                </button>

                <button
                  id="qa-switch-theme-btn"
                  onClick={toggleTheme}
                  className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-cyan-950/50 border border-slate-800 hover:border-cyan-500/40 text-left transition-all group/b"
                >
                  <Layers className="w-4 h-4 text-indigo-400 mb-1.5 group-hover/b:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-slate-200">
                    Theme: {theme.toUpperCase()}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Click to rotate
                  </div>
                </button>

                <button
                  id="qa-view-roadmap-btn"
                  onClick={onOpenRoadmap}
                  className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-cyan-950/50 border border-slate-800 hover:border-cyan-500/40 text-left transition-all group/b"
                >
                  <Sparkles className="w-4 h-4 text-amber-400 mb-1.5 group-hover/b:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-slate-200">
                    17-Step Plan
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Full Roadmap
                  </div>
                </button>

                <button
                  id="qa-settings-btn"
                  onClick={() => navigate('/settings')}
                  className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-cyan-950/50 border border-slate-800 hover:border-cyan-500/40 text-left transition-all group/b"
                >
                  <ExternalLink className="w-4 h-4 text-emerald-400 mb-1.5 group-hover/b:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-slate-200">
                    Settings
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Diagnostics
                  </div>
                </button>
              </div>
            </div>

            <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>All 4 Actions Functional</span>
              <span className="text-cyan-400">Zero Mock Calls</span>
            </div>
          </div>
        </div>
      </section>

      {/* MintMind Intelligence Section */}
      <section id="dashboard-creova-intelligence" className="space-y-4 pt-4 border-t border-slate-800/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Radar className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-display">
                  MintMind Intelligence
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                  Foundation Mode
                </span>
              </div>
              <p className="text-xs text-slate-400">
                YouTube platform signals, breakout trends, and competitive creator benchmarks
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/youtube-intelligence')}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 self-start sm:self-auto transition-colors px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/30"
          >
            <span>Open Intelligence Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 6 Intelligence Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Trending */}
          <div
            id="dash-intel-trending"
            onClick={() => navigate('/youtube-intelligence/topics')}
            className="p-5 rounded-2xl glass-panel border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer group space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                    Trending
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Radar</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Breakout search spikes and rapid keyword velocity clusters.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate">Data connection not configured yet</span>
            </div>
          </div>

          {/* 2. Rising Channels */}
          <div
            id="dash-intel-rising-channels"
            onClick={() => navigate('/youtube-intelligence/channel')}
            className="p-5 rounded-2xl glass-panel border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer group space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Tv className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                    Rising Channels
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Growth</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Creators experiencing explosive month-over-month subscriber acceleration.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate">Data connection not configured yet</span>
            </div>
          </div>

          {/* 3. Rising Videos */}
          <div
            id="dash-intel-rising-videos"
            onClick={() => navigate('/youtube-intelligence/video')}
            className="p-5 rounded-2xl glass-panel border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer group space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <PlaySquare className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                    Rising Videos
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Velocity</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Fresh uploads gaining abnormal early traction across homepage feeds.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate">Data connection not configured yet</span>
            </div>
          </div>

          {/* 4. Opportunities */}
          <div
            id="dash-intel-opportunities"
            onClick={() => navigate('/youtube-intelligence/strategy')}
            className="p-5 rounded-2xl glass-panel border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer group space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                    <Lightbulb className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                    Opportunities
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Strategy</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                High-demand content gaps where audience interest outpaces creator supply.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate">Data connection not configured yet</span>
            </div>
          </div>

          {/* 5. Competitors */}
          <div
            id="dash-intel-competitors"
            onClick={() => navigate('/youtube-intelligence/competitors')}
            className="p-5 rounded-2xl glass-panel border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer group space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                    <Crosshair className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                    Competitors
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Benchmark</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Local competitor tracking and side-by-side upload frequency audits.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate">Data connection not configured yet</span>
            </div>
          </div>

          {/* 6. Live Radar */}
          <div
            id="dash-intel-live-radar"
            onClick={() => navigate('/youtube-intelligence/live')}
            className="p-5 rounded-2xl glass-panel border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer group space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <Radio className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                    Live Radar
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Broadcasts</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Concurrent viewer distributions and active live stream signals.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate">Data connection not configured yet</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
