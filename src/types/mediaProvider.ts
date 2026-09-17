import type { MediaAssetType } from './mediaAsset';

export type MediaProviderDomain = 'image' | 'video' | 'tts' | 'music' | 'sfx';

export interface MediaProviderCapabilities {
  supportedTypes: MediaAssetType[];
  supportedFormats: string[];
  supportedAspectRatios?: string[];
  supportsNegativePrompts?: boolean;
  supportsReferenceMedia?: boolean;
  supportsVoiceCloning?: boolean;
  maxDurationSeconds?: number;
}

export interface MediaGenerationRequest {
  providerId: string;
  domain: MediaProviderDomain;
  type: MediaAssetType;
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: string;
  durationSeconds?: number;
  referenceMediaUrl?: string;
  voiceStyle?: string;
  projectId?: string;
  scriptId?: string;
  sceneNumber?: number;
  metadata?: Record<string, any>;
}

export interface MediaGenerationResult {
  success: boolean;
  assetId?: string;
  url?: string;
  thumbnailUrl?: string;
  duration?: number;
  width?: number;
  height?: number;
  error?: string;
  providerMetadata?: Record<string, any>;
}

export interface IMediaProvider {
  id: string;
  name: string;
  domain: MediaProviderDomain;
  description: string;
  isConfigured: boolean;
  capabilities: MediaProviderCapabilities;
  generate(request: MediaGenerationRequest): Promise<MediaGenerationResult>;
}
