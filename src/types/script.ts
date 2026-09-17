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

export type CameraShotType =
  | 'Extreme Wide Shot'
  | 'Wide Shot'
  | 'Medium Shot'
  | 'Medium Close-Up'
  | 'Close-Up'
  | 'Extreme Close-Up'
  | 'Over-the-Shoulder'
  | 'POV'
  | 'Drone Aerial'
  | 'Dutch Angle'
  | 'Macro';

export type CameraMovement =
  | 'Static'
  | 'Pan Left/Right'
  | 'Tilt Up/Down'
  | 'Slow Push-In / Dolly'
  | 'Pull-Out'
  | 'Tracking / Gimbal'
  | 'Handheld Organic'
  | 'Whip Pan'
  | 'Orbit';

export interface ShotPlan {
  shotType: CameraShotType | string;
  movement: CameraMovement | string;
  framing: '16:9 Widescreen' | '9:16 Vertical';
  lightingMood: string;
  colorGrade: string;
  focalPoint: string;
  visualPrompt: string;
  cinematicNotes?: string;
}

export interface AudioTimingSync {
  startSec: number;
  endSec: number;
  timecode: string;
  durationSec: number;
  wordCount: number;
  speechRateWPM: number;
  isSyncedToAudioFile?: boolean;
}

export interface ScriptSection {
  id: string;
  name: string;
  content: string;
  order: number;
}

export interface ScriptScene {
  sceneId?: string;
  sceneNumber: number;
  title?: string;
  duration: string;
  durationSec?: number;
  voiceover: string;
  dialogue?: string;
  visualDescription: string;
  bRoll?: string;
  bRollSuggestion: string;
  shotType?: CameraShotType | string;
  cameraMovement?: CameraMovement | string;
  cameraDirection: string;
  transition: string;
  onScreenText: string;
  music?: string;
  sfxMusic: string;
  soundEffects?: string;
  sfx?: string;
  imageGenerationPrompt?: string;
  videoGenerationPrompt?: string;
  sceneMode?: StoryMode;
  primaryMode?: StoryMode;
  secondaryModes?: StoryMode[];
  shotPlan?: ShotPlan;
  audioTiming?: AudioTimingSync;
  lightingMood?: string;
  action?: string;
  mediaAssetIds?: string[];
  generatedImage?: string;
  generatedVideo?: {
    status: 'idle' | 'generating' | 'ready' | 'failed';
    previewUrl?: string;
    prompt?: string;
    assetId?: string;
  };
  generatedVoice?: {
    audioUrl?: string;
    voiceName?: string;
    durationSec?: number;
  };
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
  captions?: CaptionLine[];
  captionConfig?: CaptionConfig;
  aspectRatio?: '16:9' | '9:16';
  isAudioSynced?: boolean;
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
