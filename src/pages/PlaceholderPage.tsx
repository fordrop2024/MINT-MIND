import React, { useState } from 'react';
import { Play, Sparkles, Sliders, Send, CheckCircle2, Download, RefreshCw } from 'lucide-react';

interface PlaceholderPageProps {
  route?: string;
  onOpenRoadmap?: () => void;
}

export function PlaceholderPage({ route = '/studio', onOpenRoadmap }: PlaceholderPageProps) {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputResult, setOutputResult] = useState<string | null>(null);

  const cleanTitle = route
    .replace('/', '')
    .replace('-', ' ')
    .toUpperCase();

  const handleProcess = () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setOutputResult(`Generated optimization and production specs for: "${inputText}"`);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-md">
              LIVE ENGINE
            </span>
            <span className="text-xs text-slate-400 font-mono">{route}</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-2">{cleanTitle || 'STUDIO WORKSPACE'}</h1>
          <p className="text-slate-400 text-sm mt-1">
            Generate, optimize, and synthesize assets directly in this dedicated studio environment.
          </p>
        </div>
      </div>

      {/* Main Studio Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-1 bg-slate-900/40 p-5 rounded-xl border border-slate-800/80 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" /> Control Parameters
          </h3>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-2">Prompt / Topic Input</label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter details, video titles, or script prompts here..."
              rows={4}
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
                <RefreshCw className="w-4 h-4 animate-spin" /> Processing Engine...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Run {cleanTitle || 'Engine'}
              </>
            )}
          </button>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-2 bg-slate-900/40 p-5 rounded-xl border border-slate-800/80 min-h-[300px] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-4">
              <Play className="w-4 h-4 text-cyan-400" /> Generated Output & Preview
            </h3>

            {outputResult ? (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono">
                  <CheckCircle2 className="w-4 h-4" /> Generation Complete
                </div>
                <p className="text-sm text-slate-300 font-mono">{outputResult}</p>
              </div>
            ) : (
              <div className="h-48 border border-dashed border-slate-800 rounded-lg flex flex-col items-center justify-center text-slate-500 text-sm">
                Enter your prompt on the left and click "Run Engine" to view generated results.
              </div>
            )}
          </div>

          {outputResult && (
            <div className="pt-4 border-t border-slate-800/80 flex justify-end">
              <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-md flex items-center gap-1.5 transition">
                <Download className="w-3.5 h-3.5" /> Export Data
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}