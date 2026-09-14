import React, { useState } from 'react';
import { X, GitCompare, ArrowLeftRight, Clock, FileText } from 'lucide-react';
import type { Script, ScriptVersion } from '../../types/script';

interface CompareVersionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  script: Script;
  onRestore: (versionNumber: number) => void;
}

export function CompareVersionsModal({
  isOpen,
  onClose,
  script,
  onRestore,
}: CompareVersionsModalProps) {
  const versions = script.versions || [];
  const [leftVerNum, setLeftVerNum] = useState<number>(
    versions.length > 1 ? versions[versions.length - 2].versionNumber : (versions[0]?.versionNumber || 1)
  );
  const [rightVerNum, setRightVerNum] = useState<number>(
    versions[versions.length - 1]?.versionNumber || 1
  );

  if (!isOpen) return null;

  const leftVersion = versions.find((v) => v.versionNumber === leftVerNum);
  const rightVersion = versions.find((v) => v.versionNumber === rightVerNum);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <GitCompare className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Version Differential Inspector
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Side-by-Side
                </span>
              </h3>
              <p className="text-xs text-slate-400">Comparing snapshot revisions of "{script.title}"</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Version Pickers Bar */}
        <div className="grid grid-cols-2 divide-x divide-slate-800 bg-slate-950 border-b border-slate-800 px-6 py-3">
          <div className="flex items-center justify-between pr-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400 font-semibold">Baseline:</span>
              <select
                value={leftVerNum}
                onChange={(e) => setLeftVerNum(Number(e.target.value))}
                className="text-xs font-mono px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200"
              >
                {versions.map((v) => (
                  <option key={v.versionNumber} value={v.versionNumber}>
                    v{v.versionNumber} — {new Date(v.timestamp).toLocaleTimeString()}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-[11px] text-slate-500">{leftVersion?.summaryNote}</span>
          </div>

          <div className="flex items-center justify-between pl-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-cyan-400 font-semibold">Comparison:</span>
              <select
                value={rightVerNum}
                onChange={(e) => setRightVerNum(Number(e.target.value))}
                className="text-xs font-mono px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200"
              >
                {versions.map((v) => (
                  <option key={v.versionNumber} value={v.versionNumber}>
                    v{v.versionNumber} — {new Date(v.timestamp).toLocaleTimeString()}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-[11px] text-cyan-300">{rightVersion?.summaryNote}</span>
          </div>
        </div>

        {/* Split Diff Content */}
        <div className="grid grid-cols-2 divide-x divide-slate-800 overflow-y-auto p-6 flex-1 gap-6">
          {/* Left Column */}
          <div className="space-y-4 pr-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300">
                Version {leftVersion?.versionNumber} ({leftVersion?.sections?.length || 0} sections)
              </span>
              <button
                onClick={() => {
                  if (leftVersion) onRestore(leftVersion.versionNumber);
                  onClose();
                }}
                className="text-[11px] font-mono text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
              >
                Restore This
              </button>
            </div>

            {leftVersion?.sections?.map((sec, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                  {sec.name}
                </span>
                <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {sec.content}
                </p>
              </div>
            ))}
          </div>

          {/* Right Column */}
          <div className="space-y-4 pl-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-cyan-300">
                Version {rightVersion?.versionNumber} ({rightVersion?.sections?.length || 0} sections)
              </span>
              <button
                onClick={() => {
                  if (rightVersion) onRestore(rightVersion.versionNumber);
                  onClose();
                }}
                className="text-[11px] font-mono text-cyan-300 hover:text-cyan-200 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40"
              >
                Restore This
              </button>
            </div>

            {rightVersion?.sections?.map((sec, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-cyan-500/20 space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
                  {sec.name}
                </span>
                <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {sec.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Close Diff
          </button>
        </div>
      </div>
    </div>
  );
}
