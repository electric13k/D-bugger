import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  GitCommit, 
  ShieldCheck, 
  Cpu, 
  FileCode, 
  ExternalLink,
  Sparkles,
  RotateCcw,
  BrainCircuit,
  Scale
} from 'lucide-react';
import { BugFixRun } from '../types';

interface CodeDiffModalProps {
  run: BugFixRun | null;
  onClose: () => void;
  onUndo: (run: BugFixRun) => void;
  onOpenThoughtStream?: (run: BugFixRun) => void;
}

export const CodeDiffModal: React.FC<CodeDiffModalProps> = ({ run, onClose, onUndo, onOpenThoughtStream }) => {
  const [viewMode, setViewMode] = useState<'split' | 'unified' | 'test'>('split');
  const [copied, setCopied] = useState(false);

  if (!run) return null;

  const deliveryVerified = Boolean(run.pullRequestUrl && run.pullRequestNumber && run.pushedCommitSha);
  const legalAudit = run.pipeline?.legalRiskCheck;
  const tests = run.pipeline?.unitTestVerification;
  const hasStoredTestEvidence = Boolean(tests?.generatedTestSnippet && tests.testsRun > 0);

  const handleCopyPatch = () => {
    navigator.clipboard.writeText(run.fixedCodeSnippet || run.patchDiff);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden my-8 text-[#121212]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black bg-[#F9F7F2] px-6 py-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-black bg-white px-2 py-0.5 border border-black">
                {run.repoName}
              </span>
              <span className="text-xs text-[#121212]/70 font-mono">
                {run.affectedFiles?.[0] || 'code patch'}
              </span>
            </div>
            <h3 className="font-serif-heading text-lg font-bold text-[#121212]">
              {run.bugTitle}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {onOpenThoughtStream && (
              <button
                onClick={() => onOpenThoughtStream(run)}
                className="flex items-center gap-1.5 border-2 border-black bg-purple-100 hover:bg-purple-200 text-purple-950 px-3 py-1.5 text-xs font-sans font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all"
              >
                <BrainCircuit className="h-3.5 w-3.5 text-purple-800" />
                Agent Activity
              </button>
            )}

            <button
              onClick={handleCopyPatch}
              className="flex items-center gap-1 border border-black bg-white px-3 py-1.5 text-xs font-sans font-bold uppercase tracking-wider text-[#121212] hover:bg-[#F9F7F2] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-700" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy Code'}
            </button>

            <button
              onClick={onClose}
              className="border border-black bg-white p-1.5 text-[#121212] hover:bg-[#F9F7F2] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Subheader: Model & Pipeline Score */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black bg-[#F9F7F2]/60 px-6 py-3 text-xs font-sans">
          <div className="flex items-center gap-4 text-[#121212]/80">
            <span className="flex items-center gap-1.5 font-bold">
              <Cpu className="h-4 w-4 text-black" />
              Model: <strong className="text-black font-mono">{run.modelUsed}</strong>
            </span>
            <span className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="h-4 w-4 text-emerald-800" />
              Recorded Pipeline Score: <strong className="text-emerald-900 font-mono">{run.pipeline?.overallScore ?? 0}%</strong>
            </span>
              <span className={`flex items-center gap-1.5 font-bold ${legalAudit?.status === 'passed' ? 'text-emerald-900' : 'text-amber-900'}`}>
              <Scale className="h-4 w-4 text-emerald-800" />
              Legal Risk: <strong>{legalAudit ? `${legalAudit.status.toUpperCase()} (${legalAudit.licenseContamination?.detectedLicenses?.length ?? 0} reported license references)` : 'Not independently verified'}</strong>
            </span>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 border border-black bg-white p-0.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 text-xs font-sans font-bold uppercase tracking-wider transition-colors ${
                viewMode === 'split' ? 'bg-black text-[#F9F7F2]' : 'text-[#121212] hover:bg-[#F9F7F2]'
              }`}
            >
              Side-by-Side
            </button>
            <button
              onClick={() => setViewMode('unified')}
              className={`px-3 py-1 text-xs font-sans font-bold uppercase tracking-wider transition-colors ${
                viewMode === 'unified' ? 'bg-black text-[#F9F7F2]' : 'text-[#121212] hover:bg-[#F9F7F2]'
              }`}
            >
              Unified Diff
            </button>
            <button
              onClick={() => setViewMode('test')}
              className={`px-3 py-1 text-xs font-sans font-bold uppercase tracking-wider transition-colors ${
                viewMode === 'test' ? 'bg-black text-[#F9F7F2]' : 'text-[#121212] hover:bg-[#F9F7F2]'
              }`}
            >
              Regression Test
            </button>
          </div>
        </div>

        {/* AI Explanation Box */}
        <div className="border-b-2 border-black bg-[#F9F7F2] px-6 py-3">
          <div className="flex items-start gap-2 text-xs text-[#121212]/90">
            <Sparkles className="h-4 w-4 text-black shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#121212] font-sans uppercase tracking-wider">Recorded Analysis Summary:</strong> {run.aiReasoning || 'No model or diagnostic summary was returned.'}
            </div>
          </div>
        </div>

        {/* Code Body */}
        <div className="max-h-[500px] overflow-y-auto p-6 font-mono text-xs bg-white">
          {viewMode === 'split' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Original Buggy Code */}
              <div className="border-2 border-red-800 bg-red-50 p-4 text-[#121212]">
                <div className="mb-2 flex items-center justify-between text-xs font-bold font-sans uppercase text-red-950 border-b border-red-300 pb-1">
                  <span>❌ Buggy Original Code</span>
                  <span className="text-[10px] font-mono opacity-75">commit {run.commitSha}</span>
                </div>
                <pre className="overflow-x-auto text-red-950 font-mono whitespace-pre-wrap leading-relaxed">
                  {run.originalCodeSnippet || '// No original source evidence stored for this run.'}
                </pre>
              </div>

              {/* Fixed Code */}
              <div className="border-2 border-emerald-800 bg-emerald-50 p-4 text-[#121212]">
                <div className="mb-2 flex items-center justify-between text-xs font-bold font-sans uppercase text-emerald-950 border-b border-emerald-300 pb-1">
                  <span>✅ {deliveryVerified ? `Code in Verified PR (${run.modelUsed.split('/')[1] || 'model'})` : `Diagnostic Proposal (${run.modelUsed.split('/')[1] || 'fallback'})`}</span>
                  <span className="text-[10px] font-mono opacity-75">{deliveryVerified ? `branch ${run.branchName}` : 'no GitHub branch or commit created'}</span>
                </div>
                <pre className="overflow-x-auto text-emerald-950 font-mono whitespace-pre-wrap leading-relaxed">
                  {run.fixedCodeSnippet || '// No corrected code proposal was returned.'}
                </pre>
              </div>
            </div>
          )}

          {viewMode === 'unified' && (
            <div className="border-2 border-black bg-black p-4 text-[#F9F7F2]">
              <pre className="overflow-x-auto font-mono whitespace-pre-wrap leading-relaxed text-[#F9F7F2]">
                {run.patchDiff || '// No patch diff was returned for this run.'}
              </pre>
            </div>
          )}

          {viewMode === 'test' && (
            <div className="border-2 border-black bg-purple-50 p-4 text-[#121212]">
              <div className="mb-2 flex items-center justify-between text-xs font-bold font-sans uppercase text-purple-950 border-b border-purple-300 pb-1">
                <span>Recorded Regression Test Evidence</span>
                <span className="text-[10px] text-purple-900 font-mono font-bold">{hasStoredTestEvidence ? `${tests?.testsPassed || 0}/${tests?.testsRun || 0} recorded` : 'Not executed / not verified'}</span>
              </div>
              <pre className="overflow-x-auto text-purple-950 font-mono whitespace-pre-wrap leading-relaxed">
                {tests?.generatedTestSnippet || 'No test execution evidence was stored for this run. Add an OpenRouter key and connect a real repository to generate a model proposal, then validate it in CI before merging.'}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t-2 border-black bg-[#F9F7F2] px-6 py-4">
          <div>
            {deliveryVerified && (
              <a
                href={run.pullRequestUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-sans font-bold uppercase tracking-wider text-black hover:underline"
              >
                Verified Pull Request #{run.pullRequestNumber} on GitHub
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          <div className="flex items-center gap-3">
            {deliveryVerified && !run.isUndone && (
              <button
                onClick={() => {
                  onUndo(run);
                  onClose();
                }}
                className="flex items-center gap-1.5 border border-black bg-amber-200 px-3.5 py-1.5 text-xs font-sans font-bold uppercase tracking-wider text-amber-950 hover:bg-amber-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Undo This Fix
              </button>
            )}

            {!deliveryVerified && <span className="text-[10px] font-mono text-amber-900">No verified GitHub delivery to undo</span>}
            <button
              onClick={onClose}
              className="border border-black bg-white px-4 py-1.5 text-xs font-sans font-bold uppercase tracking-wider text-[#121212] hover:bg-[#F9F7F2] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

