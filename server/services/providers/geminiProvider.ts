import { GoogleGenAI } from '@google/genai';
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

export class GeminiProviderError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 500, code = 'AI_ERROR') {
    super(message);
    this.name = 'GeminiProviderError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class GeminiProvider implements IAIProvider {
  public readonly id: AIProviderId = 'gemini';
  public readonly name = 'Google Gemini';
  public readonly type: AIProviderType = 'cloud';
  public readonly defaultModel = 'gemini-3.5-flash-lite';

  private client: GoogleGenAI | null = null;
  private customApiKey: string | null = null;
  private selectedModel = 'gemini-3.5-flash-lite';
  public readonly availableModels = [
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
    'gemini-3.6-flash',
    'gemini-flash-latest',
  ];

  public configure(config: Partial<AIProviderConfig>): void {
    if (config.apiKey) {
      this.customApiKey = config.apiKey.trim();
      this.client = null; // Re-initialize with new key
    }
    if (config.defaultModel) {
      this.selectedModel = config.defaultModel;
    }
  }

  public isConfigured(): boolean {
    const key = this.customApiKey || process.env.GEMINI_API_KEY;
    return Boolean(key && key.trim().length > 0 && key !== 'MY_GEMINI_API_KEY');
  }

  public getStatus(): AIProviderStatus {
    const configured = this.isConfigured();
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      configured,
      active: false,
      model: this.selectedModel || this.defaultModel,
      availableModels: this.availableModels,
      health: configured ? 'connected' : 'standby',
      message: configured
        ? 'Gemini Cloud API credentials loaded and active.'
        : 'GEMINI_API_KEY environment variable not configured.',
    };
  }

  public getClient(): GoogleGenAI {
    if (!this.isConfigured()) {
      throw new GeminiProviderError('AI provider not configured', 503, 'NOT_CONFIGURED');
    }

    if (!this.client) {
      const apiKey = (this.customApiKey || process.env.GEMINI_API_KEY)!.trim();
      this.client = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'mintmind-ai-studio',
          },
        },
      });
    }

    return this.client;
  }

  public async testConnection(): Promise<ProviderTestResult> {
    const startTime = Date.now();
    try {
      if (!this.isConfigured()) {
        return {
          ok: false,
          message: 'Gemini API key is not configured. Add GEMINI_API_KEY in environment or project settings.',
          error: 'MISSING_API_KEY',
        };
      }

      const client = this.getClient();
      const response = await client.models.generateContent({
        model: this.defaultModel,
        contents: 'Ping',
        config: {
          maxOutputTokens: 10,
        },
      });

      const latencyMs = Date.now() - startTime;
      return {
        ok: true,
        latencyMs,
        message: `Successfully connected to Google Gemini API (${latencyMs}ms)`,
        discoveredModels: this.availableModels,
      };
    } catch (err: any) {
      const sanitized = this.sanitizeError(err);
      return {
        ok: false,
        latencyMs: Date.now() - startTime,
        message: sanitized.message,
        error: sanitized.code,
      };
    }
  }

  public sanitizeError(err: any): GeminiProviderError {
    if (err instanceof GeminiProviderError) {
      return err;
    }

    if (!this.isConfigured()) {
      return new GeminiProviderError('AI provider not configured', 503, 'NOT_CONFIGURED');
    }

    const rawMsg = String(err?.message || err || '');
    const lower = rawMsg.toLowerCase();

    const safeMsg = rawMsg
      .replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]')
      .replace(/[a-zA-Z0-9_-]{20,}/g, (match) => {
        if (match.startsWith('AIza') || match.length >= 39) return '[REDACTED]';
        return match;
      });

    if (lower.includes('resource_exhausted') || lower.includes('quota') || lower.includes('429')) {
      return new GeminiProviderError(
        'Gemini API rate limit or quota exceeded. Please wait a moment before trying again.',
        429,
        'RATE_LIMIT'
      );
    }

    if (
      lower.includes('api_key_invalid') ||
      lower.includes('invalid api key') ||
      lower.includes('permission_denied') ||
      lower.includes('unauthenticated')
    ) {
      return new GeminiProviderError(
        'Invalid Gemini API key or credentials. Please check your configuration.',
        401,
        'INVALID_CREDENTIALS'
      );
    }

    if (
      lower.includes('overloaded') ||
      lower.includes('experiencing high demand') ||
      lower.includes('unavailable') ||
      lower.includes('503')
    ) {
      return new GeminiProviderError(
        'The Gemini model service is currently experiencing high demand. Please try again shortly.',
        503,
        'SERVICE_OVERLOADED'
      );
    }

    if (lower.includes('timeout') || lower.includes('deadline')) {
      return new GeminiProviderError(
        'Gemini API request timed out. The operation took longer than expected.',
        504,
        'TIMEOUT'
      );
    }

    return new GeminiProviderError(safeMsg || 'An error occurred while communicating with Gemini AI.', 500, 'AI_ERROR');
  }

  public parseStructuredJSON<T>(rawText: string): T {
    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      throw new GeminiProviderError(
        'AI response was empty. Valid structured output was not received.',
        502,
        'EMPTY_RESPONSE'
      );
    }

    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

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
        const candidate = cleaned.substring(startIndex, endIndex + 1);
        try {
          return JSON.parse(candidate) as T;
        } catch (innerErr: any) {
          throw new GeminiProviderError(
            `AI returned malformed JSON structure: ${innerErr?.message || 'Parse error'}`,
            502,
            'INVALID_JSON'
          );
        }
      }

      throw new GeminiProviderError(
        'AI response did not contain a valid JSON object or array.',
        502,
        'INVALID_JSON'
      );
    }
  }

  private async callWithRetry<T>(
    operation: (activeModel: string) => Promise<T>,
    preferredModel = this.selectedModel || this.defaultModel,
    retries = 1,
    delayMs = 1200
  ): Promise<T> {
    const candidateModels = Array.from(
      new Set([
        preferredModel,
        'gemini-3.5-flash-lite',
        'gemini-3.6-flash',
        'gemini-flash-latest',
        'gemini-3.8-flash',
      ])
    );
    let lastError: any = null;

    for (const activeModel of candidateModels) {
      let attempts = retries;
      while (attempts >= 0) {
        try {
          return await operation(activeModel);
        } catch (err: any) {
          lastError = err;
          const isHighDemand =
            err?.message?.includes('experiencing high demand') ||
            err?.message?.includes('503') ||
            err?.status === 503;

          if (isHighDemand && attempts > 0) {
            attempts--;
            await new Promise((r) => setTimeout(r, delayMs));
          } else {
            console.warn(`[GeminiProvider] Model "${activeModel}" failed, trying fallback...`, err?.message || err);
            break;
          }
        }
      }
    }

    throw lastError;
  }

  public async generateText(options: ProviderGenerateTextOptions): Promise<string> {
    if (!options.prompt || !options.prompt.trim()) {
      throw new GeminiProviderError('A non-empty prompt is required.', 400, 'BAD_REQUEST');
    }

    const ai = this.getClient();
    const model = options.model || this.selectedModel || this.defaultModel;

    try {
      const response = await this.callWithRetry(
        (activeModel) =>
          ai.models.generateContent({
            model: activeModel,
            contents: options.prompt,
            config: {
              systemInstruction: options.systemInstruction,
              temperature: typeof options.temperature === 'number' ? options.temperature : 0.7,
              maxOutputTokens: options.maxOutputTokens,
            },
          }),
        model
      );

      const text = response.text;
      if (!text) {
        throw new GeminiProviderError('AI model returned an empty text response.', 502, 'EMPTY_RESPONSE');
      }
      return text;
    } catch (err) {
      throw this.sanitizeError(err);
    }
  }

  public async generateStructuredJSON<T = any>(options: ProviderGenerateStructuredJSONOptions): Promise<T> {
    if (!options.prompt || !options.prompt.trim()) {
      throw new GeminiProviderError('A non-empty prompt is required for structured output.', 400, 'BAD_REQUEST');
    }

    const ai = this.getClient();
    const model = options.model || this.selectedModel || this.defaultModel;

    try {
      const response = await this.callWithRetry(
        (activeModel) =>
          ai.models.generateContent({
            model: activeModel,
            contents: options.prompt,
            config: {
              systemInstruction: options.systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: options.responseSchema,
              temperature: typeof options.temperature === 'number' ? options.temperature : 0.4,
            },
          }),
        model
      );

      const rawText = response.text || '';
      return this.parseStructuredJSON<T>(rawText);
    } catch (err) {
      throw this.sanitizeError(err);
    }
  }

  public async analyzeText(options: ProviderAnalyzeTextOptions): Promise<string> {
    if (!options.text || !options.instructions) {
      throw new GeminiProviderError('Both text and analysis instructions are required.', 400, 'BAD_REQUEST');
    }

    const prompt = `Analyze the following content:\n\n"""\n${options.text}\n"""\n\nSpecific Analysis Instructions:\n${options.instructions}`;
    return this.generateText({
      prompt,
      model: options.model || this.selectedModel || this.defaultModel,
      systemInstruction: 'You are an expert content strategist, audience psychologist, and analytical editor.',
      temperature: 0.3,
    });
  }

  public async rewriteText(options: ProviderRewriteTextOptions): Promise<string> {
    if (!options.text || !options.instruction) {
      throw new GeminiProviderError('Both original text and rewrite instructions are required.', 400, 'BAD_REQUEST');
    }

    const prompt = `Rewrite the following text:\n\n"""\n${options.text}\n"""\n\nRewrite Guidelines:\n- Instruction: ${options.instruction}\n${options.tone ? `- Target Tone: ${options.tone}\n` : ''}- Preserve core factual claims while maximizing clarity and viewer retention.\nReturn only the rewritten text.`;
    return this.generateText({
      prompt,
      model: options.model || this.selectedModel || this.defaultModel,
      systemInstruction: 'You are a world-class script editor and narrative polish engineer.',
      temperature: 0.7,
    });
  }

  public async summarizeText(options: ProviderSummarizeTextOptions): Promise<string> {
    if (!options.text || !options.text.trim()) {
      throw new GeminiProviderError('Text to summarize is required.', 400, 'BAD_REQUEST');
    }

    const lengthConstraint = options.maxLength ? `in approximately ${options.maxLength}` : 'concisely';
    const prompt = `Summarize the following text ${lengthConstraint}, capturing all primary narrative beats and key takeaways:\n\n"""\n${options.text}\n"""`;

    return this.generateText({
      prompt,
      model: options.model || this.selectedModel || this.defaultModel,
      systemInstruction: 'You are a concise executive summarizer and story structure extractor.',
      temperature: 0.2,
    });
  }
}
