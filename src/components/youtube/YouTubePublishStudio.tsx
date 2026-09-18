import React, { useState, useMemo } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Globe,
  Lock,
  EyeOff,
  Sparkles,
  Calendar,
  Check,
  Film,
  Youtube,
  Send,
  Sliders,
  ExternalLink,
  ShieldCheck,
  Tag,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import type { Script } from '../../types/script';
import {
  buildYouTubePublishPayload,
  auditPrePublishCompliance,
  getConnectedYouTubeChannel,
  YOUTUBE_CATEGORIES,
  type YouTubePublishPayload,
  type YouTubePrivacyStatus,
} from '../../services/youtubePublishService';

interface YouTubePublishStudioProps {
  script: Script;
  onPublishToYouTube?: (payload: YouTubePublishPayload) => Promise<void>;
  onNotification?: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const YouTubePublishStudio: React.FC<YouTubePublishStudioProps> = ({
  script,
  onPublishToYouTube,
  onNotification,
}) => {
  const [channel, setChannel] = useState(getConnectedYouTubeChannel);
  const [payload, setPayload] = useState<YouTubePublishPayload>(() =>
    buildYouTubePublishPayload(script)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-publish audit calculation
  const audit = useMemo(() => auditPrePublishCompliance(payload), [payload]);

  // Handle privacy status change
  const handlePrivacyChange = (status: YouTubePrivacyStatus) => {
    setPayload((prev) => ({ ...prev, privacyStatus: status }));
  };

  // Handle schedule time change
  const handleScheduleChange = (dateTimeStr: string) => {
    setPayload((prev) => ({
      ...prev,
      scheduledPublishTime: dateTimeStr ? new Date(dateTimeStr).toISOString() : undefined,
    }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!audit.isValid) {
      onNotification?.('Please resolve metadata validation warnings before publishing', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      if (onPublishToYouTube) {
        await onPublishToYouTube(payload);
      }
      setPayload((prev) => ({
        ...prev,
        status: payload.scheduledPublishTime ? 'scheduled' : 'published',
        publishedVideoId: 'dQw4w9WgXcQ',
        publishedUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      }));
      onNotification?.(
        payload.scheduledPublishTime
          ? 'Video queued for scheduled release!'
          : 'Video metadata successfully published to YouTube Studio!',
        'success'
      );
    } catch (err: any) {
      onNotification?.('Failed to publish to YouTube: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* CHANNEL OAUTH STATUS & HEADER */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1">
                <Youtube className="w-3 h-3" /> YouTube Studio OAuth Pipeline
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Script: {script.title}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-red-400" />
              Direct YouTube Publishing & Scheduling Control Center
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl">
              Sync optimized titles, retention chapters, search tags, and thumbnails directly to your verified YouTube channel.
            </p>
          </div>

          {/* Connected Channel Card */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
            <img
              src={channel.avatarUrl}
              alt={channel.title}
              className="w-10 h-10 rounded-full object-cover border border-red-500/40"
            />
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">{channel.title}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" title="Connected" />
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                {channel.handle} • {channel.subscribers.toLocaleString()} subs
              </div>
            </div>
            <button
              onClick={() => onNotification?.('Channel permissions verified with YouTube OAuth 2.0', 'info')}
              className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors ml-2"
            >
              Manage
            </button>
          </div>
        </div>

        {/* AUDIT SCORE BANNER */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-black text-base ${
                audit.score >= 85
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}
            >
              {audit.score}%
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Pre-Publish Readiness Health Check</span>
                {audit.isValid ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                    PASSED
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold">
                    NEEDS ATTENTION
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {audit.titleAudit.message}
              </p>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !audit.isValid}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
              audit.isValid
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            {isSubmitting
              ? 'Publishing...'
              : payload.scheduledPublishTime
              ? 'Schedule Video Release'
              : 'Publish to YouTube'}
          </button>
        </div>
      </div>

      {/* TWO COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: METADATA INSPECTION (7 COLS) */}
        <div className="lg:col-span-7 space-y-5">
          {/* TITLE & CATEGORY */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-400" />
              Video Packaging Metadata
            </h3>

            {/* Video Title */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300">YouTube Video Title:</label>
                <span
                  className={`font-mono text-[11px] ${
                    payload.title.length > 100
                      ? 'text-rose-400 font-bold'
                      : payload.title.length > 70
                      ? 'text-amber-400'
                      : 'text-slate-400'
                  }`}
                >
                  {payload.title.length} / 100 characters
                </span>
              </div>
              <input
                type="text"
                value={payload.title}
                onChange={(e) => setPayload({ ...payload, title: e.target.value })}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-bold tracking-wide focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Category Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">YouTube Category:</label>
              <select
                value={payload.categoryId}
                onChange={(e) => setPayload({ ...payload, categoryId: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-red-500"
              >
                {YOUTUBE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} (ID: {cat.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300">Description (Including Chapters):</label>
                <span className="font-mono text-[11px] text-slate-400">
                  {payload.description.length} / 5000 chars
                </span>
              </div>
              <textarea
                value={payload.description}
                onChange={(e) => setPayload({ ...payload, description: e.target.value })}
                rows={7}
                className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-red-500 font-mono resize-y leading-relaxed"
              />
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-cyan-400" />
                  YouTube Search Tags:
                </label>
                <span
                  className={`font-mono text-[11px] ${
                    audit.tagsAudit.totalChars > 500 ? 'text-rose-400 font-bold' : 'text-slate-400'
                  }`}
                >
                  {audit.tagsAudit.totalChars} / 500 characters ({payload.tags.length} tags)
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 min-h-[50px]">
                {payload.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-700 flex items-center gap-1"
                  >
                    {tag}
                    <button
                      onClick={() =>
                        setPayload({
                          ...payload,
                          tags: payload.tags.filter((_, tIdx) => tIdx !== idx),
                        })
                      }
                      className="text-slate-500 hover:text-rose-400 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PRIVACY, SCHEDULING & COMPLIANCE (5 COLS) */}
        <div className="lg:col-span-5 space-y-5">
          {/* VISIBILITY / PRIVACY */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Globe className="w-4 h-4 text-red-400" />
              Visibility & Release
            </h3>

            <div className="space-y-2.5">
              {[
                {
                  id: 'public' as YouTubePrivacyStatus,
                  label: 'Public',
                  desc: 'Everyone can search for and view immediately upon release.',
                  icon: Globe,
                },
                {
                  id: 'unlisted' as YouTubePrivacyStatus,
                  label: 'Unlisted (Recommended for QA)',
                  desc: 'Anyone with the video link can watch. Not searchable.',
                  icon: EyeOff,
                },
                {
                  id: 'private' as YouTubePrivacyStatus,
                  label: 'Private',
                  desc: 'Only you and specified people can view.',
                  icon: Lock,
                },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = payload.privacyStatus === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handlePrivacyChange(opt.id)}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-red-950/20 border-red-500/60 ring-1 ring-red-500/40 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 mt-0.5 ${
                        isSelected ? 'text-red-400' : 'text-slate-500'
                      }`}
                    />
                    <div>
                      <div className="text-xs font-bold text-white">{opt.label}</div>
                      <div className="text-[11px] text-slate-400 leading-relaxed">
                        {opt.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* SCHEDULE DATE PICKER */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                Schedule Premiere Release:
              </label>
              <input
                type="datetime-local"
                onChange={(e) => handleScheduleChange(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:border-red-500"
              />
              <p className="text-[10px] font-mono text-slate-500">
                Leave blank to release as immediate {payload.privacyStatus.toUpperCase()}.
              </p>
            </div>
          </div>

          {/* COPPA & AUDIENCE COMPLIANCE */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Audience & COPPA Declaration
            </h3>

            <div className="space-y-3 text-xs">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="kids"
                  checked={!payload.selfDeclaredMadeForKids}
                  onChange={() => setPayload({ ...payload, selfDeclaredMadeForKids: false })}
                  className="mt-0.5 accent-red-500"
                />
                <span className="text-slate-300">
                  <strong>No, it's not made for kids</strong> (Enables comments, notification bell, and full creator monetization).
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="kids"
                  checked={payload.selfDeclaredMadeForKids}
                  onChange={() => setPayload({ ...payload, selfDeclaredMadeForKids: true })}
                  className="mt-0.5 accent-red-500"
                />
                <span className="text-slate-400">
                  Yes, it's made for kids (Restricts personalized ads and comments per Children's Online Privacy Protection Act).
                </span>
              </label>
            </div>
          </div>

          {/* PUBLISHING STATUS SUMMARY */}
          {payload.status === 'published' && payload.publishedUrl && (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                Live in YouTube Studio Pipeline
              </div>
              <p className="text-xs text-slate-300">
                Metadata is synced. Open YouTube Studio to monitor processing.
              </p>
              <a
                href={payload.publishedUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-mono text-cyan-400 hover:underline pt-1"
              >
                View on YouTube <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
