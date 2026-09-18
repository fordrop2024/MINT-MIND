import React, { useState, useEffect } from 'react';
import { FileText, Download, Save, Copy, Check, Sparkles, Trash2 } from 'lucide-react';

interface ScriptStudioProps {
  route?: string;
}

export function PlaceholderPage({ route = '/script' }: ScriptStudioProps) {
  const [scriptTitle, setScriptTitle] = useState('My New Video Script');
  const [scriptContent, setScriptContent] = useState(
    `[SCENE 1: HOOK]\nVisual: Fast cuts of high-tech workspaces.\nVoiceover: "What if you could build an entire app in 10 minutes?"\n\n[SCENE 2: INTRODUCTION]\nVisual: Host speaking directly to camera.\nVoiceover: "Today, we are diving deep into automated workflow pipelines."\n\n[SCENE 3: CALL TO ACTION]\nVisual: On-screen subscribe graphics.\nVoiceover: "Don't forget to like and subscribe for more content!"`
  );
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem(`script_${route}`);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.title) setScriptTitle(parsed.title);
        if (parsed.content) setScriptContent(parsed.content);
      } catch (e) {}
    }
  }, [route]);

  const handleSave = () => {
    localStorage.setItem(`script_${route}`, JSON.stringify({ title: scriptTitle, content: scriptContent }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${scriptTitle}\n\n${scriptContent}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([`${scriptTitle}\n\n====================\n\n${scriptContent}`], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${scriptTitle.toLowerCase().replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md">
              PRODUCTION STUDIO
            </span>
            <span className="text-xs text-slate-400 font-mono">{route}</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-2">SCRIPT & CONTENT EDITOR</h1>
          <p className="text-slate-400 text-sm mt-1">
            Build, structure, and export production-ready video scripts instantly.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-lg flex items-center gap-2 border border-slate-700 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Script'}
          </button>
          
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono rounded-lg flex items-center gap-2 transition"
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved Local!' : 'Save Progress'}
          </button>

          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono rounded-lg flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4" /> Export .TXT
          </button>
        </div>
      </div>

      <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80 space-y-4">
        <div>
          <label className="block text-xs font-mono text-slate-400 mb-2">Project / Script Title</label>
          <input
            type="text"
            value={scriptTitle}
            onChange={(e) => setScriptTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-lg font-semibold text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-slate-400 mb-2">Script Timeline & Visual Notes</label>
          <textarea
            value={scriptContent}
            onChange={(e) => setScriptContent(e.target.value)}
            rows={14}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-4 text-sm text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>
    </div>
  );
}