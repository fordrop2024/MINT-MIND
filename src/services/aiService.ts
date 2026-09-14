import type {
  Idea,
  IdeaGenerationInputs,
  IdeaAnalysis,
  IdeaVariation,
} from '../types/idea';
import type {
  Script,
  ScriptSettings,
  AISectionAction,
  ScriptSEO,
  ThumbnailConcept,
  RepurposeVersions,
  ContentPackage,
} from '../types/script';

export interface AIStatus {
  configured: boolean;
  textModel: string;
  provider: string;
}

export async function checkAIStatus(): Promise<AIStatus> {
  try {
    const res = await fetch('/api/ai/status');
    if (!res.ok) throw new Error('Status request failed');
    return await res.json();
  } catch {
    return {
      configured: false,
      textModel: 'gemini-3.8-flash',
      provider: 'Google Gemini (standby)',
    };
  }
}

export async function generateIdeasAPI(inputs: IdeaGenerationInputs): Promise<Idea[]> {
  const res = await fetch('/api/ai/generate-ideas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inputs),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to generate ideas with Gemini.');
  }

  return (data.ideas || []).map((item: any, idx: number) => ({
    id: `idea_${Date.now()}_${idx}`,
    ownerId: '',
    projectId: inputs.projectId,
    title: item.title || 'Untitled Idea',
    hook: item.hook || '',
    concept: item.concept || '',
    angle: item.angle || '',
    targetAudience: item.targetAudience || inputs.targetAudience,
    contentType: item.contentType || inputs.contentType,
    recommendedPlatform: item.recommendedPlatform || inputs.platform,
    estimatedDuration: item.estimatedDuration || inputs.videoDuration,
    trendScore: typeof item.trendScore === 'number' ? item.trendScore : 82,
    audienceInterestScore: typeof item.audienceInterestScore === 'number' ? item.audienceInterestScore : 85,
    competitionScore: typeof item.competitionScore === 'number' ? item.competitionScore : 45,
    opportunityScore: typeof item.opportunityScore === 'number' ? item.opportunityScore : 84,
    reason: item.reason || '',
    keywords: Array.isArray(item.keywords) ? item.keywords : [],
    hashtags: Array.isArray(item.hashtags) ? item.hashtags : [],
    thumbnailConcept: item.thumbnailConcept || '',
    cta: item.cta || '',
    status: 'draft',
    metadata: {
      niche: inputs.niche,
      topic: inputs.topic,
      language: inputs.language,
      tone: inputs.tone,
      goal: inputs.goal,
      referenceContext: inputs.referenceContext,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

export async function analyzeIdeaAPI(idea: Idea): Promise<IdeaAnalysis> {
  const res = await fetch('/api/ai/analyze-idea', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idea }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to analyze idea.');
  }

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
  const res = await fetch('/api/ai/generate-variations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idea }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to generate variations.');
  }

  return data.variations || [];
}

export async function improveIdeaAPI(idea: Idea): Promise<Partial<Idea>> {
  const res = await fetch('/api/ai/improve-idea', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idea }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to improve idea.');
  }

  return data.improved || {};
}

export async function generateScriptAPI(settings: ScriptSettings): Promise<Partial<Script>> {
  const res = await fetch('/api/ai/generate-script', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to generate script.');
  }

  return data.script;
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
  const res = await fetch('/api/ai/rewrite-section', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to rewrite section.');
  }

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
  const res = await fetch('/api/ai/generate-seo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to generate SEO.');
  }

  return data.seo;
}

export async function generateThumbnailsAPI(params: {
  title: string;
  concept: string;
  platform: string;
}): Promise<ThumbnailConcept[]> {
  const res = await fetch('/api/ai/generate-thumbnails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to generate thumbnail concepts.');
  }

  return data.thumbnails || [];
}

export async function repurposeScriptAPI(params: {
  scriptText: string;
  title: string;
  topic: string;
}): Promise<RepurposeVersions> {
  const res = await fetch('/api/ai/repurpose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to repurpose script.');
  }

  return data.repurpose;
}

export async function generateContentPackageAPI(params: {
  idea?: any;
  topic?: string;
  platform?: string;
  language?: string;
  audience?: string;
}): Promise<ContentPackage> {
  const res = await fetch('/api/ai/generate-content-package', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to generate content package.');
  }

  return data.contentPackage;
}

export async function generateSceneImageAPI(params: {
  prompt: string;
  sceneNumber: number;
  style?: string;
}): Promise<{ imageUrl: string; provider: string; note?: string }> {
  const res = await fetch('/api/ai/generate-scene-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to generate scene image.');
  }

  return data;
}
