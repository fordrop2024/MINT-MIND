import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import type { Project } from '../../types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({
  isOpen,
  project,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!isOpen || !project) return null;

  return (
    <div
      id="delete-project-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="delete-project-modal-dialog"
        className="w-full max-w-md rounded-2xl p-6 glass-panel border border-rose-500/30 shadow-2xl shadow-rose-950/40 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id="close-delete-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-100 font-display">
              Delete Project
            </h2>
            <p className="text-xs text-rose-400/90 font-mono">
              Action cannot be undone
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed mb-4">
          Are you sure you want to permanently purge{' '}
          <strong className="text-white font-semibold">"{project.name}"</strong>?
          This will purge the container and all associated local metadata from this workstation.
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            id="cancel-delete-project-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            id="confirm-delete-project-btn"
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-rose-600/25 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Purge Project
          </button>
        </div>
      </div>
    </div>
  );
}
