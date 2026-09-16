import React, { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Palette,
  Globe,
  User,
  Link2,
  Check,
  Moon,
  Sun,
  Layers,
  Activity,
  Server,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Bell,
  LogOut,
  LogIn,
  Cloud,
  HardDrive,
  UploadCloud,
  CheckCircle2,
  Cpu,
  Zap,
  Radio,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
import { useCompetitors } from '../context/CompetitorContext';
import { useRouter } from '../context/RouterContext';
import { db, isFirebaseConfigured } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { ThemeMode, SystemStatusResponse } from '../types';
import type { AIProviderStatus, AIProviderId, ProviderTestResult } from '../types/aiProvider';
import {
  getAIProvidersAPI,
  selectAIProviderAPI,
  testAIProviderAPI,
} from '../services/aiService';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { authState, user, logout } = useAuth();
  const { navigate } = useRouter();
  const { localProjectsPendingMigration, importLocalProjects } = useProjects();
  const { localCompetitorsPendingMigration, importLocalCompetitors } = useCompetitors();

  // Settings State
  const [language, setLanguage] = useState<string>(() => {
    try {
      return localStorage.getItem('creova_language') || 'en-US';
    } catch {
      return 'en-US';
    }
  });

  const [notifications, setNotifications] = useState<{ email: boolean; push: boolean }>(() => {
    try {
      const saved = localStorage.getItem('creova_notifications');
      return saved ? JSON.parse(saved) : { email: true, push: false };
    } catch {
      return { email: true, push: false };
    }
  });

  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);
  const [migrationFeedback, setMigrationFeedback] = useState<string | null>(null);
  const [isMigratingAll, setIsMigratingAll] = useState(false);

  // Server diagnostics
  const [serverStatus, setServerStatus] = useState<SystemStatusResponse | null>(null);
  const [serverPingLoading, setServerPingLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // AI Providers State
  const [aiProviders, setAiProviders] = useState<AIProviderStatus[]>([]);
  const [activeProviderId, setActiveProviderId] = useState<AIProviderId>('gemini');
  const [providersLoading, setProvidersLoading] = useState(false);
  const [testingProviderId, setTestingProviderId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; latencyMs?: number; message?: string } | null>(null);
  const [switchingProviderId, setSwitchingProviderId] = useState<string | null>(null);

  // Sync settings from Firestore if authenticated
  useEffect(() => {
    if (authState === 'AUTHENTICATED' && user && isFirebaseConfigured && db) {
      const docRef = doc(db, 'users', user.id, 'settings', 'preferences');
      getDoc(docRef)
        .then((snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data.language) setLanguage(data.language);
            if (data.notifications) setNotifications(data.notifications);
          }
        })
        .catch((err) => console.warn('Failed to load user settings:', err));
    }
  }, [authState, user]);

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    try {
      localStorage.setItem('creova_language', newLang);
    } catch {
      // ignore
    }

    if (authState === 'AUTHENTICATED' && user && isFirebaseConfigured && db) {
      const docRef = doc(db, 'users', user.id, 'settings', 'preferences');
      setDoc(docRef, { language: newLang, updatedAt: new Date().toISOString() }, { merge: true });
    }

    setSettingsFeedback('Language preference updated.');
    setTimeout(() => setSettingsFeedback(null), 2500);
  };

  const handleToggleNotification = (key: 'email' | 'push') => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    try {
      localStorage.setItem('creova_notifications', JSON.stringify(updated));
    } catch {
      // ignore
    }

    if (authState === 'AUTHENTICATED' && user && isFirebaseConfigured && db) {
      const docRef = doc(db, 'users', user.id, 'settings', 'preferences');
      setDoc(docRef, { notifications: updated, updatedAt: new Date().toISOString() }, { merge: true });
    }

    setSettingsFeedback('Notification preferences updated.');
    setTimeout(() => setSettingsFeedback(null), 2500);
  };

  const handleMigrateAll = async () => {
    setIsMigratingAll(true);
    try {
      const pCount = await importLocalProjects();
      const cCount = await importLocalCompetitors();
      setMigrationFeedback(`Imported ${pCount} project(s) and ${cCount} competitor(s) to your cloud account.`);
      setTimeout(() => setMigrationFeedback(null), 4000);
    } catch (err) {
      setMigrationFeedback((err as Error).message || 'Failed to migrate data');
    } finally {
      setIsMigratingAll(false);
    }
  };

  const fetchServerStatus = async () => {
    setServerPingLoading(true);
    setServerError(null);
    try {
      const res = await fetch('/api/system/status');
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data: SystemStatusResponse = await res.json();
      setServerStatus(data);
    } catch (err) {
      setServerError((err as Error).message || 'Failed to reach Express backend');
    } finally {
      setServerPingLoading(false);
    }
  };

  const fetchAIProviders = async () => {
    setProvidersLoading(true);
    try {
      const res = await getAIProvidersAPI();
      setAiProviders(res.providers);
      setActiveProviderId(res.activeProviderId);
    } catch (err) {
      console.warn('Could not load AI providers:', err);
    } finally {
      setProvidersLoading(false);
    }
  };

  const handleSelectProvider = async (id: AIProviderId) => {
    setSwitchingProviderId(id);
    setTestResult(null);
    try {
      await selectAIProviderAPI(id);
      setActiveProviderId(id);
      await fetchAIProviders();
      setSettingsFeedback(`Active AI provider set to ${id.toUpperCase()}`);
      setTimeout(() => setSettingsFeedback(null), 3000);
    } catch (err: any) {
      setSettingsFeedback(`Failed to switch provider: ${err?.message || 'Error'}`);
    } finally {
      setSwitchingProviderId(null);
    }
  };

  const handleTestProvider = async (id: AIProviderId) => {
    setTestingProviderId(id);
    setTestResult(null);
    try {
      const res = await testAIProviderAPI(id);
      const isOk = res.ok ?? (res.success ?? true);
      setTestResult({
        id,
        success: isOk,
        latencyMs: res.latencyMs,
        message: res.message || (isOk ? `Connected successfully (${res.latencyMs}ms)` : 'Connection test failed'),
      });
    } catch (err: any) {
      setTestResult({
        id,
        success: false,
        message: err?.message || 'Test connection error',
      });
    } finally {
      setTestingProviderId(null);
    }
  };

  useEffect(() => {
    fetchServerStatus();
    fetchAIProviders();
  }, []);

  const themeOptions: {
    id: ThemeMode;
    label: string;
    description: string;
    icon: typeof Moon;
    previewColors: string[];
  }[] = [
    {
      id: 'dark',
      label: 'Dark Mode',
      description: 'Obsidian & deep navy background with electric cyan accents.',
      icon: Moon,
      previewColors: ['#07090e', '#121826', '#38bdf8'],
    },
    {
      id: 'light',
      label: 'Light Mode',
      description: 'Crisp surgical workspace with high contrast and cyan tech borders.',
      icon: Sun,
      previewColors: ['#f8fafc', '#ffffff', '#0284c7'],
    },
    {
      id: 'mix',
      label: 'Mix Mode',
      description: 'Hybrid command console: dark sidebar & header with soft slate canvas.',
      icon: Layers,
      previewColors: ['#0b0f19', '#1e293b', '#22d3ee'],
    },
  ];

  const totalLocalItems =
    localProjectsPendingMigration.length + localCompetitorsPendingMigration.length;

  return (
    <div id="settings-page" className="max-w-4xl space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-display">
              Workspace Settings
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Configuration, visual themes, account security, and cloud storage telemetry
            </p>
          </div>
        </div>
      </div>

      {settingsFeedback && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{settingsFeedback}</span>
        </div>
      )}

      {/* Section 1: Appearance & Theme (FUNCTIONAL) */}
      <section id="settings-section-appearance" className="space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-cyan-400" />
          <h2 className="text-base font-bold text-slate-100 font-display">
            Appearance & Theme
          </h2>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
            {authState === 'AUTHENTICATED' ? 'Cloud Synced' : 'Local Storage'}
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Select your visual environment. Your choice is instantly applied and persisted{' '}
          {authState === 'AUTHENTICATED' ? 'to your Firestore user profile' : 'locally in this browser'}.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themeOptions.map((opt) => {
            const isSelected = theme === opt.id;
            const Icon = opt.icon;

            return (
              <button
                key={opt.id}
                id={`theme-select-btn-${opt.id}`}
                onClick={() => setTheme(opt.id)}
                className={`p-4 rounded-2xl text-left glass-panel transition-all relative group flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-cyan-400 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-100">
                        {opt.label}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center text-slate-950">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                    {opt.description}
                  </p>
                </div>

                {/* Color swatch indicator */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/60">
                  {opt.previewColors.map((color, idx) => (
                    <span
                      key={idx}
                      className="w-4 h-4 rounded-full border border-white/20"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <span className="text-[10px] font-mono text-slate-500 ml-auto">
                    {isSelected ? 'Active' : 'Apply'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Section 2: Account & Authentication (FUNCTIONAL) */}
      <section id="settings-section-account" className="p-6 rounded-3xl glass-panel border border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-100 font-display">
              Account & Credentials
            </h2>
          </div>
          <span
            className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
              authState === 'AUTHENTICATED'
                ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}
          >
            {authState === 'AUTHENTICATED' ? 'Google Authenticated' : 'Guest Mode'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-3">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-xl object-cover border border-cyan-500/40"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-slate-950 font-bold font-mono text-base">
                {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'CR'}
              </div>
            )}
            <div>
              <h3 className="text-sm font-bold text-white">
                {user?.displayName || (authState === 'GUEST' ? 'Guest Creator' : 'Creator')}
              </h3>
              <p className="text-xs text-slate-400">
                {user?.email || (authState === 'GUEST' ? 'Local guest session' : 'Signed out')}
              </p>
              <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-slate-500">
                <span>Account ID: {user?.id.slice(0, 12)}...</span>
                <span>Role: Creator</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {authState === 'GUEST' ? (
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In with Google</span>
              </button>
            ) : (
              <button
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
                className="px-4 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>

        {/* Data Migration Prompt in Account Settings */}
        {authState === 'AUTHENTICATED' && totalLocalItems > 0 && (
          <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <UploadCloud className="w-5 h-5 text-cyan-400 shrink-0" />
              <div>
                <strong className="text-cyan-200">Local Data Available for Import</strong>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Found {localProjectsPendingMigration.length} local project(s) and {localCompetitorsPendingMigration.length} competitor(s) stored on this device.
                </p>
              </div>
            </div>
            <button
              onClick={handleMigrateAll}
              disabled={isMigratingAll}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shrink-0 cursor-pointer disabled:opacity-50"
            >
              {isMigratingAll ? 'Migrating...' : 'Import All to Cloud'}
            </button>
          </div>
        )}

        {migrationFeedback && (
          <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{migrationFeedback}</span>
          </div>
        )}
      </section>

      {/* Section 3: Language & Localization */}
      <section id="settings-section-language" className="p-6 rounded-3xl glass-panel border border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-100 font-display">
              Language & Localization
            </h2>
          </div>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
            {language}
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Select your primary interface language. Settings are persisted with your profile.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'en-US', label: 'English (US)', desc: 'Standard Operating System UI' },
            { id: 'es-ES', label: 'Español', desc: 'Spanish Localization' },
            { id: 'ja-JP', label: '日本語', desc: 'Japanese Localization' },
          ].map((lang) => (
            <button
              key={lang.id}
              onClick={() => handleLanguageChange(lang.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                language === lang.id
                  ? 'bg-cyan-500/10 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400/40'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-bold text-slate-200">{lang.label}</div>
              <div className="text-[10px] font-mono text-slate-500 mt-1">{lang.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Section 4: Notifications */}
      <section id="settings-section-notifications" className="p-6 rounded-3xl glass-panel border border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-slate-100 font-display">
              Notifications & Alerts
            </h2>
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Configure how MintMind AI communicates pipeline updates and intelligence alerts.
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <div className="text-xs font-bold text-slate-200">Email Digest & Summaries</div>
              <div className="text-[11px] text-slate-500">Receive weekly performance summaries and competitor updates</div>
            </div>
            <button
              onClick={() => handleToggleNotification('email')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                notifications.email ? 'bg-cyan-500' : 'bg-slate-800'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 left-1 ${
                  notifications.email ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <div className="text-xs font-bold text-slate-200">Browser Push Alerts</div>
              <div className="text-[11px] text-slate-500">Instant notification when a competitor publishes or trends trigger</div>
            </div>
            <button
              onClick={() => handleToggleNotification('push')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                notifications.push ? 'bg-cyan-500' : 'bg-slate-800'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 left-1 ${
                  notifications.push ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Section 5: AI Provider Architecture & Intelligence Engine */}
      <section id="settings-section-ai-providers" className="p-6 rounded-3xl glass-panel border border-slate-800/80 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-100 font-display">
              AI Provider Architecture & Intelligence Engine
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAIProviders}
              disabled={providersLoading}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${providersLoading ? 'animate-spin text-cyan-400' : ''}`} />
              <span>Refresh Providers</span>
            </button>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              Active: {activeProviderId.toUpperCase()}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          MintMind AI uses a modular provider registry supporting cloud foundation models, local offline daemons (Ollama), and OpenAI-compatible gateways. Select an active provider to power all creative pipeline steps.
        </p>

        {testResult && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
              testResult.success
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
            {typeof testResult.latencyMs === 'number' && (
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-900/60 border border-slate-700">
                {testResult.latencyMs}ms latency
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(aiProviders.length > 0 ? aiProviders : [
            {
              id: 'gemini' as AIProviderId,
              name: 'Google Gemini',
              type: 'cloud' as const,
              configured: true,
              health: 'connected' as const,
              model: 'gemini-3.5-flash-lite',
              availableModels: ['gemini-3.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.5-pro'],
            },
            {
              id: 'ollama' as AIProviderId,
              name: 'Ollama (Local Host)',
              type: 'local' as const,
              configured: false,
              health: 'standby' as const,
              model: 'deepseek-r1:latest',
              availableModels: ['deepseek-r1:latest', 'llama3.2:latest', 'mistral:latest'],
              message: 'Local daemon at http://localhost:11434',
            },
            {
              id: 'openai-compatible' as AIProviderId,
              name: 'OpenAI-Compatible Gateway',
              type: 'cloud' as const,
              configured: false,
              health: 'standby' as const,
              model: 'gpt-4o-mini',
              availableModels: ['gpt-4o-mini', 'gpt-4o', 'custom'],
              message: 'Self-hosted or third-party endpoint',
            },
          ]).map((prov) => {
            const isActive = activeProviderId === prov.id;
            const isTesting = testingProviderId === prov.id;
            const isSwitching = switchingProviderId === prov.id;

            return (
              <div
                key={prov.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                  isActive
                    ? 'bg-cyan-950/20 border-cyan-500/50 shadow-lg shadow-cyan-950/30'
                    : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {prov.type.toUpperCase()}
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border flex items-center gap-1 ${
                        prov.health === 'connected'
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : prov.health === 'error'
                          ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          prov.health === 'connected'
                            ? 'bg-emerald-400'
                            : prov.health === 'error'
                            ? 'bg-rose-400'
                            : 'bg-amber-400'
                        }`}
                      />
                      {prov.health}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    {prov.name}
                    {isActive && <Check className="w-4 h-4 text-cyan-400" />}
                  </h3>

                  <p className="text-[11px] font-mono text-slate-400 mt-1">
                    Model: <span className="text-cyan-300">{prov.model}</span>
                  </p>

                  {prov.message && (
                    <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                      {prov.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                  <button
                    onClick={() => handleSelectProvider(prov.id)}
                    disabled={isActive || isSwitching}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 cursor-default'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    } disabled:opacity-60`}
                  >
                    {isSwitching ? 'Activating...' : isActive ? 'Active' : 'Set as Active'}
                  </button>

                  <button
                    onClick={() => handleTestProvider(prov.id)}
                    disabled={isTesting}
                    title="Test connection and latency"
                    className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Zap className={`w-3 h-3 ${isTesting ? 'animate-spin text-amber-400' : 'text-amber-400'}`} />
                    <span>{isTesting ? 'Testing...' : 'Ping'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 6: Express Backend Telemetry */}
      <section id="settings-section-backend" className="p-6 rounded-3xl glass-panel border border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Server className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-100 font-display">
              Node.js Express Backend Telemetry
            </h2>
          </div>
          <button
            id="ping-backend-btn"
            onClick={fetchServerStatus}
            disabled={serverPingLoading}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${serverPingLoading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Ping Server</span>
          </button>
        </div>

        {serverError ? (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{serverError}</span>
          </div>
        ) : serverStatus ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Engine</span>
              <span className="text-cyan-400 font-bold">{serverStatus.engine}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Health</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {serverStatus.status.toUpperCase()}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Uptime</span>
              <span className="text-slate-300">{Math.round(serverStatus.uptime)}s</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Port</span>
              <span className="text-slate-300 font-bold">{serverStatus.port}</span>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
