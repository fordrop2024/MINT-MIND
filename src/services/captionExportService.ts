/**
 * Caption Export & Formatting Service
 * Supports standard SubRip (.srt), WebVTT (.vtt), and Word-Level JSON Exports
 * Designed for Premiere Pro, DaVinci Resolve, CapCut, Final Cut Pro, and YouTube Studio
 */

import type { CaptionLine, CaptionConfig, CaptionWord } from '../types/script';

/**
 * Format seconds into SRT timestamp: HH:MM:SS,mmm
 */
export function formatSRTTimestamp(totalSeconds: number): string {
  const safeSec = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSec / 3600);
  const minutes = Math.floor((safeSec % 3600) / 60);
  const seconds = Math.floor(safeSec % 60);
  const milliseconds = Math.floor((safeSec - Math.floor(safeSec)) * 1000);

  const pad = (num: number, size = 2) => num.toString().padStart(size, '0');

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(milliseconds, 3)}`;
}

/**
 * Format seconds into WebVTT timestamp: HH:MM:SS.mmm
 */
export function formatVTTTimestamp(totalSeconds: number): string {
  const safeSec = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSec / 3600);
  const minutes = Math.floor((safeSec % 3600) / 60);
  const seconds = Math.floor(safeSec % 60);
  const milliseconds = Math.floor((safeSec - Math.floor(safeSec)) * 1000);

  const pad = (num: number, size = 2) => num.toString().padStart(size, '0');

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(milliseconds, 3)}`;
}

/**
 * Generate standard SubRip (.srt) caption file content
 */
export function generateSRT(captions: CaptionLine[]): string {
  if (!captions || captions.length === 0) return '';

  return captions
    .map((caption, index) => {
      const idx = index + 1;
      const start = formatSRTTimestamp(caption.startSec);
      const end = formatSRTTimestamp(caption.endSec);
      const cleanText = (caption.text || '').trim();

      return `${idx}\n${start} --> ${end}\n${cleanText}\n`;
    })
    .join('\n');
}

/**
 * Generate standard WebVTT (.vtt) caption file content
 */
export function generateVTT(captions: CaptionLine[], title?: string): string {
  const header = `WEBVTT${title ? ` - ${title}` : ''}\n\n`;
  if (!captions || captions.length === 0) return header;

  const body = captions
    .map((caption, index) => {
      const idx = index + 1;
      const start = formatVTTTimestamp(caption.startSec);
      const end = formatVTTTimestamp(caption.endSec);
      const cleanText = (caption.text || '').trim();

      return `${idx}\n${start} --> ${end}\n${cleanText}\n`;
    })
    .join('\n');

  return header + body;
}

/**
 * Generate full JSON export with word-level timestamps and typography metadata
 */
export function generateJSONExport(
  captions: CaptionLine[],
  config?: CaptionConfig,
  scriptTitle?: string
): string {
  const exportPayload = {
    generator: 'MintMind AI Caption Engine',
    version: '2.0',
    exportedAt: new Date().toISOString(),
    title: scriptTitle || 'Video Captions',
    config: config || {
      style: 'bold_pop',
      fontFamily: 'Montserrat, sans-serif',
      fontSize: 28,
      textColor: '#ffffff',
      highlightColor: '#22d3ee',
      position: 'bottom',
      animation: 'word_by_word',
      language: 'English',
    },
    totalLines: captions.length,
    totalDurationSec: captions.length > 0 ? captions[captions.length - 1].endSec : 0,
    captions: captions.map((c, i) => ({
      index: i + 1,
      id: c.id,
      startSec: Number(c.startSec.toFixed(3)),
      endSec: Number(c.endSec.toFixed(3)),
      durationSec: Number((c.endSec - c.startSec).toFixed(3)),
      text: c.text,
      words: (c.words || []).map((w) => ({
        word: w.word,
        startSec: Number(w.startSec.toFixed(3)),
        endSec: Number(w.endSec.toFixed(3)),
      })),
    })),
  };

  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Recalculate word timestamps proportionally when text or duration changes
 */
export function recalculateWordsTiming(
  text: string,
  startSec: number,
  endSec: number
): CaptionWord[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const duration = Math.max(0.1, endSec - startSec);
  const timePerWord = duration / words.length;

  return words.map((w, idx) => ({
    word: w,
    startSec: Number((startSec + idx * timePerWord).toFixed(3)),
    endSec: Number((startSec + (idx + 1) * timePerWord).toFixed(3)),
  }));
}

/**
 * Trigger client-side file download using Blob
 */
export function downloadCaptionFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
