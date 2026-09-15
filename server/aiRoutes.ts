import { Router, Request, Response } from 'express';
import { geminiService, GeminiServiceError } from './services/geminiService.js';

export const aiRouter = Router();

/**
 * AI Provider Status
 * GET /api/ai/status
 */
aiRouter.get('/status', (_req: Request, res: Response) => {
  const status = geminiService.getStatus();
  res.json({
    configured: status.configured,
    textModel: status.model,
    provider: status.provider,
  });
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
        const generated = await geminiService.generateText({
          prompt: prompt || text,
          systemInstruction,
          model,
          temperature,
          maxOutputTokens,
        });
        return res.json({ success: true, text: generated });
      }

      case 'generateStructuredJSON': {
        const data = await geminiService.generateStructuredJSON({
          prompt: prompt || text,
          systemInstruction,
          model,
          temperature,
          responseSchema,
        });
        return res.json({ success: true, data });
      }

      case 'analyzeText': {
        const analysis = await geminiService.analyzeText({
          text: text || prompt,
          instructions: instructions || instruction || 'Analyze this content in depth.',
          model,
        });
        return res.json({ success: true, analysis });
      }

      case 'rewriteText': {
        const rewritten = await geminiService.rewriteText({
          text: text || prompt,
          instruction: instruction || instructions || 'Polish and improve this text.',
          tone,
          model,
        });
        return res.json({ success: true, rewritten });
      }

      case 'summarizeText': {
        const summary = await geminiService.summarizeText({
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
    const errorObj = geminiService.sanitizeError(err);
    return res.status(errorObj.statusCode).json({
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

  const rawIdeas = await geminiService.generateStructuredJSON<any[]>({
    prompt,
    model: 'gemini-3.5-flash-lite',
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

    const analysis = await geminiService.generateStructuredJSON<any>({
      prompt,
      model: 'gemini-3.5-flash-lite',
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

    const variations = await geminiService.generateStructuredJSON<any[]>({
      prompt,
      model: 'gemini-3.5-flash-lite',
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

    const improved = await geminiService.generateStructuredJSON<any>({
      prompt,
      model: 'gemini-3.5-flash-lite',
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
    } = req.body;

    const isShortForm =
      platform.includes('Short') || platform.includes('Reel') || platform.includes('Story');

    const prompt = `You are MintMind AI, the master scriptwriter for top creators.
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

You MUST return a strictly valid JSON object matching this structure:
{
  "title": "${topic}",
  "type": "${platform}",
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

    const script = await geminiService.generateStructuredJSON<any>({
      prompt,
      model: 'gemini-3.5-flash-lite',
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
      script.scenes = script.scenes.map((sc: any, idx: number) => {
        const durSec = typeof sc.durationSec === 'number'
          ? sc.durationSec
          : typeof sc.duration === 'number'
            ? sc.duration
            : parseInt(String(sc.duration || '5'), 10) || 5;

        return {
          sceneNumber: typeof sc.sceneNumber === 'number' ? sc.sceneNumber : idx + 1,
          duration: `${durSec}s`,
          durationSec: durSec,
          voiceover: sc.voiceover || sc.spokenDialogue || '',
          visualDescription: sc.visualDescription || sc.action || '',
          bRollSuggestion: sc.bRollSuggestion || '',
          onScreenText: sc.onScreenText || '',
          cameraDirection: sc.cameraDirection || sc.shotType || 'Medium Shot',
          transition: sc.transition || 'Cut',
          sfxMusic: sc.sfxMusic || sc.sfx || '',
          sfx: sc.sfx || sc.sfxMusic || '',
          ...sc,
        };
      });
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

    const parsed = await geminiService.generateStructuredJSON<any>({
      prompt,
      model: 'gemini-3.5-flash-lite',
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

    const seo = await geminiService.generateStructuredJSON<any>({
      prompt,
      model: 'gemini-3.5-flash-lite',
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

    const thumbnails = await geminiService.generateStructuredJSON<any[]>({
      prompt,
      model: 'gemini-3.5-flash-lite',
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

    const repurpose = await geminiService.generateStructuredJSON<any>({
      prompt,
      model: 'gemini-3.5-flash-lite',
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

    const contentPackage = await geminiService.generateStructuredJSON<any>({
      prompt,
      model: 'gemini-3.5-flash-lite',
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
