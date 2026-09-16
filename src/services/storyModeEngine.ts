import { STORY_MODE_PROFILES, ALL_STORY_MODES } from '../config/storyModes';
import type {
  StoryMode,
  StoryModeProfile,
  StoryModeDetection,
  StoryModeDetectionInput,
} from '../types/storyMode';

/**
 * MintMind AI - Adaptive Story Mode Engine
 * Centralized business logic, mode profile resolution, prompt contextualization,
 * and intelligent classification fallbacks.
 */

export function getStoryModeProfile(mode?: StoryMode | string): StoryModeProfile {
  if (mode && mode in STORY_MODE_PROFILES) {
    return STORY_MODE_PROFILES[mode as StoryMode];
  }
  return STORY_MODE_PROFILES.Documentary;
}

export function getAllStoryModes(): StoryModeProfile[] {
  return ALL_STORY_MODES.map((id) => STORY_MODE_PROFILES[id]);
}

/**
 * Checks if a string is a valid StoryMode
 */
export function isValidStoryMode(mode: any): mode is StoryMode {
  return typeof mode === 'string' && mode in STORY_MODE_PROFILES;
}

/**
 * Generates prompt instructions for Gemini adapting to the selected primary & secondary story modes,
 * handling Short-Form (Shorts, Reels, Stories) vs Long-Form dynamics cleanly.
 */
export function buildStoryModePromptContext(params: {
  primaryMode?: StoryMode;
  secondaryModes?: StoryMode[];
  platform?: string;
  duration?: string;
  contentType?: string;
}): string {
  const { primaryMode = 'Documentary', secondaryModes = [], platform = 'YouTube Long-form' } = params;

  const primaryProfile = getStoryModeProfile(primaryMode);
  const secondaryProfiles = secondaryModes
    .filter((m) => m !== primaryMode && isValidStoryMode(m))
    .map((m) => getStoryModeProfile(m));

  const isShortForm =
    platform.includes('Short') || platform.includes('Reel') || platform.includes('Story');

  const formatGuidance = isShortForm
    ? `=== SHORT-FORM VERTICAL ADAPTATION (${platform}) ===
- Pacing Rule: ${primaryProfile.shortFormAdjustment}
- Scene Frequency: Rapid cuts every 2-4 seconds. Maximize visual retention and immediate sensory hook within the first 1-2 seconds.
- Spoken Hook: Punchy, zero filler words, immediate conflict/mystery/curiosity gap.
- Captioning & Graphics: High energy, keyword-emphasized, kinetic on-screen text.`
    : `=== LONG-FORM EXPANSIVE ADAPTATION (${platform}) ===
- Narrative Flow: ${primaryProfile.longFormAdjustment}
- Scene Rhythm: Deliberate cinematic progression with varied scene pacing (scene density: ${primaryProfile.sceneDensity}).
- Spoken Hook: Multi-layered thesis question, compelling cinematic setup, and progressive chapter payoffs.
- Sound & Lighting: Rich motivated atmosphere, evolving themes, and nuanced storytelling.`;

  const secondaryGuidance =
    secondaryProfiles.length > 0
      ? `\n=== SECONDARY MODE INFLUENCES ===
${secondaryProfiles
  .map(
    (sec) =>
      `• ${sec.label}: Borrow creative elements like ${sec.hookStyle.slice(0, 70)}... Infuse visual tone: "${sec.visualStyle.slice(0, 80)}" and sound design accents: "${sec.musicDirection.slice(0, 80)}".`
  )
  .join('\n')}`
      : '';

  return `
[MINTMIND ADAPTIVE STORY MODE ENGINE CONFIGURATION]
Active Primary Mode: ${primaryProfile.label} (${primaryProfile.category})
Core Narrative Structure: ${primaryProfile.narrativeStructure}
Pacing Signature: ${primaryProfile.pacing.toUpperCase()}
Hook Style Directive: ${primaryProfile.hookStyle}
Narration Tone Directive: ${primaryProfile.narrationStyle}
Visual Aesthetic Directive: ${primaryProfile.visualStyle}
Camera Movement & Framing: ${primaryProfile.cameraStyle}
Lighting Atmosphere: ${primaryProfile.lightingStyle}
Music Direction: ${primaryProfile.musicDirection}
Sound Design / SFX: ${primaryProfile.soundDirection}
Transition Style: ${primaryProfile.transitionStyle}
Thumbnail Concept Direction: ${primaryProfile.thumbnailDirection}
Title Direction: ${primaryProfile.titleDirection}

${formatGuidance}
${secondaryGuidance}

INSTRUCTIONS FOR GEMINI SCRIPT & SCENE ADAPTATION:
1. Ensure the spoken script narration meticulously reflects the Primary Mode's narration tone ("${primaryProfile.narrationStyle}").
2. In the scene-by-scene breakdown, explicitly annotate camera directions, lighting moods, visual descriptions, and music/SFX using this mode profile.
3. Apply the appropriate pacing (${primaryProfile.pacing}) matching the video duration and platform.
`;
}

/**
 * Heuristic classifier for fast, instant client-side prediction or offline fallback
 */
export function heuristicDetectStoryMode(input: StoryModeDetectionInput): StoryModeDetection {
  const text = `${input.topic || ''} ${input.title || ''} ${input.idea || ''} ${input.content || ''} ${input.audience || ''}`.toLowerCase();

  const rules: Array<{ mode: StoryMode; secondary: StoryMode[]; keywords: string[]; score: number }> = [
    {
      mode: 'Crime',
      secondary: ['Investigation', 'Mystery', 'Thriller'],
      keywords: ['murder', 'heist', 'robbery', 'killer', 'detective', 'cartel', 'fbi', 'police', 'investigation', 'cold case', 'evidence', 'crime', 'courtroom', 'trial', 'mafia'],
      score: 0,
    },
    {
      mode: 'Horror',
      secondary: ['Thriller', 'Psychological', 'Mystery'],
      keywords: ['ghost', 'haunted', 'monster', 'creepy', 'nightmare', 'terrifying', 'scary', 'demon', 'paranormal', 'horror', 'entity', 'evil', 'blood', 'curse', 'abandoned hospital'],
      score: 0,
    },
    {
      mode: 'Sci-Fi',
      secondary: ['Technology', 'Space', 'Post-Apocalyptic'],
      keywords: ['ai', 'cyborg', 'robot', 'artificial intelligence', 'future', 'quantum', 'simulation', 'timeline', 'android', '2050', 'nanotech', 'cyberpunk', 'metaverse', 'singularity'],
      score: 0,
    },
    {
      mode: 'Space',
      secondary: ['Sci-Fi', 'Documentary', 'Adventure'],
      keywords: ['space', 'nasa', 'astronomy', 'planet', 'mars', 'galaxy', 'black hole', 'telescope', 'spacex', 'orbit', 'solar system', 'universe', 'alien', 'cosmos', 'star'],
      score: 0,
    },
    {
      mode: 'War History',
      secondary: ['Historical', 'Documentary', 'Action'],
      keywords: ['wwii', 'ww1', 'world war', 'battle', 'soldier', 'army', 'tank', 'navy', 'vietnam', 'general', 'infantry', 'blitzkrieg', 'artillery', 'military', 'invasion'],
      score: 0,
    },
    {
      mode: 'Historical',
      secondary: ['Documentary', 'Biography', 'War History'],
      keywords: ['history', 'ancient', 'rome', 'egypt', 'empire', 'century', 'dynasty', 'medieval', 'civilization', 'monarch', 'king', 'queen', 'revolution', 'archaeology'],
      score: 0,
    },
    {
      mode: 'Biography',
      secondary: ['Documentary', 'Drama', 'Explainer'],
      keywords: ['biography', 'story of', 'life of', 'who was', 'founder', 'steve jobs', 'elon musk', 'built an empire', 'humble beginnings', 'billionaire', 'childhood', 'legacy'],
      score: 0,
    },
    {
      mode: 'Technology',
      secondary: ['Explainer', 'Educational', 'Sci-Fi'],
      keywords: ['iphone', 'gadget', 'review', 'benchmark', 'software', 'apple', 'nvidia', 'hardware', 'laptop', 'gpu', 'code', 'coding', 'developer', 'unboxing', 'specs'],
      score: 0,
    },
    {
      mode: 'Gaming',
      secondary: ['Action', 'Comedy', 'Entertainment' as any],
      keywords: ['game', 'gameplay', 'gta', 'minecraft', 'playstation', 'xbox', 'nintendo', 'esports', 'fortnite', 'roblox', 'speedrun', 'boss fight', 'rpg', 'fps', 'gamer'],
      score: 0,
    },
    {
      mode: 'Sports',
      secondary: ['Action', 'Biography', 'Documentary'],
      keywords: ['football', 'nba', 'soccer', 'athlete', 'champion', 'olympics', 'tennis', 'messi', 'ronaldo', 'lebron', 'nfl', 'ufc', 'boxing', 'score', 'comeback'],
      score: 0,
    },
    {
      mode: 'Travel',
      secondary: ['Adventure', 'Documentary', 'Explainer'],
      keywords: ['travel', 'flight', 'japan', 'country', 'city', 'hotel', 'island', 'vacation', 'hidden gems', 'backpacking', 'culture', 'street food', 'tourism', 'visit'],
      score: 0,
    },
    {
      mode: 'Adventure',
      secondary: ['Survival', 'Travel', 'Action'],
      keywords: ['expedition', 'mountain', 'summit', 'everest', 'hike', 'climbing', 'jungle', 'explore', 'wilderness', 'survival', 'kayak', 'desert', 'extreme'],
      score: 0,
    },
    {
      mode: 'Survival',
      secondary: ['Adventure', 'Action', 'Psychological'],
      keywords: ['stranded', 'desert island', 'survival', 'surviving 24 hours', 'shelter', 'calories', 'frostbite', 'hypothermia', 'wilderness survival', 'emergency'],
      score: 0,
    },
    {
      mode: 'Comedy',
      secondary: ['Drama', 'Explainer', 'Custom'],
      keywords: ['funny', 'hilarious', 'laugh', 'meme', 'comedy', 'prank', 'joke', 'parody', 'satire', 'cringe', 'awkward', 'absurd', 'humor', 'skit'],
      score: 0,
    },
    {
      mode: 'Mystery',
      secondary: ['Crime', 'Investigation', 'Thriller'],
      keywords: ['mystery', 'unexplained', 'unsolved', 'baffling', 'vanished', 'disappearance', 'anomalous', 'conspiracy', 'enigma', 'cryptic', 'clues', 'bermuda triangle'],
      score: 0,
    },
    {
      mode: 'Investigation',
      secondary: ['Documentary', 'Crime', 'News'],
      keywords: ['expose', 'scam', 'fraud', 'whistleblower', 'investigation', 'leaked', 'documents', 'uncovered', 'truth behind', 'scandal', 'corruption', 'money trail'],
      score: 0,
    },
    {
      mode: 'Psychological',
      secondary: ['Thriller', 'Educational', 'Mystery'],
      keywords: ['psychology', 'brain', 'mind', 'cognitive', 'bias', 'gaslight', 'manipulation', 'subconscious', 'mental', 'behavior', 'habit', 'dopamine', 'psychological'],
      score: 0,
    },
    {
      mode: 'Explainer',
      secondary: ['Educational', 'Technology', 'Documentary'],
      keywords: ['how it works', 'explained', 'why do', 'what happens if', 'the math behind', 'breakdown', 'mechanism', 'visualized', 'system works', 'in 5 minutes'],
      score: 0,
    },
    {
      mode: 'Educational',
      secondary: ['Explainer', 'Technology', 'Documentary'],
      keywords: ['tutorial', 'guide', 'masterclass', 'course', 'learn', 'lesson', 'study', 'principles', 'fundamentals', 'step by step', 'how to'],
      score: 0,
    },
    {
      mode: 'News',
      secondary: ['Investigation', 'Explainer', 'Documentary'],
      keywords: ['breaking', 'urgent', 'announcement', 'crisis', 'election', 'policy', 'economy', 'inflation', 'stock market', 'geopolitics', 'summit', 'press conference'],
      score: 0,
    },
    {
      mode: 'Action',
      secondary: ['Thriller', 'Adventure', 'Superhero'],
      keywords: ['stunt', 'chase', 'explosion', 'danger', 'extreme', 'high speed', 'intense', 'combat', 'fight', 'action packed', 'adrenaline'],
      score: 0,
    },
    {
      mode: 'Thriller',
      secondary: ['Drama Thriller', 'Crime', 'Psychological'],
      keywords: ['suspense', 'paranoia', 'countdown', 'deadly', 'trapped', 'escape', 'hostage', 'betrayal', 'twist', 'cliffhanger', 'tension'],
      score: 0,
    },
    {
      mode: 'Superhero',
      secondary: ['Action', 'Sci-Fi', 'Fantasy'],
      keywords: ['superhero', 'powers', 'villain', 'marvel', 'dc', 'batman', 'superman', 'comic', 'avengers', 'mutant', 'save the city', 'hero'],
      score: 0,
    },
    {
      mode: 'Post-Apocalyptic',
      secondary: ['Survival', 'Sci-Fi', 'Thriller'],
      keywords: ['apocalypse', 'wasteland', 'fallout', 'after the end', 'ruins', 'nuclear', 'extinction', 'civilization ended', 'zombie', 'scavenger'],
      score: 0,
    },
    {
      mode: 'Fantasy',
      secondary: ['Adventure', 'Mystery', 'Cinematic Story'],
      keywords: ['magic', 'dragon', 'wizard', 'spells', 'realm', 'mythology', 'enchanted', 'legendary weapon', 'sorcery', 'kingdom', 'elves'],
      score: 0,
    },
    {
      mode: 'Romance',
      secondary: ['Drama', 'Comedy', 'Cinematic Story'],
      keywords: ['love', 'dating', 'relationship', 'heartbreak', 'romantic', 'crush', 'wedding', 'soulmate', 'intimacy', 'chemistry', 'affair'],
      score: 0,
    },
    {
      mode: 'Drama',
      secondary: ['Psychological', 'Cinematic Story', 'Biography'],
      keywords: ['emotional', 'tragedy', 'moral dilemma', 'family secret', 'personal loss', 'sacrifice', 'tears', 'heartfelt', 'human struggle'],
      score: 0,
    },
    {
      mode: 'Cinematic Story',
      secondary: ['Drama', 'Documentary', 'Adventure'],
      keywords: ['cinematic', 'epic story', 'film', 'odyssey', 'short film', 'visual poem', 'narrative', 'journey'],
      score: 0,
    },
  ];

  for (const rule of rules) {
    for (const kw of rule.keywords) {
      if (text.includes(kw)) {
        rule.score += kw.includes(' ') ? 3 : 1;
      }
    }
  }

  rules.sort((a, b) => b.score - a.score);
  const best = rules[0];

  if (best && best.score > 0) {
    const rawConfidence = Math.min(94, 60 + best.score * 5);
    return {
      primaryMode: best.mode,
      secondaryModes: best.secondary.slice(0, 2),
      confidence: rawConfidence,
      reasoning: `Content strongly aligns with ${best.mode} narrative patterns based on topic keywords and thematic focus.`,
    };
  }

  // Safe fallback
  return {
    primaryMode: 'Documentary',
    secondaryModes: ['Explainer', 'Investigation'],
    confidence: 68,
    reasoning: 'Balanced informational storytelling with observational structure suited to creator audience.',
  };
}
