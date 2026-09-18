import { Router, Request, Response } from 'express';
import { geminiService, GeminiServiceError } from './services/geminiService.js';
import { aiProviderRegistry } from './services/aiProviderRegistry.js';

export const aiRouter = Router();

/**
 * AI Provider Status & Capabilities
 * GET /api/ai/status
 */
aiRouter.get('/status', (_req: Request, res: Response) => {
  const active = aiProviderRegistry.getActiveProvider();
  const status = active.getStatus();
  res.json({
    configured: status.configured,
    textModel: status.model,
    provider: status.name,
    providerId: status.id,
    type: status.type,
    health: status.health,
    message: status.message,
    availableModels: status.availableModels,
  });
});

/**
 * List All Available AI Providers
 * GET /api/ai/providers
 */
aiRouter.get('/providers', (_req: Request, res: Response) => {
  const providers = aiProviderRegistry.getAllProvidersStatus();
  const activeProviderId = aiProviderRegistry.getActiveProviderId();
  res.json({
    success: true,
    activeProviderId,
    providers,
  });
});

/**
 * Select Active AI Provider
 * POST /api/ai/providers/select
 */
aiRouter.post('/providers/select', (req: Request, res: Response) => {
  try {
    const { providerId, config } = req.body;
    if (!providerId) {
      return res.status(400).json({ success: false, error: 'providerId is required' });
    }
    const status = aiProviderRegistry.selectProvider(providerId, config);
    res.json({ success: true, status });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err?.message || 'Failed to select provider' });
  }
});

/**
 * Test Connection to an AI Provider
 * POST /api/ai/providers/test
 */
aiRouter.post('/providers/test', async (req: Request, res: Response) => {
  try {
    const { providerId, config } = req.body;
    const targetId = providerId || aiProviderRegistry.getActiveProviderId();
    const result = await aiProviderRegistry.testProvider(targetId, config);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Provider test failed' });
  }
});

/**
 * Universal Unified AI Execution Endpoint
 * POST /api/ai
 *
 * Supports reusable operations for future modules:
 * - generateText
 * - generateStructuredJSON
 * - analyzeText
 * - rewriteText
 * - summarizeText
 */
aiRouter.post('/', async (req: Request, res: Response) => {
  const ai = aiProviderRegistry.getActiveProvider();
  try {
    const {
      operation,
      prompt,
      text,
      instruction,
      instructions,
      tone,
      maxLength,
      model,
      systemInstruction,
      temperature,
      maxOutputTokens,
      responseSchema,
    } = req.body;

    if (!operation) {
      return res.status(400).json({
        success: false,
        error: 'Missing required "operation" in request body.',
        code: 'BAD_REQUEST',
      });
    }

    switch (operation) {
      case 'generateText': {
        const generated = await ai.generateText({
          prompt: prompt || text,
          systemInstruction,
          model,
          temperature,
          maxOutputTokens,
        });
        return res.json({ success: true, text: generated });
      }

      case 'generateStructuredJSON': {
        const data = await ai.generateStructuredJSON({
          prompt: prompt || text,
          systemInstruction,
          model,
          temperature,
          responseSchema,
        });
        return res.json({ success: true, data });
      }

      case 'analyzeText': {
        const analysis = await ai.analyzeText({
          text: text || prompt,
          instructions: instructions || instruction || 'Analyze this content in depth.',
          model,
        });
        return res.json({ success: true, analysis });
      }

      case 'rewriteText': {
        const rewritten = await ai.rewriteText({
          text: text || prompt,
          instruction: instruction || instructions || 'Polish and improve this text.',
          tone,
          model,
        });
        return res.json({ success: true, rewritten });
      }

      case 'summarizeText': {
        const summary = await ai.summarizeText({
          text: text || prompt,
          maxLength,
          model,
        });
        return res.json({ success: true, summary });
      }

      case 'generateIdeas': {
        const ideas = await executeGenerateIdeas(req.body);
        return res.json({ success: true, ideas });
      }

      default:
        return res.status(400).json({
          success: false,
          error: `Unsupported AI operation: "${operation}". Supported operations: generateIdeas, generateText, generateStructuredJSON, analyzeText, rewriteText, summarizeText.`,
          code: 'UNSUPPORTED_OPERATION',
        });
    }
  } catch (err: any) {
    const errorObj = ai.sanitizeError(err);
    return res.status(errorObj.statusCode || 500).json({
      success: false,
      error: errorObj.message,
      code: errorObj.code,
    });
  }
});

/**
 * Validates and normalizes raw idea objects from Gemini structured output.
 * Throws explicit GeminiServiceError if any required field is missing or malformed.
 */
function validateAndNormalizeIdeas(raw: any, fallbackParams: any): any[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new GeminiServiceError(
      'AI response did not return a valid list of content ideas.',
      502,
      'INVALID_RESPONSE_STRUCTURE'
    );
  }

  return raw.map((item, idx) => {
    if (typeof item !== 'object' || item === null) {
      throw new GeminiServiceError(
        `Idea #${idx + 1} is malformed. Expected an object.`,
        502,
        'MALFORMED_IDEA'
      );
    }

    const title = typeof item.title === 'string' ? item.title.trim() : '';
    const hook = typeof item.hook === 'string' ? item.hook.trim() : '';
    const coreConcept = typeof (item.coreConcept || item.concept) === 'string'
      ? (item.coreConcept || item.concept).trim()
      : '';
    const uniqueAngle = typeof (item.uniqueAngle || item.angle) === 'string'
      ? (item.uniqueAngle || item.angle).trim()
      : '';

    if (!title) {
      throw new GeminiServiceError(
        `Idea #${idx + 1} is missing a valid title.`,
        502,
        'MALFORMED_IDEA'
      );
    }
    if (!hook) {
      throw new GeminiServiceError(
        `Idea #${idx + 1} is missing a valid opening hook.`,
        502,
        'MALFORMED_IDEA'
      );
    }
    if (!coreConcept) {
      throw new GeminiServiceError(
        `Idea #${idx + 1} is missing a core concept breakdown.`,
        502,
        'MALFORMED_IDEA'
      );
    }

    const clampScore = (val: any, defaultVal: number) => {
      const num = Number(val);
      if (isNaN(num) || num <= 0) return defaultVal;
      return Math.min(100, Math.max(1, Math.round(num)));
    };

    const trendRelevance = clampScore(item.trendRelevance ?? item.trendScore, 85);
    const audienceInterest = clampScore(item.audienceInterest ?? item.audienceInterestScore, 88);
    const competition = clampScore(item.competition ?? item.competitionScore, 45);
    const opportunityScore = clampScore(item.opportunityScore, 86);

    const whyThisIdea = typeof (item.whyThisIdea || item.reason) === 'string'
      ? (item.whyThisIdea || item.reason).trim()
      : 'Targeted to current viewer psychographics and algorithmic search velocity.';

    const keywords = Array.isArray(item.keywords)
      ? item.keywords.map(String).filter((k: string) => k.trim().length > 0)
      : [];

    const hashtags = Array.isArray(item.hashtags)
      ? item.hashtags.map((h: string) => {
          const str = String(h).trim();
          return str.startsWith('#') ? str : `#${str}`;
        }).filter((h: string) => h.length > 1)
      : [];

    const thumbnailConcept = typeof item.thumbnailConcept === 'string'
      ? item.thumbnailConcept.trim()
      : '';

    const cta = typeof item.cta === 'string'
      ? item.cta.trim()
      : 'Subscribe and share your perspective in the comments.';

    return {
      title,
      coreConcept,
      concept: coreConcept, // preserve dual compatibility
      uniqueAngle: uniqueAngle || 'Distinct creator angle with clear practical differentiation.',
      angle: uniqueAngle || 'Distinct creator angle with clear practical differentiation.',
      hook,
      targetAudience: typeof item.targetAudience === 'string' && item.targetAudience.trim()
        ? item.targetAudience.trim()
        : fallbackParams.targetAudience || 'Target audience',
      recommendedPlatform: typeof item.recommendedPlatform === 'string' && item.recommendedPlatform.trim()
        ? item.recommendedPlatform.trim()
        : fallbackParams.platform || 'YouTube Long-form',
      contentType: typeof item.contentType === 'string' && item.contentType.trim()
        ? item.contentType.trim()
        : fallbackParams.contentType || 'Educational',
      estimatedDuration: typeof item.estimatedDuration === 'string' && item.estimatedDuration.trim()
        ? item.estimatedDuration.trim()
        : fallbackParams.videoDuration || '8-12 minutes',
      whyThisIdea,
      reason: whyThisIdea, // preserve dual compatibility
      trendRelevance,
      trendScore: trendRelevance,
      audienceInterest,
      audienceInterestScore: audienceInterest,
      competition,
      competitionScore: competition,
      opportunityScore,
      keywords,
      hashtags,
      thumbnailConcept,
      cta,
      primaryMode: item.primaryMode || fallbackParams.primaryMode || 'Documentary',
      secondaryModes: Array.isArray(item.secondaryModes) && item.secondaryModes.length > 0
        ? item.secondaryModes
        : fallbackParams.secondaryModes || [],
      modeDetectionConfidence: fallbackParams.modeDetectionConfidence || 85,
      modeReasoning: fallbackParams.modeReasoning || '',
    };
  });
}

/**
 * Core Idea Generation Logic with Gemini structured output
 */
async function executeGenerateIdeas(params: any): Promise<any[]> {
  const {
    niche = 'General Tech & Productivity',
    topic = '',
    targetAudience = 'Creators and tech enthusiasts',
    platform = 'YouTube Long-form',
    contentType = 'Educational',
    language = 'English',
    tone = 'Energetic',
    videoDuration = '8-12 minutes',
    goal = 'High Views / Reach',
    referenceContext = '',
    currentTrendContext = '',
    competitorReference = '',
    keywords = [],
    userNotes = '',
    count = 4,
    primaryMode,
    secondaryModes = [],
  } = params;

  const prompt = `You are MintMind AI, the premier AI Content Operating System ideation engine for elite creators.
Generate ${count} distinct, high-performing, original, and deeply researched content ideas based on the following creator inputs:

- Niche / Domain: ${niche}
- Topic / Seed Keyword: ${topic ? `"${topic}"` : 'High-demand, trending opportunity in this niche'}
- Target Audience: ${targetAudience}
- Platform: ${platform}
- Content Type: ${contentType}
- Language: ${language}
- Tone / Persona: ${tone}
- Video Duration / Runtime: ${videoDuration}
- Core Goal: ${goal}
${primaryMode ? `- Adaptive Story Mode: ${primaryMode} ${secondaryModes && secondaryModes.length ? `(Secondary influences: ${secondaryModes.join(', ')})` : ''}` : ''}
${currentTrendContext ? `- Current Trend / Market Context: ${currentTrendContext}` : ''}
${competitorReference ? `- Competitor / Reference Inspiration: ${competitorReference}` : ''}
${keywords && keywords.length ? `- Targeted Keywords: ${Array.isArray(keywords) ? keywords.join(', ') : keywords}` : ''}
${userNotes ? `- User Directives & Constraints: ${userNotes}` : ''}
${referenceContext ? `- Reference Context: ${referenceContext}` : ''}

CRITICAL CREATIVE & STRATEGIC DIRECTIVES:
1. Topic Alignment: Every single idea must strictly center on the specified topic and niche.
2. Distinct Angles: Do not produce repetitive variations of the same premise. Provide completely distinct conceptual angles (e.g. counter-intuitive breakdown, actionable playbook, high-stakes case study, behind-the-scenes teardown).
3. Practical Hooks: Provide word-for-word spoken opening hooks (first 3-5 seconds) designed to eliminate scroll inertia and build immediate curiosity gaps without cheap clickbait.
4. Target Language & Tone: Adapt vocabulary and phrasing naturally to ${language} and ${tone}.
5. Realistic Algorithmic Estimations: Provide realistic algorithmic index scores (integers 1-100) representing MintMind AI strategic estimates only. Never claim guaranteed virality or 100% certainty.

You MUST return a strictly valid JSON array of ${count} idea objects. Do NOT include markdown code blocks or conversational text outside JSON.
Each idea object must have exactly these keys:
[
  {
    "title": "Compelling, clickable, high-CTR non-clickbait title",
    "coreConcept": "Clear, detailed breakdown of what the video covers, the key insights, and the transformation it delivers",
    "uniqueAngle": "What makes this specific perspective or approach different and superior to existing content",
    "hook": "Exact word-for-word first 3-5 seconds opening verbal hook that captures immediate attention",
    "targetAudience": "${targetAudience}",
    "recommendedPlatform": "${platform}",
    "contentType": "${contentType}",
    "estimatedDuration": "${videoDuration}",
    "whyThisIdea": "Behavioral psychology rationale for why viewers will click, stay engaged, and value this video",
    "trendRelevance": 86,
    "audienceInterest": 91,
    "competition": 42,
    "opportunityScore": 89,
    "keywords": ["keyword1", "keyword2", "keyword3", "keyword4"],
    "hashtags": ["#tag1", "#tag2", "#tag3"],
    "thumbnailConcept": "Visual art direction: subject composition, emotional facial expression, background lighting, and max 3-4 word high-contrast text overlay",
    "cta": "Punchy, audience-aligned call-to-action tailored to the goal: ${goal}"
  }
]`;

  const rawIdeas = await aiProviderRegistry.getActiveProvider().generateStructuredJSON<any[]>({
    prompt,
  });

  return validateAndNormalizeIdeas(rawIdeas, {
    targetAudience,
    platform,
    contentType,
    videoDuration,
  });
}

// 1. Generate Ideas
aiRouter.post('/generate-ideas', async (req: Request, res: Response) => {
  try {
    const ideas = await executeGenerateIdeas(req.body);
    res.json({ success: true, ideas });
  } catch (err: any) {
    const errorObj = geminiService.sanitizeError(err);
    res.status(errorObj.statusCode).json({
      success: false,
      error: errorObj.message,
      code: errorObj.code,
    });
  }
});

// 2. Analyze Idea
aiRouter.post('/analyze-idea', async (req: Request, res: Response) => {
  try {
    const { idea } = req.body;
    if (!idea) {
      return res.status(400).json({ success: false, error: 'Idea object is required', code: 'BAD_REQUEST' });
    }

    const prompt = `You are MintMind AI's Executive Content Strategist.
Perform an in-depth audit of the following content idea:

Title: ${idea.title}
Concept: ${idea.concept}
Hook: ${idea.hook}
Target Audience: ${idea.targetAudience || 'General audience'}
Platform: ${idea.recommendedPlatform || 'YouTube'}
Duration: ${idea.estimatedDuration || 'Standard'}

Return a strictly valid JSON object with the following analysis:
{
  "whyItWorks": "Detailed behavioral psychology breakdown of why viewers will click and watch",
  "targetViewer": "Exact demographic and psychographic profile of who this resonates with",
  "targetAudienceAnalysis": "In-depth breakdown of viewer intentions, friction points, and motivations",
  "strongestAngle": "The single most potent and magnetic hook angle of this concept",
  "differentiation": "What makes this specific concept stand out against a sea of generic videos",
  "potentialWeaknesses": [
    "Weakness 1 and how to avoid it",
    "Weakness 2 and how to mitigate it"
  ],
  "betterAngle": "A sharper, more punchy alternative angle that could boost retention by 20%",
  "betterHook": "An even higher-retention alternative opening 3-second hook",
  "recommendedDuration": "Optimal duration for maximum algorithmic promotion and viewer retention",
  "recommendedPlatform": "Best suited platform and why",
  "suggestedTitles": [
    "Alternative High CTR Title 1",
    "Alternative High CTR Title 2",
    "Alternative High CTR Title 3"
  ],
  "thumbnailDirection": "Art direction: camera angle, color contrast, and 3-word text overlay recommendation",
  "seoDirection": "Search intent alignment and recommended ranking strategy",
  "contentGapOpportunity": "Clear opportunity gap in current competitor uploads this idea fills"
}`;

    const analysis = await aiProviderRegistry.getActiveProvider().generateStructuredJSON<any>({
      prompt,
    });

    res.json({ success: true, analysis });
  } catch (err: any) {
    const errorObj = geminiService.sanitizeError(err);
    res.status(errorObj.statusCode).json({
      success: false,
      error: errorObj.message,
      code: errorObj.code,
    });
  }
});

// 3. Generate 5 Variations (Angles)
aiRouter.post('/generate-variations', async (req: Request, res: Response) => {
  try {
    const { idea } = req.body;
    if (!idea) {
      return res.status(400).json({ success: false, error: 'Idea is required', code: 'BAD_REQUEST' });
    }

    const prompt = `You are MintMind AI Idea Multiplier.
Take this base idea:
Title: ${idea.title}
Concept: ${idea.concept}
Hook: ${idea.hook}
Target Audience: ${idea.targetAudience}

Generate 5 DISTINCT content angle variations for this same core topic:
1. Curiosity (High intrigue, mysterious reveal, cognitive gap)
2. Problem/Solution (Pain-point first, immediate relief, actionable steps)
3. Story (Personal journey, case study, narrative arc, high emotion)
4. Contrarian (Challenging popular consensus, controversial truth, myth busting)
5. Educational (Structured masterclass, framework, step-by-step clarity)

Return a strictly valid JSON array of 5 objects:
[
  {
    "angleType": "Curiosity",
    "title": "Curiosity-driven title",
    "hook": "Curiosity opening hook",
    "concept": "Concept summary with this angle",
    "rationale": "Why this curiosity angle works"
  },
  {
    "angleType": "Problem/Solution",
    "title": "Problem-solution title",
    "hook": "Problem-solution hook",
    "concept": "Concept summary",
    "rationale": "Why this problem-solution angle works"
  },
  {
    "angleType": "Story",
    "title": "Story-driven title",
    "hook": "Story hook",
    "concept": "Concept summary",
    "rationale": "Why narrative resonance works here"
  },
  {
    "angleType": "Contrarian",
    "title": "Contrarian title",
    "hook": "Contrarian hook",
    "concept": "Concept summary",
    "rationale": "Why challenging common beliefs works here"
  },
  {
    "angleType": "Educational",
    "title": "Educational title",
    "hook": "Educational hook",
    "concept": "Concept summary",
    "rationale": "Why structured learning works here"
  }
]`;

    const variations = await aiProviderRegistry.getActiveProvider().generateStructuredJSON<any[]>({
      prompt,
    });

    res.json({ success: true, variations });
  } catch (err: any) {
    const errorObj = geminiService.sanitizeError(err);
    res.status(errorObj.statusCode).json({
      success: false,
      error: errorObj.message,
      code: errorObj.code,
    });
  }
});

// 4. Improve Idea
aiRouter.post('/improve-idea', async (req: Request, res: Response) => {
  try {
    const { idea } = req.body;
    if (!idea) {
      return res.status(400).json({ success: false, error: 'Idea is required', code: 'BAD_REQUEST' });
    }

    const prompt = `Improve and sharpen this content idea to maximize viewer retention, click-through-rate, and algorithmic reach:
Title: ${idea.title}
Concept: ${idea.concept}
Hook: ${idea.hook}
Platform: ${idea.recommendedPlatform}

Return a strictly valid JSON object:
{
  "title": "Sharper, more enticing title",
  "hook": "Punchier first 3-second hook that eliminates fluff",
  "concept": "More cohesive, high-retention concept execution",
  "angle": "Refined unique differentiator",
  "reason": "Why these specific changes will increase viewer watch-time"
}`;

    const improved = await aiProviderRegistry.getActiveProvider().generateStructuredJSON<any>({
      prompt,
    });

    res.json({ success: true, improved });
  } catch (err: any) {
    const errorObj = geminiService.sanitizeError(err);
    res.status(errorObj.statusCode).json({
      success: false,
      error: errorObj.message,
      code: errorObj.code,
    });
  }
});

// 4.5 Detect Story Mode
const VALID_STORY_MODES = [
  'Documentary',
  'Action',
  'Crime',
  'Thriller',
  'Horror',
  'Sci-Fi',
  'Space',
  'Mystery',
  'Investigation',
  'Psychological',
  'Adventure',
  'Survival',
  'Fantasy',
  'Romance',
  'Comedy',
  'Drama',
  'Historical',
  'Biography',
  'News',
  'Explainer',
  'Educational',
  'Travel',
  'Gaming',
  'Technology',
  'Sports',
  'War History',
  'Post-Apocalyptic',
  'Superhero',
  'Cinematic Story',
  'Drama Thriller',
  'Custom',
];

aiRouter.post('/detect-story-mode', async (req: Request, res: Response) => {
  try {
    const {
      topic = '',
      idea = '',
      title = '',
      script = '',
      content = '',
      audience = '',
      platform = '',
    } = req.body;

    const prompt = `You are MintMind AI's Adaptive Story Mode Engine classification expert.
Analyze the following creative inputs and classify the optimal primary Story Mode and 1-2 complementary secondary modes.

ONLY SELECT FROM THESE 31 SUPPORTED MODES:
${VALID_STORY_MODES.join(', ')}

INPUT METADATA:
- Topic / Premise: ${topic || title}
${idea ? `- Idea Concept: ${idea}` : ''}
${title ? `- Title: ${title}` : ''}
${content || script ? `- Content / Dialogue excerpt: ${(content || script).slice(0, 500)}` : ''}
${audience ? `- Audience: ${audience}` : ''}
${platform ? `- Target Platform: ${platform}` : ''}

CRITICAL RULES:
1. Return a strictly valid JSON object matching the schema below.
2. primaryMode MUST be an exact string from the supported 31 modes.
3. secondaryModes MUST be an array of 1 or 2 distinct supported modes different from primaryMode.
4. confidence MUST be an internal estimated integer between 55 and 95 (treat as an internal estimate, never claim certainty).
5. reasoning MUST be a concise 1-2 sentence explanation of why this mode fits the emotional pacing, hook structure, and narrative style.

JSON SCHEMA:
{
  "primaryMode": "Documentary",
  "secondaryModes": ["Investigation", "Explainer"],
  "confidence": 85,
  "reasoning": "Reasoning string here."
}`;

    const raw = await aiProviderRegistry.getActiveProvider().generateStructuredJSON<any>({
      prompt,
    });

    const primaryMode = raw?.primaryMode && VALID_STORY_MODES.includes(raw.primaryMode)
      ? raw.primaryMode
      : 'Documentary';

    const secondaryModes: string[] = Array.isArray(raw?.secondaryModes)
      ? raw.secondaryModes.filter((m: string) => VALID_STORY_MODES.includes(m) && m !== primaryMode).slice(0, 2)
      : [];

    const confidence = typeof raw?.confidence === 'number'
      ? Math.max(50, Math.min(96, Math.round(raw.confidence)))
      : 82;

    const reasoning = typeof raw?.reasoning === 'string' && raw.reasoning.trim()
      ? raw.reasoning.trim()
      : `Classified as ${primaryMode} based on narrative tension, subject matter, and format requirements.`;

    res.json({
      success: true,
      detection: {
        primaryMode,
        secondaryModes,
        confidence,
        reasoning,
      },
    });
  } catch (err: any) {
    console.warn('AI detect-story-mode fallback triggered:', err?.message || err);
    // Intelligent heuristic fallback
    const { topic = '', idea = '', title = '', content = '' } = req.body || {};
    const text = `${topic} ${idea} ${title} ${content}`.toLowerCase();
    let detectedMode = 'Documentary';
    let secondary = ['Explainer', 'Investigation'];

    if (text.includes('crime') || text.includes('murder') || text.includes('police') || text.includes('heist') || text.includes('case')) {
      detectedMode = 'Crime';
      secondary = ['Investigation', 'Mystery'];
    } else if (text.includes('horror') || text.includes('creepy') || text.includes('ghost') || text.includes('terrifying') || text.includes('scary')) {
      detectedMode = 'Horror';
      secondary = ['Thriller', 'Psychological'];
    } else if (text.includes('sci-fi') || text.includes('ai') || text.includes('robot') || text.includes('future') || text.includes('quantum')) {
      detectedMode = 'Sci-Fi';
      secondary = ['Technology', 'Space'];
    } else if (text.includes('space') || text.includes('nasa') || text.includes('planet') || text.includes('galaxy') || text.includes('astronomy')) {
      detectedMode = 'Space';
      secondary = ['Sci-Fi', 'Documentary'];
    } else if (text.includes('war') || text.includes('battle') || text.includes('wwii') || text.includes('soldier') || text.includes('army')) {
      detectedMode = 'War History';
      secondary = ['Historical', 'Documentary'];
    } else if (text.includes('history') || text.includes('ancient') || text.includes('empire') || text.includes('medieval')) {
      detectedMode = 'Historical';
      secondary = ['Documentary', 'Biography'];
    } else if (text.includes('travel') || text.includes('flight') || text.includes('island') || text.includes('destination')) {
      detectedMode = 'Travel';
      secondary = ['Adventure', 'Explainer'];
    } else if (text.includes('game') || text.includes('gaming') || text.includes('minecraft') || text.includes('boss') || text.includes('esports')) {
      detectedMode = 'Gaming';
      secondary = ['Action', 'Comedy'];
    } else if (text.includes('tech') || text.includes('iphone') || text.includes('hardware') || text.includes('review') || text.includes('gadget')) {
      detectedMode = 'Technology';
      secondary = ['Explainer', 'Educational'];
    } else if (text.includes('sport') || text.includes('football') || text.includes('nba') || text.includes('athlete') || text.includes('championship')) {
      detectedMode = 'Sports';
      secondary = ['Action', 'Biography'];
    }

    res.json({
      success: true,
      detection: {
        primaryMode: detectedMode,
        secondaryModes: secondary,
        confidence: 75,
        reasoning: `Identified as ${detectedMode} via thematic keyword and platform heuristic alignment.`,
      },
    });
  }
});

// 5. Generate Full Script + Scenes
aiRouter.post('/generate-script', async (req: Request, res: Response) => {
  try {
    const {
      topic = 'Untitled Topic',
      ideaText = '',
      audience = 'General Creators',
      language = 'English',
      tone = 'Energetic',
      duration = '8-10 minutes',
      platform = 'YouTube Long-form',
      narrationStyle = 'Engaging narrator directly addressing the audience',
      ctaStyle = 'Subscribe and share perspective in comments',
      referenceMaterial = '',
      keyPoints = [],
      brandVoice = '',
      primaryMode = 'Documentary',
      secondaryModes = [],
      modeDetectionConfidence = 85,
      modeReasoning = '',
      modeProfile,
    } = req.body;

    const isShortForm =
      platform.includes('Short') || platform.includes('Reel') || platform.includes('Story');

    const prompt = `You are MintMind AI, the master scriptwriter and visual director for top creators.
Generate a complete, production-ready script and scene-by-scene breakdown for:

Topic: ${topic}
${ideaText ? `Source Idea / Concept: ${ideaText}` : ''}
Target Audience: ${audience}
Platform: ${platform}
Format: ${isShortForm ? 'Short-form Vertical Video' : 'Long-form Horizontal Video'}
Duration: ${duration}
Language: ${language}
Tone / Delivery Style: ${tone}
Narration Style: ${narrationStyle}
Call-to-Action: ${ctaStyle}
${brandVoice ? `Creator Voice: ${brandVoice}` : ''}
${keyPoints && keyPoints.length ? `Mandatory Core Points: ${keyPoints.join(', ')}` : ''}
${referenceMaterial ? `Reference Notes: ${referenceMaterial}` : ''}

=== ADAPTIVE STORY MODE ENGINE DIRECTIVES ===
Primary Story Mode: ${primaryMode}
${secondaryModes && secondaryModes.length ? `Secondary Creative Accents: ${secondaryModes.join(', ')}` : ''}
${modeProfile?.narrativeStructure ? `Narrative Structure Guide: ${modeProfile.narrativeStructure}` : ''}
${modeProfile?.pacing ? `Pacing Signature: ${modeProfile.pacing}` : ''}
${modeProfile?.hookStyle ? `Hook Style Directive: ${modeProfile.hookStyle}` : ''}
${modeProfile?.visualStyle ? `Visual Aesthetic Directive: ${modeProfile.visualStyle}` : ''}
${modeProfile?.musicDirection ? `Music Direction: ${modeProfile.musicDirection}` : ''}
${modeProfile?.soundDirection ? `Sound Design / SFX: ${modeProfile.soundDirection}` : ''}

${isShortForm
  ? `SHORT-FORM VERTICAL RETENTION DIRECTIVE:
- Hook in the first 1.5 seconds with high curiosity/conflict matching the ${primaryMode} hook style.
- Rapid visual scene changes every 2-4 seconds.
- Kinetic on-screen keyword captions.`
  : `LONG-FORM CINEMATIC DIRECTIVE:
- Structured chapter-by-chapter progression following ${primaryMode} narrative architecture.
- Atmospheric pacing and clear visual scene transitions.`
}

You MUST return a strictly valid JSON object matching this structure:
{
  "title": "${topic}",
  "type": "${platform}",
  "primaryMode": "${primaryMode}",
  "secondaryModes": ${JSON.stringify(secondaryModes || [])},
  "sections": [
    {
      "id": "sec_1",
      "name": "THE HOOK",
      "content": "Exact word-for-word spoken script text for this section...",
      "narration": "Exact word-for-word spoken script text...",
      "targetDuration": "0:00 - 0:15",
      "wordCount": 45,
      "visualDescription": "Camera framing, b-roll, motion graphics instruction",
      "directorNotes": "Energy spike, fast cut, no pauses",
      "pacing": "fast",
      "order": 1
    }
  ],
  "scenes": [
    {
      "sceneNumber": 1,
      "duration": "5s",
      "durationSec": 5,
      "sceneMode": "${primaryMode}",
      "primaryMode": "${primaryMode}",
      "secondaryModes": ${JSON.stringify(secondaryModes || [])},
      "voiceover": "Opening hook dialogue line spoken in this scene...",
      "spokenDialogue": "Opening hook dialogue line spoken in this scene...",
      "visualDescription": "Host standing with neon rim light looking directly into lens",
      "cameraDirection": "Medium Close Up, Eye Level",
      "shotType": "Medium Close Up",
      "action": "Host gestures forward with intense focus",
      "onScreenText": "3 PUNCHY WORDS",
      "bRollSuggestion": "Quick montage of charts crashing",
      "sfxMusic": "Subtle bass drop into driving synth beat",
      "sfx": "Subtle bass drop into driving synth beat",
      "transition": "Cut",
      "lightingMood": "High-contrast cinematic cyan & dark slate"
    }
  ]
}`;

    const script = await aiProviderRegistry.getActiveProvider().generateStructuredJSON<any>({
      prompt,
    });

    if (script && Array.isArray(script.sections)) {
      script.sections = script.sections.map((sec: any, idx: number) => ({
        id: sec.id || `sec_${idx + 1}`,
        name: sec.name || `Section ${idx + 1}`,
        content: sec.content || sec.narration || '',
        order: typeof sec.order === 'number' ? sec.order : idx + 1,
        ...sec,
      }));
    }

    if (script && Array.isArray(script.scenes)) {
      let runningSec = 0;
      const isVertical = String(platform || '').toLowerCase().includes('short') || String(platform || '').toLowerCase().includes('reel');
      const framing = isVertical ? '9:16 Vertical' : '16:9 Widescreen';
      const aspectParam = isVertical ? '--ar 9:16' : '--ar 16:9';

      script.scenes = script.scenes.map((sc: any, idx: number) => {
        const durSec = typeof sc.durationSec === 'number'
          ? sc.durationSec
          : typeof sc.duration === 'number'
            ? sc.duration
            : parseInt(String(sc.duration || '5'), 10) || 5;

        const startSec = runningSec;
        const endSec = runningSec + durSec;
        runningSec = endSec;

        const pad = (n: number) => Math.floor(n).toString().padStart(2, '0');
        const formatTime = (s: number) => `${pad(s / 60)}:${pad(s % 60)}`;
        const timecode = `${formatTime(startSec)} - ${formatTime(endSec)}`;

        const words = (sc.voiceover || sc.spokenDialogue || '').trim().split(/\s+/).filter(Boolean);
        const wordCount = words.length;

        const shotType = sc.shotType || sc.cameraDirection || (idx === 0 ? 'Wide Shot' : 'Medium Shot');
        const movement = sc.cameraMovement || (idx % 2 === 0 ? 'Slow Push-In / Dolly' : 'Pan Left/Right');

        const shotPlan = sc.shotPlan || {
          shotType,
          movement,
          framing,
          lightingMood: sc.lightingMood || 'High-contrast cinematic lighting with volumetric depth',
          colorGrade: `${primaryMode} color palette with calibrated saturation`,
          focalPoint: sc.bRollSuggestion || sc.visualDescription?.slice(0, 70) || 'Subject focus',
          visualPrompt: `Cinematic ${shotType.toLowerCase()}, ${movement.toLowerCase()}. ${sc.visualDescription || ''}. ${sc.lightingMood || 'Atmospheric lighting'}. 8k resolution, ARRI Alexa 35, photorealistic. ${aspectParam}`,
          cinematicNotes: `Transition: ${sc.transition || 'Cut'}. SFX: ${sc.sfxMusic || sc.sfx || 'Ambient'}`,
        };

        const audioTiming = sc.audioTiming || {
          startSec,
          endSec,
          durationSec: durSec,
          timecode,
          wordCount,
          speechRateWPM: Math.round((wordCount / (durSec || 5)) * 60) || 145,
          isSyncedToAudioFile: false,
        };

        return {
          sceneNumber: typeof sc.sceneNumber === 'number' ? sc.sceneNumber : idx + 1,
          duration: `${durSec}s`,
          durationSec: durSec,
          sceneMode: sc.sceneMode || primaryMode || 'Documentary',
          primaryMode: sc.primaryMode || primaryMode || 'Documentary',
          secondaryModes: Array.isArray(sc.secondaryModes) ? sc.secondaryModes : (secondaryModes || []),
          voiceover: sc.voiceover || sc.spokenDialogue || '',
          visualDescription: sc.visualDescription || sc.action || '',
          bRollSuggestion: sc.bRollSuggestion || '',
          onScreenText: sc.onScreenText || '',
          cameraDirection: sc.cameraDirection || sc.shotType || 'Medium Shot',
          transition: sc.transition || 'Cut',
          sfxMusic: sc.sfxMusic || sc.sfx || '',
          sfx: sc.sfx || sc.sfxMusic || '',
          shotPlan,
          audioTiming,
          ...sc,
        };
      });
    }

    if (script) {
      script.primaryMode = script.primaryMode || primaryMode || 'Documentary';
      script.secondaryModes = Array.isArray(script.secondaryModes) ? script.secondaryModes : (secondaryModes || []);
      script.modeDetectionConfidence = modeDetectionConfidence || 85;
      script.modeReasoning = modeReasoning || '';
    }

    res.json({ success: true, script });
  } catch (err: any) {
    const errorObj = geminiService.sanitizeError(err);
    res.status(errorObj.statusCode).json({
      success: false,
      error: errorObj.message,
      code: errorObj.code,
    });
  }
});

// 5.5 Generate Full Scene Breakdown & Shot Planning from Script
aiRouter.post('/generate-scene-breakdown', async (req: Request, res: Response) => {
  try {
    const {
      scriptTitle = 'Untitled Production',
      scriptText = '',
      sections = [],
      primaryMode = 'Documentary',
      secondaryModes = [],
      platform = 'YouTube Long-form',
      duration = '',
      audience = 'General Creators',
      tone = 'Cinematic',
      modeProfile,
    } = req.body;

    // Build the script content to break down
    let fullScriptContent = scriptText;
    if (!fullScriptContent && Array.isArray(sections) && sections.length > 0) {
      fullScriptContent = sections
        .map((sec: any) => `[${sec.name || 'Section'}]:\n${sec.content || sec.narration || ''}`)
        .join('\n\n');
    }

    if (!fullScriptContent.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Script text or sections are required to generate a scene breakdown.',
        code: 'BAD_REQUEST',
      });
    }

    const isShortForm =
      platform.includes('Short') || platform.includes('Reel') || platform.includes('Story');
    const aspectParam = isShortForm ? '--ar 9:16' : '--ar 16:9';
    const framing = isShortForm ? '9:16 Vertical' : '16:9 Widescreen';

    const prompt = `You are MintMind AI's Executive Film Director and Visual Cinematographer.
Transform the following complete video script into an elite, shot-by-shot production scene breakdown.

SCRIPT TITLE: "${scriptTitle}"
PLATFORM: ${platform} (${isShortForm ? 'Vertical 9:16 Fast Retention' : 'Horizontal 16:9 Cinematic'})
TARGET AUDIENCE: ${audience}
TONE: ${tone}
${duration ? `ESTIMATED RUNTIME: ${duration}` : ''}

=== ADAPTIVE STORY MODE DIRECTIVES ===
Primary Story Mode: ${primaryMode}
${secondaryModes && secondaryModes.length ? `Secondary Creative Accents: ${secondaryModes.join(', ')}` : ''}
${modeProfile?.narrativeStructure ? `Narrative Structure Guide: ${modeProfile.narrativeStructure}` : ''}
${modeProfile?.pacing ? `Pacing Signature: ${modeProfile.pacing}` : ''}
${modeProfile?.visualStyle ? `Visual Aesthetic Directive: ${modeProfile.visualStyle}` : ''}
${modeProfile?.cameraStyle ? `Camera Language: ${modeProfile.cameraStyle}` : ''}
${modeProfile?.lightingStyle ? `Lighting Atmosphere: ${modeProfile.lightingStyle}` : ''}
${modeProfile?.musicDirection ? `Music Direction: ${modeProfile.musicDirection}` : ''}
${modeProfile?.soundDirection ? `Sound Design / SFX: ${modeProfile.soundDirection}` : ''}
${modeProfile?.transitionStyle ? `Transitions: ${modeProfile.transitionStyle}` : ''}

=== COMPLETE SCRIPT TEXT TO BREAK DOWN ===
${fullScriptContent}

=== DIRECTIVES FOR PRODUCTION BREAKDOWN ===
1. Break down the ENTIRE script chronologically into discrete, purposeful production scenes.
2. For each scene, determine the exact spoken dialogue/voiceover line corresponding to that moment.
3. Every scene MUST have:
   - sceneNumber: Sequential integer (1, 2, 3...)
   - title: A concise 2-4 word descriptive scene title (e.g. "Hook: The Revelation", "B-Roll: Microchip Macro")
   - duration: String like "4s", "6s", or "8s" matching the spoken dialogue length
   - durationSec: Integer seconds matching duration
   - voiceover: The exact spoken spoken dialogue for this scene
   - dialogue: Duplicate of voiceover for actor/voiceover synchronization
   - visualDescription: Vivid, highly detailed cinematic visual description (subjects, action, background, lighting)
   - bRoll: Specific, practical B-roll footage suggestion to intercut
   - shotType: One of: "Extreme Wide Shot", "Wide Shot", "Medium Shot", "Medium Close-Up", "Close-Up", "Extreme Close-Up", "Over-the-Shoulder", "POV", "Drone Aerial", "Dutch Angle", "Macro"
   - cameraMovement: One of: "Static", "Pan Left/Right", "Tilt Up/Down", "Slow Push-In / Dolly", "Pull-Out", "Tracking / Gimbal", "Handheld Organic", "Whip Pan", "Orbit"
   - transition: Cinematic cut/transition (e.g. "Cut", "Match Cut", "Whip Pan", "Cross Dissolve", "J-Cut", "Flash")
   - onScreenText: High-impact punchy words/typography overlay (or empty if none needed)
   - music: Ambient or musical cue description matching ${primaryMode}
   - soundEffects: Specific foley / sound effect (SFX) cue (e.g. "Whoosh risers", "Heartbeat thump", "Keyboard clack")
   - imageGenerationPrompt: A complete, photorealistic prompt for Midjourney/Flux (shot type, subject, camera motion, lighting, color grading, photorealistic, 8k, ${aspectParam})
   - videoGenerationPrompt: A complete prompt for Runway/Sora/Kling (motion direction, physics, camera movement, speed, cinematic atmospheric quality)

Return a strictly valid JSON object with the array of scenes:
{
  "scenes": [
    {
      "sceneNumber": 1,
      "title": "Scene Title",
      "duration": "5s",
      "durationSec": 5,
      "voiceover": "First spoken line...",
      "dialogue": "First spoken line...",
      "visualDescription": "Detailed visual...",
      "bRoll": "B-roll suggestion...",
      "shotType": "Wide Shot",
      "cameraMovement": "Slow Push-In / Dolly",
      "transition": "Cut",
      "onScreenText": "HOOK KEYWORDS",
      "music": "Driving low bass drone",
      "soundEffects": "Deep sub-bass impact",
      "imageGenerationPrompt": "Cinematic wide shot... photorealistic, 8k ${aspectParam}",
      "videoGenerationPrompt": "Camera slowly pushes in on... smooth 24fps cinematic motion"
    }
  ]
}`;

    const raw = await aiProviderRegistry.getActiveProvider().generateStructuredJSON<any>({
      prompt,
    });

    const rawScenes = Array.isArray(raw?.scenes) ? raw.scenes : Array.isArray(raw) ? raw : [];

    if (rawScenes.length === 0) {
      throw new GeminiServiceError(
        'AI did not return any scenes in the breakdown. Please try again.',
        502,
        'EMPTY_SCENE_BREAKDOWN'
      );
    }

    let runningSec = 0;
    const validatedScenes = rawScenes.map((sc: any, idx: number) => {
      const durSec =
        typeof sc.durationSec === 'number' && sc.durationSec > 0
          ? sc.durationSec
          : typeof sc.duration === 'number' && sc.duration > 0
          ? sc.duration
          : parseInt(String(sc.duration || '5'), 10) || 5;

      const startSec = runningSec;
      const endSec = runningSec + durSec;
      runningSec = endSec;

      const pad = (n: number) => Math.floor(n).toString().padStart(2, '0');
      const formatTime = (s: number) => `${pad(s / 60)}:${pad(s % 60)}`;
      const timecode = `${formatTime(startSec)} - ${formatTime(endSec)}`;

      const voiceText = (sc.voiceover || sc.dialogue || sc.spokenDialogue || '').trim();
      const words = voiceText.split(/\s+/).filter(Boolean);
      const wordCount = words.length;

      const shotType = sc.shotType || sc.cameraDirection || (idx === 0 ? 'Wide Shot' : 'Medium Shot');
      const cameraMovement = sc.cameraMovement || (idx % 2 === 0 ? 'Slow Push-In / Dolly' : 'Pan Left/Right');
      const transition = sc.transition || 'Cut';
      const bRoll = sc.bRoll || sc.bRollSuggestion || '';
      const music = sc.music || sc.sfxMusic || '';
      const soundEffects = sc.soundEffects || sc.sfx || '';
      const visualDesc = sc.visualDescription || sc.action || '';

      const imagePrompt =
        sc.imageGenerationPrompt ||
        `Cinematic ${shotType.toLowerCase()}, ${cameraMovement.toLowerCase()} motion. ${visualDesc}. Volumetric atmospheric lighting, photorealistic, 8k resolution, ARRI Alexa 35, anamorphic lens flare. ${aspectParam}`;

      const videoPrompt =
        sc.videoGenerationPrompt ||
        `Camera movement: ${cameraMovement.toLowerCase()}. ${visualDesc}. Cinematic motion, continuous 24fps, high fidelity.`;

      const shotPlan = {
        shotType,
        movement: cameraMovement,
        framing,
        lightingMood: sc.lightingMood || modeProfile?.lightingStyle || 'Atmospheric cinematic lighting',
        colorGrade: `${primaryMode} calibrated color palette`,
        focalPoint: bRoll || visualDesc.slice(0, 70) || 'Center subject',
        visualPrompt: imagePrompt,
        cinematicNotes: `Transition: ${transition}. Music: ${music}. SFX: ${soundEffects}`,
      };

      const audioTiming = {
        startSec,
        endSec,
        durationSec: durSec,
        timecode,
        wordCount,
        speechRateWPM: Math.round((wordCount / (durSec || 5)) * 60) || 145,
        isSyncedToAudioFile: false,
      };

      return {
        sceneId: sc.sceneId || `scene_${Date.now()}_${idx + 1}`,
        sceneNumber: idx + 1,
        title: sc.title || `Scene ${idx + 1}`,
        duration: `${durSec}s`,
        durationSec: durSec,
        voiceover: voiceText,
        dialogue: voiceText,
        visualDescription: visualDesc,
        bRoll,
        bRollSuggestion: bRoll,
        shotType,
        cameraMovement,
        cameraDirection: shotType,
        transition,
        onScreenText: sc.onScreenText || '',
        music,
        sfxMusic: music,
        soundEffects,
        sfx: soundEffects,
        imageGenerationPrompt: imagePrompt,
        videoGenerationPrompt: videoPrompt,
        sceneMode: primaryMode,
        primaryMode,
        secondaryModes,
        shotPlan,
        audioTiming,
      };
    });

    res.json({
      success: true,
      scenes: validatedScenes,
      totalScenes: validatedScenes.length,
      totalDurationSec: runningSec,
    });
  } catch (err: any) {
    const errorObj = geminiService.sanitizeError(err);
    res.status(errorObj.statusCode).json({
      success: false,
      error: errorObj.message,
      code: errorObj.code,
    });
  }
});

// 5.6 Regenerate a Single Scene in Context
aiRouter.post('/regenerate-scene', async (req: Request, res: Response) => {
  try {
    const {
      scene,
      scriptContext = {},
      instruction = '',
    } = req.body;

    if (!scene || typeof scene.sceneNumber !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Scene object with sceneNumber is required.',
        code: 'BAD_REQUEST',
      });
    }

    const primaryMode = scriptContext.primaryMode || scene.primaryMode || 'Documentary';
    const isShortForm = String(scriptContext.platform || '').toLowerCase().includes('short');
    const aspectParam = isShortForm ? '--ar 9:16' : '--ar 16:9';

    const prompt = `You are MintMind AI's Master Visual Director.
Regenerate and elevate Scene #${scene.sceneNumber} for the project: "${scriptContext.title || 'Video Script'}".

CURRENT SCENE DATA:
- Title: ${scene.title || `Scene ${scene.sceneNumber}`}
- Current Spoken Voiceover: "${scene.voiceover || scene.dialogue || ''}"
- Current Visual Description: "${scene.visualDescription || ''}"
- Current Shot Type: ${scene.shotType || 'Medium Shot'}
- Current Camera Movement: ${scene.cameraMovement || 'Slow Push-In'}
- Current B-Roll: "${scene.bRoll || scene.bRollSuggestion || ''}"
- Current Transition: ${scene.transition || 'Cut'}
- Story Mode Tone: ${primaryMode}

SPECIFIC REGENERATION INSTRUCTION:
${instruction ? `"${instruction}"` : 'Elevate the visual dynamism, cinematic lighting, and precision shot direction while preserving the narrative alignment.'}

Return a strictly valid JSON object matching:
{
  "title": "Sharper 2-4 word scene title",
  "duration": "${scene.duration || '5s'}",
  "durationSec": ${scene.durationSec || 5},
  "voiceover": "Spoken dialogue line...",
  "dialogue": "Spoken dialogue line...",
  "visualDescription": "High-impact visual art direction...",
  "bRoll": "Fresh B-roll suggestion...",
  "shotType": "Extreme Wide Shot | Wide Shot | Medium Shot | Medium Close-Up | Close-Up | Extreme Close-Up | POV | Drone Aerial | Dutch Angle",
  "cameraMovement": "Static | Pan Left/Right | Tilt Up/Down | Slow Push-In / Dolly | Pull-Out | Tracking / Gimbal | Handheld Organic | Orbit",
  "transition": "Cut | Match Cut | Whip Pan | Cross Dissolve",
  "onScreenText": "On-screen text",
  "music": "Music suggestion",
  "soundEffects": "SFX suggestion",
  "imageGenerationPrompt": "Photorealistic Midjourney prompt with ${aspectParam}",
  "videoGenerationPrompt": "Video prompt with camera motion and physics"
}`;

    const raw = await aiProviderRegistry.getActiveProvider().generateStructuredJSON<any>({
      prompt,
    });

    const durSec =
      typeof raw.durationSec === 'number' && raw.durationSec > 0
        ? raw.durationSec
        : scene.durationSec || 5;

    const shotType = raw.shotType || scene.shotType || 'Medium Shot';
    const cameraMovement = raw.cameraMovement || scene.cameraMovement || 'Slow Push-In / Dolly';
    const transition = raw.transition || scene.transition || 'Cut';
    const bRoll = raw.bRoll || raw.bRollSuggestion || scene.bRoll || '';
    const music = raw.music || raw.sfxMusic || scene.music || '';
    const soundEffects = raw.soundEffects || raw.sfx || scene.soundEffects || '';
    const visualDesc = raw.visualDescription || scene.visualDescription || '';
    const voiceText = raw.voiceover || raw.dialogue || scene.voiceover || '';

    const imagePrompt =
      raw.imageGenerationPrompt ||
      `Cinematic ${shotType.toLowerCase()}, ${cameraMovement.toLowerCase()} motion. ${visualDesc}. Volumetric lighting, 8k photorealistic, ARRI Alexa 35. ${aspectParam}`;

    const videoPrompt =
      raw.videoGenerationPrompt ||
      `Camera movement: ${cameraMovement.toLowerCase()}. ${visualDesc}. Cinematic motion, continuous 24fps.`;

    const updatedScene = {
      ...scene,
      title: raw.title || scene.title || `Scene ${scene.sceneNumber}`,
      duration: `${durSec}s`,
      durationSec: durSec,
      voiceover: voiceText,
      dialogue: voiceText,
      visualDescription: visualDesc,
      bRoll,
      bRollSuggestion: bRoll,
      shotType,
      cameraMovement,
      cameraDirection: shotType,
      transition,
      onScreenText: raw.onScreenText ?? scene.onScreenText ?? '',
      music,
      sfxMusic: music,
      soundEffects,
      sfx: soundEffects,
      imageGenerationPrompt: imagePrompt,
      videoGenerationPrompt: videoPrompt,
      shotPlan: {
        ...(scene.shotPlan || {}),
        shotType,
        movement: cameraMovement,
        visualPrompt: imagePrompt,
        cinematicNotes: `Transition: ${transition}. SFX: ${soundEffects}`,
      },
    };

    res.json({
      success: true,
      scene: updatedScene,
    });
  } catch (err: any) {
    const errorObj = geminiService.sanitizeError(err);
    res.status(errorObj.statusCode).json({
      success: false,
      error: errorObj.message,
      code: errorObj.code,
    });
  }
});

// 5.5. Enhance Media Generation Prompts (Midjourney v6, Flux.1, Runway Gen-3, Luma, Sora + Audio Metadata)
aiRouter.post('/enhance-media-prompts', async (req: Request, res: Response) => {
  try {
    const {
      scene,
      storyMode = 'Documentary',
      aspectRatio = '16:9',
      projectContext = {},
    } = req.body;

    if (!scene || typeof scene.sceneNumber !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Scene object with sceneNumber is required.',
        code: 'BAD_REQUEST',
      });
    }

    const isVertical = aspectRatio === '9:16' || String(projectContext.platform || '').toLowerCase().includes('short');
    const arParam = isVertical ? '9:16' : '16:9';

    const prompt = `You are MintMind AI's Master Cinematographer, Prompt Engineer & Technical Director.
Generate production-grade AI Media Generation Prompts for Scene #${scene.sceneNumber}: "${scene.title || `Scene ${scene.sceneNumber}`}".

PROJECT CONTEXT:
- Title: "${projectContext.title || 'Cinematic Production'}"
- Topic: "${projectContext.topic || 'High-Impact Media'}"
- Story Mode: ${storyMode}
- Aspect Ratio: ${arParam}
- Subject Anchor: "${projectContext.subjectAnchor || 'Consistent visual subject'}"

SCENE DATA:
- Voiceover / Dialogue: "${scene.voiceover || scene.dialogue || ''}"
- Visual Description: "${scene.visualDescription || ''}"
- B-Roll: "${scene.bRoll || scene.bRollSuggestion || ''}"
- Camera Shot: "${scene.shotType || 'Medium Shot'}"
- Camera Movement: "${scene.cameraMovement || 'Slow Push-In'}"
- Transition: "${scene.transition || 'Cut'}"
- Music / SFX: "${scene.music || scene.sfxMusic || ''}" / "${scene.soundEffects || scene.sfx || ''}"

TASK:
Craft enhanced, production-ready prompts tailored specifically for leading image and video AI generation models, plus camera physics and audio timing metadata.

Return a strictly valid JSON object matching:
{
  "midjourneyPrompt": "Cinematic visual prompt formatted for Midjourney v6 with ARRI Alexa 35, 35mm anamorphic lens, lighting, composition, photorealistic, 8k, --ar ${arParam} --v 6.0 --style raw",
  "fluxPrompt": "Flux.1 prompt focused on textural realism, volumetric ambient occlusion, and compositional depth",
  "runwayPrompt": "Runway Gen-3 prompt specifying motion trajectory, camera speed, physics simulation, and atmospheric quality",
  "lumaPrompt": "Luma Dream Machine prompt specifying continuous camera path and physical interaction",
  "soraPrompt": "OpenAI Sora prompt specifying temporal realism, nuanced expressions, and physical consistency",
  "cameraSettings": {
    "lens": "e.g. 35mm Anamorphic Prime",
    "aperture": "e.g. f/1.8",
    "shutter": "e.g. 1/50 sec 180° angle",
    "sensor": "e.g. ARRI Alexa 35",
    "movementStyle": "e.g. Steadicam smooth tracking"
  },
  "lightingMood": "Specific cinematic lighting setup (e.g. Chiaroscuro high-contrast key light with amber rim)",
  "colorGrade": "Filmic color palette description (e.g. Kodak Vision3 500T 5219 film stock LUT with muted cool shadows)",
  "subjectConsistencyAnchor": "Clear visual signature for character/subject consistency across scenes",
  "negativePrompt": "blurry, low resolution, deformed, plastic skin, oversaturated, amateur footage, glitch, jitter",
  "audioMetadata": {
    "voiceStyle": "Tone and cadence recommendation for voiceover",
    "pacingWPM": 145,
    "emotion": "Dominant vocal emotion (e.g. Solemn intrigue, urgent revelation, calm authority)",
    "recommendedVoice": "e.g. Adam (Deep Baritone) or Rachel (Intelligent Documentary)",
    "sfxLayering": ["Sound effect 1", "Sound effect 2", "Atmospheric background layer"],
    "musicBpm": "e.g. 74 BPM - Minimalist Cello & Ambient Synth Drone"
  }
}`;

    const enhanced = await aiProviderRegistry.getActiveProvider().generateStructuredJSON<any>({
      prompt,
    });

    res.json({
      success: true,
      enhancedPrompts: enhanced,
    });
  } catch (err: any) {
    const errorObj = geminiService.sanitizeError(err);
    res.status(errorObj.statusCode).json({
      success: false,
      error: errorObj.message,
      code: errorObj.code,
    });
  }
});

// 6. Rewrite Specific Section Only
aiRouter.post('/rewrite-section', async (req: Request, res: Response) => {
  try {
    const {
      sectionName,
      currentContent,
      action,
      targetLanguage,
      overallContext = {},
    } = req.body;

    if (!currentContent) {
      return res.status(400).json({ success: false, error: 'Current section content is required', code: 'BAD_REQUEST' });
    }

    let instruction = '';
    switch (action) {
      case 'rewrite':
        instruction = 'Completely rewrite this section with fresh phrasing while preserving the core message.';
        break;
      case 'shorten':
        instruction = 'Make this section significantly tighter, crisper, and more concise by removing all filler words.';
        break;
      case 'expand':
        instruction = 'Expand this section with more depth, engaging details, practical analogies, and clear value.';
        break;
      case 'improve_hook':
        instruction = 'Dramatically improve the hook of this section to create an irresistible curiosity gap and stop the scroll.';
        break;
      case 'conversational':
        instruction = 'Make this section sound ultra natural, warm, conversational, and direct as if speaking to a close friend.';
        break;
      case 'professional':
        instruction = 'Elevate this section to an authoritative, professional, and polished executive tone.';
        break;
      case 'energetic':
        instruction = 'Inject high energy, urgent pacing, and dynamic excitement into this section.';
        break;
      case 'translate':
        instruction = `Translate and culturally adapt this section fluently into ${targetLanguage || 'Hindi'} while preserving creator slang and punchiness.`;
        break;
      case 'simplify':
        instruction = 'Simplify the vocabulary and concepts so even a beginner can instantly understand it clearly.';
        break;
      case 'add_examples':
        instruction = 'Incorporate concrete real-world examples, analogies, or metrics to prove the point.';
        break;
      case 'remove_repetition':
        instruction = 'Eliminate repeated ideas, redundant phrasing, and sluggish pacing.';
        break;
      case 'improve_flow':
        instruction = 'Smooth out the transitions, rhythm, and sentence variance for seamless spoken delivery.';
        break;
      case 'alternative':
        instruction = 'Provide a totally fresh alternative take or counter-intuitive angle for this section.';
        break;
      default:
        instruction = 'Polish and optimize this section for spoken video delivery.';
    }

    const prompt = `You are MintMind AI's precision script editor.
Target Section: "${sectionName}"
Context: Topic "${overallContext.topic || 'General'}", Platform "${overallContext.platform || 'YouTube'}", Tone "${overallContext.tone || 'Energetic'}"

Original Content:
"""
${currentContent}
"""

TASK:
${instruction}

IMPORTANT:
Modify ONLY this specific section. Do NOT generate the rest of the script.
Return a strictly valid JSON object:
{
  "modifiedContent": "The rewritten section text ready to paste directly",
  "explanation": "Brief 1-sentence note of what was changed and why it enhances the script"
}`;

    const parsed = await aiProviderRegistry.getActiveProvider().generateStructuredJSON<any>({
      prompt,
    });

    res.json({ success: true, ...parsed });
  } catch (err: any) {
    const errorObj = geminiService.sanitizeError(err);
    res.status(errorObj.statusCode).json({
      success: false,
      error: errorObj.message,
      code: errorObj.code,
    });
  }
});

// 7. Generate SEO
aiRouter.post('/generate-seo', async (req: Request, res: Response) => {
  try {
    const { scriptText = '', topic = '', platform = 'YouTube', audience = '' } = req.body;

    const prompt = `You are MintMind AI's YouTube & Social SEO Algorithm Master.
Analyze this script and topic to engineer the maximum search ranking and recommendation boost:

Topic: ${topic}
Platform: ${platform}
Audience: ${audience}
Script Snippet:
${scriptText.slice(0, 3000)}

Return a strictly valid JSON object with:
{
  "title": "Primary high-CTR search-optimized title (under 65 chars)",
  "description": "Comprehensive video description with hook in first 2 lines, timestamp placeholders, keyword placement, and CTA",
  "keywords": ["5-10 strategic target search keywords"],
  "tags": ["10-15 algorithmic YouTube tags"],
  "hashtags": ["5-8 viral hashtags with # prefix"],
  "thumbnailText": "3-4 word high-contrast text overlay for the thumbnail",
  "filename": "SEO-optimized-raw-video-file-name.mp4",
  "chapters": [
    { "timestamp": "0:00", "title": "The Hook & Core Secret" },
    { "timestamp": "1:15", "title": "Step 1: The Foundation" },
    { "timestamp": "3:45", "title": "Step 2: Execution Framework" },
    { "timestamp": "6:20", "title": "Avoid These Critical Mistakes" },
    { "timestamp": "8:30", "title": "Final Summary & Next Steps" }
  ],
  "shortFormSEO": {
    "hookCaption": "First line caption for TikTok/Reels algorithm",
    "hashtags": ["#shorts", "#creator", "#viral"],
    "audioRecommendation": "Trending sound category or tempo advice",
    "engagementQuestion": "Specific pinned comment question to trigger viewer comment arguments"
  }
}`;

    const seo = await aiProviderRegistry.getActiveProvider().generateStructuredJSON<any>({
      prompt,
    });

    res.json({ success: true, seo });
  } catch (err: any) {
    const errorObj = geminiService.sanitizeError(err);
    res.status(errorObj.statusCode).json({
      success: false,
      error: errorObj.message,
      code: errorObj.code,
    });
  }
});

// 8. Generate Thumbnail Concepts
aiRouter.post('/generate-thumbnails', async (req: Request, res: Response) => {
  try {
    const { title = '', concept = '', platform = 'YouTube' } = req.body;

    const prompt = `You are MintMind AI's Elite Thumbnail Art Director.
Design 3 distinctly different, high-CTR thumbnail packaging concepts for:
Title: ${title}
Concept: ${concept}
Platform: ${platform}

Return a strictly valid JSON array of 3 concepts:
[
  {
    "id": "thumb-1",
    "conceptTitle": "Extreme Emotion / Shock Factor",
    "visualDescription": "Detailed visual layout: subject on right side, dramatic rim lighting, expressive face...",
    "layoutDescription": "Subject taking 40% of frame on right, contrasting object on left, bold arrows...",
    "colorTheory": "High contrast complimentary colors (e.g. Electric Cyan vs Radiant Orange)",
    "primaryTextOverlay": "DO THIS NOW!",
    "secondaryTextOverlay": "(NOT THAT)",
    "focalPoint": "Creator's wide eyes pointing toward glowing interface",
    "predictedCTRRating": "12.4% - High Probability Outlier"
  }
]`;

    const thumbnails = await aiProviderRegistry.getActiveProvider().generateStructuredJSON<any[]>({
      prompt,
    });

    res.json({ success: true, thumbnails });
  } catch (err: any) {
    const errorObj = geminiService.sanitizeError(err);
    res.status(errorObj.statusCode).json({
      success: false,
      error: errorObj.message,
      code: errorObj.code,
    });
  }
});

// 9. Repurpose Script
aiRouter.post('/repurpose', async (req: Request, res: Response) => {
  try {
    const { scriptText = '', title = '', topic = '' } = req.body;

    const prompt = `You are MintMind AI Multi-Platform Repurposing Engine.
Repurpose this long-form script or topic into 3 standalone, optimized short-form assets:
1. YouTube Short (Vertical 9:16, 45-55 sec, retention focused)
2. Instagram Reel (Vertical 9:16, 30-40 sec, aesthetic & punchy)
3. Instagram Story (Interactive 15-sec teaser with poll/sticker CTA)

Title: ${title}
Topic: ${topic}
Script Context:
${scriptText.slice(0, 3000)}

Return a strictly valid JSON object with this exact shape:
{
  "short": {
    "platform": "YouTube Short",
    "title": "YouTube Short Title",
    "hook": "0-3s high retention hook",
    "scriptText": "Complete 45-second vertical script with fast pacing",
    "targetDuration": "45s",
    "onScreenCaptions": ["LINE 1", "LINE 2", "LINE 3"],
    "recommendedHashtags": ["#Shorts", "#Trending", "#Creator"],
    "cta": "Subscribe for part 2"
  },
  "reel": {
    "platform": "Instagram Reel",
    "title": "Instagram Reel Title",
    "hook": "Visual + spoken opening hook",
    "scriptText": "Complete 35-second punchy reel script",
    "targetDuration": "35s",
    "onScreenCaptions": ["TEXT 1", "TEXT 2"],
    "recommendedHashtags": ["#reels", "#explorepage", "#viralreels"],
    "cta": "Save this reel for later"
  },
  "story": {
    "platform": "Instagram Story",
    "title": "Story Sequence",
    "hook": "Attention-grabbing question sticker premise",
    "scriptText": "15-second teaser script with swipe-up / link sticker instruction",
    "targetDuration": "15s",
    "onScreenCaptions": ["TAP HERE", "WATCH FULL VIDEO"],
    "recommendedHashtags": [],
    "cta": "Tap the link sticker to watch full breakdown"
  }
}`;

    const repurpose = await aiProviderRegistry.getActiveProvider().generateStructuredJSON<any>({
      prompt,
    });

    res.json({ success: true, repurpose });
  } catch (err: any) {
    const errorObj = geminiService.sanitizeError(err);
    res.status(errorObj.statusCode).json({
      success: false,
      error: errorObj.message,
      code: errorObj.code,
    });
  }
});

// 10. Complete Content Package
aiRouter.post('/generate-content-package', async (req: Request, res: Response) => {
  try {
    const { idea, topic = '', platform = 'YouTube Long-form', language = 'English', audience = 'Creators' } = req.body;

    const prompt = `You are MintMind AI Content Operating System.
Generate a COMPLETE, comprehensive end-to-end content production package from this idea:

Idea Title: ${idea?.title || topic}
Concept: ${idea?.concept || topic}
Hook: ${idea?.hook || ''}
Platform: ${platform}
Language: ${language}
Audience: ${audience}

You must return a single, unified, strictly valid JSON object containing:
1. "idea": refined title, hook, concept, angle, whyItWorks
2. "script": title, 5-7 structural sections (HOOK, INTRO, SECTION 1, SECTION 2, SECTION 3, CTA, OUTRO)
3. "scenes": 5-8 detailed scene breakdown objects (sceneNumber, duration, voiceover, visualDescription, bRollSuggestion, onScreenText, cameraDirection, transition, sfxMusic)
4. "seo": title, description, keywords, tags, hashtags, thumbnailText, filename, chapters
5. "thumbnails": 3 thumbnail concepts
6. "repurpose": short, reel, story

Strict JSON format only.`;

    const contentPackage = await aiProviderRegistry.getActiveProvider().generateStructuredJSON<any>({
      prompt,
    });

    res.json({ success: true, contentPackage });
  } catch (err: any) {
    const errorObj = geminiService.sanitizeError(err);
    res.status(errorObj.statusCode).json({
      success: false,
      error: errorObj.message,
      code: errorObj.code,
    });
  }
});

// 11. Scene Image Generation (Preserved for existing storyboard cards)
aiRouter.post('/generate-scene-image', async (req: Request, res: Response) => {
  try {
    const { prompt: imagePrompt = '', sceneNumber = 1, style = 'Cinematic Photo' } = req.body;

    if (!geminiService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'AI provider not configured',
        code: 'NOT_CONFIGURED',
      });
    }

    try {
      const ai = geminiService.getClient();
      const imgResponse = await (ai.models as any).generateImages?.({
        model: 'gemini-3.1-flash-lite-image',
        prompt: `${imagePrompt}. Style: ${style}. High resolution, 16:9 widescreen composition, cinematic lighting, ultra-detailed render.`,
        config: {
          numberOfImages: 1,
          aspectRatio: '16:9',
        },
      });

      if (imgResponse?.generatedImages?.[0]?.image?.imageBytes) {
        const base64 = imgResponse.generatedImages[0].image.imageBytes;
        const imageUrl = `data:image/jpeg;base64,${base64}`;
        return res.json({
          success: true,
          imageUrl,
          provider: 'Gemini Image Studio',
          model: 'gemini-3.1-flash-lite-image',
        });
      }
    } catch {
      // Direct image model may not be available; proceed to storyboard graphic
    }

    const escapedPrompt = imagePrompt.slice(0, 100).replace(/"/g, '&quot;');
    const svg = `
      <svg width="640" height="360" viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#090d16" />
            <stop offset="50%" stop-color="#0f172a" />
            <stop offset="100%" stop-color="#1e1b4b" />
          </linearGradient>
        </defs>
        <rect width="640" height="360" fill="url(#bg)" />
        <circle cx="320" cy="180" r="140" fill="#06b6d4" opacity="0.08" />
        <rect x="24" y="24" width="592" height="312" rx="12" fill="none" stroke="#334155" stroke-width="1.5" stroke-dasharray="6 6" />
        <line x1="310" y1="180" x2="330" y2="180" stroke="#06b6d4" stroke-width="2" />
        <line x1="320" y1="170" x2="320" y2="190" stroke="#06b6d4" stroke-width="2" />
        <rect x="40" y="40" width="120" height="26" rx="6" fill="#06b6d4" opacity="0.2" />
        <text x="50" y="57" font-family="monospace" font-size="11" font-weight="bold" fill="#38bdf8">SCENE ${sceneNumber} • 16:9</text>
        <rect x="480" y="40" width="120" height="26" rx="6" fill="#6366f1" opacity="0.2" />
        <text x="490" y="57" font-family="sans-serif" font-size="11" fill="#a5b4fc">${style}</text>
        <text x="320" y="150" font-family="sans-serif" font-size="13" font-weight="bold" fill="#f8fafc" text-anchor="middle">SCENE VISUAL COMPOSITION</text>
        <text x="320" y="190" font-family="sans-serif" font-size="11" fill="#94a3b8" text-anchor="middle">
          "${escapedPrompt}..."
        </text>
        <text x="320" y="295" font-family="monospace" font-size="9" fill="#64748b" text-anchor="middle">MINTMIND AI STORYBOARD ENGINE • READY FOR RENDER</text>
      </svg>
    `.trim();

    const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

    res.json({
      success: true,
      imageUrl: dataUri,
      provider: 'MintMind Storyboard Studio',
      note: 'Storyboard frame synthesized. Ready for direct export or production pipeline.',
    });
  } catch (err: any) {
    const errorObj = geminiService.sanitizeError(err);
    res.status(errorObj.statusCode).json({
      success: false,
      error: errorObj.message,
      code: errorObj.code,
    });
  }
});
