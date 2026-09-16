export type StoryMode =
  | 'Documentary'
  | 'Action'
  | 'Crime'
  | 'Thriller'
  | 'Horror'
  | 'Sci-Fi'
  | 'Space'
  | 'Mystery'
  | 'Investigation'
  | 'Psychological'
  | 'Adventure'
  | 'Survival'
  | 'Fantasy'
  | 'Romance'
  | 'Comedy'
  | 'Drama'
  | 'Historical'
  | 'Biography'
  | 'News'
  | 'Explainer'
  | 'Educational'
  | 'Travel'
  | 'Gaming'
  | 'Technology'
  | 'Sports'
  | 'War History'
  | 'Post-Apocalyptic'
  | 'Superhero'
  | 'Cinematic Story'
  | 'Drama Thriller'
  | 'Custom';

export type ModeCategory = 'Narrative' | 'Informative' | 'Genre' | 'Lifestyle';

export interface StoryModeProfile {
  id: StoryMode;
  label: string;
  category: ModeCategory;
  description: string;
  narrativeStructure: string;
  pacing: 'rapid' | 'fast' | 'moderate' | 'slow_burn' | 'dynamic';
  hookStyle: string;
  narrationStyle: string;
  visualStyle: string;
  cameraStyle: string;
  lightingStyle: string;
  musicDirection: string;
  soundDirection: string;
  sceneDensity: 'high' | 'medium' | 'cinematic_sparse';
  transitionStyle: string;
  captionStyle: string;
  thumbnailDirection: string;
  titleDirection: string;
  shortFormAdjustment: string;
  longFormAdjustment: string;
}

export interface StoryModeDetectionInput {
  topic?: string;
  idea?: string;
  title?: string;
  script?: string;
  content?: string;
  audience?: string;
  platform?: string;
}

export interface StoryModeDetection {
  primaryMode: StoryMode;
  secondaryModes: StoryMode[];
  confidence: number; // Internal estimate e.g. 0 to 100
  reasoning: string;
}

export interface StoryModeContext {
  primaryMode?: StoryMode;
  secondaryModes?: StoryMode[];
  modeDetectionConfidence?: number;
  modeReasoning?: string;
  isAutoDetected?: boolean;
}
