import type {
  ScriptScene,
  EnhancedMediaPrompts,
  CameraSettings,
  AudioMetadataPrompt,
  SceneMediaStatus,
  StoryMode,
} from '../types/scene';
import type { MediaAsset } from '../types/mediaAsset';
import { enhanceMediaPromptsAPI } from './aiService';

export interface EnhancePromptOptions {
  storyMode?: StoryMode;
  aspectRatio?: '16:9' | '9:16';
  projectContext?: {
    title?: string;
    topic?: string;
    visualStyle?: string;
    subjectAnchor?: string;
    platform?: string;
  };
}

/**
 * Story Mode specific visual direction palettes, lens selections, and lighting styles
 */
interface StoryModeVisualProfile {
  lens: string;
  aperture: string;
  shutter: string;
  sensor: string;
  movementStyle: string;
  lightingMood: string;
  colorGrade: string;
  voiceStyle: string;
  pacingWPM: number;
  emotion: string;
  recommendedVoice: string;
  musicBpm: string;
}

const STORY_MODE_PROFILES: Record<string, StoryModeVisualProfile> = {
  Documentary: {
    lens: '35mm Cook Anamorphic Prime',
    aperture: 'f/2.8',
    shutter: '1/50 sec 180° cinematic shutter',
    sensor: 'ARRI Alexa 35 Large Format',
    movementStyle: 'Slow organic push-in with subtle handheld stabilization',
    lightingMood: 'Naturalistic ambient window light with gentle warm bounce',
    colorGrade: 'Kodak Vision3 500T 5219 filmic LUT, muted natural earthy tones with deep soft blacks',
    voiceStyle: 'Gravelly, authoritative, investigative, and measured cadence',
    pacingWPM: 135,
    emotion: 'Solemn reverence and profound journalistic intrigue',
    recommendedVoice: 'Adam (Deep Baritone) or George (Narrative Master)',
    musicBpm: '68 BPM - Minimalist acoustic cello, upright bass, and sustained analog synth pad',
  },
  'Narrative Drama': {
    lens: '50mm Master Prime T1.3',
    aperture: 'f/1.4 ultra-shallow depth of field',
    shutter: '1/48 sec cinematic standard',
    sensor: 'RED V-Raptor 8K VV',
    movementStyle: 'Tension-building slow tracking dolly',
    lightingMood: 'Chiaroscuro high-contrast side lighting with warm rim reflection and atmospheric haze',
    colorGrade: 'Filmic teal and deep tungsten amber split-toning with cinematic contrast curve',
    voiceStyle: 'Intimate, emotionally charged, nuanced whisper-to-crescendo delivery',
    pacingWPM: 140,
    emotion: 'High emotional stakes, psychological tension, and vulnerability',
    recommendedVoice: 'Marcus (Theatrical Baritone) or Sarah (Cinematic Drama)',
    musicBpm: '74 BPM - Swelling orchestral strings with subtle sub-bass pulse',
  },
  Educational: {
    lens: '28mm Zeiss Supreme Prime',
    aperture: 'f/4.0 sharp edge-to-edge clarity',
    shutter: '1/60 sec crisp shutter',
    sensor: 'Sony FX9 Full Frame 6K',
    movementStyle: 'Smooth 3-axis motorized gimbal pan and centered framing',
    lightingMood: 'Three-point softbox diffused key lighting with crisp clean separation backlight',
    colorGrade: 'Crisp vibrant rec.709 with true whites and engaging, saturated chromatic balance',
    voiceStyle: 'Energetic, articulate, inviting, and crystal-clear explanatory rhythm',
    pacingWPM: 155,
    emotion: 'Infectious intellectual curiosity and engaging clarity',
    recommendedVoice: 'Rachel (Intelligent Educator) or Josh (Approachable Mentor)',
    musicBpm: '110 BPM - Upbeat lo-fi modern acoustic beats and light plucks',
  },
  'High-Energy Promo': {
    lens: '18mm Ultra-Wide Cine Prime',
    aperture: 'f/2.0',
    shutter: '1/120 sec fast shutter with crisp motion freezing',
    sensor: 'ARRI Alexa Mini LF Open Gate',
    movementStyle: 'Dynamic whip-pan, hyper-fast push-in, and orbital rotation',
    lightingMood: 'Hyper-stylized cyberpunk neon rim lighting with deep volumetric laser haze',
    colorGrade: 'Ultra-punchy high-saturation commercial grade with crushed blacks and luminous highlights',
    voiceStyle: 'Fast-paced, punchy, declarative, high-octane motivational hype',
    pacingWPM: 175,
    emotion: 'Unstoppable adrenaline, relentless momentum, and triumphant excitement',
    recommendedVoice: 'Antony (Bold Commercial) or Chris (High-Octane)',
    musicBpm: '128 BPM - Heavy electronic synthwave bassline with explosive percussion hits',
  },
  Entertainment: {
    lens: '40mm Panavision C-Series Anamorphic',
    aperture: 'f/2.0',
    shutter: '1/50 sec 180° shutter',
    sensor: 'ARRI Alexa 35',
    movementStyle: 'Smooth cinematic crane descent into tracking push',
    lightingMood: 'Golden hour warm backlighting with cinematic lens flare streak',
    colorGrade: 'Rich cinematic blockbuster grade, warm skin tones, and rich cyan-toned shadows',
    voiceStyle: 'Charismatic, humorous, dynamic pacing with sharp comedic or dramatic beats',
    pacingWPM: 160,
    emotion: 'Playful intrigue, charismatic charm, and captivating showmanship',
    recommendedVoice: 'Sam (Dynamic Creator) or Nicole (Vibrant Presenter)',
    musicBpm: '118 BPM - Driving cinematic pop percussion and dynamic bassline',
  },
  Storytelling: {
    lens: '65mm Vintage Cooke Speed Panchro',
    aperture: 'f/2.0 dreamy bokeh',
    shutter: '1/48 sec vintage shutter',
    sensor: 'ARRI Amira Super 35',
    movementStyle: 'Gentle slider glide with delicate parallax shift',
    lightingMood: 'Soft ambient twilight with flickering candle/lantern warmth',
    colorGrade: 'Warm nostalgic 35mm film emulation with subtle halation and fine organic grain',
    voiceStyle: 'Hypnotic, lyrical, evocative, and deeply immersive oral storyteller cadence',
    pacingWPM: 130,
    emotion: 'Wonder, nostalgic longing, and transcendent discovery',
    recommendedVoice: 'David (Timeless Narrator) or Freya (Mythic Voice)',
    musicBpm: '64 BPM - Ethereal ambient piano, gentle woodwinds, and soft pads',
  },
};

/**
 * Generates an algorithmic, production-grade EnhancedMediaPrompts set
 * for any scene when offline or as a rock-solid fallback.
 */
export function buildAlgorithmicEnhancedPrompts(
  scene: ScriptScene,
  storyMode: StoryMode = 'Documentary',
  aspectRatio: '16:9' | '9:16' = '16:9',
  projectContext?: EnhancePromptOptions['projectContext']
): EnhancedMediaPrompts {
  const profile = STORY_MODE_PROFILES[storyMode] || STORY_MODE_PROFILES.Documentary;
  const isVertical = aspectRatio === '9:16';
  const arParam = isVertical ? '--ar 9:16' : '--ar 16:9';

  const visualCore =
    scene.visualDescription?.trim() ||
    scene.bRoll?.trim() ||
    scene.voiceover?.trim() ||
    `Cinematic visual composition for Scene ${scene.sceneNumber}`;

  const shotType = scene.shotType || 'Medium Shot';
  const movement = scene.cameraMovement || 'Slow Push-In / Dolly';
  const subjectAnchor =
    projectContext?.subjectAnchor ||
    projectContext?.topic ||
    'focal character / primary subject';

  // 1. Midjourney v6 Prompt
  const midjourneyPrompt = [
    `${shotType} of ${visualCore}`,
    `Subject focal anchor: ${subjectAnchor}`,
    `${profile.lightingMood}`,
    `Shot on ${profile.sensor}, ${profile.lens}, ${profile.aperture}`,
    `${profile.colorGrade}`,
    'photorealistic, 8k resolution, master cinematography, ray-traced reflections, highly detailed, raw documentary photography',
    `${arParam} --v 6.0 --style raw`,
  ].join(', ');

  // 2. Flux.1 Prompt
  const fluxPrompt = [
    `A cinematic masterpiece visual showing ${visualCore}.`,
    `Framing: ${shotType} with ${movement.toLowerCase()}.`,
    `Environment & Light: ${profile.lightingMood}.`,
    `Textures & Composition: micro-textures on surfaces, realistic ambient occlusion, subtle volumetric atmospheric fog, pristine optical clarity on ${subjectAnchor}.`,
    `Color palette: ${profile.colorGrade}.`,
  ].join(' ');

  // 3. Runway Gen-3 Alpha Prompt
  const runwayPrompt = [
    `Continuous cinematic shot: ${movement.toLowerCase()} on ${visualCore}.`,
    `Motion dynamics: Smooth camera velocity at 0.5x speed, realistic physical wind and atmospheric dust drift.`,
    `Subject motion: Natural organic movement of ${subjectAnchor} with temporal consistency.`,
    `Lighting transition: Dynamic ${profile.lightingMood.toLowerCase()}.`,
    `Cinematic 24fps film motion blur, stable camera trajectory.`,
  ].join(' ');

  // 4. Luma Dream Machine Prompt
  const lumaPrompt = [
    `${movement} camera path through scene. ${visualCore}.`,
    `Physics-accurate environmental reaction, volumetric light beams shifting realistically.`,
    `Zero distortion, coherent multi-depth parallax, realistic physical mass.`,
  ].join(' ');

  // 5. OpenAI Sora Prompt
  const soraPrompt = [
    `Hyper-realistic continuous take: ${shotType}, ${movement.toLowerCase()}.`,
    `${visualCore}.`,
    `The scene features ${profile.lightingMood.toLowerCase()} with subtle ambient environmental motion.`,
    `Consistent spatial coherence, authentic material reflections, and realistic temporal evolution over ${scene.duration || '5s'}.`,
  ].join(' ');

  // 6. Camera Settings
  const cameraSettings: CameraSettings = {
    lens: profile.lens,
    aperture: profile.aperture,
    shutter: profile.shutter,
    sensor: profile.sensor,
    movementStyle: profile.movementStyle,
  };

  // 7. Audio & Voiceover Metadata
  const wordCount = (scene.voiceover || scene.dialogue || '').split(/\s+/).filter(Boolean).length;
  const audioMetadata: AudioMetadataPrompt = {
    voiceStyle: profile.voiceStyle,
    pacingWPM: profile.pacingWPM,
    emotion: profile.emotion,
    recommendedVoice: profile.recommendedVoice,
    sfxLayering: [
      scene.soundEffects || scene.sfx || 'Subtle atmospheric room tone',
      scene.bRoll ? `Foley sound of ${scene.bRoll.slice(0, 40)}` : 'Subtle organic foley movement',
      'Low sub-harmonic audio cue for transition',
    ],
    musicBpm: scene.music || scene.sfxMusic || profile.musicBpm,
  };

  return {
    midjourneyPrompt,
    fluxPrompt,
    runwayPrompt,
    lumaPrompt,
    soraPrompt,
    cameraSettings,
    lightingMood: profile.lightingMood,
    colorGrade: profile.colorGrade,
    subjectConsistencyAnchor: subjectAnchor,
    negativePrompt:
      'blurry, low resolution, deformed, plastic skin, oversaturated, amateur footage, glitch, jitter, watermark, artifacts',
    audioMetadata,
  };
}

/**
 * Enhances a single scene's media generation prompts using Gemini AI with
 * graceful algorithmic fallback.
 */
export async function enhanceSceneMediaPrompts(
  scene: ScriptScene,
  options?: EnhancePromptOptions
): Promise<EnhancedMediaPrompts> {
  const storyMode = options?.storyMode || scene.primaryMode || scene.sceneMode || 'Documentary';
  const aspectRatio = options?.aspectRatio || '16:9';

  try {
    const aiResult = await enhanceMediaPromptsAPI({
      scene,
      storyMode,
      aspectRatio,
      projectContext: options?.projectContext,
    });

    if (aiResult && aiResult.midjourneyPrompt) {
      return aiResult;
    }
  } catch (err) {
    console.warn(
      `[MediaPromptService] AI endpoint unavailable, using algorithmic cinematography engine for Scene #${scene.sceneNumber}:`,
      err
    );
  }

  return buildAlgorithmicEnhancedPrompts(scene, storyMode, aspectRatio, options?.projectContext);
}

/**
 * Enhances an entire sequence of scenes with media prompts.
 */
export async function enhanceAllScenesMediaPrompts(
  scenes: ScriptScene[],
  options?: EnhancePromptOptions
): Promise<ScriptScene[]> {
  const enhancedScenes: ScriptScene[] = [];

  for (const scene of scenes) {
    const prompts = await enhanceSceneMediaPrompts(scene, options);
    enhancedScenes.push({
      ...scene,
      enhancedPrompts: prompts,
      imageGenerationPrompt: prompts.midjourneyPrompt,
      videoGenerationPrompt: prompts.runwayPrompt,
      mediaStatus: 'Prompt Ready',
    });
  }

  return enhancedScenes;
}

/**
 * Determines the current production status badge for a scene
 */
export function determineSceneMediaStatus(
  scene: ScriptScene,
  attachedAssets: MediaAsset[] = []
): SceneMediaStatus {
  // 1. Audio Check
  const hasAudioTrack =
    attachedAssets.some((a) => a.type === 'audio' || a.type === 'voiceover' || a.type === 'music') ||
    scene.audioTiming?.isSyncedToAudioFile ||
    Boolean(scene.generatedVoice?.audioUrl);

  // 2. Video Check
  const hasVideoReady =
    attachedAssets.some((a) => a.type === 'video' && a.status === 'ready') ||
    scene.generatedVideo?.status === 'ready';

  const hasVideoPending =
    attachedAssets.some((a) => a.type === 'video' && (a.status === 'generating' || a.status === 'pending')) ||
    scene.generatedVideo?.status === 'generating';

  // 3. Image Check
  const hasImageReady =
    attachedAssets.some((a) => a.type === 'image' && a.status === 'ready') ||
    Boolean(scene.generatedImage);

  if (hasAudioTrack && hasVideoReady) return 'Audio Synced';
  if (hasVideoReady) return 'Audio Synced';
  if (hasVideoPending) return 'Video Pending';
  if (hasImageReady) return 'Image Generated';
  if (hasAudioTrack) return 'Audio Synced';

  if (
    scene.enhancedPrompts ||
    scene.imageGenerationPrompt ||
    scene.videoGenerationPrompt
  ) {
    return 'Prompt Ready';
  }

  return 'Pending';
}

/**
 * Copies a prompt string to the user's clipboard
 */
export async function copyPromptToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}
