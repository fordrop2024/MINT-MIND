import React, { useState } from 'react';
import {
  Crosshair,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  ArrowRightLeft,
  CheckSquare,
  Square,
  Info,
  Clock,
  TrendingUp,
  MessageSquare,
  Layers,
  Sparkles,
  X,
  UploadCloud,
  CheckCircle2,
} from 'lucide-react';
import { useCompetitors } from '../../context/CompetitorContext';
import { useAuth } from '../../context/AuthContext';
import { IntelligenceEmptyState } from '../../components/youtube/IntelligenceEmptyState';
import type { YouTubeCompetitor } from '../../types/youtube';

export function CompetitorRadarPage() {
  const {
    competitors,
    selectedForComparison,
    loading,
    isAdding,
    isRemoving,
    localCompetitorsPendingMigration,
    addCompetitor,
    editCompetitor,
    removeCompetitor,
    toggleComparison,
    clearComparison,
    importLocalCompetitors,
  } = useCompetitors();

  const { authState } = useAuth();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState<YouTubeCompetitor | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [channelId, setChannelId] = useState('');
  const [channelUrl, setChannelUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const [isComparing, setIsComparing] = useState(false);
  const [migrationFeedback, setMigrationFeedback] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);

  const handleOpenAddModal = () => {
    setName('');
    setChannelId('');
    setChannelUrl('');
    setNotes('');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (comp: YouTubeCompetitor) => {
    setEditingCompetitor(comp);
    setName(comp.name || comp.channelName || '');
    setChannelId(comp.channelId || '');
    setChannelUrl(comp.channelUrl || '');
    setNotes(comp.notes || '');
    setFormError(null);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await addCompetitor(name, channelId, channelUrl, notes);
      setIsAddModalOpen(false);
      setName('');
      setChannelId('');
      setChannelUrl('');
      setNotes('');
    } catch (err) {
      setFormError((err as Error).message || 'Failed to add competitor');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompetitor) return;
    setFormError(null);
    try {
      await editCompetitor(editingCompetitor.id, name, channelId, channelUrl, notes);
      setEditingCompetitor(null);
    } catch (err) {
      setFormError((err as Error).message || 'Failed to update competitor');
    }
  };

  const handleImportLocal = async () => {
    setIsMigrating(true);
    try {
      const count = await importLocalCompetitors();
      setMigrationFeedback(`Successfully migrated ${count} competitor(s) to your Firestore account.`);
      setTimeout(() => setMigrationFeedback(null), 4000);
    } catch (err) {
      setMigrationFeedback((err as Error).message || 'Failed to migrate competitors.');
    } finally {
      setIsMigrating(false);
    }
  };

  const selectedList = competitors.filter((c) => selectedForComparison.includes(c.id));

  return (
    <div id="competitor-radar-page" className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Crosshair className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-display">
                Competitor Radar
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Benchmark peer creator channels, compare upload pacing, and track market positioning
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {competitors.length >= 2 && (
              <button
                id="toggle-compare-mode-btn"
                onClick={() => setIsComparing((prev) => !prev)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border ${
                  isComparing
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>
                  {isComparing
                    ? 'Close Comparison'
                    : `Compare (${selectedForComparison.length || competitors.length})`}
                </span>
              </button>
            )}

            <button
              id="open-add-competitor-modal-btn"
              onClick={handleOpenAddModal}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-cyan-500/20 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add Competitor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Migration Notice Banner if Local Competitors Exist */}
      {authState === 'AUTHENTICATED' && localCompetitorsPendingMigration.length > 0 && (
        <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-cyan-200">
          <div className="flex items-center gap-2.5">
            <UploadCloud className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <strong className="text-white">Local Competitors Found:</strong>
              <p className="text-slate-300 text-[11px] mt-0.5">
                You have {localCompetitorsPendingMigration.length} competitor(s) stored locally from your guest session. Import them to your cloud account to access across devices.
              </p>
            </div>
          </div>
          <button
            onClick={handleImportLocal}
            disabled={isMigrating}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shrink-0 disabled:opacity-60"
          >
            {isMigrating ? 'Importing...' : 'Import to Cloud'}
          </button>
        </div>
      )}

      {migrationFeedback && (
        <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{migrationFeedback}</span>
        </div>
      )}

      {/* Global Status Banner */}
      <IntelligenceEmptyState
        title="Competitor data connection not configured yet."
        description={
          authState === 'AUTHENTICATED'
            ? 'Competitor channels are persisted securely in your cloud Firestore database. Live metrics (subscribers, views, upload cadence, engagement) will populate automatically when official YouTube Data API access is connected.'
            : 'Competitor channels are stored locally in your browser session. Sign in to synchronize your competitors with your permanent cloud profile.'
        }
        compact={true}
      />

      {/* Comparison Matrix View (When activated) */}
      {isComparing && (
        <div className="p-6 rounded-3xl glass-panel border border-cyan-500/40 bg-slate-950/80 space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white font-display">
                Side-by-Side Competitor Comparison
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                {selectedList.length > 0 ? selectedList.length : competitors.length} Channels Selected
              </span>
            </div>
            <button
              onClick={clearComparison}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Reset Selection
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                  <th className="py-2.5 px-3">Metric</th>
                  {(selectedList.length > 0 ? selectedList : competitors).map((c) => (
                    <th key={c.id} className="py-2.5 px-3 text-cyan-300 font-bold font-sans">
                      {c.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                <tr>
                  <td className="py-2.5 px-3 text-slate-400 font-sans">Channel ID</td>
                  {(selectedList.length > 0 ? selectedList : competitors).map((c) => (
                    <td key={c.id} className="py-2.5 px-3 text-slate-300">
                      {c.channelId || '--'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-400 font-sans">Subscribers</td>
                  {(selectedList.length > 0 ? selectedList : competitors).map((c) => (
                    <td key={c.id} className="py-2.5 px-3 text-slate-500">
                      Awaiting API
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-400 font-sans">Avg Views / Upload</td>
                  {(selectedList.length > 0 ? selectedList : competitors).map((c) => (
                    <td key={c.id} className="py-2.5 px-3 text-slate-500">
                      Awaiting API
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-400 font-sans">Upload Frequency</td>
                  {(selectedList.length > 0 ? selectedList : competitors).map((c) => (
                    <td key={c.id} className="py-2.5 px-3 text-slate-500">
                      Awaiting API
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-400 font-sans">Cadence Consistency</td>
                  {(selectedList.length > 0 ? selectedList : competitors).map((c) => (
                    <td key={c.id} className="py-2.5 px-3 text-slate-500">
                      Awaiting API
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Competitor Cards Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white font-display">Monitored Channels</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono border border-cyan-500/30">
              {competitors.length} Active
            </span>
          </div>

          <span className="text-[11px] font-mono text-slate-400">
            {authState === 'AUTHENTICATED' ? 'Cloud Firestore persistence' : 'Local storage persistence'}
          </span>
        </div>

        {competitors.length === 0 ? (
          <div className="p-12 rounded-3xl glass-panel border border-dashed border-slate-800 text-center space-y-3">
            <Crosshair className="w-10 h-10 mx-auto text-slate-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-200 font-display">
                No Competitors Monitored Yet
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Add peer creator channels to establish your competitive baseline and track upload rhythms.
              </p>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-cyan-500/20 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Your First Competitor</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {competitors.map((comp) => {
              const isSelected = selectedForComparison.includes(comp.id);

              return (
                <div
                  key={comp.id}
                  id={`competitor-card-${comp.id}`}
                  className={`p-5 rounded-2xl glass-panel border transition-all space-y-4 flex flex-col justify-between ${
                    isSelected
                      ? 'border-cyan-400 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-400/50'
                      : 'border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => toggleComparison(comp.id)}
                          className="text-cyan-400 hover:text-cyan-300 transition-colors"
                          title={isSelected ? 'Deselect for comparison' : 'Select for comparison'}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-500" />
                          )}
                        </button>
                        <div>
                          <h3 className="text-sm font-bold text-white font-display">
                            {comp.name}
                          </h3>
                          <span className="text-[10px] font-mono text-slate-400 block truncate max-w-[180px]">
                            ID: {comp.channelId || '--'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(comp)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-cyan-950/30 transition-colors"
                          title="Edit competitor"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeCompetitor(comp.id)}
                          disabled={isRemoving}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors disabled:opacity-50"
                          title="Remove competitor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Channel URL link */}
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <a
                        href={comp.channelUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 truncate max-w-[200px]"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">{comp.channelUrl}</span>
                      </a>
                    </div>

                    {/* Notes if present */}
                    {comp.notes && (
                      <p className="text-[11px] text-slate-400 italic bg-slate-900/40 p-2 rounded-lg border border-slate-800">
                        "{comp.notes}"
                      </p>
                    )}

                    {/* Placeholder Metrics: Real status, no fake numbers */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                      <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Subscribers</span>
                        <span className="text-slate-400">Awaiting API</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Avg Views</span>
                        <span className="text-slate-400">Awaiting API</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>Added {new Date(comp.createdAt).toLocaleDateString()}</span>
                    <button
                      onClick={() => toggleComparison(comp.id)}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold"
                    >
                      {isSelected ? 'Selected' : 'Compare'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Competitor Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl glass-panel border border-slate-800 bg-slate-950 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-display">
                  Add Competitor Channel
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-[11px]">
                  {formError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-mono text-slate-300 uppercase text-[10px]">
                  Channel Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Veritasium, MKBHD, Ali Abdaal"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-slate-300 uppercase text-[10px]">
                  Channel ID
                </label>
                <input
                  type="text"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  placeholder="e.g. UCHnyfMqiRRG1u-2MsSQLbXA"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-slate-300 uppercase text-[10px]">
                  Channel URL
                </label>
                <input
                  type="text"
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  placeholder="e.g. https://youtube.com/@mkbhd"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-slate-300 uppercase text-[10px]">
                  Notes / Strategy Focus
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. High production value shorts, weekly cadence"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-400 font-mono resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider disabled:opacity-60"
                >
                  {isAdding ? 'Saving...' : 'Save Competitor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Competitor Modal */}
      {editingCompetitor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl glass-panel border border-slate-800 bg-slate-950 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-display">
                  Edit Competitor Channel
                </h3>
              </div>
              <button
                onClick={() => setEditingCompetitor(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-[11px]">
                  {formError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-mono text-slate-300 uppercase text-[10px]">
                  Channel Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-slate-300 uppercase text-[10px]">
                  Channel ID
                </label>
                <input
                  type="text"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-slate-300 uppercase text-[10px]">
                  Channel URL
                </label>
                <input
                  type="text"
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-slate-300 uppercase text-[10px]">
                  Notes / Strategy Focus
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-400 font-mono resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCompetitor(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider"
                >
                  Update Competitor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
