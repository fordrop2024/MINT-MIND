import React, { useState, useEffect } from 'react';
import { Search, X, Terminal, ArrowRight, ShieldAlert } from 'lucide-react';
import { NAV_ITEMS } from '../../constants/routes';
import { useRouter } from '../../context/RouterContext';
import type { AppRoute } from '../../types';

interface CommandModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandModal({ isOpen, onClose }: CommandModalProps) {
  const { navigate } = useRouter();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // handled in parent or toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredItems = NAV_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.description.toLowerCase().includes(query.toLowerCase()) ||
    item.path.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path: AppRoute) => {
    navigate(path);
    onClose();
  };

  return (
    <div
      id="command-palette-backdrop"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="command-palette-dialog"
        className="w-full max-w-2xl rounded-2xl glass-panel border border-cyan-500/40 shadow-2xl shadow-cyan-950/50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 gap-3 bg-slate-950/60">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            id="command-palette-input"
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or jump to workspace module..."
            className="w-full bg-transparent text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none font-sans"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-800 border border-slate-700 rounded text-slate-400">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* AI Command Engine Status Banner */}
        <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2.5 text-xs text-amber-300">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>AI Command Engine: Standby (Not connected yet).</strong> Natural language generation and automated multi-step orchestrations are scheduled for Phase 2. Use this palette for direct module navigation.
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-800/40">
          <div className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Workspace Modules ({filteredItems.length})</span>
            <span>Jump to Route</span>
          </div>

          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isPhase2 = item.phase === 'phase_2';

            return (
              <button
                key={item.path}
                id={`command-item-${item.path.replace('/', '')}`}
                onClick={() => handleSelect(item.path)}
                className="w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-left hover:bg-cyan-500/10 hover:border hover:border-cyan-500/30 transition-all group border border-transparent"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-cyan-400 group-hover:border-cyan-500/50 group-hover:text-cyan-300 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-100 group-hover:text-cyan-200">
                        {item.label}
                      </span>
                      {isPhase2 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                          Phase 2
                        </span>
                      )}
                      {item.pipelineStage && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/50 font-mono">
                          Stage {item.pipelineStage}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-slate-500 group-hover:text-cyan-400">
                  <span className="hidden sm:inline">{item.path}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="py-8 text-center text-slate-400">
              <Terminal className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm">No matching workspace modules found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>MintMind AI OS Foundation</span>
          <span>Press Enter to select &bull; Esc to close</span>
        </div>
      </div>
    </div>
  );
}
