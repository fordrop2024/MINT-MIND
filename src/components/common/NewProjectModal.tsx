import React, { useState } from 'react';
import { X, FolderPlus, Sparkles, Loader2 } from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (projectId: string) => void;
}

export function NewProjectModal({ isOpen, onClose, onSuccess }: NewProjectModalProps) {
  const { createProject, isCreating } = useProjects();
  const { authState } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) return;

    if (!name.trim()) {
      setError('Please enter a project title');
      return;
    }

    try {
      const newProj = await createProject(name, description);
      setName('');
      setDescription('');
      setError('');
      onClose();
      if (onSuccess) {
        onSuccess(newProj.id);
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to create project');
    }
  };

  return (
    <div
      id="new-project-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="new-project-modal-dialog"
        className="w-full max-w-lg rounded-2xl p-6 glass-panel border border-cyan-500/30 shadow-2xl shadow-cyan-950/40 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id="close-new-project-modal"
          onClick={onClose}
          disabled={isCreating}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-colors disabled:opacity-50"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <FolderPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-100 font-display">
              Initialize Project
            </h2>
            <p className="text-xs text-slate-400">
              Establish a new creator workflow workspace container
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="project-name-input"
              className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Project Name <span className="text-cyan-400">*</span>
            </label>
            <input
              id="project-name-input"
              type="text"
              autoFocus
              value={name}
              disabled={isCreating}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g., Cyberpunk Shorts Series Vol. 1"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/70 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all font-sans disabled:opacity-60"
            />
            {error && <p className="text-xs text-rose-400 mt-1.5 font-medium">{error}</p>}
          </div>

          <div>
            <label
              htmlFor="project-desc-input"
              className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Description <span className="text-slate-500">(Optional)</span>
            </label>
            <textarea
              id="project-desc-input"
              rows={3}
              value={description}
              disabled={isCreating}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Objective, target audience, format specifications..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/70 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all resize-none font-sans disabled:opacity-60"
            />
          </div>

          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-300 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
            <span>
              {authState === 'AUTHENTICATED' ? (
                <>
                  <strong>Cloud Synchronization:</strong> This project will be safely persisted in your private Firestore collection.
                </>
              ) : (
                <>
                  <strong>Guest Mode:</strong> This project will be stored locally on this device. Sign in with Google to synchronize across devices.
                </>
              )}
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              id="cancel-new-project-btn"
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              id="submit-new-project-btn"
              type="submit"
              disabled={isCreating}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <FolderPlus className="w-4 h-4" />
                  <span>Create Project</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
