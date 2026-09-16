/**
 * MintMind AI - Audio Timing Sync & Shot Plan Engine
 *
 * Implements audio-synchronized scene timing (from voiceover text or uploaded audio files)
 * and production-grade camera shot planning for 16:9 widescreen and 9:16 vertical video formats.
 */

import type { ScriptScene, ShotPlan, AudioTimingSync, CameraShotType, CameraMovement } from '../types/script';
import type { StoryMode } from '../types/storyMode';
import { getStoryModeProfile } from './storyModeEngine';

export interface AudioSyncResult {
  scenes: ScriptScene[];
  totalDurationSec: number;
  totalWords: number;
  averageWPM: number;
  timecodeFormatted: string;
}

export function formatTimecode(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Calculates audio timing for all scenes in a script.
 * If totalAudioDurationSec is provided (from an uploaded voice/audio file),
 * it distributes the audio duration across scenes proportionally by word count.
 */
export function calculateAudioTimingForScenes(
  scenes: ScriptScene[],
  totalAudioDurationSec?: number,
  speechRateWPM = 145
): AudioSyncResult {
  if (!scenes || scenes.length === 0) {
    return {
      scenes: [],
      totalDurationSec: 0,
      totalWords: 0,
      averageWPM: speechRateWPM,
      timecodeFormatted: '00:00',
    };
  }

  // Count words for each scene
  const wordCounts = scenes.map((s) => {
    const text = s.voiceover || s.visualDescription || '';
    const words = text.trim().split(/\s+/).filter(Boolean);
    return Math.max(1, words.length);
  });

  const totalWords = wordCounts.reduce((acc, count) => acc + count, 0);

  let currentSec = 0;
  const updatedScenes: ScriptScene[] = [];

  if (totalAudioDurationSec && totalAudioDurationSec > 0) {
    // Proportional distribution based on uploaded audio track
    const effectiveWPM = Math.round((totalWords / totalAudioDurationSec) * 60);

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const count = wordCounts[i];
      // Allocate duration proportionally
      let sceneDuration = (count / totalWords) * totalAudioDurationSec;
      // Round to 1 decimal place, minimum 1.5s
      sceneDuration = Math.max(1.5, Math.round(sceneDuration * 10) / 10);

      // On the last scene, adjust to match exact total duration
      if (i === scenes.length - 1) {
        sceneDuration = Math.max(1.5, Math.round((totalAudioDurationSec - currentSec) * 10) / 10);
      }

      const startSec = Math.round(currentSec * 10) / 10;
      const endSec = Math.round((startSec + sceneDuration) * 10) / 10;
      currentSec = endSec;

      const audioTiming: AudioTimingSync = {
        startSec,
        endSec,
        timecode: `${formatTimecode(startSec)} - ${formatTimecode(endSec)}`,
        durationSec: sceneDuration,
        wordCount: count,
        speechRateWPM: effectiveWPM,
        isSyncedToAudioFile: true,
      };

      updatedScenes.push({
        ...scene,
        duration: `${Math.round(sceneDuration)}s`,
        durationSec: sceneDuration,
        audioTiming,
      });
    }

    return {
      scenes: updatedScenes,
      totalDurationSec: totalAudioDurationSec,
      totalWords,
      averageWPM: effectiveWPM,
      timecodeFormatted: formatTimecode(totalAudioDurationSec),
    };
  } else {
    // Cadence-based calculation using speech rate (WPM)
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const count = wordCounts[i];

      // Natural speech timing: (words / WPM) * 60 + pause padding (0.8s per scene)
      const baseSec = (count / speechRateWPM) * 60;
      const sceneDuration = Math.max(2.5, Math.round((baseSec + 0.8) * 10) / 10);

      const startSec = Math.round(currentSec * 10) / 10;
      const endSec = Math.round((startSec + sceneDuration) * 10) / 10;
      currentSec = endSec;

      const audioTiming: AudioTimingSync = {
        startSec,
        endSec,
        timecode: `${formatTimecode(startSec)} - ${formatTimecode(endSec)}`,
        durationSec: sceneDuration,
        wordCount: count,
        speechRateWPM,
        isSyncedToAudioFile: false,
      };

      updatedScenes.push({
        ...scene,
        duration: `${Math.round(sceneDuration)}s`,
        durationSec: sceneDuration,
        audioTiming,
      });
    }

    return {
      scenes: updatedScenes,
      totalDurationSec: currentSec,
      totalWords,
      averageWPM: speechRateWPM,
      timecodeFormatted: formatTimecode(currentSec),
    };
  }
}

/**
 * Reads audio file metadata and exact duration via browser Audio Element
 */
export async function parseAudioFileMetadata(
  file: File
): Promise<{ durationSec: number; audioUrl: string; fileName: string; fileSize: number }> {
  return new Promise((resolve, reject) => {
    try {
      const audioUrl = URL.createObjectURL(file);
      const audio = new Audio();
      audio.preload = 'metadata';

      audio.onloadedmetadata = () => {
        const durationSec = Math.round(audio.duration * 10) / 10;
        resolve({
          durationSec,
          audioUrl,
          fileName: file.name,
          fileSize: file.size,
        });
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        reject(new Error('Failed to parse audio file. Please ensure it is a valid MP3, WAV, or AAC audio file.'));
      };

      audio.src = audioUrl;
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Builds or enriches a production-ready Shot Plan for a scene,
 * matching Story Mode visual aesthetics and aspect ratio (16:9 vs 9:16).
 */
export function generateProductionShotPlan(
  scene: ScriptScene,
  storyMode?: StoryMode,
  aspectRatio: '16:9' | '9:16' = '16:9'
): ShotPlan {
  // If shot plan already exists, preserve it but ensure framing matches
  if (scene.shotPlan) {
    return {
      ...scene.shotPlan,
      framing: aspectRatio === '16:9' ? '16:9 Widescreen' : '9:16 Vertical',
    };
  }

  // Derive shot type from camera direction or scene number
  let shotType: CameraShotType = 'Medium Shot';
  const camDir = (scene.cameraDirection || '').toLowerCase();

  if (camDir.includes('close-up') || camDir.includes('closeup') || camDir.includes('macro')) {
    shotType = camDir.includes('extreme') ? 'Extreme Close-Up' : 'Close-Up';
  } else if (camDir.includes('wide') || camDir.includes('establishing') || camDir.includes('landscape')) {
    shotType = camDir.includes('extreme') ? 'Extreme Wide Shot' : 'Wide Shot';
  } else if (camDir.includes('drone') || camDir.includes('aerial') || camDir.includes('overhead')) {
    shotType = 'Drone Aerial';
  } else if (camDir.includes('over the shoulder') || camDir.includes('ots')) {
    shotType = 'Over-the-Shoulder';
  } else if (camDir.includes('pov') || camDir.includes('point of view')) {
    shotType = 'POV';
  } else if (camDir.includes('dutch') || camDir.includes('canted') || camDir.includes('tilted')) {
    shotType = 'Dutch Angle';
  } else if (scene.sceneNumber === 1) {
    shotType = 'Wide Shot'; // Default establishing shot for first scene
  } else if (scene.sceneNumber % 3 === 0) {
    shotType = 'Close-Up';
  }

  // Derive camera movement
  let movement: CameraMovement = 'Slow Push-In / Dolly';
  if (camDir.includes('pan')) movement = 'Pan Left/Right';
  else if (camDir.includes('tilt')) movement = 'Tilt Up/Down';
  else if (camDir.includes('track') || camDir.includes('follow')) movement = 'Tracking / Gimbal';
  else if (camDir.includes('handheld') || camDir.includes('shake')) movement = 'Handheld Organic';
  else if (camDir.includes('static') || camDir.includes('locked')) movement = 'Static';
  else if (camDir.includes('pull') || camDir.includes('zoom out')) movement = 'Pull-Out';

  // Story Mode aesthetic integration
  const modeKey = scene.sceneMode || scene.primaryMode || storyMode;
  const modeProfile = modeKey ? getStoryModeProfile(modeKey) : undefined;

  const lightingMood =
    modeProfile?.lightingStyle ||
    scene.lightingMood ||
    'Cinematic volumetric atmospheric lighting with high dynamic range';

  const colorGrade = modeProfile
    ? `${modeProfile.label} color palette, ${modeProfile.visualStyle}`
    : 'Rich cinematic grade with natural skin tones';

  const focalPoint = scene.bRollSuggestion || scene.visualDescription.slice(0, 80);

  const aspectParam = aspectRatio === '16:9' ? '--ar 16:9' : '--ar 9:16';
  const visualPrompt = `Cinematic ${shotType.toLowerCase()}, ${movement.toLowerCase()} motion. ${scene.visualDescription}. ${lightingMood}. Photorealistic, 8k resolution, ARRI Alexa 35, anamorphic lens flare, film grain. ${aspectParam}`;

  return {
    shotType,
    movement,
    framing: aspectRatio === '16:9' ? '16:9 Widescreen' : '9:16 Vertical',
    lightingMood,
    colorGrade,
    focalPoint,
    visualPrompt,
    cinematicNotes: `Transition: ${scene.transition || 'Cut'}. SFX/Audio: ${scene.sfxMusic || 'Ambient'}`,
  };
}
