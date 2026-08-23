import React, { useState } from 'react';
import { 
  X, 
  RotateCcw, 
  History, 
  CheckCircle2, 
  AlertTriangle, 
  GitBranch, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  Code2
} from 'lucide-react';
import { BugFixRun } from '../types';

interface UndoCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  fixRuns: BugFixRun[];
  onUndoFix: (run: BugFixRun) => void;
  isUndoingId: string | null;
}

export const UndoCenterModal: React.FC<UndoCenterModalProps> = ({
  isOpen,
  onClose,
  fixRuns,
  onUndoFix,
  isUndoingId
}) => {
  const [selectedRunForCommands, setSelectedRunForCommands] = useState<BugFixRun | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const activeFixes = fixRuns.filter(r => !r.isUndone && r.status !== 'undone');
  const undoneFixes = fixRuns.filter(r => r.isUndone || r.status === 'undone');

  const handleCopyCommands = (commands: string[]) => {
    navigator.clipboard.writeText(commands.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden my-8 text-[#121212]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black bg-[#F9F7F2] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border-2 border-black bg-amber-200 text-amber-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif-heading text-lg font-bold uppercase tracking-tight text-[#121212]">
                1-Click Rollback &amp; Manual Git Undo Center
              </h3>
              <p className="text-xs font-sans text-[#121212]/70">
                Restore clean commit states via GitHub MCP Revert PRs or execute step-by-step CLI commands in your terminal.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="border border-black bg-white p-1.5 text-[#121212] hover:bg-[#F9F7F2] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[540px] overflow-y-auto bg-white font-sans">
          
          {/* Active Fixes Eligible for Undo */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#121212] flex items-center gap-2">
                <GitBranch className="h-3.5 w-3.5 text-black" />
                Active Automated Fixes ({activeFixes.length})
              </h4>
              <span className="text-[11px] text-[#121212]/60 font-mono">
                Full snapshot history maintained for every patch
              </span>
            </div>

            {activeFixes.length === 0 ? (
              <div className="border border-black bg-[#F9F7F2] p-5 text-center text-xs text-[#121212]/60 font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                No active fixes currently deployed. All patches are clean or already restored.
              </div>
            ) : (
              <div className="space-y-3">
                {activeFixes.map((run) => {
                  const defaultCommands = [
                    `# 1. Fetch remote changes`,
                    `git fetch origin`,
                    `# 2. Create revert branch`,
                    `git checkout -b revert-dbugger-${run.commitSha}`,
                    `# 3. Revert automated commit`,
                    `git revert ${run.pushedCommitSha || run.commitSha} -m 1 --no-edit`,
                    `# 4. Push revert branch to GitHub`,
                    `git push origin revert-dbugger-${run.commitSha}`,
                    `# 5. Open/close PR on GitHub UI`
                  ];
                  const commands = run.manualRevertCommands || defaultCommands;
                  const isInspectingCommands = selectedRunForCommands?.id === run.id;

                  return (
                    <div
                      key={run.id}
                      className="border-2 border-black bg-[#F9F7F2] p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-black bg-white px-2 py-0.5 border border-black">
                              {run.repoName}
                            </span>
                            <span className="text-[11px] font-mono text-[#121212]/80">
                              PR #{run.pullRequestNumber || 'PR'}
                            </span>
                            <span className="text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-950 px-1.5 border border-emerald-300">
                              Score: {run.pipeline?.overallScore || 96}%
                            </span>
                          </div>
                          
                          <p className="text-sm font-serif-heading font-bold text-[#121212] mt-1">
                            {run.bugTitle}
                          </p>
                          
                          <p className="text-[11px] text-[#121212]/70 font-mono mt-0.5">
                            Branch: <code>{run.branchName}</code> • Model: <strong>{run.modelUsed}</strong> • Sha: <code>{run.pushedCommitSha || run.commitSha}</code>
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setSelectedRunForCommands(isInspectingCommands ? null : run)}
                            className="flex items-center gap-1 border border-black bg-white px-2.5 py-1.5 text-xs font-sans font-bold uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-[#F9F7F2]"
                          >
                            <Terminal className="h-3.5 w-3.5" />
                            {isInspectingCommands ? 'Hide CLI' : 'Git CLI Guide'}
                          </button>

                          <button
                            onClick={() => onUndoFix(run)}
                            disabled={isUndoingId === run.id}
                            className="flex items-center justify-center gap-1.5 border border-black bg-amber-200 text-amber-950 px-3.5 py-1.5 text-xs font-sans font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-amber-300 active:translate-x-[1px] active:translate-y-[1px] transition-all disabled:opacity-50"
                          >
                            <RotateCcw className={`h-3.5 w-3.5 ${isUndoingId === run.id ? 'animate-spin' : ''}`} />
                            {isUndoingId === run.id ? 'Reverting...' : '1-Click Rollback'}
                          </button>
                        </div>
                      </div>

                      {/* Manual Git CLI Instructions Accordion */}
                      {isInspectingCommands && (
                        <div className="mt-3 border border-black bg-black p-3 text-[#F9F7F2] font-mono text-[11px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          <div className="flex items-center justify-between border-b border-neutral-700 pb-1.5 mb-2">
                            <span className="flex items-center gap-1 text-[10px] text-amber-300 uppercase tracking-wider font-bold">
                              <Terminal className="h-3.5 w-3.5" /> Terminal Revert Commands (Copy &amp; Paste):
                            </span>
                            <button
                              onClick={() => handleCopyCommands(commands)}
                              className="flex items-center gap-1 bg-white text-black px-2 py-0.5 text-[10px] uppercase font-bold hover:bg-neutral-200"
                            >
                              {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                              {copied ? 'Copied to Clipboard!' : 'Copy Commands'}
                            </button>
                          </div>
                          <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed text-neutral-200">
                            {commands.join('\n')}
                          </pre>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Revert History Audit Trail */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#121212] mb-3 flex items-center gap-2">
              <History className="h-3.5 w-3.5 text-black" />
              Rollback Audit Log ({undoneFixes.length})
            </h4>

            {undoneFixes.length === 0 ? (
              <div className="border border-black bg-[#F9F7F2] p-4 text-center text-xs text-[#121212]/60 font-mono">
                Zero rollbacks executed. Your automated fixes are running smoothly.
              </div>
            ) : (
              <div className="space-y-2">
                {undoneFixes.map((run) => (
                  <div
                    key={run.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-neutral-300 bg-[#F9F7F2]/60 p-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#121212]">{run.repoName}</span>
                        <span className="text-amber-900 font-mono font-bold uppercase text-[10px] bg-amber-100 px-1.5 border border-amber-300">
                          [Rolled Back]
                        </span>
                        {run.revertPrUrl && (
                          <a
                            href={run.revertPrUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-mono text-black underline flex items-center gap-0.5"
                          >
                            Revert PR <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>
                      <p className="text-[#121212]/80 mt-0.5">{run.bugTitle}</p>
                      <p className="text-[10px] text-[#121212]/60 font-mono mt-0.5">
                        Reason: {run.undoReason || 'User requested 1-click rollback'}
                      </p>
                    </div>

                    <span className="text-[11px] text-[#121212]/60 font-mono shrink-0">
                      {run.undoneAt ? new Date(run.undoneAt).toLocaleTimeString() : 'Recently'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t-2 border-black bg-[#F9F7F2] px-6 py-3">
          <span className="text-xs text-[#121212]/70 font-mono">
            D-Bugger GitHub MCP Engine preserves all snapshot diffs indefinitely.
          </span>

          <button
            onClick={onClose}
            className="border border-black bg-white px-4 py-1.5 text-xs font-sans font-bold uppercase tracking-wider text-[#121212] hover:bg-[#F9F7F2] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            Close Undo Center
          </button>
        </div>

      </div>
    </div>
  );
};
