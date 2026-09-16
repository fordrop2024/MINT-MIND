import type { StoryMode } from './storyMode';

export type IdeaStatus = 'draft' | 'saved' | 'scripted' | 'produced' | 'published';

export type PlatformOption =
  | 'YouTube'
  | 'YouTube Long-form'
  | 'YouTube Shorts'
  | 'Instagram Reels'
  | 'Instagram Stories'
  | 'Facebook'
  | 'General Social Media'
  | 'General Social Video';

export type ContentTypeOption =
  | 'Educational'
  | 'Entertainment'
  | 'News/Explainer'
  | 'Story'
  | 'Tutorial'
  | 'Review'
  | 'Commentary'
  | 'Travel'
  | 'Gaming'
  | 'Technology'
  | 'Product'
  | 'Personal Brand'
  | 'Advertisement'
  | 'Custom';

export type LanguageOption =
  | 'English'
  | 'Hindi'
  | 'Hinglish'
  | 'Gujarati'
  | 'Tamil'
  | 'Bengali'
  | 'Telugu'
  | 'Marathi'
  | 'Punjabi'
  | 'Kannada'
  | 'Malayalam'
  | 'Custom';

export type ToneOption =
  | 'Professional'
  | 'Casual'
  | 'Energetic'
  | 'Educational'
  | 'Funny'
  | 'Dramatic'
  | 'Inspirational'
  | 'Storytelling'
  | 'News-style'
  | 'Custom';

export type GoalOption =
  | 'Brand Awareness'
  | 'High Views / Reach'
  | 'Lead Generation'
  | 'Education & Trust'
  | 'Community Growth'
  | 'Product Sales'
  | 'Authority Building'
  | 'Entertainment'
  | 'Viral Potential'
  | 'Custom';

export interface IdeaGenerationInputs {
  niche: string;
  topic: string;
  targetAudience: string;
  platform: PlatformOption;
  contentType: ContentTypeOption;
  language: LanguageOption;
  tone: ToneOption;
  videoDuration: string;
  goal: GoalOption;
  currentTrendContext?: string;
  competitorReference?: string;
  keywords?: string[];
  userNotes?: string;
  referenceContext?: string;
  projectId?: string;
  count?: number;
  primaryMode?: StoryMode;
  secondaryModes?: StoryMode[];
  modeDetectionConfidence?: number;
  modeReasoning?: string;
}

export interface Idea {
  id: string;
  ownerId: string;
  projectId?: string;
  title: string;
  hook: string;
  concept: string;
  coreConcept?: string;
  angle: string;
  uniqueAngle?: string;
  targetAudience: string;
  contentType: string;
  recommendedPlatform: string;
  estimatedDuration: string;
  trendScore: number;
  trendRelevance?: number;
  audienceInterestScore: number;
  audienceInterest?: number;
  competitionScore: number;
  competition?: number;
  opportunityScore: number;
  reason: string;
  whyThisIdea?: string;
  keywords: string[];
  hashtags: string[];
  thumbnailConcept: string;
  cta: string;
  status: IdeaStatus;
  primaryMode?: StoryMode;
  secondaryModes?: StoryMode[];
  modeDetectionConfidence?: number;
  modeReasoning?: string;
  metadata?: {
    niche?: string;
    topic?: string;
    language?: string;
    tone?: string;
    goal?: string;
    currentTrendContext?: string;
    competitorReference?: string;
    userNotes?: string;
    referenceContext?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IdeaAnalysis {
  ideaId: string;
  whyItWorks: string;
  targetViewer?: string;
  targetAudienceAnalysis: string;
  strongestAngle?: string;
  differentiation: string;
  potentialWeaknesses: string[];
  betterAngle: string;
  betterHook: string;
  recommendedDuration: string;
  recommendedPlatform: string;
  suggestedTitles: string[];
  thumbnailDirection: string;
  seoDirection: string;
  contentGapOpportunity?: string;
}

export interface IdeaVariation {
  angleType: 'Curiosity' | 'Problem/Solution' | 'Story' | 'Contrarian' | 'Educational';
  title: string;
  hook: string;
  concept: string;
  rationale: string;
}
