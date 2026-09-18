/**
 * MintMind AI - YouTube Publishing & OAuth Pipeline Service
 *
 * Constructs YouTube Data API v3 metadata payloads, audits platform constraints,
 * manages scheduled publishing queues, and tracks upload statuses.
 */

import type { Script } from '../types/script';

export type YouTubePrivacyStatus = 'public' | 'unlisted' | 'private';

export interface YouTubePublishPayload {
  id: string;
  scriptId: string;
  title: string;
  description: string;
  tags: string[];
  categoryId: string;
  privacyStatus: YouTubePrivacyStatus;
  scheduledPublishTime?: string; // ISO 8601
  selfDeclaredMadeForKids: boolean;
  notifySubscribers: boolean;
  thumbnailUrl?: string;
  videoFileName?: string;
  status: 'draft' | 'scheduled' | 'validating' | 'ready' | 'publishing' | 'published' | 'error';
  errorMessage?: string;
  publishedVideoId?: string;
  publishedUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrePublishAuditResult {
  isValid: boolean;
  score: number; // 0 - 100
  titleAudit: {
    length: number;
    isValid: boolean;
    message: string;
  };
  descriptionAudit: {
    length: number;
    hasChapters: boolean;
    hasHashtags: boolean;
    isValid: boolean;
    message: string;
  };
  tagsAudit: {
    count: number;
    totalChars: number;
    isValid: boolean;
    message: string;
  };
  thumbnailAudit: {
    hasThumbnail: boolean;
    message: string;
  };
  complianceAudit: {
    madeForKidsDeclared: boolean;
    message: string;
  };
}

export interface ConnectedYouTubeChannel {
  channelId: string;
  title: string;
  handle: string;
  avatarUrl: string;
  subscribers: number;
  isConnected: boolean;
  connectedEmail: string;
  expiresAt?: string;
}

export const YOUTUBE_CATEGORIES = [
  { id: '28', name: 'Science & Technology' },
  { id: '27', name: 'Education' },
  { id: '22', name: 'People & Blogs' },
  { id: '24', name: 'Entertainment' },
  { id: '26', name: 'Howto & Style' },
  { id: '20', name: 'Gaming' },
  { id: '25', name: 'News & Politics' },
  { id: '1', name: 'Film & Animation' },
];

/**
 * Builds a YouTube Data API v3 compliant publish payload from a MintMind Script.
 */
export function buildYouTubePublishPayload(
  script: Script,
  overrides?: Partial<YouTubePublishPayload>
): YouTubePublishPayload {
  const seo = script.seo;
  const title = overrides?.title || seo?.title || script.title;

  // Build full description including chapters and hashtags
  let description = overrides?.description || seo?.description || '';
  if (seo?.chapters && seo.chapters.length > 0 && !description.includes('0:00')) {
    const chaptersText = `\n\n--- CHAPTERS ---\n` + seo.chapters.map((c) => `${c.timestamp} - ${c.title}`).join('\n');
    description += chaptersText;
  }
  if (seo?.hashtags && seo.hashtags.length > 0 && !description.includes('#')) {
    description += `\n\n` + seo.hashtags.slice(0, 5).join(' ');
  }

  const tags = overrides?.tags || seo?.tags || ['content creator', 'tutorial', 'guide'];
  const thumbnailUrl = overrides?.thumbnailUrl || script.thumbnailConcepts?.[0]?.previewImageUrl || undefined;

  return {
    id: overrides?.id || `yt-pub-${Date.now()}`,
    scriptId: script.id,
    title: title.slice(0, 100),
    description: description.slice(0, 5000),
    tags,
    categoryId: overrides?.categoryId || '28', // Default Science & Tech
    privacyStatus: overrides?.privacyStatus || 'unlisted',
    scheduledPublishTime: overrides?.scheduledPublishTime,
    selfDeclaredMadeForKids: overrides?.selfDeclaredMadeForKids || false,
    notifySubscribers: overrides?.notifySubscribers !== undefined ? overrides.notifySubscribers : true,
    thumbnailUrl,
    videoFileName: overrides?.videoFileName || seo?.filename || 'master_render_4k.mp4',
    status: overrides?.status || 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Performs strict pre-publish audit against YouTube algorithm and API constraints.
 */
export function auditPrePublishCompliance(payload: YouTubePublishPayload): PrePublishAuditResult {
  const titleLen = payload.title.trim().length;
  const titleValid = titleLen >= 10 && titleLen <= 100;
  const titleMessage =
    titleLen < 10
      ? 'Title is too short (min 10 characters required).'
      : titleLen > 100
      ? 'Title exceeds YouTube 100 character maximum limit.'
      : titleLen > 70
      ? 'Title is valid, but consider <70 characters for mobile truncation.'
      : 'Optimal high-CTR title length.';

  const descLen = payload.description.trim().length;
  const hasChapters = payload.description.includes('0:00') || payload.description.includes('00:00');
  const hasHashtags = payload.description.includes('#');
  const descValid = descLen >= 30 && descLen <= 5000;
  const descMessage =
    descLen < 30
      ? 'Description is too brief. YouTube search indexing requires contextual copy.'
      : descLen > 5000
      ? 'Description exceeds YouTube 5,000 character limit.'
      : 'Healthy search-indexed description.';

  const tagsJoined = payload.tags.join(',');
  const tagsChars = tagsJoined.length;
  const tagsCount = payload.tags.length;
  const tagsValid = tagsChars <= 500 && tagsCount >= 3;
  const tagsMessage =
    tagsChars > 500
      ? `Tags exceed YouTube 500 character ceiling (${tagsChars}/500 chars).`
      : tagsCount < 3
      ? 'Add at least 3 relevant search tags.'
      : `Optimal tag density (${tagsChars}/500 chars).`;

  const hasThumbnail = Boolean(payload.thumbnailUrl);
  const thumbMessage = hasThumbnail
    ? 'High-CTR thumbnail concept attached.'
    : 'No thumbnail attached. YouTube will auto-select an unoptimized frame.';

  const complianceMessage = payload.selfDeclaredMadeForKids
    ? 'Marked as Made for Kids (Comments & personalized ads disabled by COPPA).'
    : 'Not Made for Kids (Standard monetization & comments enabled).';

  let score = 50;
  if (titleValid) score += 15;
  if (descValid) score += 10;
  if (hasChapters) score += 10;
  if (tagsValid) score += 10;
  if (hasThumbnail) score += 5;

  const isValid = titleValid && descValid && tagsValid;

  return {
    isValid,
    score: Math.min(100, score),
    titleAudit: { length: titleLen, isValid: titleValid, message: titleMessage },
    descriptionAudit: {
      length: descLen,
      hasChapters,
      hasHashtags,
      isValid: descValid,
      message: descMessage,
    },
    tagsAudit: {
      count: tagsCount,
      totalChars: tagsChars,
      isValid: tagsValid,
      message: tagsMessage,
    },
    thumbnailAudit: { hasThumbnail, message: thumbMessage },
    complianceAudit: { madeForKidsDeclared: true, message: complianceMessage },
  };
}

/**
 * Mock/Connected YouTube Account state.
 */
export function getConnectedYouTubeChannel(): ConnectedYouTubeChannel {
  return {
    channelId: 'UC_MINTMIND_STUDIO_90BC',
    title: 'MintMind AI Official',
    handle: '@MintMindAI',
    avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    subscribers: 54200,
    isConnected: true,
    connectedEmail: 'creator@mintmind.ai',
    expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
  };
}
