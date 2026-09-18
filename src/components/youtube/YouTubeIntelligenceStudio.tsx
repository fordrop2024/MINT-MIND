import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  BarChart3,
  Flame,
  Search,
  Zap,
  Target,
  Users,
  Eye,
  ArrowUpRight,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  Filter,
  Layers,
  ChevronRight,
  Compass,
} from 'lucide-react';
import {
  calculateChannelPerformanceMetrics,
  detectPerformanceOutliers,
  VIRAL_HOOK_PATTERNS,
  generateTopicOpportunityClusters,
} from '../../services/youtubeIntelligenceService';
import type { YouTubeChannel } from '../../types/youtube';

interface YouTubeIntelligenceStudioProps {
  channel?: Partial<YouTubeChannel>;
  activeNiche?: string;
  onSelectTopicForScript?: (topicName: string, angle: string) => void;
  onNotification?: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const YouTubeIntelligenceStudio: React.FC<YouTubeIntelligenceStudioProps> = ({
  channel,
  activeNiche = 'AI & Creative Automation',
  onSelectTopicForScript,
  onNotification,
}) => {
  const [nicheInput, setNicheInput] = useState(activeNiche);
  const [activeTab, setActiveTab] = useState<'opportunities' | 'outliers' | 'viral_hooks' | 'channel_health'>('opportunities');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Compute Metrics
  const metrics = useMemo(() => calculateChannelPerformanceMetrics(channel || {}), [channel]);
  const topicClusters = useMemo(() => generateTopicOpportunityClusters(nicheInput), [nicheInput]);

  // Sample Outlier Videos for benchmarking
  const sampleOutliers = useMemo(() => {
    return detectPerformanceOutliers(
      [
        {
          id: 'v1',
          title: 'I Automated My Entire Workflow in 48 Hours (Step-by-Step)',
          views: 184000,
          channelTitle: 'Creator Systems',
          publishedAt: '2026-03-02',
        },
        {
          id: 'v2',
          title: 'Why 99% Of Creators Are Using AI Completely Wrong',
          views: 312000,
          channelTitle: 'Digital Momentum',
          publishedAt: '2026-02-18',
        },
        {
          id: 'v3',
          title: 'The Uncomfortable Truth About the Future of Content Creation',
          views: 420000,
          channelTitle: 'Tech Vision',
          publishedAt: '2026-01-25',
        },
        {
          id: 'v4',
          title: '10 Tools I Wish I Knew Before Starting in 2026',
          views: 98000,
          channelTitle: 'NextGen Production',
          publishedAt: '2026-03-10',
        },
      ],
      25000
    );
  }, []);

  const handleCopy = (text: string, key: string, label = 'Copied to clipboard') => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onNotification?.(label, 'success');
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* COMMAND BAR */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Algorithmic Intelligence & Market Radar
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Niche: {nicheInput}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Compass className="w-5 h-5 text-cyan-400" />
              YouTube Intelligence & Algorithmic Growth Radar
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl">
              Track breakout outlier patterns, discover untapped topic opportunity gaps, and exploit proven viral hook formulas to maximize organic recommendations.
            </p>
          </div>

          {/* Niche Input / Refresh */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={nicheInput}
                onChange={(e) => setNicheInput(e.target.value)}
                placeholder="Enter niche or topic..."
                className="pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 w-48 sm:w-64 font-medium"
              />
            </div>
            <button
              onClick={() => onNotification?.(`Refreshed intelligence data for "${nicheInput}"`, 'success')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="Refresh radar"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1">
              <Users className="w-3 h-3 text-cyan-400" /> Audience Base
            </span>
            <div className="text-lg font-black text-white font-mono">
              {metrics.subscribers.toLocaleString()}
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> +{metrics.growthRate30d}% 30d velocity
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1">
              <Eye className="w-3 h-3 text-indigo-400" /> Total Views
            </span>
            <div className="text-lg font-black text-white font-mono">
              {(metrics.totalViews / 1000000).toFixed(2)}M
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              Avg ~{metrics.avgViewsPerVideo.toLocaleString()} / video
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" /> Engagement Rate
            </span>
            <div className="text-lg font-black text-emerald-400 font-mono">
              {metrics.engagementRate}%
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Top Tier (&gt;5% benchmark)
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Upload Consistency
            </span>
            <div className="text-lg font-black text-amber-400 font-mono">
              {metrics.uploadConsistencyScore} / 100
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Algorithm Priority Status
            </span>
          </div>
        </div>

        {/* SUB-NAV TABS */}
        <div className="flex items-center gap-2 pt-2">
          {[
            { id: 'opportunities', label: 'Topic Opportunities', icon: Target },
            { id: 'outliers', label: 'Breakout Outliers (3x-10x)', icon: Flame },
            { id: 'viral_hooks', label: 'Viral Hook Playbook', icon: Sparkles },
            { id: 'channel_health', label: 'Traffic & Distribution', icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
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

      {/* TAB 1: TOPIC OPPORTUNITY CLUSTERS */}
      {activeTab === 'opportunities' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              AI-Scored Content Opportunities (High Demand + Low Competitor Saturation)
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Ranked by Opportunity Score
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topicClusters.map((cluster) => (
              <div
                key={cluster.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700 font-bold uppercase">
                      {cluster.category}
                    </span>
                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
                      <span className="text-slate-400 text-[10px] uppercase">Opportunity:</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {cluster.opportunityScore} / 100
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight">
                    {cluster.topicName}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-cyan-400 font-mono">Angle: </strong>
                    {cluster.recommendedAngle}
                  </p>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="text-slate-500 text-[9px] uppercase">Demand</div>
                      <div className="text-white font-bold">{cluster.demandScore}%</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="text-slate-500 text-[9px] uppercase">Competition</div>
                      <div
                        className={`font-bold ${
                          cluster.competitionLevel === 'Low'
                            ? 'text-emerald-400'
                            : cluster.competitionLevel === 'Medium'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {cluster.competitionLevel}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="text-slate-500 text-[9px] uppercase">Est. Views</div>
                      <div className="text-cyan-300 font-bold">{cluster.estPotentialViews}</div>
                    </div>
                  </div>

                  {/* Target Keywords */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {cluster.targetKeywords.map((kw, kIdx) => (
                      <span
                        key={kIdx}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (onSelectTopicForScript) {
                        onSelectTopicForScript(cluster.topicName, cluster.recommendedAngle);
                      }
                      onNotification?.(`Selected "${cluster.topicName}" for new script`, 'success');
                    }}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Create Script on this Topic</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: BREAKOUT OUTLIER RADAR */}
      {activeTab === 'outliers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Breakout Viral Videos (Performing 3x to 10x Above Channel Baseline)
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Reverse-engineered for replication
            </span>
          </div>

          <div className="space-y-3">
            {sampleOutliers.map((outlier) => (
              <div
                key={outlier.videoId}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                      <Flame className="w-3 h-3" /> {outlier.performanceMultiplier}x Outlier Multiplier
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Channel: {outlier.channelTitle}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {outlier.publishedAt}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white leading-snug">
                    {outlier.videoTitle}
                  </h4>

                  <div className="text-xs text-slate-300 font-mono flex items-center gap-2">
                    <span className="text-amber-400 font-bold">Detected Hook Pattern:</span>
                    <span className="text-slate-300">{outlier.detectedPattern}</span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                  <div className="text-right font-mono">
                    <div className="text-base font-black text-white">
                      {outlier.views.toLocaleString()} views
                    </div>
                    <div className="text-[10px] text-slate-500">
                      vs {outlier.channelAverageViews.toLocaleString()} avg
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      handleCopy(outlier.videoTitle, outlier.videoId, 'Outlier title copied')
                    }
                    className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    {copiedKey === outlier.videoId ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    Copy Title
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: VIRAL HOOK PLAYBOOK */}
      {activeTab === 'viral_hooks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              High-Velocity Algorithmic Hook Formulas
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Click template to copy
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {VIRAL_HOOK_PATTERNS.map((pattern) => (
              <div
                key={pattern.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase text-cyan-400">
                      {pattern.patternName}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      Avg {pattern.averageMultiplier}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {pattern.description}
                  </p>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                      Proven Template:
                    </span>
                    <div className="text-xs font-bold text-white font-sans">
                      "{pattern.exampleTitle}"
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    <strong className="text-slate-300">Psychological Trigger: </strong>
                    {pattern.whyItWorks}
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(pattern.exampleTitle, pattern.id, 'Formula copied')}
                  className="w-full py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  {copiedKey === pattern.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Formula Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-cyan-400" />
                      Copy Title Template
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CHANNEL DISTRIBUTION & TRAFFIC */}
      {activeTab === 'channel_health' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Audience Traffic Sources (Algorithmic Ingest)
            </h3>
            <div className="space-y-3">
              {metrics.topTrafficSources.map((source, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{source.source}</span>
                    <span className="font-mono text-cyan-400 font-bold">{source.percentage}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 transition-all duration-300"
                      style={{ width: `${source.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-800">
              Browse Features & Recommendations dominate 68% of long-term views. Prioritize High-CTR Thumbnails and initial 30s retention.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Algorithmic Health Audit
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">Retention Pacing (160 WPM)</span>
                <span className="text-emerald-400 font-mono font-bold">OPTIMAL</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">Upload Cadence (Weekly)</span>
                <span className="text-emerald-400 font-mono font-bold">CONSISTENT</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">Keyword Density Balance</span>
                <span className="text-cyan-400 font-mono font-bold">STRONG</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">CTR Benchmark</span>
                <span className="text-amber-400 font-mono font-bold">8.4% (GOOD)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
