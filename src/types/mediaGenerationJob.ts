import type { MediaAssetType } from './mediaAsset';

export type MediaJobStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface MediaGenerationJob {
  id: string;
  jobId: string;
  projectId?: string;
  scriptId?: string;
  sceneId?: string;
  sceneNumber?: number;
  assetId?: string;
  type: MediaAssetType;
  provider: string;
  status: MediaJobStatus;
  prompt: string;
  progress: number;
  error?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGenerationJobParams {
  projectId?: string;
  scriptId?: string;
  sceneId?: string;
  sceneNumber?: number;
  assetId?: string;
  type: MediaAssetType;
  provider?: string;
  prompt: string;
  metadata?: Record<string, any>;
}

export interface MediaJobFilter {
  query?: string;
  type?: MediaAssetType | 'all';
  status?: MediaJobStatus | 'all';
  sceneNumber?: number | 'all';
  scriptId?: string;
  projectId?: string;
}
