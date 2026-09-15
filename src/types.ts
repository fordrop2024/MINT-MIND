export type ThemeMode = 'dark' | 'light' | 'mix';

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
}

export type AppRoute =
  | '/login'
  | '/dashboard'
  | '/ai-command'
  | '/trends'
  | '/research'
  | '/ideas'
  | '/script'
  | '/video-generator'
  | '/image-studio'
  | '/editor'
  | '/voice'
  | '/thumbnail'
  | '/seo'
  | '/repurpose'
  | '/youtube'
  | '/scheduler'
  | '/analytics'
  | '/brand'
  | '/templates'
  | '/projects'
  | '/team'
  | '/settings'
  | '/youtube-intelligence'
  | '/youtube-intelligence/channel'
  | '/youtube-intelligence/video'
  | '/youtube-intelligence/rankings'
  | '/youtube-intelligence/topics'
  | '/youtube-intelligence/competitors'
  | '/youtube-intelligence/live'
  | '/youtube-intelligence/outliers'
  | '/youtube-intelligence/strategy';

export interface NavItemConfig {
  path: AppRoute;
  label: string;
  category: 'core' | 'creation' | 'distribution' | 'management' | 'intelligence';
  description: string;
  phase: 'foundation' | 'phase_2' | 'phase_3';
}

export interface SystemStatusResponse {
  name: string;
  version: string;
  phase: string;
  architecture: string;
  databaseStatus: string;
  integrations: {
    youtube: string;
    videoGeneration: string;
    externalAI: string;
  };
}
