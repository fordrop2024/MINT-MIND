/**
 * MintMind AI - Modular AI Provider System Types
 *
 * Defines the contract and configuration for all pluggable AI providers
 * (e.g. Google Gemini, Local Ollama, OpenAI-compatible APIs).
 */

export type AIProviderId = 'gemini' | 'ollama' | 'openai-compatible' | 'custom';

export type AIProviderType = 'cloud' | 'local';

export interface AIProviderConfig {
  id: AIProviderId;
  name: string;
  type: AIProviderType;
  description: string;
  enabled: boolean;
  baseURL?: string;
  apiKey?: string;
  defaultModel: string;
  availableModels: string[];
  supportsJSON: boolean;
  supportsStreaming: boolean;
}

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

export interface ProviderGenerateTextOptions {
  prompt: string;
  systemInstruction?: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface ProviderGenerateStructuredJSONOptions {
  prompt: string;
  systemInstruction?: string;
  model?: string;
  temperature?: number;
  responseSchema?: any;
}

export interface ProviderAnalyzeTextOptions {
  text: string;
  instructions: string;
  model?: string;
}

export interface ProviderRewriteTextOptions {
  text: string;
  instruction: string;
  tone?: string;
  model?: string;
}

export interface ProviderSummarizeTextOptions {
  text: string;
  maxLength?: string | number;
  model?: string;
}

export interface ProviderTestResult {
  ok: boolean;
  latencyMs?: number;
  message: string;
  discoveredModels?: string[];
  error?: string;
}

/**
 * Common standard interface that every AI provider must implement.
 */
export interface IAIProvider {
  readonly id: AIProviderId;
  readonly name: string;
  readonly type: AIProviderType;
  readonly defaultModel: string;

  isConfigured(): boolean;
  getStatus(): AIProviderStatus;
  configure(config: Partial<AIProviderConfig>): void;
  testConnection(): Promise<ProviderTestResult>;

  generateText(options: ProviderGenerateTextOptions): Promise<string>;
  generateStructuredJSON<T = any>(options: ProviderGenerateStructuredJSONOptions): Promise<T>;
  analyzeText(options: ProviderAnalyzeTextOptions): Promise<string>;
  rewriteText(options: ProviderRewriteTextOptions): Promise<string>;
  summarizeText(options: ProviderSummarizeTextOptions): Promise<string>;
  sanitizeError(err: any): Error & { statusCode?: number; code?: string };
}
