import type { StoryMode } from './storyMode';
import type { MediaAsset } from './mediaAsset';

export type { StoryMode };

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

export type CameraTransition =
  | 'Cut'
  | 'Match Cut'
  | 'Cross Dissolve'
  | 'Fade to Black'
  | 'Fade to White'
  | 'Whip Pan'
  | 'Zoom In'
  | 'Zoom Out'
  | 'J-Cut'
  | 'L-Cut'
  | 'Glitch Transition'
  | 'Morph Cut'
  | 'None';

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

/**
 * Core Production Scene definition for MintMind AI.
 * Bridges Script -> Scene Breakdown -> Shot Plan -> Visual Prompts -> Media Assets.
 */
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
  cameraDirection?: string;
  transition: CameraTransition | string;
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
  enhancedPrompts?: EnhancedMediaPrompts;
  mediaStatus?: SceneMediaStatus;
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

export type SceneMediaStatus =
  | 'Prompt Ready'
  | 'Image Generated'
  | 'Video Pending'
  | 'Audio Synced'
  | 'Pending';

export interface CameraSettings {
  lens: string;
  aperture: string;
  shutter: string;
  sensor: string;
  movementStyle: string;
}

export interface AudioMetadataPrompt {
  voiceStyle: string;
  pacingWPM: number;
  emotion: string;
  recommendedVoice: string;
  sfxLayering: string[];
  musicBpm: string;
}

export interface EnhancedMediaPrompts {
  midjourneyPrompt: string;
  fluxPrompt: string;
  runwayPrompt: string;
  lumaPrompt: string;
  soraPrompt: string;
  cameraSettings: CameraSettings;
  lightingMood: string;
  colorGrade: string;
  subjectConsistencyAnchor: string;
  negativePrompt?: string;
  audioMetadata?: AudioMetadataPrompt;
}

/**
 * Alias for ScriptScene for generalized production scene modeling.
 */
export type Scene = ScriptScene;

/**
 * Input parameters for generating a Scene Breakdown from existing script content.
 */
export interface SceneBreakdownGenerationParams {
  scriptTitle: string;
  scriptText?: string;
  sections?: Array<{ id: string; name: string; content: string; order: number }>;
  primaryMode?: StoryMode;
  secondaryModes?: StoryMode[];
  platform?: string;
  duration?: string;
  audience?: string;
  tone?: string;
  aspectRatio?: '16:9' | '9:16';
}

/**
 * Response returned by the automated Scene Breakdown generation pipeline.
 */
export interface SceneBreakdownResponse {
  success: boolean;
  scenes: ScriptScene[];
  totalScenes: number;
  totalDurationSec: number;
  primaryMode: StoryMode;
}
