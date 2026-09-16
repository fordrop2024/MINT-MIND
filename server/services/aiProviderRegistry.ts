import type {
  IAIProvider,
  AIProviderId,
  AIProviderStatus,
  AIProviderConfig,
  ProviderTestResult,
} from './aiProviderTypes.js';
import { GeminiProvider } from './providers/geminiProvider.js';
import { OllamaProvider } from './providers/ollamaProvider.js';
import { OpenAICompatibleProvider } from './providers/openaiCompatibleProvider.js';

class AIProviderRegistry {
  private providers: Map<AIProviderId, IAIProvider> = new Map();
  private activeProviderId: AIProviderId = 'gemini';

  constructor() {
    // Register default providers
    const gemini = new GeminiProvider();
    const ollama = new OllamaProvider();
    const openaiCompatible = new OpenAICompatibleProvider();

    this.providers.set('gemini', gemini);
    this.providers.set('ollama', ollama);
    this.providers.set('openai-compatible', openaiCompatible);

    // Initial preference check: if Gemini is configured, use it, else check local Ollama
    if (gemini.isConfigured()) {
      this.activeProviderId = 'gemini';
    } else {
      this.activeProviderId = 'gemini'; // default standby
    }
  }

  public getActiveProvider(): IAIProvider {
    const provider = this.providers.get(this.activeProviderId);
    if (!provider) {
      // Fallback to gemini
      return this.providers.get('gemini')!;
    }
    return provider;
  }

  public getActiveProviderId(): AIProviderId {
    return this.activeProviderId;
  }

  public getProvider(id: AIProviderId): IAIProvider | undefined {
    return this.providers.get(id);
  }

  public getAllProvidersStatus(): AIProviderStatus[] {
    const list: AIProviderStatus[] = [];
    for (const [id, provider] of this.providers.entries()) {
      const status = provider.getStatus();
      status.active = id === this.activeProviderId;
      list.push(status);
    }
    return list;
  }

  public selectProvider(id: AIProviderId, config?: Partial<AIProviderConfig>): AIProviderStatus {
    const provider = this.providers.get(id);
    if (!provider) {
      throw new Error(`Provider "${id}" is not registered.`);
    }

    if (config) {
      provider.configure(config);
    }

    this.activeProviderId = id;
    const status = provider.getStatus();
    status.active = true;
    return status;
  }

  public async testProvider(id: AIProviderId, config?: Partial<AIProviderConfig>): Promise<ProviderTestResult> {
    const provider = this.providers.get(id);
    if (!provider) {
      return {
        ok: false,
        message: `Provider "${id}" not found.`,
        error: 'NOT_FOUND',
      };
    }

    if (config) {
      provider.configure(config);
    }

    return provider.testConnection();
  }
}

export const aiProviderRegistry = new AIProviderRegistry();
