/**
 * CREOVA YouTube Intelligence - Data Architecture Models
 * Designed for future YouTube Data API v3 & Firestore persistence.
 * Strict Rule: No fake or fabricated data values.
 */

export interface YouTubeChannel {
  id: string; // YouTube Channel ID (e.g. UC...)
  title: string;
  customUrl?: string;
  description?: string;
  publishedAt?: string;
  country?: string;
  thumbnails?: {
    default?: string;
    medium?: string;
    high?: string;
  };
  statistics?: {
    viewCount?: number;
    subscriberCount?: number;
    hiddenSubscriberCount?: boolean;
    videoCount?: number;
  };
  analytics?: {
    avgViews?: number;
    avgLikes?: number;
    avgComments?: number;
    uploadFrequencyPerMonth?: number;
    growthRate30d?: number;
    engagementRate?: number;
  };
  topicCategories?: string[];
}

export interface YouTubeVideo {
  id: string; // YouTube Video ID
  channelId: string;
  channelTitle: string;
  title: string;
  description?: string;
  publishedAt: string;
  duration?: string; // ISO 8601 duration
  thumbnails?: {
    default?: string;
    medium?: string;
    high?: string;
    maxres?: string;
  };
  statistics?: {
    viewCount?: number;
    likeCount?: number;
    commentCount?: number;
  };
  computed?: {
    viewsPerDay?: number;
    engagementRate?: number;
    performanceScore?: number;
  };
  tags?: string[];
  categoryId?: string;
}

export interface YouTubeRanking {
  rank: number;
  channelId: string;
  channelTitle: string;
  category: string;
  country: string;
  period: 'daily' | 'weekly' | 'monthly' | '90days' | 'yearly';
  rankingType:
    | 'most_popular'
    | 'most_subscribed'
    | 'most_viewed'
    | 'most_growth'
    | 'most_decline'
    | 'most_engaging'
    | 'most_live_viewers';
  subscribers?: number;
  views?: number;
  growthRate?: number;
  engagementScore?: number;
  trendDirection?: 'up' | 'down' | 'neutral';
}

export interface YouTubeTopic {
  id: string;
  name: string;
  category: string;
  country: string;
  language: string;
  period: string;
  demandScore?: number; // CREOVA internal metric (0-100)
  growthRate?: number;
  competitionLevel?: 'low' | 'medium' | 'high';
  contentGapScore?: number;
  opportunityScore?: number;
  relatedKeywords?: string[];
}

export interface YouTubeCompetitor {
  id: string; // Local ID or YouTube Channel ID
  name: string;
  channelName?: string; // Alias for compatibility with Firestore blueprint
  channelId: string;
  channelUrl: string;
  createdAt: string;
  updatedAt?: string;
  ownerId?: string;
  notes?: string;
}

export interface YouTubeLiveStream {
  id: string;
  channelId: string;
  channelTitle: string;
  liveTitle: string;
  category: string;
  country: string;
  currentViewers?: number;
  startedAt?: string;
  duration?: string;
  chatVelocity?: number;
  growthRate?: number;
}

export interface YouTubeOutlier {
  videoId: string;
  videoTitle: string;
  channelId: string;
  channelTitle: string;
  views: number;
  channelAverageViews: number;
  performanceMultiplier: number; // e.g. 5.4x normal views
  outlierScore: number;
  detectedPattern: string;
  publishedAt: string;
}

export interface YouTubeStrategyInsight {
  channelId?: string;
  winningTopics: string[];
  contentFormats: string[];
  publishingPattern: string;
  titlePatterns: string[];
  thumbnailPatterns: string[];
  audienceSignals: string[];
  contentGaps: string[];
  opportunities: string[];
  recommendedOriginalStrategy: string;
}

/**
 * Future Firestore / Database Collection Schemas
 */
export interface DatabaseCollections {
  youtube_channels: YouTubeChannel;
  youtube_videos: YouTubeVideo;
  youtube_rankings: YouTubeRanking;
  youtube_topics: YouTubeTopic;
  youtube_competitors: YouTubeCompetitor;
  youtube_snapshots: {
    channelId: string;
    timestamp: string;
    subscribers: number;
    views: number;
    videoCount: number;
  };
  youtube_analytics: {
    channelId: string;
    calculatedAt: string;
    growthScore: number;
    engagementScore: number;
    retentionVelocity: number;
  };
  youtube_outliers: YouTubeOutlier;
}

/**
 * Service response contract for unconfigured API state
 */
export interface ServiceResponse<T> {
  connected: boolean;
  data: T | null;
  message: string;
  timestamp: string;
}
