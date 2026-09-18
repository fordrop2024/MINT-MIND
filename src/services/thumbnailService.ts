/**
 * MintMind AI - AI Thumbnail Concept & Visual Packaging Engine
 *
 * Generates high-CTR thumbnail concepts, visual art prompts (Midjourney v6, Flux, DALL-E 3),
 * color harmonies, and typography compositions contextualized by Script Content & Story Mode.
 */

import type { ThumbnailConcept, Script, ScriptScene } from '../types/script';
import type { StoryMode } from '../types/storyMode';

export interface ThumbnailGenerationParams {
  title: string;
  topic: string;
  conceptText?: string;
  storyMode?: StoryMode | string;
  scenes?: ScriptScene[];
  aspectRatio?: '16:9' | '9:16';
  targetAudience?: string;
}

export interface StoryModeThumbnailProfile {
  lighting: string;
  colorTheory: string;
  composition: string;
  recommendedFont: string;
  palette: string[];
  contrastKeywords: string[];
}

export const STORY_MODE_THUMBNAIL_STYLES: Record<string, StoryModeThumbnailProfile> = {
  Documentary: {
    lighting: 'Natural cinematic golden hour with deep shadow falloff, 35mm film grain, Hasselblad aesthetic',
    colorTheory: 'Muted earth tones with punchy warm amber focal contrast',
    composition: 'Rule of thirds, intense subject eye contact, authentic human grit and historical resonance',
    recommendedFont: 'Montserrat Black',
    palette: ['#0f172a', '#f59e0b', '#78350f', '#f8fafc'],
    contrastKeywords: ['EXPOSED', 'THE UNTOLD STORY', 'WHAT HAPPENED?'],
  },
  'Tech Explainer': {
    lighting: 'Crisp studio key light with sharp 5600K rim light, subtle blue ambient bounce, ultra-clean reflections',
    colorTheory: 'Futuristic Electric Cyan (#00f0ff) contrasting against deep Obsidian Charcoal (#090d16)',
    composition: 'Subject presenting a floating holographic or glowing 3D diagram, center weighted with diagonal energy',
    recommendedFont: 'Impact Bold',
    palette: ['#090d16', '#06b6d4', '#3b82f6', '#ffffff'],
    contrastKeywords: ['10X FASTER', 'IT FINALLY HAPPENED', 'DO THIS INSTEAD'],
  },
  'Cyberpunk Neon': {
    lighting: 'Volumetric wet-street neon reflections, split teal and magenta rim lighting, anamorphic lens flares',
    colorTheory: 'Hyper-saturated Neon Pink and Electric Cyan over dystopian dark tones',
    composition: 'Low-angle wide shot, glowing interface reflections on subject sunglasses or eyes',
    recommendedFont: 'Bebas Neue',
    palette: ['#050510', '#ec4899', '#06b6d4', '#facc15'],
    contrastKeywords: ['THE FUTURE IS HERE', 'GLITCH DETECTED', 'DO NOT TOUCH'],
  },
  'Action Thriller': {
    lighting: 'Extreme contrast chiaroscuro, explosive amber backfire, dynamic motion blur on edges',
    colorTheory: 'Teal and Orange Hollywood blockbuster color grade',
    composition: 'Dynamic tilted Dutch angle, high-speed foreground debris, extreme subject tension',
    recommendedFont: 'Impact Bold',
    palette: ['#0b0f19', '#ea580c', '#38bdf8', '#ffffff'],
    contrastKeywords: ['RUN NOW', 'CRITICAL ERROR', 'WARNING'],
  },
  'Noir Mystery': {
    lighting: 'Venetian blind window cast shadows, intense single-source spotlight, smoke atmosphere',
    colorTheory: 'Desaturated monochrome with a single vivid crimson accent element',
    composition: 'Subject half in deep shadow, magnifying glass or spotlight revealing a shocking piece of evidence',
    recommendedFont: 'Oswald Bold',
    palette: ['#030712', '#dc2626', '#9ca3af', '#ffffff'],
    contrastKeywords: ['WHO DID THIS?', 'FOUND EVIDENCE', 'SECRET REVEALED'],
  },
  'Luxury Showcase': {
    lighting: 'Soft diffused high-end studio illumination, specular highlights on polished titanium and crystal',
    colorTheory: 'Champagne Gold and Deep Onyx Black with ultra-clean white typography',
    composition: 'Minimalist symmetrical hero framing, extreme macro texture detail, museum-grade elegance',
    recommendedFont: 'Cinzel Decorative',
    palette: ['#0a0a0a', '#fbbf24', '#71717a', '#ffffff'],
    contrastKeywords: ['WORTH $10M?', 'THE ELITE SECRET', 'PURE LUXURY'],
  },
  'Educational Academy': {
    lighting: 'Bright, welcoming key lighting, soft background gradient, crystal-clear whiteboard or tablet clarity',
    colorTheory: 'Emerald Green (#10b981) and Slate Navy with clean yellow callout badges',
    composition: 'Instructor pointing with high clarity towards simplified 3-step visual or diagram with big red arrow',
    recommendedFont: 'Montserrat Black',
    palette: ['#0f172a', '#10b981', '#facc15', '#ffffff'],
    contrastKeywords: ['LEARN THIS IN 5 MIN', 'STEP-BY-STEP', 'STOP STUDYING WRONG'],
  },
  'Cinematic Drama': {
    lighting: 'Soft directional moonlight meeting warm tungsten fill, cinematic 2.39:1 anamorphic crop feel',
    colorTheory: 'Rich cinematic film emulation, Kodachrome warm skin tones with deep velvet blacks',
    composition: 'Emotional portrait with intense storytelling eyes looking just off-camera at a dramatic light source',
    recommendedFont: 'Oswald Bold',
    palette: ['#020617', '#e11d48', '#fbbf24', '#f1f5f9'],
    contrastKeywords: ['I WAS WRONG', 'THE END OF AN ERA', 'MY BIGGEST MISTAKE'],
  },
};

/**
 * Gets thumbnail aesthetic profile based on story mode.
 */
export function getThumbnailStyleProfile(storyMode?: StoryMode | string): StoryModeThumbnailProfile {
  const modeKey = storyMode || 'Tech Explainer';
  return STORY_MODE_THUMBNAIL_STYLES[modeKey] || STORY_MODE_THUMBNAIL_STYLES['Tech Explainer'];
}

/**
 * Generates prompt strings formatted specifically for Midjourney v6, Flux, and DALL-E 3.
 */
export function formatImageModelPrompts(
  concept: {
    subject: string;
    setting: string;
    lighting: string;
    camera: string;
    colorGrade: string;
  },
  aspectRatio: '16:9' | '9:16' = '16:9'
): { midjourney: string; flux: string; dalle: string } {
  const arTag = aspectRatio === '9:16' ? '--ar 9:16' : '--ar 16:9';

  const midjourney = `YouTube thumbnail photography of ${concept.subject}, ${concept.setting}, ${concept.lighting}, ${concept.camera}, dramatic depth of field, vivid dynamic color contrast, expressive facial emotion, clean negative space for text on one side ${arTag} --v 6.0 --style raw --c 5`;

  const flux = `Masterpiece cinematic commercial YouTube thumbnail portrait, ${concept.subject}, ${concept.setting}, ${concept.lighting}, high-end commercial octane render 8k resolution, raytracing, sharp facial focus, color graded in ${concept.colorGrade}, photorealistic, studio photography`;

  const dalle = `A high-impact YouTube video thumbnail showing ${concept.subject} in a ${concept.setting}. The scene is lit with ${concept.lighting}. Extremely clear composition with high visual contrast and an expressive focal subject. Leave the top-left area clean and uncluttered.`;

  return { midjourney, flux, dalle };
}

/**
 * Generates high-CTR thumbnail concepts algorithmically.
 */
export function generateAlgorithmicThumbnails(params: ThumbnailGenerationParams): ThumbnailConcept[] {
  const { topic, title, storyMode = 'Tech Explainer', aspectRatio = '16:9' } = params;
  const style = getThumbnailStyleProfile(storyMode);
  const cleanTopic = topic.trim() || 'Modern Innovation';

  // 1. Emotion / Shock Factor Concept
  const prompts1 = formatImageModelPrompts(
    {
      subject: `creator with intense shocked expression, mouth open in disbelief, eyes looking directly at a glowing object`,
      setting: `darkened minimalist creator studio with subtle colored backlights`,
      lighting: style.lighting,
      camera: `shot on Sony A7S III with 85mm f/1.4 G Master lens, razor sharp eye focus`,
      colorGrade: style.colorTheory,
    },
    aspectRatio
  );

  const concept1: ThumbnailConcept = {
    id: `thumb-emotion-${Date.now()}-1`,
    conceptTitle: 'Extreme Emotion & Reaction Shock',
    visualDescription: `Subject on the right 40% of the frame with an intense, genuine expression of shock, pointing or staring at a glowing visual representation of ${cleanTopic} on the left.`,
    layoutDescription: `Subject positioned right-third facing left. High contrast electric glow emanating from left element. Negative space across top-left for 3-word punchy text overlay.`,
    colorTheory: `${style.palette[1]} high-energy accent contrasting sharply against ${style.palette[0]} dark background.`,
    primaryTextOverlay: `NEVER DO THIS!`,
    secondaryTextOverlay: `(FATAL MISTAKE)`,
    focalPoint: `Wide expressive eyes pointing viewer attention to the central proof graphic.`,
    predictedCTRRating: '12.8% - Outlier Potential',
    aspectRatio,
    midjourneyPrompt: prompts1.midjourney,
    fluxPrompt: prompts1.flux,
    dallePrompt: prompts1.dalle,
    colorPalette: style.palette,
    textColor: '#ffffff',
    textBgColor: '#dc2626',
    overlayText: 'NEVER DO THIS!',
    estimatedCTR: '12.8%',
    layoutDiagram: 'Right 40% Subject | Left 60% Glowing Subject & Big Text',
    fontFamily: style.recommendedFont,
    fontSize: 54,
    textPosition: 'top-left',
  };

  // 2. High-Contrast Object / Result Proof Concept
  const prompts2 = formatImageModelPrompts(
    {
      subject: `oversized dramatic glowing trophy or holographic 3D benchmark graph showing 10X growth for ${cleanTopic}`,
      setting: `sleek cinematic pedestal surrounded by subtle atmospheric smoke and beam lights`,
      lighting: `dual tone rim lighting, intense specular highlights on glossy surfaces`,
      camera: `shot on Hasselblad H6D-100c with macro 120mm lens`,
      colorGrade: style.colorTheory,
    },
    aspectRatio
  );

  const concept2: ThumbnailConcept = {
    id: `thumb-proof-${Date.now()}-2`,
    conceptTitle: '10X Result & Tangible Proof',
    visualDescription: `A giant, impossible-to-miss tangible proof metric: glowing 3D growth curve with vibrant arrow shooting through the roof, casting colorful reflections.`,
    layoutDescription: `Center punch composition. Huge, bold before-and-after contrast with bold green checkmark badge.`,
    colorTheory: `Vivid Emerald Green (#10b981) and Golden Amber (#f59e0b) over Obsidian Charcoal.`,
    primaryTextOverlay: `IT FINALLY WORKS!`,
    secondaryTextOverlay: `(10X SPEED)`,
    focalPoint: `The upward shooting green glow trajectory dominating visual attention.`,
    predictedCTRRating: '11.4% - Proven Evergreen',
    aspectRatio,
    midjourneyPrompt: prompts2.midjourney,
    fluxPrompt: prompts2.flux,
    dallePrompt: prompts2.dalle,
    colorPalette: [style.palette[0], '#10b981', '#f59e0b', '#ffffff'],
    textColor: '#ffffff',
    textBgColor: '#10b981',
    overlayText: 'IT FINALLY WORKS!',
    estimatedCTR: '11.4%',
    layoutDiagram: 'Centered Hero Graphic | Big Top Left Text | Bottom Right UI Safe',
    fontFamily: 'Impact Bold',
    fontSize: 52,
    textPosition: 'top-left',
  };

  // 3. Curiosity Intrigue / Story Mystery Concept
  const prompts3 = formatImageModelPrompts(
    {
      subject: `silhouette of an investigator inspecting a mysterious glowing document or device with ${cleanTopic} secrets`,
      setting: `foggy mysterious vault chamber with single golden light leak from vault door`,
      lighting: `intense backlight creating silhouette with dramatic gold rim lighting`,
      camera: `cinematic 35mm anamorphic prime lens with horizontal flare`,
      colorGrade: `Deep teal shadows with rich amber warm light`,
    },
    aspectRatio
  );

  const concept3: ThumbnailConcept = {
    id: `thumb-mystery-${Date.now()}-3`,
    conceptTitle: 'Forbidden Secret / Curiosity Gap',
    visualDescription: `A secretive vault scene where a mysterious glowing document or device is partially visible, creating an irresistible curiosity itch to click and uncover.`,
    layoutDescription: `Subject in silhouette on the left, spotlight slicing across the center highlighting an unanswered question.`,
    colorTheory: `High contrast Chiaroscuro with warm gold spotlight on deep navy canvas.`,
    primaryTextOverlay: `THE SECRET IS OUT`,
    secondaryTextOverlay: `(THEY HID THIS)`,
    focalPoint: `The glowing focal object hidden just behind the shadow edge.`,
    predictedCTRRating: '13.2% - High Curiosity Velocity',
    aspectRatio,
    midjourneyPrompt: prompts3.midjourney,
    fluxPrompt: prompts3.flux,
    dallePrompt: prompts3.dalle,
    colorPalette: [style.palette[0], '#f59e0b', '#06b6d4', '#ffffff'],
    textColor: '#fef08a',
    textBgColor: '#000000',
    overlayText: 'THE SECRET IS OUT',
    estimatedCTR: '13.2%',
    layoutDiagram: 'Left Silhouette | Center Spotlight | Bold Contrast Text',
    fontFamily: 'Oswald Bold',
    fontSize: 56,
    textPosition: 'center',
  };

  // 4. Comparative Split / "Do This vs That" Concept
  const prompts4 = formatImageModelPrompts(
    {
      subject: `split screen comparison, left side shows chaotic broken red error interface, right side shows sleek flawless futuristic green success setup for ${cleanTopic}`,
      setting: `clean split screen with diagonal laser cut divider line in center`,
      lighting: `left side red ominous lighting, right side clean daylight with golden sun beam`,
      camera: `straight-on eye level symmetry`,
      colorGrade: `Red vs Green psychological polarity`,
    },
    aspectRatio
  );

  const concept4: ThumbnailConcept = {
    id: `thumb-split-${Date.now()}-4`,
    conceptTitle: 'Before vs After / Do This Not That',
    visualDescription: `A high-contrast 50/50 split. The left side showcases the painful, outdated method with a red X; the right side showcases the effortless new solution with a green checkmark.`,
    layoutDescription: `Vertical or diagonal split division with big visual polarity. Clear visual comparison without needing to read complex text.`,
    colorTheory: `Crimson Red (#ef4444) on Left vs Emerald Green (#10b981) on Right.`,
    primaryTextOverlay: `OLD WAY vs NEW WAY`,
    secondaryTextOverlay: `(99% FAIL)`,
    focalPoint: `The stark contrast dividing line and green success result.`,
    predictedCTRRating: '10.9% - High Broad Audience Appeal',
    aspectRatio,
    midjourneyPrompt: prompts4.midjourney,
    fluxPrompt: prompts4.flux,
    dallePrompt: prompts4.dalle,
    colorPalette: ['#ef4444', '#10b981', '#090d16', '#ffffff'],
    textColor: '#ffffff',
    textBgColor: '#0f172a',
    overlayText: 'OLD WAY vs NEW WAY',
    estimatedCTR: '10.9%',
    layoutDiagram: '50% Left Red Failure | 50% Right Green Triumph',
    fontFamily: 'Impact Bold',
    fontSize: 48,
    textPosition: 'top-left',
  };

  return [concept1, concept2, concept3, concept4];
}

/**
 * Generates thumbnail concepts with Gemini AI via `/api/ai/generate-thumbnails`
 * with seamless fallback to story-mode algorithmic generation.
 */
export async function generateThumbnailsWithAI(params: ThumbnailGenerationParams): Promise<ThumbnailConcept[]> {
  const { title, topic, conceptText = '', storyMode = 'Tech Explainer', aspectRatio = '16:9' } = params;

  try {
    const res = await fetch('/api/ai/generate-thumbnails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        concept: `${conceptText || topic} (Story Mode: ${storyMode}, Aspect Ratio: ${aspectRatio})`,
        platform: aspectRatio === '9:16' ? 'YouTube Shorts' : 'YouTube',
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.thumbnails) && data.thumbnails.length > 0) {
        const style = getThumbnailStyleProfile(storyMode);

        return data.thumbnails.map((item: any, idx: number) => {
          const prompts = formatImageModelPrompts(
            {
              subject: item.focalPoint || item.visualDescription || topic,
              setting: `${storyMode} video scene`,
              lighting: style.lighting,
              camera: '85mm portrait lens, f/1.4 aperture',
              colorGrade: item.colorTheory || style.colorTheory,
            },
            aspectRatio
          );

          return {
            id: item.id || `ai-thumb-${idx + 1}-${Date.now()}`,
            conceptTitle: item.conceptTitle || `Concept #${idx + 1}`,
            visualDescription: item.visualDescription || '',
            layoutDescription: item.layoutDescription || '',
            colorTheory: item.colorTheory || style.colorTheory,
            primaryTextOverlay: item.primaryTextOverlay || 'WATCH THIS',
            secondaryTextOverlay: item.secondaryTextOverlay || '',
            focalPoint: item.focalPoint || '',
            predictedCTRRating: item.predictedCTRRating || '11.2% - High Probability',
            aspectRatio,
            midjourneyPrompt: item.midjourneyPrompt || prompts.midjourney,
            fluxPrompt: item.fluxPrompt || prompts.flux,
            dallePrompt: item.dallePrompt || prompts.dalle,
            colorPalette: style.palette,
            textColor: '#ffffff',
            textBgColor: '#dc2626',
            overlayText: item.primaryTextOverlay || 'WATCH THIS',
            estimatedCTR: item.predictedCTRRating || '11.2%',
            layoutDiagram: item.layoutDescription || 'Subject on right third, bold text top left',
            fontFamily: style.recommendedFont,
            fontSize: 52,
            textPosition: 'top-left' as const,
          };
        });
      }
    }
  } catch (err) {
    console.warn('Gemini thumbnail endpoint unavailable, using algorithmic generator:', err);
  }

  return generateAlgorithmicThumbnails(params);
}
