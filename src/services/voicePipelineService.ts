/**
 * MintMind AI - Voice / TTS & Audio Timing Synchronization Engine
 *
 * Provides:
 * 1. Text-to-Speech (TTS) metadata generation and cadence calculation (WPM to exact seconds).
 * 2. Multi-language voice model catalog (Hindi, English, Hinglish, Spanish, German, French, Japanese).
 * 3. Audio file timing sync engine and subtitle generator (SRT / WebVTT).
 * 4. Browser TTS preview and sequential scene playback player.
 */

import type { ScriptScene, AudioTimingSync } from '../types/script';
import type { StoryMode } from '../types/storyMode';
import type {
  VoiceLanguage,
  VoiceGender,
  VoiceEmotion,
  VoiceModelProfile,
  VoiceoverSettings,
  SceneTTSMetadata,
  VoiceoverSequenceItem,
  VoiceoverTimelineData,
} from '../types/voice';
import { voiceEngine } from './voiceService';

// ==========================================
// 1. MULTI-LANGUAGE VOICE MODELS CATALOG
// ==========================================

export const VOICE_MODELS_CATALOG: VoiceModelProfile[] = [
  // ENGLISH VOICES
  {
    id: 'adam-baritone',
    name: 'Adam',
    displayName: 'Adam (Deep Baritone)',
    language: 'English',
    localeCode: 'en-US',
    gender: 'male',
    recommendedTone: 'Authoritative',
    bestForStoryMode: ['Documentary', 'Noir Mystery', 'Cinematic Drama'],
    description: 'Deep, resonant baritone perfect for investigative documentaries, history, and cinema.',
    sampleText: 'Deep within the ancient archives, an unspoken truth was waiting to be discovered.',
    webSpeechVoiceQuery: ['Google US English', 'Daniel', 'Alex', 'en-US', 'en_US'],
  },
  {
    id: 'rachel-narrative',
    name: 'Rachel',
    displayName: 'Rachel (Warm Narrative)',
    language: 'English',
    localeCode: 'en-US',
    gender: 'female',
    recommendedTone: 'Conversational',
    bestForStoryMode: ['Documentary', 'Luxury Showcase', 'Educational Academy'],
    description: 'Warm, polished, and articulate voice ideal for brand storytelling and high-end video.',
    sampleText: 'Welcome to the frontier of human innovation, where every design choice reflects timeless elegance.',
    webSpeechVoiceQuery: ['Samantha', 'Victoria', 'Google US English female', 'en-US'],
  },
  {
    id: 'antoni-tech',
    name: 'Antoni',
    displayName: 'Antoni (Energetic Tech)',
    language: 'English',
    localeCode: 'en-GB',
    gender: 'male',
    recommendedTone: 'Energetic',
    bestForStoryMode: ['Tech Explainer', 'Action Thriller', 'Cyberpunk Neon'],
    description: 'Modern, punchy British cadence tailored for high-speed explainers, SaaS demos, and YouTube viral.',
    sampleText: 'This single algorithm changed how graphics engines render real-time global illumination forever.',
    webSpeechVoiceQuery: ['Oliver', 'George', 'en-GB', 'Google UK English Male'],
  },
  {
    id: 'bella-intimate',
    name: 'Bella',
    displayName: 'Bella (Intimate Storyteller)',
    language: 'English',
    localeCode: 'en-US',
    gender: 'female',
    recommendedTone: 'Intriguing',
    bestForStoryMode: ['Mythology & Folklore', 'Noir Mystery', 'Psychological'],
    description: 'Soft, nuanced, and atmospheric delivery suited for psychological tales and mysteries.',
    sampleText: 'Some shadows do not flee when the candle is extinguished. They simply wait.',
    webSpeechVoiceQuery: ['Karen', 'Moira', 'en-US'],
  },
  {
    id: 'marcus-thoughtleader',
    name: 'Marcus',
    displayName: 'Marcus (Executive Thought Leader)',
    language: 'English',
    localeCode: 'en-US',
    gender: 'male',
    recommendedTone: 'Authoritative',
    bestForStoryMode: ['Tech Explainer', 'Documentary', 'Luxury Showcase'],
    description: 'Confident, articulate corporate voice built for business analysis and tech leadership.',
    sampleText: 'When evaluating multi-billion dollar platform shifts, execution speed compounds exponentially.',
    webSpeechVoiceQuery: ['Tom', 'Alex', 'en-US'],
  },

  // HINDI VOICES
  {
    id: 'aarav-cinematic-hi',
    name: 'Aarav',
    displayName: 'Aarav (Cinematic Hindi)',
    language: 'Hindi',
    localeCode: 'hi-IN',
    gender: 'male',
    recommendedTone: 'Dramatic',
    bestForStoryMode: ['Documentary', 'Cinematic Drama', 'Mythology & Folklore'],
    description: 'Bhaavpurna aur gambhir aawaz jo kahaniyon aur cinematic videos ke liye sarvashrestha hai.',
    sampleText: 'Itihaas ke panno mein aisi kayi dastaanein dafan hain, jo aaj bhi zinda hain.',
    webSpeechVoiceQuery: ['hi-IN', 'Hindi', 'Lekha', 'hi_IN'],
  },
  {
    id: 'ananya-warm-hi',
    name: 'Ananya',
    displayName: 'Ananya (Warm Expressive Hindi)',
    language: 'Hindi',
    localeCode: 'hi-IN',
    gender: 'female',
    recommendedTone: 'Conversational',
    bestForStoryMode: ['Educational Academy', 'Documentary', 'Luxury Showcase'],
    description: 'Shuddh, spasht aur madhur aawaz jo darshakon ko aakarshit karti hai.',
    sampleText: 'Namaskar dosto, aaj hum samjhenge ki kaise ye nayi takneek hamari duniya ko badal rahi hai.',
    webSpeechVoiceQuery: ['hi-IN', 'Hindi', 'hi_IN'],
  },
  {
    id: 'kabir-deep-hi',
    name: 'Kabir',
    displayName: 'Kabir (Deep Hindi Voiceover)',
    language: 'Hindi',
    localeCode: 'hi-IN',
    gender: 'male',
    recommendedTone: 'Intriguing',
    bestForStoryMode: ['Noir Mystery', 'Mythology & Folklore', 'Action Thriller'],
    description: 'Bhareele aur gahan tone wali aawaz suspense aur thriller ke liye.',
    sampleText: 'Khel abhi khatam nahi hua tha, asal saazish toh ab shuru honi thi.',
    webSpeechVoiceQuery: ['hi-IN', 'Hindi'],
  },

  // HINGLISH VOICES
  {
    id: 'rohan-hinglish-creator',
    name: 'Rohan',
    displayName: 'Rohan (Urban Hinglish Creator)',
    language: 'Hinglish',
    localeCode: 'en-IN',
    gender: 'male',
    recommendedTone: 'Energetic',
    bestForStoryMode: ['Tech Explainer', 'Cyberpunk Neon', 'Fast Paced'],
    description: 'Natural modern Indian-English blend crafted for YouTube creators and young audiences.',
    sampleText: 'Toh guys, aaj ke video mein hum test karne wale hain is ultimate AI tool ka real performance.',
    webSpeechVoiceQuery: ['en-IN', 'Rishi', 'Google India English', 'en_IN'],
  },
  {
    id: 'priya-hinglish-vlog',
    name: 'Priya',
    displayName: 'Priya (Dynamic Hinglish Creator)',
    language: 'Hinglish',
    localeCode: 'en-IN',
    gender: 'female',
    recommendedTone: 'Conversational',
    bestForStoryMode: ['Educational Academy', 'Tech Explainer', 'Luxury Showcase'],
    description: 'Smooth, friendly Hinglish narration suitable for reels, shorts, and lifestyle videos.',
    sampleText: 'Agar aap bhi apna workflow 10x karna chahte hain, toh ye three steps bilkul miss mat karna.',
    webSpeechVoiceQuery: ['en-IN', 'Sangeeta', 'Veena', 'en_IN'],
  },

  // SPANISH VOICES
  {
    id: 'mateo-castilian',
    name: 'Mateo',
    displayName: 'Mateo (Cinematic Spanish)',
    language: 'Spanish',
    localeCode: 'es-ES',
    gender: 'male',
    recommendedTone: 'Dramatic',
    bestForStoryMode: ['Documentary', 'Cinematic Drama', 'Noir Mystery'],
    description: 'Voz española elegante y profunda para documentales y narrativas cinemáticas.',
    sampleText: 'En el corazón de la civilización perdida, los secretos aguardan a ser revelados.',
    webSpeechVoiceQuery: ['Jorge', 'es-ES', 'Spanish'],
  },
  {
    id: 'sofia-latin',
    name: 'Sofía',
    displayName: 'Sofía (Warm Latin American)',
    language: 'Spanish',
    localeCode: 'es-MX',
    gender: 'female',
    recommendedTone: 'Conversational',
    bestForStoryMode: ['Educational Academy', 'Luxury Showcase'],
    description: 'Voz neutra latinoamericana, cálida, nítida y profesional.',
    sampleText: 'Bienvenidos al futuro del diseño digital y la creación cinematográfica.',
    webSpeechVoiceQuery: ['Paulina', 'es-MX', 'es-US'],
  },

  // GERMAN VOICES
  {
    id: 'lukas-german',
    name: 'Lukas',
    displayName: 'Lukas (Precision German)',
    language: 'German',
    localeCode: 'de-DE',
    gender: 'male',
    recommendedTone: 'Authoritative',
    bestForStoryMode: ['Tech Explainer', 'Documentary'],
    description: 'Präzise, klangvolle Stimme für Technologie, Architektur und Dokumentarfilme.',
    sampleText: 'Die Evolution automatisierter Systeme definiert moderne Produktionsprozesse grundlegend neu.',
    webSpeechVoiceQuery: ['de-DE', 'Stefan', 'German'],
  },

  // FRENCH VOICES
  {
    id: 'celeste-french',
    name: 'Céleste',
    displayName: 'Céleste (Elegance French)',
    language: 'French',
    localeCode: 'fr-FR',
    gender: 'female',
    recommendedTone: 'Calm',
    bestForStoryMode: ['Luxury Showcase', 'Cinematic Drama'],
    description: 'Voix raffinée et captivante pour les univers du luxe et les récits artistiques.',
    sampleText: 'L’art du détail transforme chaque instant ordinaire en une œuvre intemporelle.',
    webSpeechVoiceQuery: ['fr-FR', 'Thomas', 'French'],
  },

  // JAPANESE VOICES
  {
    id: 'kenji-japanese',
    name: 'Kenji',
    displayName: 'Kenji (Dramatic Japanese)',
    language: 'Japanese',
    localeCode: 'ja-JP',
    gender: 'male',
    recommendedTone: 'Dramatic',
    bestForStoryMode: ['Cyberpunk Neon', 'Action Thriller', 'Mythology & Folklore'],
    description: '深みのある力強いトーン。アニメーションやシネマティック映像に最適。',
    sampleText: '未来の都市に蠢く無数の影。その中心で新たな物語が動き出す。',
    webSpeechVoiceQuery: ['ja-JP', 'Kyoko', 'Otoya', 'Japanese'],
  },
];

// Default Voiceover Configuration
export const DEFAULT_VOICEOVER_SETTINGS: VoiceoverSettings = {
  language: 'English',
  voiceModelId: 'adam-baritone',
  voiceName: 'Adam (Deep Baritone)',
  gender: 'male',
  emotion: 'Authoritative',
  speechRateWPM: 145,
  pitch: 1.0,
  volume: 1.0,
  pauseBetweenScenesSec: 0.6,
  addNaturalBreaths: true,
  generateSrtSubtitles: true,
};

// ==========================================
// 2. CADENCE & SPEECH TIMING CALCULATION
// ==========================================

export function cleanSpokenText(raw: string): string {
  if (!raw) return '';
  // Remove director notes like [Camera pan], (whispering), or **bold**
  return raw
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\*+/g, '')
    .replace(/#+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function calculateExactSpeechCadence(
  text: string,
  speechRateWPM = 145,
  options: {
    punctuationPauseSec?: number;
    language?: VoiceLanguage;
  } = {}
): {
  cleanText: string;
  wordCount: number;
  baseDurationSec: number;
  pauseDurationSec: number;
  estimatedDurationSec: number;
} {
  const clean = cleanSpokenText(text);
  if (!clean) {
    return {
      cleanText: '',
      wordCount: 0,
      baseDurationSec: 0,
      pauseDurationSec: 0,
      estimatedDurationSec: 1.5,
    };
  }

  // Count words
  const words = clean.split(/\s+/).filter(Boolean);
  const wordCount = Math.max(1, words.length);

  // Base spoken duration from WPM
  const baseDurationSec = (wordCount / Math.max(80, speechRateWPM)) * 60;

  // Natural punctuation pause compensation
  const commas = (clean.match(/[,、]/g) || []).length;
  const periods = (clean.match(/[.!?。！？]/g) || []).length;
  const ellipses = (clean.match(/\.{3}|…/g) || []).length;
  const colons = (clean.match(/[:;]/g) || []).length;

  const pauseUnit = options.punctuationPauseSec ?? 0.3;
  const pauseDurationSec =
    commas * (pauseUnit * 0.7) +
    periods * (pauseUnit * 1.2) +
    ellipses * (pauseUnit * 1.8) +
    colons * (pauseUnit * 0.8);

  // Total duration with minimum floor
  const estimatedDurationSec = Math.max(
    2.0,
    Math.round((baseDurationSec + pauseDurationSec) * 10) / 10
  );

  return {
    cleanText: clean,
    wordCount,
    baseDurationSec: Math.round(baseDurationSec * 10) / 10,
    pauseDurationSec: Math.round(pauseDurationSec * 10) / 10,
    estimatedDurationSec,
  };
}

// ==========================================
// 3. TTS METADATA GENERATION
// ==========================================

export function generateSceneTTSMetadata(
  scene: ScriptScene,
  settings: VoiceoverSettings = DEFAULT_VOICEOVER_SETTINGS
): SceneTTSMetadata {
  const rawSpoken = scene.voiceover || scene.dialogue || scene.visualDescription || '';
  const cadence = calculateExactSpeechCadence(rawSpoken, settings.speechRateWPM, {
    language: settings.language,
  });

  // Extract key emphasis words (words in quotes or capitalized terms)
  const quoteMatches = rawSpoken.match(/"([^"]+)"|'([^']+)'/g) || [];
  const cleanQuotes = quoteMatches.map((q) => q.replace(/['"]/g, ''));
  const capitalWords = cadence.cleanText
    .split(/\s+/)
    .filter((w) => /^[A-Z][a-z]{3,}$/.test(w) && !['This', 'That', 'With', 'From', 'Then'].includes(w));

  const emphasisWords = Array.from(new Set([...cleanQuotes, ...capitalWords])).slice(0, 4);

  // Generate standard SSML payload
  const ratePercent = Math.round(((settings.speechRateWPM - 145) / 145) * 100);
  const rateAttr = ratePercent !== 0 ? `${ratePercent >= 0 ? '+' : ''}${ratePercent}%` : 'default';
  const pitchAttr = settings.pitch !== 1.0 ? `${Math.round((settings.pitch - 1) * 50)}%` : 'default';

  const ssmlText = `<speak><prosody rate="${rateAttr}" pitch="${pitchAttr}">${cadence.cleanText}</prosody></speak>`;

  return {
    sceneNumber: scene.sceneNumber,
    spokenText: cadence.cleanText,
    wordCount: cadence.wordCount,
    estimatedDurationSec: cadence.estimatedDurationSec,
    emotion: settings.emotion,
    pacingWPM: settings.speechRateWPM,
    pitch: settings.pitch,
    emphasisWords,
    pauseDurationSec: cadence.pauseDurationSec,
    ssmlText,
    language: settings.language,
  };
}

// ==========================================
// 4. TIMELINE SYNC & SUBTITLE ENGINE (SRT/VTT)
// ==========================================

export function formatTimecodeSRT(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  const pad = (n: number, z = 2) => n.toString().padStart(z, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)},${pad(ms, 3)}`;
}

export function formatTimecodeVTT(seconds: number): string {
  return formatTimecodeSRT(seconds).replace(',', '.');
}

export function formatClockMinutesSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(mins)}:${pad(secs)}`;
}

export function generateSRTFromScenes(scenes: ScriptScene[]): string {
  const srtBlocks: string[] = [];

  scenes.forEach((scene, index) => {
    const text = cleanSpokenText(scene.voiceover || scene.dialogue || scene.visualDescription);
    if (!text) return;

    const startSec = scene.audioTiming?.startSec ?? index * 5;
    const endSec = scene.audioTiming?.endSec ?? (index + 1) * 5;

    const block = [
      (index + 1).toString(),
      `${formatTimecodeSRT(startSec)} --> ${formatTimecodeSRT(endSec)}`,
      text,
      '',
    ].join('\n');

    srtBlocks.push(block);
  });

  return srtBlocks.join('\n');
}

export function generateVTTFromScenes(scenes: ScriptScene[]): string {
  const vttBlocks: string[] = ['WEBVTT\n'];

  scenes.forEach((scene, index) => {
    const text = cleanSpokenText(scene.voiceover || scene.dialogue || scene.visualDescription);
    if (!text) return;

    const startSec = scene.audioTiming?.startSec ?? index * 5;
    const endSec = scene.audioTiming?.endSec ?? (index + 1) * 5;

    const block = [
      (index + 1).toString(),
      `${formatTimecodeVTT(startSec)} --> ${formatTimecodeVTT(endSec)}`,
      text,
      '',
    ].join('\n');

    vttBlocks.push(block);
  });

  return vttBlocks.join('\n');
}

/**
 * Recalculates exact timeline timing for all scenes based on voiceover settings,
 * updating audio timing sync models and returning timeline data.
 */
export function syncScenesToVoiceTimeline(
  scenes: ScriptScene[],
  settings: VoiceoverSettings = DEFAULT_VOICEOVER_SETTINGS,
  totalExternalAudioDurationSec?: number
): {
  updatedScenes: ScriptScene[];
  timelineData: VoiceoverTimelineData;
} {
  if (!scenes || scenes.length === 0) {
    return {
      updatedScenes: [],
      timelineData: {
        totalDurationSec: 0,
        formattedTotalTime: '00:00',
        totalWords: 0,
        averageWPM: settings.speechRateWPM,
        items: [],
        srtContent: '',
      },
    };
  }

  let currentClockSec = 0;
  let totalWordCount = 0;
  const updatedScenes: ScriptScene[] = [];
  const items: VoiceoverSequenceItem[] = [];

  // If external audio file duration is supplied, distribute duration proportionally
  if (totalExternalAudioDurationSec && totalExternalAudioDurationSec > 0) {
    const wordCounts = scenes.map((s) => {
      const text = cleanSpokenText(s.voiceover || s.dialogue || s.visualDescription);
      return Math.max(1, text.split(/\s+/).filter(Boolean).length);
    });
    const sumWords = wordCounts.reduce((a, b) => a + b, 0);
    const effectiveWPM = Math.round((sumWords / totalExternalAudioDurationSec) * 60);

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const count = wordCounts[i];
      totalWordCount += count;

      let sceneDur = (count / sumWords) * totalExternalAudioDurationSec;
      sceneDur = Math.max(1.5, Math.round(sceneDur * 10) / 10);

      // Match exact total on final scene
      if (i === scenes.length - 1) {
        sceneDur = Math.max(1.5, Math.round((totalExternalAudioDurationSec - currentClockSec) * 10) / 10);
      }

      const startSec = Math.round(currentClockSec * 10) / 10;
      const endSec = Math.round((startSec + sceneDur) * 10) / 10;
      currentClockSec = endSec;

      const spoken = cleanSpokenText(scene.voiceover || scene.dialogue || scene.visualDescription);

      const timing: AudioTimingSync = {
        startSec,
        endSec,
        timecode: `${formatClockMinutesSeconds(startSec)} - ${formatClockMinutesSeconds(endSec)}`,
        durationSec: sceneDur,
        wordCount: count,
        speechRateWPM: effectiveWPM,
        isSyncedToAudioFile: true,
      };

      const updated = {
        ...scene,
        duration: `${Math.round(sceneDur)}s`,
        durationSec: sceneDur,
        audioTiming: timing,
        generatedVoice: {
          voiceName: settings.voiceName,
          durationSec: sceneDur,
        },
      };

      updatedScenes.push(updated);
      items.push({
        sceneNumber: scene.sceneNumber,
        title: scene.title || `Scene ${scene.sceneNumber}`,
        spokenText: spoken,
        startSec,
        endSec,
        durationSec: sceneDur,
        timecode: timing.timecode,
      });
    }

    const srt = generateSRTFromScenes(updatedScenes);

    return {
      updatedScenes,
      timelineData: {
        totalDurationSec: totalExternalAudioDurationSec,
        formattedTotalTime: formatClockMinutesSeconds(totalExternalAudioDurationSec),
        totalWords: sumWords,
        averageWPM: effectiveWPM,
        items,
        srtContent: srt,
      },
    };
  }

  // Pure TTS Cadence Calculation
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const spoken = cleanSpokenText(scene.voiceover || scene.dialogue || scene.visualDescription);
    const cadence = calculateExactSpeechCadence(spoken, settings.speechRateWPM, {
      language: settings.language,
    });

    totalWordCount += cadence.wordCount;
    const sceneDur = cadence.estimatedDurationSec;

    const startSec = Math.round(currentClockSec * 10) / 10;
    const endSec = Math.round((startSec + sceneDur) * 10) / 10;

    // Apply inter-scene transition pause padding
    currentClockSec = Math.round((endSec + settings.pauseBetweenScenesSec) * 10) / 10;

    const timing: AudioTimingSync = {
      startSec,
      endSec,
      timecode: `${formatClockMinutesSeconds(startSec)} - ${formatClockMinutesSeconds(endSec)}`,
      durationSec: sceneDur,
      wordCount: cadence.wordCount,
      speechRateWPM: settings.speechRateWPM,
      isSyncedToAudioFile: false,
    };

    const updated = {
      ...scene,
      duration: `${Math.round(sceneDur)}s`,
      durationSec: sceneDur,
      audioTiming: timing,
      generatedVoice: {
        voiceName: settings.voiceName,
        durationSec: sceneDur,
      },
    };

    updatedScenes.push(updated);
    items.push({
      sceneNumber: scene.sceneNumber,
      title: scene.title || `Scene ${scene.sceneNumber}`,
      spokenText: spoken,
      startSec,
      endSec,
      durationSec: sceneDur,
      timecode: timing.timecode,
    });
  }

  const finalTotalSec = Math.round(currentClockSec * 10) / 10;
  const srt = generateSRTFromScenes(updatedScenes);

  return {
    updatedScenes,
    timelineData: {
      totalDurationSec: finalTotalSec,
      formattedTotalTime: formatClockMinutesSeconds(finalTotalSec),
      totalWords: totalWordCount,
      averageWPM: settings.speechRateWPM,
      items,
      srtContent: srt,
    },
  };
}

// ==========================================
// 5. TTS PLAYBACK ENGINE (WEB SPEECH)
// ==========================================

class VoiceoverPlayerManager {
  private isSequenceRunning = false;
  private currentSequenceIndex = 0;
  private currentScenes: ScriptScene[] = [];
  private onActiveSceneChangeCallback?: (sceneNumber: number | null) => void;
  private onCompleteCallback?: () => void;

  public playSingleScene(
    scene: ScriptScene,
    settings: VoiceoverSettings,
    callbacks: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ): void {
    this.stop();
    const textToSpeak = cleanSpokenText(scene.voiceover || scene.dialogue || scene.visualDescription);
    if (!textToSpeak) {
      callbacks.onError?.(new Error('No voiceover text found for this scene.'));
      return;
    }

    const model = VOICE_MODELS_CATALOG.find((m) => m.id === settings.voiceModelId);

    // Calculate Web Speech rate multiplier (1.0 = ~145 WPM)
    const rateMultiplier = Math.max(0.7, Math.min(1.6, settings.speechRateWPM / 145));

    voiceEngine.speak(textToSpeak, {
      lang: model?.localeCode || 'en-US',
      rate: rateMultiplier,
      pitch: settings.pitch,
      onStart: callbacks.onStart,
      onEnd: callbacks.onEnd,
      onError: callbacks.onError,
    });
  }

  public playSequence(
    scenes: ScriptScene[],
    settings: VoiceoverSettings,
    callbacks: {
      onSceneStart?: (sceneNumber: number) => void;
      onSceneEnd?: (sceneNumber: number) => void;
      onComplete?: () => void;
      onError?: (err: any) => void;
    } = {}
  ): void {
    this.stop();
    if (!scenes || scenes.length === 0) {
      callbacks.onComplete?.();
      return;
    }

    this.isSequenceRunning = true;
    this.currentScenes = scenes;
    this.currentSequenceIndex = 0;
    this.onActiveSceneChangeCallback = callbacks.onSceneStart;
    this.onCompleteCallback = callbacks.onComplete;

    this.playNextInSequence(settings, callbacks);
  }

  private playNextInSequence(
    settings: VoiceoverSettings,
    callbacks: {
      onSceneStart?: (sceneNumber: number) => void;
      onSceneEnd?: (sceneNumber: number) => void;
      onComplete?: () => void;
      onError?: (err: any) => void;
    }
  ): void {
    if (!this.isSequenceRunning || this.currentSequenceIndex >= this.currentScenes.length) {
      this.isSequenceRunning = false;
      this.onActiveSceneChangeCallback?.(null);
      callbacks.onComplete?.();
      return;
    }

    const scene = this.currentScenes[this.currentSequenceIndex];
    const textToSpeak = cleanSpokenText(scene.voiceover || scene.dialogue || scene.visualDescription);

    if (!textToSpeak) {
      this.currentSequenceIndex++;
      this.playNextInSequence(settings, callbacks);
      return;
    }

    callbacks.onSceneStart?.(scene.sceneNumber);

    const model = VOICE_MODELS_CATALOG.find((m) => m.id === settings.voiceModelId);
    const rateMultiplier = Math.max(0.7, Math.min(1.6, settings.speechRateWPM / 145));

    voiceEngine.speak(textToSpeak, {
      lang: model?.localeCode || 'en-US',
      rate: rateMultiplier,
      pitch: settings.pitch,
      onEnd: () => {
        callbacks.onSceneEnd?.(scene.sceneNumber);
        if (!this.isSequenceRunning) return;

        // Apply inter-scene pause
        setTimeout(() => {
          if (!this.isSequenceRunning) return;
          this.currentSequenceIndex++;
          this.playNextInSequence(settings, callbacks);
        }, Math.max(200, settings.pauseBetweenScenesSec * 1000));
      },
      onError: (err) => {
        callbacks.onError?.(err);
        this.stop();
      },
    });
  }

  public stop(): void {
    this.isSequenceRunning = false;
    this.onActiveSceneChangeCallback?.(null);
    voiceEngine.stop();
  }

  public isPlaying(): boolean {
    return this.isSequenceRunning || voiceEngine.isSpeaking();
  }
}

export const voiceoverPlayer = new VoiceoverPlayerManager();

// ==========================================
// 6. DOWNLOAD HELPER
// ==========================================

export function downloadSubtitleFile(content: string, filename: string, type: 'srt' | 'vtt'): void {
  const mimeType = type === 'srt' ? 'text/plain' : 'text/vtt';
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
