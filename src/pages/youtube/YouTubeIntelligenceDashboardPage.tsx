import React from 'react';
import {
  Radar,
  TrendingUp,
  Tv,
  PlaySquare,
  Trophy,
  Radio,
  Flame,
  Lightbulb,
  Crosshair,
  Link2,
  Compass,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useRouter } from '../../context/RouterContext';
import { IntelligenceEmptyState } from '../../components/youtube/IntelligenceEmptyState';
import { YouTubeIntelligenceStudio } from '../../components/youtube/YouTubeIntelligenceStudio';

export function YouTubeIntelligenceDashboardPage() {
  const { navigate } = useRouter();
  const [viewMode, setViewMode] = React.useState<'studio' | 'matrix'>('studio');

  const sections = [
    {
      id: 'trending-topics',
      title: 'Trending Topics',
      subtitle: 'High-velocity search signals and viral keyword clusters',
      icon: TrendingUp,
      route: '/youtube-intelligence/topics' as const,
    },
    {
      id: 'rising-channels',
      title: 'Rising Channels',
      subtitle: 'Fastest growing creators breaking through the algorithm',
      icon: Tv,
      route: '/youtube-intelligence/channel' as const,
    },
    {
      id: 'rising-videos',
      title: 'Rising Videos',
      subtitle: 'High-velocity video uploads gaining abnormal early traction',
      icon: PlaySquare,
      route: '/youtube-intelligence/video' as const,
    },
    {
      id: 'top-channels',
      title: 'Top Channels',
      subtitle: 'Category leaders and macro benchmark channels',
      icon: Trophy,
      route: '/youtube-intelligence/rankings' as const,
    },
    {
      id: 'live-now',
      title: 'Live Now',
      subtitle: 'Concurrent audience distribution across live broadcasts',
      icon: Radio,
      route: '/youtube-intelligence/live' as const,
    },
    {
      id: 'outliers',
      title: 'Outliers',
      subtitle: 'Statistical anomalies outperforming channel historical medians',
      icon: Flame,
      route: '/youtube-intelligence/outliers' as const,
    },
    {
      id: 'competitor-alerts',
      title: 'Competitor Alerts',
      subtitle: 'Upload frequency changes and pacing across tracked competitors',
      icon: Crosshair,
      route: '/youtube-intelligence/competitors' as const,
    },
    {
      id: 'creator-opportunities',
      title: 'Creator Opportunities',
      subtitle: 'Actionable content gaps where audience demand exceeds supply',
      icon: Lightbulb,
      route: '/youtube-intelligence/strategy' as const,
    },
  ];

  return (
    <div id="youtube-intelligence-dashboard" className="space-y-8 animate-in fade-in duration-200">
      {/* Hero Header */}
      <div className="p-8 rounded-3xl glass-panel border border-slate-800 bg-slate-950/60 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 text-xs font-mono">
              <Radar className="w-3.5 h-3.5 text-cyan-400" />
              <span>Macro Intelligence Radar &bull; Foundation Mode</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight font-display">
              YouTube Intelligence
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              Real-time platform radar, competitive channel benchmarks, breakout outlier detection, and audience opportunity insights built on MintMind proprietary analytical scoring.
            </p>

            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-300">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                No YouTube data connection yet. Data connection not configured yet. No fabricated rankings or fake metrics are displayed.
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/youtube')}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              <Link2 className="w-4 h-4 text-slate-950" />
              <span>Connect YouTube</span>
            </button>

            <button
              onClick={() => navigate('/youtube-intelligence/strategy')}
              className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Lightbulb className="w-4 h-4 text-cyan-400" />
              <span>Strategy Analyzer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mode Toggle Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('studio')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'studio'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Live Intelligence Studio
          </button>
          <button
            onClick={() => setViewMode('matrix')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'matrix'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            System Modules Radar
          </button>
        </div>

        <span className="text-[11px] font-mono text-slate-500">
          Mode: {viewMode === 'studio' ? 'Interactive Intelligence Workspace' : 'Modular Radar'}
        </span>
      </div>

      {viewMode === 'studio' ? (
        <YouTubeIntelligenceStudio />
      ) : (
        /* Grid of 8 Intelligence Sections */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section) => {
            const Icon = section.icon;

            return (
              <div
                key={section.id}
                id={`intelligence-card-${section.id}`}
                className="p-6 rounded-2xl glass-panel border border-slate-800/80 hover:border-slate-700/80 transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-white font-display">
                          {section.title}
                        </h2>
                        <p className="text-[11px] text-slate-400">
                          {section.subtitle}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(section.route)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition-colors"
                      title={`Open ${section.title}`}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="pt-2">
                    <IntelligenceEmptyState
                      title="No YouTube data connection yet."
                      description="Data connection not configured yet. This intelligence stream will activate when the official YouTube Data API is connected."
                      compact={true}
                      showConnectButton={false}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-mono text-slate-400">
                    MintMind Analytical Model
                  </span>
                  <button
                    onClick={() => navigate(section.route)}
                    className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                  >
                    <span>Launch Module</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
