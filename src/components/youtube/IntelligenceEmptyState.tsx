import React from 'react';
import { ShieldAlert, Link2, ArrowRight } from 'lucide-react';
import { useRouter } from '../../context/RouterContext';

interface IntelligenceEmptyStateProps {
  title?: string;
  description?: string;
  showConnectButton?: boolean;
  compact?: boolean;
}

export function IntelligenceEmptyState({
  title = 'Data connection not configured yet.',
  description = 'YouTube Data API v3 connection is scheduled for the upcoming integration phase. No fabricated statistics or mock metrics are rendered.',
  showConnectButton = true,
  compact = false,
}: IntelligenceEmptyStateProps) {
  const { navigate } = useRouter();

  if (compact) {
    return (
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-slate-400">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <span className="font-semibold text-slate-200 block">{title}</span>
            <span className="text-[11px] text-slate-400">{description}</span>
          </div>
        </div>
        {showConnectButton && (
          <button
            onClick={() => navigate('/youtube')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-[11px] flex items-center gap-1.5 shrink-0 transition-colors border border-slate-700 self-start sm:self-auto"
          >
            <Link2 className="w-3 h-3 text-cyan-400" />
            <span>Connect YouTube</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 rounded-2xl glass-panel border border-slate-800/80 bg-slate-950/40 text-center flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
        <ShieldAlert className="w-6 h-6" />
      </div>

      <div className="max-w-md space-y-1.5">
        <h3 className="text-sm font-bold text-slate-200 font-display">
          {title}
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        <span>Awaiting YouTube Data API & OAuth</span>
      </div>

      {showConnectButton && (
        <div className="pt-2">
          <button
            onClick={() => navigate('/youtube')}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/60 font-semibold text-xs flex items-center gap-2 transition-all group shadow-sm shadow-cyan-950/40"
          >
            <Link2 className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>Connect YouTube</span>
            <ArrowRight className="w-3 h-3 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
}
