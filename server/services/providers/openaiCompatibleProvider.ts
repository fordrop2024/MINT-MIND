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

export class OpenAICompatibleProviderError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 500, code = 'AI_PROVIDER_ERROR') {
    super(message);
    this.name = 'OpenAICompatibleProviderError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class OpenAICompatibleProvider implements IAIProvider {
  public readonly id: AIProviderId = 'openai-compatible';
  public readonly name = 'Custom / OpenAI-Compatible';
  public readonly type: AIProviderType = 'cloud';
  public readonly defaultModel = 'gpt-4o-mini';

  private baseURL = 'https://api.openai.com/v1';
  private apiKey = '';
  private selectedModel = 'gpt-4o-mini';
  public availableModels = ['gpt-4o-mini', 'gpt-4o', 'claude-3-5-sonnet', 'deepseek-chat', 'llama-3.3-70b'];

  public configure(config: Partial<AIProviderConfig>): void {
    if (config.baseURL) this.baseURL = config.baseURL.replace(/\/+$/, '');
    if (config.apiKey) this.apiKey = config.apiKey.trim();
    if (config.defaultModel) this.selectedModel = config.defaultModel;
  }

  public isConfigured(): boolean {
    return Boolean(this.baseURL && this.baseURL.trim().length > 0);
  }

  public getStatus(): AIProviderStatus {
    const configured = this.isConfigured();
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      configured,
      active: false,
      model: this.selectedModel,
      availableModels: this.availableModels,
      baseURL: this.baseURL,
      health: configured ? 'standby' : 'disconnected',
      message: `OpenAI-compatible gateway: ${this.baseURL}`,
    };
  }

  public async testConnection(): Promise<ProviderTestResult> {
    const startTime = Date.now();
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const res = await fetch(`${this.baseURL}/models`, { headers });
      const latencyMs = Date.now() - startTime;

      if (!res.ok) {
        return {
          ok: false,
          latencyMs,
          message: `Endpoint returned HTTP ${res.status}: ${res.statusText}`,
          error: 'HTTP_ERROR',
        };
      }

      const data = await res.json();
      const models = Array.isArray(data?.data) ? data.data.map((m: any) => m.id) : [];

      return {
        ok: true,
        latencyMs,
        message: `Connected to endpoint successfully (${latencyMs}ms). Found ${models.length} model(s).`,
        discoveredModels: models.slice(0, 10),
      };
    } catch (err: any) {
      return {
        ok: false,
        latencyMs: Date.now() - startTime,
        message: `Connection failed: ${err?.message || err}`,
        error: 'NETWORK_ERROR',
      };
    }
  }

  public sanitizeError(err: any): OpenAICompatibleProviderError {
    if (err instanceof OpenAICompatibleProviderError) return err;
    return new OpenAICompatibleProviderError(String(err?.message || err || 'Unknown error'), 500);
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
      throw new OpenAICompatibleProviderError('Provider response did not contain valid JSON.', 502);
    }
  }

  public async generateText(options: ProviderGenerateTextOptions): Promise<string> {
    const model = options.model || this.selectedModel || this.defaultModel;
    const messages: any[] = [];

    if (options.systemInstruction) {
      messages.push({ role: 'system', content: options.systemInstruction });
    }
    messages.push({ role: 'user', content: options.prompt });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      const res = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages,
          temperature: typeof options.temperature === 'number' ? options.temperature : 0.7,
          max_tokens: options.maxOutputTokens,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      return data?.choices?.[0]?.message?.content || '';
    } catch (err) {
      throw this.sanitizeError(err);
    }
  }

  public async generateStructuredJSON<T = any>(options: ProviderGenerateStructuredJSONOptions): Promise<T> {
    const model = options.model || this.selectedModel || this.defaultModel;
    const messages: any[] = [];

    const systemPrompt = (options.systemInstruction ? `${options.systemInstruction}\n` : '') +
      'CRITICAL: Return strictly valid raw JSON only. Do not output markdown codeblocks or conversational text.';

    messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: options.prompt });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      const res = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages,
          response_format: { type: 'json_object' },
          temperature: typeof options.temperature === 'number' ? options.temperature : 0.3,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      return this.parseJSON<T>(data?.choices?.[0]?.message?.content || '');
    } catch (err) {
      throw this.sanitizeError(err);
    }
  }

  public async analyzeText(options: ProviderAnalyzeTextOptions): Promise<string> {
    return this.generateText({
      prompt: `Analyze the following content:\n\n"""\n${options.text}\n"""\n\nInstructions:\n${options.instructions}`,
      systemInstruction: 'You are an expert content strategist and analyst.',
      model: options.model,
    });
  }

  public async rewriteText(options: ProviderRewriteTextOptions): Promise<string> {
    return this.generateText({
      prompt: `Rewrite the following text:\n\n"""\n${options.text}\n"""\n\nInstructions: ${options.instruction}`,
      systemInstruction: 'You are an expert script editor.',
      model: options.model,
    });
  }

  public async summarizeText(options: ProviderSummarizeTextOptions): Promise<string> {
    return this.generateText({
      prompt: `Summarize the following text:\n\n"""\n${options.text}\n"""`,
      systemInstruction: 'You are a concise summarizer.',
      model: options.model,
    });
  }
}
