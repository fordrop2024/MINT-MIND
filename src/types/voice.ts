import type { StoryMode } from './storyMode';

export type VoiceLanguage =
  | 'English'
  | 'Hindi'
  | 'Hinglish'
  | 'Spanish'
  | 'German'
  | 'French'
  | 'Japanese'
  | 'Portuguese'
  | string;

export type VoiceGender = 'male' | 'female' | 'neutral';

export type VoiceEmotion =
  | 'Conversational'
  | 'Authoritative'
  | 'Dramatic'
  | 'Energetic'
  | 'Calm'
  | 'Intriguing'
  | 'Humorous'
  | 'Inspirational';

export interface VoiceModelProfile {
  id: string;
  name: string;
  displayName: string;
  language: VoiceLanguage;
  localeCode: string;
  gender: VoiceGender;
  recommendedTone: VoiceEmotion;
  bestForStoryMode: (StoryMode | string)[];
  description: string;
  sampleText: string;
  previewAudioUrl?: string;
  webSpeechVoiceQuery?: string[];
}

export interface VoiceoverSettings {
  language: VoiceLanguage;
  voiceModelId: string;
  voiceName: string;
  gender: VoiceGender;
  emotion: VoiceEmotion;
  speechRateWPM: number;
  pitch: number;
  volume: number;
  pauseBetweenScenesSec: number;
  addNaturalBreaths: boolean;
  generateSrtSubtitles: boolean;
}

export interface SceneTTSMetadata {
  sceneNumber: number;
  spokenText: string;
  wordCount: number;
  estimatedDurationSec: number;
  emotion: VoiceEmotion;
  pacingWPM: number;
  pitch: number;
  emphasisWords: string[];
  pauseDurationSec: number;
  ssmlText?: string;
  language: VoiceLanguage;
}

export interface VoiceoverSequenceItem {
  sceneNumber: number;
  title: string;
  spokenText: string;
  startSec: number;
  endSec: number;
  durationSec: number;
  timecode: string;
  isPlaying?: boolean;
}

export interface VoiceoverTimelineData {
  totalDurationSec: number;
  formattedTotalTime: string;
  totalWords: number;
  averageWPM: number;
  items: VoiceoverSequenceItem[];
  srtContent: string;
}
