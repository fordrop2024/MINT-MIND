export type AIProviderId = 'gemini' | 'ollama' | 'openai-compatible' | 'custom';
export type AIProviderType = 'cloud' | 'local';

export interface AIProviderStatus {
  id: AIProviderId;
  name: string;
  type: AIProviderType;
  configured: boolean;
  active: boolean;
  model: string;
  availableModels: string[];
  baseURL?: string;
  health: 'connected' | 'disconnected' | 'error' | 'standby';
  message?: string;
}

export interface AIProviderConfigUpdate {
  providerId: AIProviderId;
  config?: {
    baseURL?: string;
    apiKey?: string;
    defaultModel?: string;
  };
}

export interface ProviderTestResult {
  ok: boolean;
  success?: boolean;
  latencyMs?: number;
  message: string;
  discoveredModels?: string[];
  error?: string;
}
