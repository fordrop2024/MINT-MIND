import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Folder,
  FolderPlus,
  Bell,
  Sun,
  Moon,
  Layers,
  ChevronDown,
  Check,
  User,
  Settings,
  ShieldCheck,
  Sparkles,
  LogOut,
  LogIn,
  Cloud,
  HardDrive,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useProjects } from '../../context/ProjectContext';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import type { ThemeMode } from '../../types';

interface TopBarProps {
  onOpenCommand: () => void;
  onOpenNewProject: () => void;
}

export function TopBar({ onOpenCommand, onOpenNewProject }: TopBarProps) {
  const { theme, setTheme } = useTheme();
  const { projects, activeProject, openProject } = useProjects();
  const { navigate } = useRouter();
  const { user, authState, logout } = useAuth();

  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const projectRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (projectRef.current && !projectRef.current.contains(e.target as Node)) {
        setIsProjectDropdownOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setIsThemeDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themes: { id: ThemeMode; label: string; icon: typeof Moon }[] = [
    { id: 'dark', label: 'Dark Mode', icon: Moon },
    { id: 'light', label: 'Light Mode', icon: Sun },
    { id: 'mix', label: 'Mix Mode', icon: Layers },
  ];

  return (
    <header
      id="top-navigation-bar"
      className="h-16 px-5 border-b border-slate-800/80 glass-panel bg-slate-950/70 flex items-center justify-between gap-4 sticky top-0 z-20"
    >
      {/* Search / AI Command Placeholder */}
      <div className="flex-1 max-w-lg">
        <button
          id="topbar-search-trigger"
          onClick={onOpenCommand}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-slate-200 transition-all text-xs group"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Search className="w-4 h-4 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="truncate">
              Search workspace or command... <span className="text-[10px] text-amber-400/80 font-mono">(AI Command: Standby)</span>
            </span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[10px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700 shrink-0 text-slate-400">
            <kbd>⌘</kbd>
            <kbd>K</kbd>
          </div>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Project Selector */}
        <div className="relative" ref={projectRef}>
          <button
            id="topbar-project-selector"
            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 text-xs font-semibold text-slate-200 transition-all"
          >
            <Folder className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="max-w-[140px] truncate">
              {activeProject ? activeProject.name : 'No Project Active'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          </button>

          {isProjectDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl glass-panel border border-slate-800 shadow-2xl p-1.5 z-40 animate-in fade-in-50 duration-100">
              <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-slate-800">
                <span>Active Project</span>
                <span className="text-cyan-400">{projects.length} Total</span>
              </div>

              <div className="max-h-48 overflow-y-auto py-1">
                {projects.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => {
                      openProject(proj.id);
                      setIsProjectDropdownOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left text-xs transition-colors ${
                      activeProject?.id === proj.id
                        ? 'bg-cyan-500/15 text-cyan-300 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{proj.name}</span>
                    {activeProject?.id === proj.id && (
                      <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    )}
                  </button>
                ))}

                {projects.length === 0 && (
                  <div className="px-3 py-3 text-center text-xs text-slate-500">
                    No projects created yet
                  </div>
                )}
              </div>

              <div className="pt-1 border-t border-slate-800 space-y-1">
                <button
                  onClick={() => {
                    setIsProjectDropdownOpen(false);
                    onOpenNewProject();
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:bg-cyan-950/40 transition-colors"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Create New Project</span>
                </button>
                <button
                  onClick={() => {
                    setIsProjectDropdownOpen(false);
                    navigate('/projects');
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  <span>Manage All Projects</span>
                  <span className="font-mono text-[10px]">/projects</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Icon with Real Empty State */}
        <div className="relative" ref={notifRef}>
          <button
            id="topbar-notifications-btn"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent hover:border-slate-800 transition-all relative"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-slate-600" />
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl glass-panel border border-slate-800 shadow-2xl p-3 z-40 animate-in fade-in-50 duration-100">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-200 font-display">
                  System Feed
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  0 Active
                </span>
              </div>
              <div className="py-6 text-center">
                <Bell className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                <p className="text-xs font-semibold text-slate-300">
                  No notifications yet
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Render queue events and platform triggers will appear here in Phase 2.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Guest Mode Indicator */}
        {authState === 'GUEST' && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-semibold text-amber-300">Guest Mode</span>
            <span className="text-slate-500">&bull;</span>
            <button
              onClick={() => navigate('/login')}
              className="text-amber-200 hover:text-white underline font-medium hover:no-underline transition-colors"
            >
              Sign in to save your work
            </button>
          </div>
        )}

        {/* Theme Selector Dropdown */}
        <div className="relative" ref={themeRef}>
          <button
            id="topbar-theme-selector-btn"
            onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent hover:border-slate-800 transition-all flex items-center gap-1"
            title={`Current Theme: ${theme.toUpperCase()}`}
          >
            {theme === 'dark' && <Moon className="w-4 h-4 text-cyan-400" />}
            {theme === 'light' && <Sun className="w-4 h-4 text-amber-400" />}
            {theme === 'mix' && <Layers className="w-4 h-4 text-indigo-400" />}
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {isThemeDropdownOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-xl glass-panel border border-slate-800 shadow-2xl p-1 z-40 animate-in fade-in-50 duration-100">
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800">
                Workspace Theme
              </div>
              <div className="py-1 space-y-0.5">
                {themes.map((t) => {
                  const Icon = t.icon;
                  const isSelected = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTheme(t.id);
                        setIsThemeDropdownOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors ${
                        isSelected
                          ? 'bg-cyan-500/15 text-cyan-300 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-cyan-400" />
                        {t.label}
                      </span>
                      {isSelected && <Check className="w-3 h-3 text-cyan-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            id="topbar-profile-menu-btn"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Creator'}
                referrerPolicy="no-referrer"
                className="w-6 h-6 rounded-lg object-cover border border-slate-700"
              />
            ) : (
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-slate-950 font-extrabold text-[10px] font-mono shadow-sm">
                {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'CR'}
              </div>
            )}
            <span className="text-xs font-semibold text-slate-200 hidden md:inline truncate max-w-[120px]">
              {user?.displayName || (authState === 'GUEST' ? 'Guest Creator' : 'Creator')}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl glass-panel border border-slate-800 shadow-2xl p-2 z-40 animate-in fade-in-50 duration-100">
              <div className="px-3 py-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Creator'}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-xl object-cover border border-cyan-500/40"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-slate-950 font-bold text-xs font-mono">
                      {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'CR'}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-slate-100 truncate">
                      {user?.displayName || (authState === 'GUEST' ? 'Guest Creator' : 'Creator')}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {user?.email || (authState === 'GUEST' ? 'Temporary Guest Session' : 'Signed out')}
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-slate-400">
                    {authState === 'AUTHENTICATED' ? (
                      <>
                        <Cloud className="w-3 h-3 text-cyan-400" />
                        <span className="text-cyan-300">Cloud Synced</span>
                      </>
                    ) : (
                      <>
                        <HardDrive className="w-3 h-3 text-amber-400" />
                        <span className="text-amber-300">Local Only</span>
                      </>
                    )}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/60">
                    {authState}
                  </span>
                </div>
              </div>

              <div className="py-1">
                <button
                  id="topbar-settings-nav-btn"
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full px-3 py-2 rounded-xl flex items-center gap-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>Workspace Settings</span>
                </button>

                {authState === 'GUEST' ? (
                  <button
                    id="topbar-signin-btn"
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate('/login');
                    }}
                    className="w-full mt-1 px-3 py-2 rounded-xl flex items-center gap-2 text-xs text-cyan-300 hover:text-cyan-100 hover:bg-cyan-950/40 border border-cyan-500/20 transition-colors font-semibold"
                  >
                    <LogIn className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Sign In to Save Work</span>
                  </button>
                ) : (
                  <button
                    id="topbar-signout-btn"
                    onClick={async () => {
                      setIsProfileOpen(false);
                      await logout();
                      navigate('/login');
                    }}
                    className="w-full mt-1 px-3 py-2 rounded-xl flex items-center gap-2 text-xs text-rose-400 hover:text-rose-200 hover:bg-rose-950/30 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
