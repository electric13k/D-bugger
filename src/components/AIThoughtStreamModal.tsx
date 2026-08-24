import React, { useEffect, useState } from 'react';
import { 
  X, 
  BrainCircuit, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Code2, 
  Scale, 
  ShieldCheck, 
  Play, 
  Terminal,
  Activity,
  MessageCircle,
  Send,
  Maximize2,
  FileSearch,
  Zap,
  CornerDownRight
} from 'lucide-react';
import { BugFixRun, AgentThoughtStep } from '../types';

interface AIThoughtStreamModalProps {
  run: BugFixRun | null;
  isOpen?: boolean;
  onClose: () => void;
  onFollowUp?: (run: BugFixRun, prompt: string) => Promise<string>;
}

export const AIThoughtStreamModal: React.FC<AIThoughtStreamModalProps> = ({
  run,
  isOpen,
  onClose,
  onFollowUp
}) => {
  const [selectedStepIdx, setSelectedStepIdx] = useState<number>(0);
  const [showRawJson, setShowRawJson] = useState(false);
  const [followUp, setFollowUp] = useState('');
  const [followUpAnswer, setFollowUpAnswer] = useState('');
  const [followUpError, setFollowUpError] = useState('');
  const [isFollowingUp, setIsFollowingUp] = useState(false);

  useEffect(() => {
    setSelectedStepIdx(0);
    setShowRawJson(false);
    setFollowUp('');
    setFollowUpAnswer('');
    setFollowUpError('');
    setIsFollowingUp(false);
  }, [run?.id]);

  if ((isOpen === false) || !run) return null;

  const thoughtSteps: AgentThoughtStep[] = run.aiThoughtStream?.length ? run.aiThoughtStream : [{
    id: `trace-missing-${run.id}`,
    phase: 'ast_ingestion',
    timestamp: run.timestamp,
    title: 'No stored agent trace',
    thought: 'This run does not contain a verified agent activity trace. No AST analysis, model reasoning, test execution, branch creation, or pull request should be inferred from this record.',
    confidence: 0,
    codeInspection: run.originalCodeSnippet || 'No source evidence stored for this run.',
    verdict: 'warning'
  }];

  const activeStep = thoughtSteps[selectedStepIdx] || thoughtSteps[0];
  const handleFollowUp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!onFollowUp || !followUp.trim() || isFollowingUp) return;
    setIsFollowingUp(true);
    setFollowUpError('');
    try {
      setFollowUpAnswer(await onFollowUp(run, followUp.trim()));
      setFollowUp('');
    } catch (error: any) {
      setFollowUpError(error?.message || 'Follow-up could not be completed.');
    } finally {
      setIsFollowingUp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl border-2 border-black bg-white shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] overflow-hidden my-6 text-[#121212] font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black bg-[#F9F7F2] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border-2 border-black bg-purple-200 text-purple-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif-heading text-lg font-bold uppercase tracking-tight text-[#121212]">
                  Agent Activity Inspector &bull; Run Evidence
                </h3>
                <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-900 px-2 py-0.5 border border-purple-800 uppercase">
                  Live Agent Activity Summary
                </span>
              </div>
              <p className="text-xs text-[#121212]/70">
                Inspect the recorded activity, repository evidence, model response summary, validation status, and GitHub delivery result for this run.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="border border-black bg-white px-3 py-1.5 text-xs font-mono font-bold uppercase text-[#121212] hover:bg-[#F9F7F2] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              {showRawJson ? 'Structured View' : 'Raw Trace JSON'}
            </button>
            <button
              onClick={onClose}
              className="border border-black bg-white p-1.5 text-[#121212] hover:bg-[#F9F7F2] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Metadata sub-bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-black bg-[#F9F7F2]/50 px-6 py-2.5 text-xs font-mono">
          <div className="flex items-center gap-4">
            <span>Repo: <strong>{run.repoName}</strong></span>
            <span>Commit: <strong>{run.commitSha.substring(0, 7)}</strong></span>
            <span>Category: <strong className="uppercase">{run.bugCategory.replace('_', ' ')}</strong></span>
          </div>
          <div className="flex items-center gap-2 font-bold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 border border-black">
            <ShieldCheck className="h-3.5 w-3.5" />
            Recorded confidence: {activeStep.confidence > 0 ? `${activeStep.confidence}%` : 'not provided'}
          </div>
        </div>

        {/* Content Body */}
        {showRawJson ? (
          <div className="p-6 max-h-[500px] overflow-y-auto bg-black text-[#F9F7F2] font-mono text-xs">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify({
                model: run.modelUsed,
                commit: run.commitSha,
                reasoning: run.aiReasoning,
                thoughtStream: thoughtSteps,
                pipeline: run.pipeline
              }, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 divide-y-2 md:divide-y-0 md:divide-x-2 divide-black max-h-[520px]">
            
            {/* Left Steps Rail */}
            <div className="md:col-span-5 bg-[#F9F7F2] p-4 space-y-2 overflow-y-auto max-h-[520px]">
              <div className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#121212]/70 mb-2">
                Observed Agent Steps ({thoughtSteps.length})
              </div>

              {thoughtSteps.map((step, idx) => {
                const isSelected = idx === selectedStepIdx;
                return (
                  <button
                    key={step.id || idx}
                    type="button"
                    onClick={() => setSelectedStepIdx(idx)}
                    className={`w-full text-left p-3 border-2 transition-all ${
                      isSelected 
                        ? 'border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]' 
                        : 'border-black/30 bg-[#F9F7F2] hover:bg-white hover:border-black'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                      <span className="flex items-center gap-1.5">
                        <span className="flex h-5 w-5 items-center justify-center border border-black bg-black text-white text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="uppercase text-[#121212]">{step.phase.replace('_', ' ')}</span>
                      </span>
                      <span className="text-[10px] bg-neutral-200 px-1.5 py-0.5 border border-black/40">
                        {step.confidence}% conf
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-[#121212] mt-1.5 line-clamp-1 font-serif-heading">
                      {step.title}
                    </h4>

                    <p className="text-[11px] text-[#121212]/70 mt-1 line-clamp-2 leading-tight font-sans">
                      {step.thought}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Right Step Inspector */}
            <div className="md:col-span-7 p-6 space-y-4 overflow-y-auto max-h-[520px] bg-white">
              
              <div className="flex items-start justify-between gap-4 border-b-2 border-black pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-purple-900 bg-purple-100 px-2 py-0.5 border border-purple-800">
                    Phase: {activeStep.phase.replace('_', ' ')}
                  </span>
                  <h3 className="font-serif-heading text-lg font-bold text-[#121212] mt-1.5">
                    {activeStep.title}
                  </h3>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[10px] font-mono text-[#121212]/70">Engine Assessment</div>
                  <div className="text-xs font-mono font-bold uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 border border-emerald-800 mt-0.5">
                    {activeStep.verdict}
                  </div>
                </div>
              </div>

              {/* Evidence-backed Reasoning Summary */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#121212] flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-black" />
                  Model Reasoning Summary:
                </label>
                <div className="border-2 border-black bg-[#F9F7F2] p-4 text-xs font-sans text-[#121212] leading-relaxed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {activeStep.thought}
                </div>
              </div>

              {/* AST Node Investigated */}
              {activeStep.astNodeInvestigated && (
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#121212] flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-black" />
                    AST Path &amp; Call Graph Target:
                  </label>
                  <div className="border border-black bg-neutral-100 px-3 py-1.5 text-xs font-mono font-bold text-[#121212]">
                    {activeStep.astNodeInvestigated}
                  </div>
                </div>
              )}

              {/* Code / Test Inspection */}
              {activeStep.codeInspection && (
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#121212] flex items-center gap-1.5">
                    <Code2 className="h-3.5 w-3.5 text-black" />
                    Code Context Evaluated:
                  </label>
                  <div className="border-2 border-black bg-black p-3 text-[#F9F7F2] font-mono text-[11px] max-h-48 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{activeStep.codeInspection}</pre>
                  </div>
                </div>
              )}

              {/* Legal and safety result from the stored run */}
              <div className="border border-black bg-emerald-50 p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-emerald-800" />
                  <div>
                  <span className="font-bold text-emerald-950 block">Legal &amp; IP Risk Result: {run.pipeline?.legalRiskCheck?.status === 'passed' ? 'REPORTED PASSED' : 'NOT VERIFIED'}</span>
                  <span className="text-[10px] text-emerald-900/80 font-mono">{run.pipeline?.legalRiskCheck?.legalSignoffSummary || 'No independent legal or secret scan evidence was stored.'}</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold bg-emerald-200 text-emerald-950 px-2 py-0.5 border border-emerald-900">
                  {run.pipeline?.passed ? 'Reported Gate Passed' : 'Review Required'}
                </span>
              </div>

              {/* Next / Previous step controls */}
              <div className="flex items-center justify-between pt-2 border-t border-black/10">
                <button
                  type="button"
                  disabled={selectedStepIdx === 0}
                  onClick={() => setSelectedStepIdx(prev => Math.max(0, prev - 1))}
                  className="border border-black bg-white px-3 py-1.5 text-xs font-bold uppercase disabled:opacity-40 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-[#F9F7F2]"
                >
                  &larr; Previous Step
                </button>
                <span className="text-xs font-mono text-[#121212]/60">
                  Step {selectedStepIdx + 1} of {thoughtSteps.length}
                </span>
                <button
                  type="button"
                  disabled={selectedStepIdx === thoughtSteps.length - 1}
                  onClick={() => setSelectedStepIdx(prev => Math.min(thoughtSteps.length - 1, prev + 1))}
                  className="border border-black bg-black text-[#F9F7F2] px-4 py-1.5 text-xs font-bold uppercase disabled:opacity-40 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-800"
                >
                  Next Step &rarr;
                </button>
              </div>

            </div>

          </div>
        )}

        {onFollowUp && (
          <div className="border-t-2 border-black bg-white px-6 py-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#121212]">
              <MessageCircle className="h-3.5 w-3.5" /> Ask a follow-up about this run
            </div>
            {followUpAnswer && <div className="border-2 border-black bg-[#F9F7F2] p-3 text-xs leading-relaxed whitespace-pre-wrap">{followUpAnswer}</div>}
            {followUpError && <div className="border border-red-800 bg-red-50 p-2 text-xs text-red-950">{followUpError}</div>}
            <form onSubmit={handleFollowUp} className="flex gap-2">
              <input value={followUp} onChange={(event) => setFollowUp(event.target.value)} placeholder="Why was this file changed? What should I verify next?" className="min-w-0 flex-1 border-2 border-black bg-[#F9F7F2] px-3 py-2 text-xs font-mono focus:outline-none" />
              <button type="submit" disabled={isFollowingUp || !followUp.trim()} className="flex items-center gap-1.5 border-2 border-black bg-black text-[#F9F7F2] px-3 py-2 text-xs font-bold uppercase disabled:opacity-40">
                <Send className="h-3.5 w-3.5" /> {isFollowingUp ? 'Asking...' : 'Ask'}
              </button>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t-2 border-black bg-[#F9F7F2] px-6 py-3">
          <div className="flex items-center gap-2 text-xs text-[#121212]/70 font-mono">
            <Activity className="h-3.5 w-3.5 text-emerald-700" />
            This panel shows stored agent activity summaries and evidence. It does not infer hidden reasoning, tests, commits, or PRs that were not returned by the system.
          </div>
          <button
            onClick={onClose}
            className="border border-black bg-black text-[#F9F7F2] px-4 py-1.5 text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-800"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
