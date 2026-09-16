import type {
  IAIProvider,
  AIProviderId,
  AIProviderType,
  AIProviderStatus,
  AIProviderConfig,
  ProviderGenerateTextOptions,
  ProviderGenerateStructuredJSONOptions,
  ProviderAnalyzeTextOptions,
  ProviderRewriteTextOptions,
  ProviderSummarizeTextOptions,
  ProviderTestResult,
} from '../aiProviderTypes.js';

export class OllamaProviderError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 500, code = 'OLLAMA_ERROR') {
    super(message);
    this.name = 'OllamaProviderError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class OllamaProvider implements IAIProvider {
  public readonly id: AIProviderId = 'ollama';
  public readonly name = 'Ollama (Local AI)';
  public readonly type: AIProviderType = 'local';
  public readonly defaultModel = 'llama3';

  private baseURL = 'http://localhost:11434';
  private selectedModel = 'llama3';
  private cachedModels: string[] = ['llama3', 'mistral', 'deepseek-r1', 'qwen2.5', 'phi3', 'gemma2'];
  private isConnected = false;

  public configure(config: Partial<AIProviderConfig>): void {
    if (config.baseURL) {
      this.baseURL = config.baseURL.replace(/\/+$/, '');
    }
    if (config.defaultModel) {
      this.selectedModel = config.defaultModel;
    }
  }

  public isConfigured(): boolean {
    return Boolean(this.baseURL && this.baseURL.trim().length > 0);
  }

  public getStatus(): AIProviderStatus {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      configured: this.isConfigured(),
      active: false,
      model: this.selectedModel || this.defaultModel,
      availableModels: this.cachedModels,
      baseURL: this.baseURL,
      health: this.isConnected ? 'connected' : 'standby',
      message: this.isConnected
        ? `Connected to Ollama engine at ${this.baseURL}`
        : `Ollama target: ${this.baseURL}. Ensure Ollama is running locally (\`ollama serve\`).`,
    };
  }

  public async testConnection(): Promise<ProviderTestResult> {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`${this.baseURL}/api/tags`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        this.isConnected = false;
        return {
          ok: false,
          latencyMs: Date.now() - startTime,
          message: `Ollama responded with HTTP ${res.status}: ${res.statusText}`,
          error: 'HTTP_ERROR',
        };
      }

      const data = await res.json();
      const models = Array.isArray(data.models) ? data.models.map((m: any) => m.name || m.model) : [];
      if (models.length > 0) {
        this.cachedModels = models;
      }
      this.isConnected = true;

      const latencyMs = Date.now() - startTime;
      return {
        ok: true,
        latencyMs,
        message: `Connected to local Ollama daemon (${latencyMs}ms). Found ${models.length} installed model(s).`,
        discoveredModels: models.length > 0 ? models : this.cachedModels,
      };
    } catch (err: any) {
      this.isConnected = false;
      const latencyMs = Date.now() - startTime;
      return {
        ok: false,
        latencyMs,
        message: `Could not reach Ollama at ${this.baseURL}. Make sure Ollama is running locally (\`ollama serve\` or launch the Ollama app).`,
        error: 'CONNECTION_REFUSED',
      };
    }
  }

  public sanitizeError(err: any): OllamaProviderError {
    if (err instanceof OllamaProviderError) return err;

    const rawMsg = String(err?.message || err || '');
    const lower = rawMsg.toLowerCase();

    if (lower.includes('econnrefused') || lower.includes('fetch failed') || lower.includes('abort')) {
      return new OllamaProviderError(
        `Cannot connect to Ollama at ${this.baseURL}. Run \`ollama serve\` or start the Ollama desktop app.`,
        503,
        'OLLAMA_OFFLINE'
      );
    }

    if (lower.includes('not found') || lower.includes('model')) {
      return new OllamaProviderError(
        `Model "${this.selectedModel}" was not found in Ollama. Pull it first via \`ollama pull ${this.selectedModel}\`.`,
        404,
        'MODEL_NOT_FOUND'
      );
    }

    return new OllamaProviderError(rawMsg || 'An error occurred with Ollama.', 500, 'OLLAMA_ERROR');
  }

  private parseJSON<T>(text: string): T {
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    try {
      return JSON.parse(cleaned) as T;
    } catch {
      const firstBrace = cleaned.indexOf('{');
      const firstBracket = cleaned.indexOf('[');
      let startIndex = -1;
      let endIndex = -1;

      if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        startIndex = firstBrace;
        endIndex = cleaned.lastIndexOf('}');
      } else if (firstBracket !== -1) {
        startIndex = firstBracket;
        endIndex = cleaned.lastIndexOf(']');
      }

      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        return JSON.parse(cleaned.substring(startIndex, endIndex + 1)) as T;
      }
      throw new OllamaProviderError('Ollama response did not contain valid JSON.', 502, 'INVALID_JSON');
    }
  }

  public async generateText(options: ProviderGenerateTextOptions): Promise<string> {
    const model = options.model || this.selectedModel || this.defaultModel;
    try {
      const res = await fetch(`${this.baseURL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt: options.prompt,
          system: options.systemInstruction,
          stream: false,
          options: {
            temperature: typeof options.temperature === 'number' ? options.temperature : 0.7,
            num_predict: options.maxOutputTokens,
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Ollama API error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      return data.response || '';
    } catch (err) {
      throw this.sanitizeError(err);
    }
  }

  public async generateStructuredJSON<T = any>(options: ProviderGenerateStructuredJSONOptions): Promise<T> {
    const model = options.model || this.selectedModel || this.defaultModel;
    try {
      const res = await fetch(`${this.baseURL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt: `${options.prompt}\n\nIMPORTANT: Respond ONLY with valid JSON matching the requested schema. No other text.`,
          system: (options.systemInstruction ? `${options.systemInstruction}\n` : '') + 'You always output pure JSON.',
          format: 'json',
          stream: false,
          options: {
            temperature: typeof options.temperature === 'number' ? options.temperature : 0.3,
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Ollama API error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      return this.parseJSON<T>(data.response || '');
    } catch (err) {
      throw this.sanitizeError(err);
    }
  }

  public async analyzeText(options: ProviderAnalyzeTextOptions): Promise<string> {
    return this.generateText({
      prompt: `Analyze the following content:\n\n"""\n${options.text}\n"""\n\nInstructions:\n${options.instructions}`,
      systemInstruction: 'You are an expert content strategist and analytical editor.',
      model: options.model,
    });
  }

  public async rewriteText(options: ProviderRewriteTextOptions): Promise<string> {
    return this.generateText({
      prompt: `Rewrite the following text:\n\n"""\n${options.text}\n"""\n\nInstruction: ${options.instruction}\n${options.tone ? `Tone: ${options.tone}` : ''}`,
      systemInstruction: 'You are an expert script editor.',
      model: options.model,
    });
  }

  public async summarizeText(options: ProviderSummarizeTextOptions): Promise<string> {
    return this.generateText({
      prompt: `Summarize the following text concisely:\n\n"""\n${options.text}\n"""`,
      systemInstruction: 'You are a concise executive summarizer.',
      model: options.model,
    });
  }
}
