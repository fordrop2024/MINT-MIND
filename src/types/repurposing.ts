/**
 * MintMind AI - Shorts & Reels Repurposing Types
 */

export type ShortHookType =
  | 'curiosity'
  | 'controversy'
  | 'counterintuitive'
  | 'story_open'
  | 'pain_point';

export type PatternInterruptType =
  | 'zoom_punch'
  | 'sound_hit'
  | 'b_roll_flash'
  | 'text_pop'
  | 'camera_angle_flip'
  | 'sfx_woosh'
  | 'screen_glitch';

export interface PatternInterrupt {
  timestampSec: number;
  timecode: string;
  type: PatternInterruptType;
  cueDescription: string;
  intensity: 'subtle' | 'medium' | 'high';
}

export interface RepurposedShort {
  id: string;
  title: string;
  hookType: ShortHookType;
  hookText: string;
  bodyText: string;
  ctaText: string;
  fullScript: string;
  targetDurationSec: 15 | 30 | 45 | 60;
  estimatedWPM: number;
  patternInterrupts: PatternInterrupt[];
  visualDirection: string;
  onScreenTextCues: string[];
  audioRecommendation: string;
  hashtags: string[];
  engagementTrigger: string;
  sourceSectionNames?: string[];
  estimatedRetentionScore?: number; // 0-100
}

export interface RepurposeOptions {
  targetPlatforms?: ('YouTube Short' | 'Instagram Reel' | 'TikTok')[];
  duration?: 15 | 30 | 45 | 60;
  tone?: string;
  language?: string;
}
