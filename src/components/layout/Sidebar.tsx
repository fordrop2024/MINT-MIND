import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Cpu,
  GitBranch,
  Layers,
  Sparkles,
} from 'lucide-react';
import { NAV_ITEMS } from '../../constants/routes';
import { useRouter } from '../../context/RouterContext';
import type { AppRoute } from '../../types';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenRoadmap: () => void;
}

export function Sidebar({ isCollapsed, onToggleCollapse, onOpenRoadmap }: SidebarProps) {
  const { currentRoute, navigate } = useRouter();

  // Categorize navigation
  const coreItems = NAV_ITEMS.filter((i) => i.category === 'core');
  const intelligenceItems = NAV_ITEMS.filter((i) => i.category === 'intelligence');
  const creationItems = NAV_ITEMS.filter((i) => i.category === 'creation');
  const distributionItems = NAV_ITEMS.filter((i) => i.category === 'distribution');
  const managementItems = NAV_ITEMS.filter((i) => i.category === 'management');

  const renderNavGroup = (title: string, items: typeof NAV_ITEMS) => (
    <div className="mb-4">
      {!isCollapsed && (
        <div className="px-3 mb-1.5 text-[10px] font-mono uppercase tracking-widest text-slate-400/80 font-bold flex items-center justify-between">
          <span>{title}</span>
          <span className="text-[9px] text-slate-500">{items.length}</span>
        </div>
      )}
      <div className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.path;
          const isPhase2 = item.phase === 'phase_2';

          return (
            <button
              key={item.path}
              id={`nav-link-${item.path.replace('/', '')}`}
              onClick={() => navigate(item.path)}
              title={isCollapsed ? `${item.label} ${isPhase2 ? '(Phase 2)' : ''}` : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all relative group ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
            >
              {/* Active Indicator Bar */}
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
              )}

              <Icon
                className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-cyan-300' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />

              {!isCollapsed && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="truncate text-left">{item.label}</span>
                  {item.pipelineStage && (
                    <span className="ml-1 text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-400 border border-slate-700/60 group-hover:border-cyan-500/30">
                      S{item.pipelineStage.toString().padStart(2, '0')}
                    </span>
                  )}
                  {isPhase2 && !item.pipelineStage && (
                    <span className="ml-1 text-[8px] font-mono px-1 py-0.2 rounded bg-slate-800/60 text-slate-500">
                      P2
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside
      id="main-sidebar"
      className={`relative flex flex-col shrink-0 border-r border-slate-800/80 glass-panel bg-slate-950/70 transition-all duration-300 ease-in-out z-30 ${
        isCollapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/80">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2.5 group overflow-hidden text-left focus:outline-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center group-hover:bg-transparent transition-colors">
              <Cpu className="w-5 h-5 text-cyan-400 group-hover:text-white transition-colors" />
            </div>
          </div>

          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-base tracking-wider text-white flex items-center gap-1.5">
                MintMind <span className="text-cyan-400 text-xs font-mono font-normal">AI</span>
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                AI Content OS
              </span>
            </div>
          )}
        </button>

        {/* Collapse Toggle */}
        <button
          id="sidebar-toggle-btn"
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-2">
        {renderNavGroup('Core Console', coreItems)}
        {renderNavGroup('YouTube Intelligence', intelligenceItems)}
        {renderNavGroup('Creator Pipeline', creationItems)}
        {renderNavGroup('Distribution & SEO', distributionItems)}
        {renderNavGroup('Management', managementItems)}
      </div>

      {/* Bottom Roadmap & Architecture Badge */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
        {!isCollapsed ? (
          <div className="space-y-2">
            <button
              onClick={onOpenRoadmap}
              className="w-full px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-950/60 to-indigo-950/60 border border-cyan-500/30 hover:border-cyan-400/60 text-xs font-semibold text-cyan-300 flex items-center justify-between transition-all group"
            >
              <span className="flex items-center gap-2">
                <GitBranch className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform" />
                Pipeline Roadmap
              </span>
              <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-900/40 px-1.5 py-0.5 rounded">
                17 Steps
              </span>
            </button>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Foundation Active
              </span>
              <span className="text-slate-400">Node + Vite</span>
            </div>
          </div>
        ) : (
          <button
            onClick={onOpenRoadmap}
            title="View 17-Step Creator Pipeline Roadmap"
            className="w-full py-2 flex items-center justify-center rounded-xl bg-cyan-950/40 text-cyan-400 hover:bg-cyan-900/50 transition-colors"
          >
            <GitBranch className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
