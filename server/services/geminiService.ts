import { GoogleGenAI } from '@google/genai';

/**
 * MintMind AI - Centralized Gemini AI Service Layer
 *
 * Implements server-side lazy initialization, robust structured JSON handling,
 * error sanitization, and reusable AI operations (text, structured JSON, analysis,
 * rewrite, summarize) using the official @google/genai SDK.
 */

export class GeminiServiceError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 500, code = 'AI_ERROR') {
    super(message);
    this.name = 'GeminiServiceError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export interface GenerateTextOptions {
  prompt: string;
  systemInstruction?: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface GenerateStructuredJSONOptions {
  prompt: string;
  systemInstruction?: string;
  model?: string;
  temperature?: number;
  responseSchema?: any;
}

export interface AnalyzeTextOptions {
  text: string;
  instructions: string;
  model?: string;
}

export interface RewriteTextOptions {
  text: string;
  instruction: string;
  tone?: string;
  model?: string;
}

export interface SummarizeTextOptions {
  text: string;
  maxLength?: string | number;
  model?: string;
}

export interface AIProviderStatus {
  configured: boolean;
  model: string;
  provider: string;
}

class GeminiService {
  private client: GoogleGenAI | null = null;
  public readonly defaultModel = 'gemini-3.5-flash-lite';

  /**
   * Checks whether the GEMINI_API_KEY is present and not a default placeholder.
   */
  public isConfigured(): boolean {
    const key = process.env.GEMINI_API_KEY;
    return Boolean(key && key.trim().length > 0 && key !== 'MY_GEMINI_API_KEY');
  }

  /**
   * Returns current provider status and primary model.
   */
  public getStatus(): AIProviderStatus {
    return {
      configured: this.isConfigured(),
      model: this.defaultModel,
      provider: 'Google Gemini',
    };
  }

  /**
   * Lazy initialization of the GoogleGenAI client singleton.
   * Throws explicit "AI provider not configured" if key is absent.
   */
  public getClient(): GoogleGenAI {
    if (!this.isConfigured()) {
      throw new GeminiServiceError('AI provider not configured', 503, 'NOT_CONFIGURED');
    }

    if (!this.client) {
      const apiKey = process.env.GEMINI_API_KEY!.trim();
      this.client = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }

    return this.client;
  }

  /**
   * Normalizes and sanitizes errors thrown during Gemini operations.
   * Prevents exposing API keys, secrets, or internal stack traces.
   */
  public sanitizeError(err: any): GeminiServiceError {
    if (err instanceof GeminiServiceError) {
      return err;
    }

    if (!this.isConfigured()) {
      return new GeminiServiceError('AI provider not configured', 503, 'NOT_CONFIGURED');
    }

    const rawMsg = String(err?.message || err || '');
    const lower = rawMsg.toLowerCase();

    // Redact any accidental credential leak in strings
    const safeMsg = rawMsg
      .replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]')
      .replace(/[a-zA-Z0-9_-]{20,}/g, (match) => {
        // Only redact if matches typical secret patterns
        if (match.startsWith('AIza') || match.length >= 39) return '[REDACTED]';
        return match;
      });

    if (lower.includes('resource_exhausted') || lower.includes('quota') || lower.includes('429')) {
      return new GeminiServiceError(
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
      return new GeminiServiceError(
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
      return new GeminiServiceError(
        'The Gemini model service is currently experiencing high demand. Please try again shortly.',
        503,
        'SERVICE_OVERLOADED'
      );
    }

    if (lower.includes('timeout') || lower.includes('deadline')) {
      return new GeminiServiceError(
        'Gemini API request timed out. The operation took longer than expected.',
        504,
        'TIMEOUT'
      );
    }

    return new GeminiServiceError(safeMsg || 'An error occurred while communicating with Gemini AI.', 500, 'AI_ERROR');
  }

  /**
   * Robust, non-fake JSON parser and validator for Gemini outputs.
   * Throws an explicit error if the output is malformed instead of returning fake data.
   */
  public parseStructuredJSON<T>(rawText: string): T {
    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      throw new GeminiServiceError(
        'AI response was empty. Valid structured output was not received.',
        502,
        'EMPTY_RESPONSE'
      );
    }

    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    // 1. Attempt direct parse
    try {
      return JSON.parse(cleaned) as T;
    } catch {
      // 2. Locate boundaries
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
          throw new GeminiServiceError(
            `AI returned malformed JSON structure: ${innerErr?.message || 'Parse error'}`,
            502,
            'INVALID_JSON'
          );
        }
      }

      throw new GeminiServiceError(
        'AI response did not contain a valid JSON object or array.',
        502,
        'INVALID_JSON'
      );
    }
  }

  /**
   * Executes a model call with transient demand retry and model fallback.
   */
  private async callWithRetry<T>(
    operation: (activeModel: string) => Promise<T>,
    preferredModel = this.defaultModel,
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
            console.warn(`[GeminiService] Model "${activeModel}" failed, trying next fallback model if available...`, err?.message || err);
            break;
          }
        }
      }
    }

    throw lastError;
  }

  /**
   * 1. generateText
   * Generates free-form textual output with optional system instruction and parameters.
   */
  public async generateText(options: GenerateTextOptions): Promise<string> {
    if (!options.prompt || !options.prompt.trim()) {
      throw new GeminiServiceError('A non-empty prompt is required.', 400, 'BAD_REQUEST');
    }

    const ai = this.getClient();
    const model = options.model || this.defaultModel;

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
        throw new GeminiServiceError('AI model returned an empty text response.', 502, 'EMPTY_RESPONSE');
      }
      return text;
    } catch (err) {
      throw this.sanitizeError(err);
    }
  }

  /**
   * 2. generateStructuredJSON
   * Generates strictly formatted JSON with server-side validation. Never returns fake data.
   */
  public async generateStructuredJSON<T = any>(options: GenerateStructuredJSONOptions): Promise<T> {
    if (!options.prompt || !options.prompt.trim()) {
      throw new GeminiServiceError('A non-empty prompt is required for structured output.', 400, 'BAD_REQUEST');
    }

    const ai = this.getClient();
    const model = options.model || this.defaultModel;

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

  /**
   * 3. analyzeText
   * Analyzes an input text based on specific analytical instructions.
   */
  public async analyzeText(options: AnalyzeTextOptions): Promise<string> {
    if (!options.text || !options.instructions) {
      throw new GeminiServiceError('Both text and analysis instructions are required.', 400, 'BAD_REQUEST');
    }

    const prompt = `Analyze the following content:\n\n"""\n${options.text}\n"""\n\nSpecific Analysis Instructions:\n${options.instructions}`;
    return this.generateText({
      prompt,
      model: options.model || this.defaultModel,
      systemInstruction: 'You are an expert content strategist, audience psychologist, and analytical editor.',
      temperature: 0.3,
    });
  }

  /**
   * 4. rewriteText
   * Rewrites an input text following specified guidance and tone.
   */
  public async rewriteText(options: RewriteTextOptions): Promise<string> {
    if (!options.text || !options.instruction) {
      throw new GeminiServiceError('Both original text and rewrite instructions are required.', 400, 'BAD_REQUEST');
    }

    const prompt = `Rewrite the following text:\n\n"""\n${options.text}\n"""\n\nRewrite Guidelines:\n- Instruction: ${options.instruction}\n${options.tone ? `- Target Tone: ${options.tone}\n` : ''}- Preserve core factual claims while maximizing clarity and viewer retention.\nReturn only the rewritten text.`;
    return this.generateText({
      prompt,
      model: options.model || this.defaultModel,
      systemInstruction: 'You are a world-class script editor and narrative polish engineer.',
      temperature: 0.7,
    });
  }

  /**
   * 5. summarizeText
   * Summarizes input text concisely.
   */
  public async summarizeText(options: SummarizeTextOptions): Promise<string> {
    if (!options.text || !options.text.trim()) {
      throw new GeminiServiceError('Text to summarize is required.', 400, 'BAD_REQUEST');
    }

    const lengthConstraint = options.maxLength ? `in approximately ${options.maxLength}` : 'concisely';
    const prompt = `Summarize the following text ${lengthConstraint}, capturing all primary narrative beats and key takeaways:\n\n"""\n${options.text}\n"""`;

    return this.generateText({
      prompt,
      model: options.model || this.defaultModel,
      systemInstruction: 'You are a concise executive summarizer and story structure extractor.',
      temperature: 0.2,
    });
  }
}

export const geminiService = new GeminiService();
