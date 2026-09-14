// Client-side Web Speech Synthesis & Voiceover Engine

export interface AvailableVoice {
  name: string;
  lang: string;
  default: boolean;
}

class VoiceEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public getVoices(): AvailableVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices().map((v) => ({
      name: v.name,
      lang: v.lang,
      default: v.default,
    }));
  }

  public speak(
    text: string,
    options: {
      voiceName?: string;
      lang?: string;
      rate?: number;
      pitch?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ): void {
    if (!this.synth) {
      options.onError?.(new Error('Speech synthesis not supported in this browser.'));
      return;
    }

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    if (options.voiceName) {
      const voice = this.synth.getVoices().find((v) => v.name === options.voiceName);
      if (voice) utterance.voice = voice;
    }
    if (options.lang) utterance.lang = options.lang;
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;

    utterance.onstart = () => options.onStart?.();
    utterance.onend = () => options.onEnd?.();
    utterance.onerror = (e) => options.onError?.(e);

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  public isSpeaking(): boolean {
    return Boolean(this.synth?.speaking);
  }

  public estimateDuration(text: string, wordsPerMinute: number = 140): number {
    const wordCount = text.trim().split(/\s+/).length;
    return Math.max(2, Math.round((wordCount / wordsPerMinute) * 60));
  }
}

export const voiceEngine = new VoiceEngine();
