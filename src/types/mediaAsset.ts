export type MediaAssetType =
  | 'image'
  | 'video'
  | 'audio'
  | 'voiceover'
  | 'music'
  | 'sound-effect'
  | 'b-roll';

export type MediaAssetStatus =
  | 'required'
  | 'pending'
  | 'generating'
  | 'ready'
  | 'failed'
  | 'missing';

export type MediaAssetSource =
  | 'ai-generated'
  | 'uploaded'
  | 'stock'
  | 'manual'
  | 'placeholder';

export interface MediaAsset {
  id: string;
  assetId: string;
  projectId?: string;
  scriptId?: string;
  sceneId?: string;
  sceneNumber?: number;
  type: MediaAssetType;
  source: MediaAssetSource;
  status: MediaAssetStatus;
  filename: string;
  url?: string;
  path?: string;
  thumbnailUrl?: string;
  duration?: number;
  width?: number;
  height?: number;
  aspectRatio?: string;
  prompt?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface MediaAssetFilter {
  query?: string;
  type?: MediaAssetType | 'all';
  status?: MediaAssetStatus | 'all';
  sceneNumber?: number | 'all';
}
