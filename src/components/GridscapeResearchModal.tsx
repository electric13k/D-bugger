import React, { useState } from 'react';
import { ExternalLink, Loader2, Network, X } from 'lucide-react';
import { readSessionCredential } from '../lib/cloudflareWorkspace';

interface ResearchSource {
  path: string;
  url: string;
}

interface GridscapeResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ResearchResult {
  mode?: string;
  text?: string;
  prompts?: string[];
  sources?: ResearchSource[];
  error?: string;
}

export const GridscapeResearchModal: React.FC<GridscapeResearchModalProps> = ({ isOpen, onClose }) => {
  const [topic, setTopic] = useState('How should an AI coding agent use spatial research to understand a repository?');
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleResearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch('/api/research/gridscape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), githubToken: readSessionCredential('dbugger_github_token', 'repoheal_github_token') }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `Gridscape research failed (${response.status}).`);
      setResult(payload);
    } catch (error: any) {
      setResult({ error: error?.message || 'Gridscape research failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative my-8 w-full max-w-3xl overflow-hidden border-2 border-black bg-white text-[#121212] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between border-b-2 border-black bg-[#F9F7F2] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border-2 border-black bg-violet-200 text-violet-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif-heading text-lg font-bold uppercase tracking-tight">Gridscape Research Bridge</h3>
              <p className="text-xs font-sans text-[#121212]/70">Infinity Canvas repository context for the D-Bugger agent.</p>
            </div>
          </div>
          <button onClick={onClose} className="border border-black bg-white p-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#F9F7F2]" aria-label="Close research modal">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <form onSubmit={handleResearch} className="space-y-2">
            <label className="text-[10px] font-sans font-bold uppercase tracking-wider">Research topic for the agent</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input value={topic} onChange={(event) => setTopic(event.target.value)} className="min-w-0 flex-1 border border-black bg-[#F9F7F2] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-300" maxLength={1200} />
              <button type="submit" disabled={loading || !topic.trim()} className="flex items-center justify-center gap-2 border border-black bg-black px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider text-[#F9F7F2] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-800 disabled:cursor-wait disabled:opacity-60">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Network className="h-4 w-4" />}
                {loading ? 'Researching...' : 'Research in Gridscape'}
              </button>
            </div>
          </form>

          {result?.error && <p className="border border-red-700 bg-red-50 px-3 py-2 text-xs font-sans text-red-800" role="alert">{result.error}</p>}

          {result?.text && <div className="space-y-4 border border-black bg-[#F9F7F2] p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between gap-3 border-b border-black/20 pb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">{result.mode === 'infinity-canvas' ? 'Infinity Canvas synthesis' : 'Repository-grounded preview'}</span>
              <a href="https://github.com/electric13k/Gridscape" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-sans font-bold uppercase underline underline-offset-2">Gridscape <ExternalLink className="h-3 w-3" /></a>
            </div>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{result.text}</div>
            {result.prompts?.length ? <div><div className="mb-2 text-[10px] font-mono font-bold uppercase tracking-wider">Suggested branches</div><div className="space-y-1">{result.prompts.map((prompt) => <div key={prompt} className="border-l-2 border-violet-500 pl-2 text-xs">{prompt}</div>)}</div></div> : null}
            {result.sources?.length ? <div><div className="mb-2 text-[10px] font-mono font-bold uppercase tracking-wider">Repository sources read</div><div className="flex flex-wrap gap-2">{result.sources.map((source) => <a key={source.path} href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 border border-black bg-white px-2 py-1 text-[10px] font-mono hover:bg-violet-50">{source.path}<ExternalLink className="h-3 w-3" /></a>)}</div></div> : null}
          </div>}
        </div>
      </div>
    </div>
  );
};
