import { ScriptScene, StoryMode, CameraShotType, CameraMovement } from '../types/script';
import { SceneBreakdownGenerationParams } from '../types/scene';
import { generateProductionShotPlan } from './audioTimingSyncService';
import { generateSceneBreakdownAPI } from './aiService';

/**
 * Automatically generates a complete, cinematic Scene Breakdown from existing
 * Script Studio data using Gemini AI.
 *
 * Receives Script data (title, narrative sections or full text, target platform,
 * audience, tone, and Story Mode) and coordinates with the server-side Gemini
 * intelligence engine to architect:
 *  - Scene sequence, timing, and word-rate sync
 *  - Spoken dialogue / voiceover line segmentation
 *  - Visual composition & B-roll cutaway requirements
 *  - Camera shot types & camera movements
 *  - Dynamic visual generation prompts (Midjourney / Flux / Runway / Sora)
 *  - Music cues, atmospheric SFX, and on-screen text overlays
 *
 * @param scriptData Script data from Script Studio
 * @param options Optional mode/duration/aspect overrides
 * @returns Array of sequentially indexed, production-ready ScriptScene objects
 */
export async function generateSceneBreakdownFromScript(
  scriptData: SceneBreakdownGenerationParams,
  options?: {
    primaryMode?: StoryMode;
    secondaryModes?: StoryMode[];
    targetDuration?: string;
    aspectRatio?: '16:9' | '9:16';
  }
): Promise<ScriptScene[]> {
  const primaryMode = options?.primaryMode || scriptData.primaryMode || 'Documentary';
  const secondaryModes = options?.secondaryModes || scriptData.secondaryModes || [];
  const duration = options?.targetDuration || scriptData.duration;
  const isShortForm =
    scriptData.platform?.includes('Short') ||
    scriptData.platform?.includes('Reel') ||
    scriptData.platform?.includes('Story');
  const targetAspect = options?.aspectRatio || (isShortForm ? '9:16' : '16:9');

  // Call the Gemini-powered server breakdown pipeline
  const rawScenes = await generateSceneBreakdownAPI({
    scriptTitle: scriptData.scriptTitle,
    scriptText: scriptData.scriptText,
    sections: scriptData.sections,
    primaryMode,
    secondaryModes,
    platform: scriptData.platform || 'YouTube Long-form',
    duration,
    audience: scriptData.audience,
    tone: scriptData.tone,
  });

  // Re-index, calculate audio timing timecodes, and generate cinematic shot plans
  const normalizedScenes = reindexScenes(rawScenes, primaryMode, targetAspect);

  return normalizedScenes;
}

/**
 * Validates and guarantees all required fields on a ScriptScene for the

 * Scene Breakdown and Shot Planning layer.
 */
export function normalizeScene(
  sc: Partial<ScriptScene>,
  idx: number,
  storyMode?: StoryMode,
  aspectRatio: '16:9' | '9:16' = '16:9'
): ScriptScene {
  const sceneNumber = typeof sc.sceneNumber === 'number' ? sc.sceneNumber : idx + 1;
  const sceneId = sc.sceneId || `scene_${Date.now()}_${idx + 1}`;
  const title = sc.title || `Scene ${sceneNumber}`;

  let durSec = 5;
  if (typeof sc.durationSec === 'number' && sc.durationSec > 0) {
    durSec = sc.durationSec;
  } else if (typeof sc.duration === 'string') {
    const parsed = parseInt(sc.duration.replace(/[^\d]/g, ''), 10);
    if (!isNaN(parsed) && parsed > 0) durSec = parsed;
  }

  const voiceover = (sc.voiceover || sc.dialogue || '').trim();
  const dialogue = (sc.dialogue || sc.voiceover || '').trim();
  const visualDescription = (sc.visualDescription || sc.action || '').trim();
  const bRoll = (sc.bRoll || sc.bRollSuggestion || '').trim();
  const bRollSuggestion = bRoll;

  const shotType: CameraShotType = (sc.shotType as CameraShotType) || 'Medium Shot';
  const cameraMovement: CameraMovement = (sc.cameraMovement as CameraMovement) || 'Slow Push-In / Dolly';
  const cameraDirection = sc.cameraDirection || shotType;
  const transition = sc.transition || 'Cut';
  const onScreenText = sc.onScreenText || '';
  const music = sc.music || sc.sfxMusic || '';
  const sfxMusic = music;
  const soundEffects = sc.soundEffects || sc.sfx || '';
  const sfx = soundEffects;

  const aspectParam = aspectRatio === '9:16' ? '--ar 9:16' : '--ar 16:9';

  const imageGenerationPrompt =
    sc.imageGenerationPrompt ||
    `Cinematic ${shotType.toLowerCase()}, ${cameraMovement.toLowerCase()} motion. ${visualDescription}. Volumetric atmospheric lighting, photorealistic, 8k resolution, ARRI Alexa 35, anamorphic lens flare. ${aspectParam}`;

  const videoGenerationPrompt =
    sc.videoGenerationPrompt ||
    `Camera movement: ${cameraMovement.toLowerCase()}. ${visualDescription}. Cinematic continuous motion, 24fps high fidelity.`;

  const baseScene: ScriptScene = {
    sceneId,
    sceneNumber,
    title,
    duration: `${durSec}s`,
    durationSec: durSec,
    voiceover,
    dialogue,
    visualDescription,
    bRoll,
    bRollSuggestion,
    shotType,
    cameraMovement,
    cameraDirection,
    transition,
    onScreenText,
    music,
    sfxMusic,
    soundEffects,
    sfx,
    imageGenerationPrompt,
    videoGenerationPrompt,
    sceneMode: sc.sceneMode || storyMode,
    primaryMode: sc.primaryMode || storyMode,
    secondaryModes: sc.secondaryModes || [],
    lightingMood: sc.lightingMood,
    action: visualDescription,
    generatedImage: sc.generatedImage,
    generatedVideo: sc.generatedVideo,
    generatedVoice: sc.generatedVoice,
  };

  baseScene.shotPlan = sc.shotPlan || generateProductionShotPlan(baseScene, storyMode, aspectRatio);

  return baseScene;
}

/**
 * Re-indexes an array of scenes sequentially (sceneNumber 1..N) and recalculates
 * their audio timing timecodes.
 */
export function reindexScenes(
  scenes: ScriptScene[],
  storyMode?: StoryMode,
  aspectRatio: '16:9' | '9:16' = '16:9'
): ScriptScene[] {
  let runningSec = 0;

  return scenes.map((sc, idx) => {
    const durSec = sc.durationSec || parseInt(sc.duration) || 5;
    const startSec = runningSec;
    const endSec = runningSec + durSec;
    runningSec = endSec;

    const pad = (n: number) => Math.floor(n).toString().padStart(2, '0');
    const formatTime = (s: number) => `${pad(s / 60)}:${pad(s % 60)}`;
    const timecode = `${formatTime(startSec)} - ${formatTime(endSec)}`;

    const words = (sc.voiceover || '').trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    const normalized = normalizeScene(
      {
        ...sc,
        sceneNumber: idx + 1,
        title: sc.title || `Scene ${idx + 1}`,
      },
      idx,
      storyMode,
      aspectRatio
    );

    normalized.audioTiming = {
      startSec,
      endSec,
      durationSec: durSec,
      timecode,
      wordCount,
      speechRateWPM: Math.round((wordCount / (durSec || 5)) * 60) || 145,
      isSyncedToAudioFile: sc.audioTiming?.isSyncedToAudioFile || false,
    };

    return normalized;
  });
}

/**
 * Exports scenes in JSON format.
 */
export function exportScenesToJSON(scenes: ScriptScene[], scriptTitle: string): string {
  const payload = {
    title: scriptTitle,
    exportedAt: new Date().toISOString(),
    totalScenes: scenes.length,
    totalDurationSec: scenes.reduce((acc, s) => acc + (s.durationSec || 5), 0),
    scenes,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Exports scenes as a CSV string for spreadsheet / production logistics.
 */
export function exportScenesToCSV(scenes: ScriptScene[]): string {
  const headers = [
    'Scene #',
    'Title',
    'Duration',
    'Shot Type',
    'Camera Movement',
    'Transition',
    'Voiceover / Dialogue',
    'Visual Description',
    'B-Roll',
    'On-Screen Text',
    'Music',
    'SFX',
    'Image Prompt',
    'Video Prompt',
  ];

  const rows = scenes.map((s) => [
    s.sceneNumber,
    `"${(s.title || '').replace(/"/g, '""')}"`,
    s.duration,
    `"${(s.shotType || '').toString().replace(/"/g, '""')}"`,
    `"${(s.cameraMovement || '').toString().replace(/"/g, '""')}"`,
    `"${(s.transition || '').replace(/"/g, '""')}"`,
    `"${(s.voiceover || '').replace(/"/g, '""')}"`,
    `"${(s.visualDescription || '').replace(/"/g, '""')}"`,
    `"${(s.bRoll || s.bRollSuggestion || '').replace(/"/g, '""')}"`,
    `"${(s.onScreenText || '').replace(/"/g, '""')}"`,
    `"${(s.music || s.sfxMusic || '').replace(/"/g, '""')}"`,
    `"${(s.soundEffects || s.sfx || '').replace(/"/g, '""')}"`,
    `"${(s.imageGenerationPrompt || '').replace(/"/g, '""')}"`,
    `"${(s.videoGenerationPrompt || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Exports scenes as a formatted Production Shot Sheet / Call Sheet text file.
 */
export function exportScenesToText(scenes: ScriptScene[], scriptTitle: string): string {
  const lines: string[] = [
    `================================================================================`,
    `MINTMIND AI — PRODUCTION SCENE BREAKDOWN & SHOT PLAN`,
    `TITLE: ${scriptTitle}`,
    `DATE: ${new Date().toLocaleDateString()}`,
    `TOTAL SCENES: ${scenes.length}`,
    `TOTAL ESTIMATED RUNTIME: ~${Math.round(scenes.reduce((acc, s) => acc + (s.durationSec || 5), 0))} seconds`,
    `================================================================================\n`,
  ];

  scenes.forEach((s) => {
    lines.push(`--- SCENE #${s.sceneNumber}: ${s.title || 'Untitled'} [${s.duration}] ---`);
    lines.push(`SHOT TYPE: ${s.shotType || 'Medium Shot'} | MOVEMENT: ${s.cameraMovement || 'Slow Push-In'} | TRANSITION: ${s.transition || 'Cut'}`);
    if (s.onScreenText) lines.push(`ON-SCREEN TEXT: "${s.onScreenText}"`);
    lines.push(`VOICEOVER: "${s.voiceover}"`);
    lines.push(`VISUALS: ${s.visualDescription}`);
    if (s.bRoll || s.bRollSuggestion) lines.push(`B-ROLL: ${s.bRoll || s.bRollSuggestion}`);
    if (s.music || s.sfxMusic) lines.push(`MUSIC: ${s.music || s.sfxMusic}`);
    if (s.soundEffects || s.sfx) lines.push(`SFX: ${s.soundEffects || s.sfx}`);
    if (s.imageGenerationPrompt) lines.push(`IMAGE PROMPT: ${s.imageGenerationPrompt}`);
    if (s.videoGenerationPrompt) lines.push(`VIDEO PROMPT: ${s.videoGenerationPrompt}`);
    lines.push('');
  });

  return lines.join('\n');
}
