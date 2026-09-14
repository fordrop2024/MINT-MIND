import React, { useState } from 'react';
import {
  FolderGit2,
  FolderPlus,
  Search,
  Trash2,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  Edit3,
  UploadCloud,
  X,
  Loader2,
  Cloud,
  HardDrive,
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';
import type { Project } from '../types';

interface ProjectsPageProps {
  onOpenNewProject: () => void;
}

export function ProjectsPage({ onOpenNewProject }: ProjectsPageProps) {
  const {
    projects,
    activeProject,
    loading,
    isDeleting,
    localProjectsPendingMigration,
    openProject,
    deleteProject,
    updateProject,
    importLocalProjects,
  } = useProjects();
  const { navigate } = useRouter();
  const { authState, user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectToRename, setProjectToRename] = useState<Project | null>(null);
  const [renameName, setRenameName] = useState('');
  const [renameDesc, setRenameDesc] = useState('');
  const [renameError, setRenameError] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  const [feedback, setFeedback] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpen = (id: string, name: string) => {
    openProject(id);
    setFeedback(`Active project switched to "${name}"`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleDeleteConfirm = async () => {
    if (projectToDelete) {
      const name = projectToDelete.name;
      try {
        await deleteProject(projectToDelete.id);
        setProjectToDelete(null);
        setFeedback(`Project "${name}" removed`);
        setTimeout(() => setFeedback(null), 3000);
      } catch (e) {
        setFeedback(`Failed to delete project: ${(e as Error).message}`);
      }
    }
  };

  const handleOpenRename = (project: Project) => {
    setProjectToRename(project);
    setRenameName(project.name);
    setRenameDesc(project.description || '');
    setRenameError('');
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectToRename) return;
    if (!renameName.trim()) {
      setRenameError('Project name cannot be empty');
      return;
    }

    setIsRenaming(true);
    setRenameError('');
    try {
      await updateProject(projectToRename.id, renameName, renameDesc);
      setFeedback(`Project renamed to "${renameName.trim()}"`);
      setProjectToRename(null);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setRenameError((err as Error).message || 'Failed to rename project');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleImportLocalProjects = async () => {
    setIsMigrating(true);
    try {
      const count = await importLocalProjects();
      setFeedback(`Imported ${count} project(s) to your cloud profile.`);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback(`Migration failed: ${(err as Error).message}`);
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div id="projects-management-page" className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-display flex items-center gap-2.5">
                Creator Projects
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono border border-cyan-500/30">
                  {projects.length} Saved
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {authState === 'AUTHENTICATED'
                  ? 'Cloud Firestore persistent storage &bull; Isolated to your Google account'
                  : 'Local state containers &bull; Local storage engine active (Guest Mode)'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="page-new-project-btn"
            onClick={onOpenNewProject}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Initialize Project</span>
          </button>
        </div>
      </div>

      {/* Migration Notice Banner */}
      {authState === 'AUTHENTICATED' && localProjectsPendingMigration.length > 0 && (
        <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-cyan-200 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <UploadCloud className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <strong className="text-white">Local Projects Found:</strong>
              <p className="text-slate-300 text-[11px] mt-0.5">
                You have {localProjectsPendingMigration.length} project(s) saved on this browser from prior sessions. Import them to your cloud account to preserve them permanently.
              </p>
            </div>
          </div>
          <button
            onClick={handleImportLocalProjects}
            disabled={isMigrating}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shrink-0 disabled:opacity-60 cursor-pointer"
          >
            {isMigrating ? 'Importing...' : 'Import to Cloud'}
          </button>
        </div>
      )}

      {/* Feedback Banner */}
      {feedback && (
        <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-projects-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects by name or description..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-colors font-sans"
          />
        </div>

        <div className="text-xs font-mono text-slate-400 hidden sm:block">
          Active: <strong className="text-cyan-300">{activeProject?.name || 'None'}</strong>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="rounded-2xl p-5 glass-panel border border-slate-800/80 animate-pulse space-y-4"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-800" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-3/4 bg-slate-800 rounded" />
                  <div className="h-2 w-1/2 bg-slate-800 rounded" />
                </div>
              </div>
              <div className="h-10 bg-slate-800/50 rounded" />
              <div className="h-8 bg-slate-800/30 rounded" />
            </div>
          ))}
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const isActive = activeProject?.id === project.id;

            return (
              <div
                key={project.id}
                id={`project-card-${project.id}`}
                className={`rounded-2xl p-5 glass-panel transition-all flex flex-col justify-between relative group ${
                  isActive
                    ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                    : 'border-slate-800/80 hover:border-cyan-500/30'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isActive
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'bg-slate-800/60 text-slate-400 border border-slate-700/60'
                        }`}
                      >
                        <FolderGit2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-100 font-display line-clamp-1">
                          {project.name}
                        </h3>
                        <span className="text-[10px] font-mono text-slate-500">
                          ID: {project.id.slice(0, 8)}...
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isActive && (
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                          Active
                        </span>
                      )}
                      <button
                        onClick={() => handleOpenRename(project)}
                        className="p-1 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-cyan-950/30 transition-colors"
                        title="Rename project"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px]">
                    {project.description || 'No container description provided.'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-1 text-[11px] font-mono text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-slate-600" />
                      <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-600" />
                      <span>Updated: {new Date(project.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    id={`delete-btn-${project.id}`}
                    onClick={() => setProjectToDelete(project)}
                    disabled={isDeleting}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors disabled:opacity-50"
                    title="Delete project"
                    aria-label={`Delete ${project.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    {isActive ? (
                      <button
                        onClick={() => navigate('/dashboard')}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-semibold text-xs transition-colors flex items-center gap-1"
                      >
                        <span>Go to Dashboard</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        id={`open-btn-${project.id}`}
                        onClick={() => handleOpen(project.id, project.name)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 font-semibold text-xs transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>Open Project</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 rounded-3xl glass-panel border border-dashed border-slate-800 text-center space-y-3">
          <FolderGit2 className="w-10 h-10 mx-auto text-slate-600" />
          <div>
            <h3 className="text-base font-bold text-slate-200 font-display">
              {searchQuery ? 'No matching projects found' : 'No projects initialized yet'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              {searchQuery
                ? 'Try adjusting your search criteria'
                : 'Establish your first project workspace to begin organizing creative assets and pipeline states.'}
            </p>
          </div>
          <button
            onClick={onOpenNewProject}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all shadow-md shadow-cyan-500/20 inline-flex items-center gap-2 mt-2 cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Create First Project</span>
          </button>
        </div>
      )}

      {/* Persistence Architecture Notice */}
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3 text-xs text-slate-400">
        <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-slate-200">
            {authState === 'AUTHENTICATED' ? 'Cloud Firestore Engine Active:' : 'Local Storage Active:'}
          </strong>
          <p>
            {authState === 'AUTHENTICATED'
              ? `Projects for user ${user?.email || user?.displayName} are synchronized with Firestore. Strict security rules isolate documents to your user ID.`
              : 'Guest projects are saved locally in this browser. To preserve your projects permanently across devices, sign in with Google.'}
          </p>
        </div>
      </div>

      {/* Rename Project Modal */}
      {projectToRename && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl glass-panel border border-cyan-500/30 bg-slate-950 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-display">Rename Project</h3>
              </div>
              <button
                onClick={() => setProjectToRename(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRenameSubmit} className="space-y-4 text-xs">
              {renameError && (
                <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-[11px]">
                  {renameError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-mono text-slate-300 uppercase text-[10px]">
                  Project Title *
                </label>
                <input
                  type="text"
                  value={renameName}
                  onChange={(e) => setRenameName(e.target.value)}
                  autoFocus
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-slate-300 uppercase text-[10px]">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={renameDesc}
                  onChange={(e) => setRenameDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-400 font-mono resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProjectToRename(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRenaming}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider disabled:opacity-60 cursor-pointer"
                >
                  {isRenaming ? 'Saving...' : 'Update Title'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(projectToDelete)}
        project={projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
