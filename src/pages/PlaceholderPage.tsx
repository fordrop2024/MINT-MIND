import React, { useState } from 'react';
import { Play, Sparkles, Sliders, CheckCircle2, Download, RefreshCw, AlertCircle } from 'lucide-react';
import Groq from 'groq-sdk';

interface PlaceholderPageProps {
  route?: string;
  onOpenRoadmap?: () => void;
}

export function PlaceholderPage({ route = '/studio' }: PlaceholderPageProps) {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputResult, setOutputResult] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cleanTitle = route.replace('/', '').replace('-', ' ').toUpperCase();

  const getSystemPrompt = (currentRoute: string) => {
    switch (currentRoute) {
      case '/seo':
        return "You are an expert YouTube SEO strategist. Generate high-ranking tags, optimized video descriptions, and click-worthy titles with search volume predictions.";
      case '/ideas':
        return "You are a Viral Content Strategist. Generate 5 unique, high-CTR content ideas with viral hooks and audience retention angles.";
      case '/script':
        return "You are a Professional Screenwriter. Generate a full video script with scene directions, voiceover lines, and visual cues.";
      case '/repurpose':
        return "You are a Short-Form Content Specialist. Transform long-form content into engaging 60-second YouTube Shorts/Reels scripts.";
      default:
        return `You are an AI assistant specialized in ${cleanTitle}. Provide structured, high-quality production outputs.`;
    }
  };

  const handleProcess = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setOutputResult(null);

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) {
        throw new Error("Groq API key missing! Please check VITE_GROQ_API_KEY in your .env file.");
      }

      const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: getSystemPrompt(route),
          },
          {
            role: 'user',
            content: inputText,
          },
        ],
        model: 'llama-3.3-70b-versatile',
      });

      const responseText = completion.choices[0]?.message?.content || "No output generated.";
      setOutputResult(responseText);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to fetch response from Groq AI.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-md">
              GROQ AI POWERED
            </span>
            <span className="text-xs text-slate-400 font-mono">{route}</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-2">{cleanTitle || 'STUDIO WORKSPACE'}</h1>
          <p className="text-slate-400 text-sm mt-1">
            Generate and process assets in real-time using Llama 3.3 70B AI.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-slate-900/40 p-5 rounded-xl border border-slate-800/80 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" /> Control Parameters
          </h3>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-2">Prompt Input</label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Enter prompt for ${cleanTitle}...`}
              rows={5}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <button
            onClick={handleProcess}
            disabled={isProcessing || !inputText.trim()}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-medium rounded-lg text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Calling Groq AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Run {cleanTitle || 'Engine'}
              </>
            )}
          </button>
        </div>

        <div className="lg:col-span-2 bg-slate-900/40 p-5 rounded-xl border border-slate-800/80 min-h-[300px] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-4">
              <Play className="w-4 h-4 text-cyan-400" /> Live AI Output
            </h3>

            {errorMessage && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {errorMessage}
              </div>
            )}

            {outputResult ? (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3 max-h-[400px] overflow-y-auto">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono">
                  <CheckCircle2 className="w-4 h-4" /> Response Generated
                </div>
                <div className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                  {outputResult}
                </div>
              </div>
            ) : !errorMessage && (
              <div className="h-48 border border-dashed border-slate-800 rounded-lg flex flex-col items-center justify-center text-slate-500 text-sm">
                Enter your prompt and click "Run Engine" to get real-time Groq AI results.
              </div>
            )}
          </div>

          {outputResult && (
            <div className="pt-4 border-t border-slate-800/80 flex justify-end">
              <button 
                onClick={() => navigator.clipboard.writeText(outputResult)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-md flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" /> Copy Output
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}