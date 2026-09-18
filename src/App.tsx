import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ProjectProvider } from './context/ProjectContext';
import { RouterProvider, useRouter } from './context/RouterContext';
import { CompetitorProvider } from './context/CompetitorContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { SettingsPage } from './pages/SettingsPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { YouTubeIntelligenceDashboardPage } from './pages/youtube/YouTubeIntelligenceDashboardPage';
import { ChannelAnalyzerPage } from './pages/youtube/ChannelAnalyzerPage';
import { VideoAnalyzerPage } from './pages/youtube/VideoAnalyzerPage';
import { RankingsPage } from './pages/youtube/RankingsPage';
import { TopicRadarPage } from './pages/youtube/TopicRadarPage';
import { CompetitorRadarPage } from './pages/youtube/CompetitorRadarPage';
import { LiveRadarPage } from './pages/youtube/LiveRadarPage';
import { OutlierDetectorPage } from './pages/youtube/OutlierDetectorPage';
import { StrategyAnalyzerPage } from './pages/youtube/StrategyAnalyzerPage';
import { IdeaGeneratorPage } from './pages/ideas/IdeaGeneratorPage';
import { ScriptStudioPage } from './pages/script/ScriptStudioPage';
import { IdeaProvider } from './context/IdeaContext';
import { ScriptProvider } from './context/ScriptContext';
import { YouTubeProvider } from './context/YouTubeContext';
import { NewProjectModal } from './components/common/NewProjectModal';
import { CommandModal } from './components/common/CommandModal';
import { RoadmapModal } from './components/common/RoadmapModal';
import { Cpu, Loader2 } from 'lucide-react';

function AppContent() {
  const { currentRoute, navigate } = useRouter();
  const { theme } = useTheme();
  const { authState } = useAuth();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('creova_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  const [isRoadmapModalOpen, setIsRoadmapModalOpen] = useState(false);

  useEffect(() => {
    if (authState === 'LOADING') return;

    if (authState === 'SIGNED_OUT' && currentRoute !== '/login') {
      navigate('/login');
    } else if (authState === 'AUTHENTICATED' && currentRoute === '/login') {
      navigate('/dashboard');
    }
  }, [authState, currentRoute, navigate]);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('creova_sidebar_collapsed', String(next));
      } catch (e) {
        console.warn('Could not store sidebar state', e);
      }
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (authState === 'LOADING') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 p-0.5 shadow-2xl shadow-cyan-500/30 animate-pulse">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Cpu className="w-6 h-6 text-cyan-400" />
          </div>
        </div>
        <span className="font-display font-bold text-sm tracking-wider text-white mt-4 flex items-center gap-1.5">
          MintMind <span className="text-cyan-400 text-xs font-mono font-normal">AI</span>
        </span>
        <span className="text-xs text-slate-500 mt-1 font-mono flex items-center gap-1.5">
          <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
          Connecting security session...
        </span>
      </div>
    );
  }

  if (currentRoute === '/login') {
    return <LoginPage />;
  }

  const renderActivePage = () => {
    switch (currentRoute) {
      case '/dashboard':
        return (
          <DashboardPage
            onOpenNewProject={() => setIsNewProjectModalOpen(true)}
            onOpenRoadmap={() => setIsRoadmapModalOpen(true)}
          />
        );
      case '/projects':
        return (
          <ProjectsPage
            onOpenNewProject={() => setIsNewProjectModalOpen(true)}
          />
        );
      case '/settings':
        return <SettingsPage />;
      case '/youtube-intelligence':
        return <YouTubeIntelligenceDashboardPage />;
      case '/youtube-intelligence/channel':
        return <ChannelAnalyzerPage />;
      case '/youtube-intelligence/video':
        return <VideoAnalyzerPage />;
      case '/youtube-intelligence/rankings':
        return <RankingsPage />;
      case '/youtube-intelligence/topics':
        return <TopicRadarPage />;
      case '/youtube-intelligence/competitors':
        return <CompetitorRadarPage />;
      case '/youtube-intelligence/live':
        return <LiveRadarPage />;
      case '/youtube-intelligence/outliers':
        return <OutlierDetectorPage />;
      case '/youtube-intelligence/strategy':
        return <StrategyAnalyzerPage />;
      case '/ideas':
        return <IdeaGeneratorPage />;
      case '/script':
        return <ScriptStudioPage />;
      default:
        return (
          <PlaceholderPage
            route={currentRoute}
            onOpenRoadmap={() => setIsRoadmapModalOpen(true)}
          />
        );
    }
  };

  return (
    <div
      id="creova-app-root"
      className={`min-h-screen flex text-slate-100 cyber-grid transition-colors duration-300 ${
        theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-[#07090e] text-slate-100'
      }`}
    >
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        onOpenRoadmap={() => setIsRoadmapModalOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <TopBar
          onOpenCommand={() => setIsCommandModalOpen(true)}
          onOpenNewProject={() => setIsNewProjectModalOpen(true)}
        />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {renderActivePage()}
        </main>
      </div>

      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
      />

      <CommandModal
        isOpen={isCommandModalOpen}
        onClose={() => setIsCommandModalOpen(false)}
      />

      <RoadmapModal
        isOpen={isRoadmapModalOpen}
        onClose={() => setIsRoadmapModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <ThemeProvider>
          <ProjectProvider>
            <CompetitorProvider>
              <IdeaProvider>
                <ScriptProvider>
                  <YouTubeProvider>
                    <AppContent />
                  </YouTubeProvider>
                </ScriptProvider>
              </IdeaProvider>
            </CompetitorProvider>
          </ProjectProvider>
        </ThemeProvider>
      </RouterProvider>
    </AuthProvider>
  );
}