import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Shield,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Database,
  Lock,
  Layers,
  Moon,
  Sun,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { useTheme } from '../context/ThemeContext';

export function LoginPage() {
  const {
    authState,
    user,
    isFirebaseConfigured,
    configError,
    error: authError,
    loading: authLoading,
    loginWithGoogle,
    loginAsGuest,
    clearError,
  } = useAuth();
  const { navigate } = useRouter();
  const { theme, setTheme } = useTheme();

  const [localError, setLocalError] = useState<string | null>(null);
  const [submittingGoogle, setSubmittingGoogle] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (authState === 'AUTHENTICATED') {
      navigate('/dashboard');
    }
  }, [authState, navigate]);

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    clearError();
    setSubmittingGoogle(true);

    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err: unknown) {
      const e = err as { message?: string; code?: string };
      console.error('Google Sign-In failed:', err);
      // Helpful human-readable diagnostics
      if (e.code === 'auth/popup-closed-by-user') {
        setLocalError('Sign-in cancelled. The Google popup was closed before completion.');
      } else if (!isFirebaseConfigured) {
        setLocalError(
          'Firebase configuration is missing or could not be loaded. Guest Mode is active and available.'
        );
      } else {
        setLocalError(e.message || 'Unable to sign in with Google. Please try again.');
      }
    } finally {
      setSubmittingGoogle(false);
    }
  };

  const handleGuestEntry = () => {
    setLocalError(null);
    loginAsGuest();
    navigate('/dashboard');
  };

  return (
    <div
      id="creova-login-page"
      className="min-h-screen flex flex-col justify-between p-4 md:p-8 bg-slate-950 text-slate-100 relative overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-500/10 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Controls */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Cpu className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <span className="font-display font-extrabold text-lg tracking-wider text-white flex items-center gap-1.5">
              MintMind <span className="text-cyan-400 text-xs font-mono font-normal">AI</span>
            </span>
          </div>
        </div>

        {/* Theme Toggle in Login */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 rounded-xl p-1">
          <button
            id="login-theme-dark"
            onClick={() => setTheme('dark')}
            title="Dark Theme"
            className={`p-1.5 rounded-lg transition-colors ${
              theme === 'dark' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
          <button
            id="login-theme-light"
            onClick={() => setTheme('light')}
            title="Light Theme"
            className={`p-1.5 rounded-lg transition-colors ${
              theme === 'light' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            id="login-theme-mix"
            onClick={() => setTheme('mix')}
            title="Mix Theme"
            className={`p-1.5 rounded-lg transition-colors ${
              theme === 'mix' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md mx-auto my-auto z-10 py-10">
        <div className="rounded-3xl glass-panel border border-slate-800/80 bg-slate-900/60 shadow-2xl p-8 backdrop-blur-xl relative">
          {/* Header */}
          <div className="text-center space-y-2 mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>MintMind OS &bull; Auth Gateway</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-display">
              Welcome to MintMind AI
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              AI Content Operating System &bull; Think. Create. Publish.
            </p>
          </div>

          {/* Error & Diagnostics Notice */}
          {(localError || authError) && (
            <div
              id="auth-error-banner"
              className="mb-6 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold text-rose-200">Authentication Alert</span>
                <p className="text-[11px] leading-relaxed opacity-90">{localError || authError}</p>
              </div>
            </div>
          )}

          {/* Firebase Setup Diagnostic (if not configured yet) */}
          {!isFirebaseConfigured && (
            <div className="mb-6 p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-300 flex items-start gap-2.5">
              <Database className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-[11px]">
                <strong className="text-cyan-200">Firebase Setup Status:</strong>
                <p className="text-slate-400 leading-relaxed">
                  Firebase configuration is pending acceptance in the AI Studio environment. You can explore all features immediately in <strong>Guest Mode</strong>, which supports local projects and YouTube Intelligence exploration.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3.5">
            {/* Real Google Sign-In */}
            <button
              id="google-signin-btn"
              onClick={handleGoogleSignIn}
              disabled={authLoading || submittingGoogle}
              className="w-full h-12 rounded-xl bg-white hover:bg-slate-100 active:scale-[0.99] text-slate-900 font-semibold text-sm transition-all shadow-lg flex items-center justify-center gap-3 relative disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
            >
              {submittingGoogle ? (
                <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10px] font-mono uppercase tracking-widest text-slate-500">
                <span className="bg-slate-900/90 px-3">or instant access</span>
              </div>
            </div>

            {/* Real Guest Mode */}
            <button
              id="guest-signin-btn"
              onClick={handleGuestEntry}
              className="w-full h-12 rounded-xl bg-slate-800 hover:bg-slate-700/80 active:scale-[0.99] border border-slate-700/70 text-slate-200 font-semibold text-sm transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Continue as Guest</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Privacy & Scope Disclaimer */}
          <div className="mt-8 pt-5 border-t border-slate-800/80 text-[11px] text-slate-500 space-y-2 text-center">
            <div className="flex items-center justify-center gap-1.5 text-slate-400">
              <Lock className="w-3 h-3 text-cyan-400" />
              <span>Zero-Trust Security &bull; User-Scoped Isolation</span>
            </div>
            <p className="leading-relaxed">
              Authenticated accounts sync securely to your private Firestore collection. Guest mode isolates data to this browser.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2 z-10">
        <div>&copy; {new Date().getFullYear()} MintMind AI &bull; AI Content Operating System &bull; Think. Create. Publish.</div>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            System Operational
          </span>
          <span>Phase 1 Foundation</span>
        </div>
      </div>
    </div>
  );
}
