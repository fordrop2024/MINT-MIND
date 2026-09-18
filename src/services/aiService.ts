import type {
  Idea,
  IdeaGenerationInputs,
  IdeaAnalysis,
  IdeaVariation,
} from '../types/idea';
import type {
  Script,
  ScriptSettings,
  ScriptScene,
  EnhancedMediaPrompts,
  StoryMode,
  AISectionAction,
  ScriptSEO,
  ThumbnailConcept,
  RepurposeVersions,
  ContentPackage,
} from '../types/script';
import type {
  StoryModeDetectionInput,
  StoryModeDetection,
} from '../types/storyMode';
import type {
  AIProviderStatus,
  AIProviderId,
  ProviderTestResult,
} from '../types/aiProvider';
import { getStoryModeProfile, heuristicDetectStoryMode } from './storyModeEngine';

export interface AIStatus {
  configured: boolean;
  textModel: string;
  provider: string;
  providerId?: AIProviderId;
  type?: 'cloud' | 'local';
  health?: 'connected' | 'disconnected' | 'error' | 'standby';
  message?: string;
  availableModels?: string[];
}

/**
 * Robust JSON fetcher with retry logic, Content-Type validation,
 * and friendly error messaging to completely prevent SyntaxError on HTML responses.
 */
async function safeFetchJSON(url: string, options?: RequestInit, retries = 1): Promise<any> {
  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      const contentType = res.headers.get('content-type') || '';

      if (!contentType.includes('application/json')) {
        const text = await res.text();
        if (!res.ok) {
          throw new Error(`Server error (${res.status}): ${text.slice(0, 160) || res.statusText}`);
        }
        throw new Error(`Unexpected server response format (expected JSON, received ${contentType || 'non-JSON'}).`);
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || `Request failed with status ${res.status}`);
      }
      return data;
    } catch (err: any) {
      lastError = err;
      const isNetworkFetchError =
        (err.name === 'TypeError' && err.message?.includes('fetch')) ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('NetworkError');

      if (isNetworkFetchError && attempt < retries) {
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        continue;
      }
      break;
    }
  }

  const message = String(lastError?.message || '');
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    throw new Error('Could not connect to the AI server. Please check your network and try again.');
  }

  throw lastError;
}

export async function checkAIStatus(): Promise<AIStatus> {
  try {
    const res = await fetch('/api/ai/status');
    if (!res.ok) throw new Error('Status request failed');
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) throw new Error('Non-JSON response');
    return await res.json();
  } catch {
    return {
      configured: false,
      textModel: 'gemini-3.5-flash-lite',
      provider: 'Google Gemini (standby)',
    };
  }
}

export async function generateIdeasAPI(inputs: IdeaGenerationInputs): Promise<Idea[]> {
  const data = await safeFetchJSON('/api/ai/generate-ideas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inputs),
  });

  return (data.ideas || []).map((item: any, idx: number) => {
    const coreConcept = item.coreConcept || item.concept || '';
    const uniqueAngle = item.uniqueAngle || item.angle || '';
    const whyThisIdea = item.whyThisIdea || item.reason || '';
    const trend = typeof item.trendRelevance === 'number' ? item.trendRelevance : (typeof item.trendScore === 'number' ? item.trendScore : 82);
    const audience = typeof item.audienceInterest === 'number' ? item.audienceInterest : (typeof item.audienceInterestScore === 'number' ? item.audienceInterestScore : 85);
    const comp = typeof item.competition === 'number' ? item.competition : (typeof item.competitionScore === 'number' ? item.competitionScore : 45);
    const opp = typeof item.opportunityScore === 'number' ? item.opportunityScore : 84;

    return {
      id: `idea_${Date.now()}_${idx}`,
      ownerId: '',
      projectId: inputs.projectId,
      title: item.title || 'Untitled Idea',
      hook: item.hook || '',
      concept: coreConcept,
      coreConcept,
      angle: uniqueAngle,
      uniqueAngle,
      targetAudience: item.targetAudience || inputs.targetAudience,
      contentType: item.contentType || inputs.contentType,
      recommendedPlatform: item.recommendedPlatform || inputs.platform,
      estimatedDuration: item.estimatedDuration || inputs.videoDuration,
      trendScore: trend,
      trendRelevance: trend,
      audienceInterestScore: audience,
      audienceInterest: audience,
      competitionScore: comp,
      competition: comp,
      opportunityScore: opp,
      reason: whyThisIdea,
      whyThisIdea,
      keywords: Array.isArray(item.keywords) ? item.keywords : [],
      hashtags: Array.isArray(item.hashtags) ? item.hashtags : [],
      thumbnailConcept: item.thumbnailConcept || '',
      cta: item.cta || '',
      status: 'draft' as const,
      metadata: {
        niche: inputs.niche,
        topic: inputs.topic,
        language: inputs.language,
        tone: inputs.tone,
        goal: inputs.goal,
        currentTrendContext: inputs.currentTrendContext,
        competitorReference: inputs.competitorReference,
        keywords: inputs.keywords,
        userNotes: inputs.userNotes,
        referenceContext: inputs.referenceContext,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
}

export async function analyzeIdeaAPI(idea: Idea): Promise<IdeaAnalysis> {
  const data = await safeFetchJSON('/api/ai/analyze-idea', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idea }),
  });

  return {
    ideaId: idea.id,
    whyItWorks: data.analysis.whyItWorks || '',
    targetAudienceAnalysis: data.analysis.targetAudienceAnalysis || '',
    differentiation: data.analysis.differentiation || '',
    potentialWeaknesses: Array.isArray(data.analysis.potentialWeaknesses)
      ? data.analysis.potentialWeaknesses
      : [],
    betterAngle: data.analysis.betterAngle || '',
    betterHook: data.analysis.betterHook || '',
    recommendedDuration: data.analysis.recommendedDuration || '',
    recommendedPlatform: data.analysis.recommendedPlatform || '',
    suggestedTitles: Array.isArray(data.analysis.suggestedTitles)
      ? data.analysis.suggestedTitles
      : [],
    thumbnailDirection: data.analysis.thumbnailDirection || '',
    seoDirection: data.analysis.seoDirection || '',
  };
}

export async function generateVariationsAPI(idea: Idea): Promise<IdeaVariation[]> {
  const data = await safeFetchJSON('/api/ai/generate-variations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idea }),
  });

  return data.variations || [];
}

export async function improveIdeaAPI(idea: Idea): Promise<Partial<Idea>> {
  const data = await safeFetchJSON('/api/ai/improve-idea', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idea }),
  });

  return data.improved || {};
}

export async function detectStoryModeAPI(input: StoryModeDetectionInput): Promise<StoryModeDetection> {
  try {
    const data = await safeFetchJSON('/api/ai/detect-story-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (data?.detection && data.detection.primaryMode) {
      return data.detection;
    }
    return heuristicDetectStoryMode(input);
  } catch (err) {
    console.warn('Backend story mode detection fallback:', err);
    return heuristicDetectStoryMode(input);
  }
}

export async function generateScriptAPI(settings: ScriptSettings): Promise<Partial<Script>> {
  const modeProfile = getStoryModeProfile(settings.primaryMode);
  const data = await safeFetchJSON('/api/ai/generate-script', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...settings,
      modeProfile,
    }),
  });

  return data.script;
}

export async function generateSceneBreakdownAPI(params: {
  scriptTitle: string;
  scriptText?: string;
  sections?: { id: string; name: string; content: string; order: number }[];
  primaryMode: StoryMode;
  secondaryModes?: StoryMode[];
  platform?: string;
  duration?: string;
  audience?: string;
  tone?: string;
}): Promise<ScriptScene[]> {
  const modeProfile = getStoryModeProfile(params.primaryMode);
  const data = await safeFetchJSON('/api/ai/generate-scene-breakdown', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...params,
      modeProfile,
    }),
  });

  return data.scenes || [];
}

export async function regenerateSceneAPI(params: {
  scene: ScriptScene;
  scriptContext: {
    title?: string;
    topic?: string;
    primaryMode?: StoryMode;
    secondaryModes?: StoryMode[];
    platform?: string;
  };
  instruction?: string;
}): Promise<ScriptScene> {
  const data = await safeFetchJSON('/api/ai/regenerate-scene', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  return data.scene;
}

export async function enhanceMediaPromptsAPI(params: {
  scene: ScriptScene;
  storyMode?: StoryMode;
  aspectRatio?: '16:9' | '9:16';
  projectContext?: {
    title?: string;
    topic?: string;
    visualStyle?: string;
    subjectAnchor?: string;
  };
}): Promise<EnhancedMediaPrompts> {
  const data = await safeFetchJSON('/api/ai/enhance-media-prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  return data.enhancedPrompts;
}

export async function rewriteSectionAPI(params: {
  sectionName: string;
  currentContent: string;
  action: AISectionAction;
  targetLanguage?: string;
  overallContext?: {
    topic?: string;
    platform?: string;
    tone?: string;
  };
}): Promise<{ modifiedContent: string; explanation: string }> {
  const data = await safeFetchJSON('/api/ai/rewrite-section', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  return {
    modifiedContent: data.modifiedContent,
    explanation: data.explanation || '',
  };
}

export async function generateSEOAPI(params: {
  scriptText: string;
  topic: string;
  platform: string;
  audience: string;
}): Promise<ScriptSEO> {
  const data = await safeFetchJSON('/api/ai/generate-seo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  return data.seo;
}

export async function generateThumbnailsAPI(params: {
  title: string;
  concept: string;
  platform: string;
}): Promise<ThumbnailConcept[]> {
  const data = await safeFetchJSON('/api/ai/generate-thumbnails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  return data.thumbnails || [];
}

export async function repurposeScriptAPI(params: {
  scriptText: string;
  title: string;
  topic: string;
}): Promise<RepurposeVersions> {
  const data = await safeFetchJSON('/api/ai/repurpose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  return data.repurpose;
}

export async function generateContentPackageAPI(params: {
  idea?: any;
  topic?: string;
  platform?: string;
  language?: string;
  audience?: string;
}): Promise<ContentPackage> {
  const data = await safeFetchJSON('/api/ai/generate-content-package', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  return data.contentPackage;
}

export async function generateSceneImageAPI(params: {
  prompt: string;
  sceneNumber: number;
  style?: string;
}): Promise<{ imageUrl: string; provider: string; note?: string }> {
  const data = await safeFetchJSON('/api/ai/generate-scene-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  return {
    imageUrl: data.imageUrl,
    provider: data.provider || 'AI Generated',
    note: data.note,
  };
}

/**
 * Universal Unified AI Client Operations
 * Allows any future MintMind AI module (Idea Generator, Script Studio, Research,
 * Trend Analysis, Story Mode, SEO, Repurpose) to leverage the centralized backend service.
 */

export type AIOperation =
  | 'generateText'
  | 'generateStructuredJSON'
  | 'analyzeText'
  | 'rewriteText'
  | 'summarizeText';

export interface AIOperationPayload {
  operation: AIOperation;
  prompt?: string;
  text?: string;
  instruction?: string;
  instructions?: string;
  tone?: string;
  maxLength?: string | number;
  model?: string;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseSchema?: any;
  [key: string]: any;
}

export async function executeAIOperation<T = any>(payload: AIOperationPayload): Promise<T> {
  const data = await safeFetchJSON('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return (data.data ?? data.text ?? data.analysis ?? data.rewritten ?? data.summary ?? data) as T;
}

export async function generateTextAI(
  prompt: string,
  options?: { systemInstruction?: string; model?: string; temperature?: number; maxOutputTokens?: number }
): Promise<string> {
  const data = await safeFetchJSON('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation: 'generateText',
      prompt,
      ...options,
    }),
  });

  return data.text;
}

export async function generateStructuredJSONAI<T = any>(
  prompt: string,
  options?: { systemInstruction?: string; model?: string; temperature?: number; responseSchema?: any }
): Promise<T> {
  const data = await safeFetchJSON('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation: 'generateStructuredJSON',
      prompt,
      ...options,
    }),
  });

  return data.data as T;
}

export async function analyzeTextAI(
  text: string,
  instructions: string,
  model?: string
): Promise<string> {
  const data = await safeFetchJSON('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation: 'analyzeText',
      text,
      instructions,
      model,
    }),
  });

  return data.analysis;
}

export async function rewriteTextAI(
  text: string,
  instruction: string,
  tone?: string,
  model?: string
): Promise<string> {
  const data = await safeFetchJSON('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation: 'rewriteText',
      text,
      instruction,
      tone,
      model,
    }),
  });

  return data.rewritten;
}

export async function summarizeTextAI(
  text: string,
  maxLength?: string | number,
  model?: string
): Promise<string> {
  const data = await safeFetchJSON('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation: 'summarizeText',
      text,
      maxLength,
      model,
    }),
  });

  return data.summary;
}

/**
 * AI Provider Management APIs
 */
export async function getAIProvidersAPI(): Promise<{
  activeProviderId: AIProviderId;
  providers: AIProviderStatus[];
}> {
  const data = await safeFetchJSON('/api/ai/providers');
  return {
    activeProviderId: data.activeProviderId || 'gemini',
    providers: data.providers || [],
  };
}

export async function selectAIProviderAPI(
  providerId: AIProviderId,
  config?: { baseURL?: string; apiKey?: string; defaultModel?: string }
): Promise<AIProviderStatus> {
  const data = await safeFetchJSON('/api/ai/providers/select', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ providerId, config }),
  });
  return data.status;
}

export async function testAIProviderAPI(
  providerId?: AIProviderId,
  config?: { baseURL?: string; apiKey?: string; defaultModel?: string }
): Promise<ProviderTestResult> {
  const data = await safeFetchJSON('/api/ai/providers/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ providerId, config }),
  });
  return data.result;
}


