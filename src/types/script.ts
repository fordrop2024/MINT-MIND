import type { PlatformOption, LanguageOption, ToneOption } from './idea';
import type { StoryMode } from './storyMode';
import type {
  MediaAsset,
  MediaAssetType,
  MediaAssetStatus,
  MediaAssetSource,
  MediaAssetFilter,
} from './mediaAsset';

export type {
  StoryMode,
  MediaAsset,
  MediaAssetType,
  MediaAssetStatus,
  MediaAssetSource,
  MediaAssetFilter,
};

export type ScriptType =
  | 'YouTube Long-form'
  | 'YouTube Shorts'
  | 'Instagram Reels'
  | 'Instagram Stories'
  | 'General Social Video';

export type PlatformFormat = ScriptType;

export type CaptionStyle = 'bold_pop' | 'cyber_neon' | 'karaoke_glow' | 'minimalist' | 'classic_sub';

export type ScriptStatus = 'draft' | 'saved' | 'in_review' | 'ready';

export type AISectionAction =
  | 'rewrite'
  | 'shorten'
  | 'expand'
  | 'improve_hook'
  | 'conversational'
  | 'professional'
  | 'energetic'
  | 'translate'
  | 'simplify'
  | 'add_examples'
  | 'remove_repetition'
  | 'improve_flow'
  | 'alternative'
  | 'alternative_angle';

import type {
  ScriptScene,
  Scene,
  CameraShotType,
  CameraMovement,
  CameraTransition,
  ShotPlan,
  AudioTimingSync,
  SceneBreakdownGenerationParams,
  SceneBreakdownResponse,
} from './scene';

export * from './scene';
export * from './voice';
export * from './repurposing';
export * from './film';
import type { VoiceoverSettings } from './voice';
import type { RepurposedShort } from './repurposing';
import type { FilmStoryBible } from './film';

export interface ScriptSection {
  id: string;
  name: string;
  content: string;
  order: number;
}

export interface ScriptVersion {
  versionNumber: number;
  timestamp: string;
  title: string;
  sections: ScriptSection[];
  scenes: ScriptScene[];
  summaryNote?: string;
}

export interface ScriptSEO {
  title: string;
  description: string;
  keywords: string[];
  tags: string[];
  hashtags: string[];
  thumbnailText: string;
  filename: string;
  chapters?: Array<{ timestamp: string; title: string }>;
  shortFormSEO?: {
    hookCaption: string;
    hashtags: string[];
    audioRecommendation: string;
    engagementQuestion: string;
  };
  titleOptions?: Array<{
    id: string;
    title: string;
    hookType: 'curiosity' | 'urgency' | 'value' | 'question' | 'outlier';
    score: number;
    charCount: number;
    estimatedCTR?: string;
  }>;
  keywordMetrics?: Array<{
    keyword: string;
    searchVolume: 'High' | 'Very High' | 'Medium' | 'Breakout';
    competition: 'Low' | 'Medium' | 'High';
    relevance: number;
  }>;
  seoScore?: number;
  tagCharacterCount?: number;
  bestUploadTiming?: string;
}

export interface ThumbnailConcept {
  id: string;
  conceptTitle: string;
  visualDescription: string;
  layoutDescription: string;
  colorTheory: string;
  primaryTextOverlay: string;
  secondaryTextOverlay?: string;
  focalPoint: string;
  predictedCTRRating: string;
  aspectRatio?: '16:9' | '9:16';
  midjourneyPrompt?: string;
  fluxPrompt?: string;
  dallePrompt?: string;
  colorPalette?: string | string[];
  textColor?: string;
  textBgColor?: string;
  overlayText?: string;
  estimatedCTR?: string;
  layoutDiagram?: string;
  previewImageUrl?: string;
  fontFamily?: string;
  fontSize?: number;
  textPosition?: 'top-left' | 'top-right' | 'center' | 'bottom-left' | 'bottom-right';
}

export interface RepurposeItem {
  platform: 'YouTube Short' | 'Instagram Reel' | 'Instagram Story';
  title: string;
  hook: string;
  scriptText: string;
  targetDuration: string;
  onScreenCaptions: string[];
  recommendedHashtags: string[];
  cta: string;
}

export interface RepurposeVersions {
  short: RepurposeItem;
  reel: RepurposeItem;
  story: RepurposeItem;
}

export interface CaptionWord {
  word: string;
  startSec: number;
  endSec: number;
}

export interface CaptionLine {
  id: string;
  startSec: number;
  endSec: number;
  text: string;
  words?: CaptionWord[];
}

export interface CaptionConfig {
  style: 'bold_pop' | 'cyber_neon' | 'karaoke_glow' | 'minimalist' | 'classic_sub';
  fontFamily: string;
  fontSize: number;
  textColor: string;
  highlightColor: string;
  position: 'bottom' | 'middle' | 'top';
  animation: 'fade' | 'bounce' | 'word_by_word' | 'punch';
  language: string;
}

export interface ScriptSettings {
  topic: string;
  ideaText?: string;
  audience: string;
  language: LanguageOption | string;
  tone: ToneOption | string;
  duration: string;
  platform: ScriptType;
  narrationStyle: string;
  ctaStyle: string;
  referenceMaterial?: string;
  keyPoints?: string[];
  sources?: string[];
  brandVoice?: string;
  primaryMode?: StoryMode;
  secondaryModes?: StoryMode[];
  modeDetectionConfidence?: number;
  modeReasoning?: string;
}

export interface Script {
  id: string;
  ownerId: string;
  projectId?: string;
  ideaId?: string;
  title: string;
  type: ScriptType;
  status: ScriptStatus;
  settings: ScriptSettings;
  sections: ScriptSection[];
  scenes: ScriptScene[];
  versions: ScriptVersion[];
  currentVersionNumber: number;
  primaryMode?: StoryMode;
  secondaryModes?: StoryMode[];
  modeDetectionConfidence?: number;
  modeReasoning?: string;
  seo?: ScriptSEO;
  thumbnailConcepts?: ThumbnailConcept[];
  repurposeVersions?: RepurposeVersions;
  repurposedShorts?: RepurposedShort[];
  filmBible?: FilmStoryBible;
  captions?: CaptionLine[];
  captionConfig?: CaptionConfig;
  aspectRatio?: '16:9' | '9:16';
  isAudioSynced?: boolean;
  voiceoverSettings?: VoiceoverSettings;
  audioTrack?: {
    fileName: string;
    fileSize: number;
    durationSec: number;
    audioUrl?: string;
    syncedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ContentPackage {
  idea: {
    title: string;
    hook: string;
    concept: string;
    angle: string;
    whyItWorks: string;
  };
  script: {
    title: string;
    sections: ScriptSection[];
  };
  scenes: ScriptScene[];
  seo: ScriptSEO;
  thumbnails: ThumbnailConcept[];
  repurpose: RepurposeVersions;
}
