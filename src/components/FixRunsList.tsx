import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  GitPullRequest, 
  ExternalLink, 
  Eye, 
  ShieldCheck, 
  Cpu, 
  Clock, 
  Mail, 
  FileCode2,
  Bug,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  HelpCircle,
  BrainCircuit,
  Scale
} from 'lucide-react';
import { BugFixRun } from '../types';

interface FixRunsListProps {
  runs: BugFixRun[];
  onViewDiff: (run: BugFixRun) => void;
  onViewPipeline: (run: BugFixRun) => void;
  onUndoFix: (run: BugFixRun) => void;
  onOpenThoughtStream?: (run: BugFixRun) => void;
  isUndoingId: string | null;
}

export const FixRunsList: React.FC<FixRunsListProps> = ({
  runs,
  onViewDiff,
  onViewPipeline,
  onUndoFix,
  onOpenThoughtStream,
  isUndoingId
}) => {
  if (runs.length === 0) {
    return (
      <div className="border-2 border-dashed border-black bg-white p-12 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-[#121212]">
        <Bug className="mx-auto h-10 w-10 text-neutral-400 mb-3" />
        <h3 className="font-serif-heading text-lg font-bold uppercase tracking-tight text-[#121212]">
          No automated bug fixes recorded yet
        </h3>
        <p className="text-xs font-sans text-[#121212]/70 mt-1 max-w-sm mx-auto">
          The daemon is actively watching your configured repositories. Click &quot;Inject Bug&quot; or &quot;Sweep Now&quot; to test the automated pipeline!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-[#121212]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-serif-heading text-xl sm:text-2xl font-bold uppercase tracking-tight text-[#121212]">
              Automated Fix History &amp; Pull Requests
            </span>
          </div>
          <p className="text-xs font-sans text-[#121212]/70 mt-1">
            Every fix undergoes autonomous 5-stage AST &amp; CVE verification, PR generation, email notification, and supports instant 1-click undo.
          </p>
        </div>
        <span className="text-xs font-mono uppercase font-bold text-[#121212] bg-[#F9F7F2] px-3 py-1 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] self-start sm:self-auto">
          {runs.length} Patches Logged
        </span>
      </div>

      <div className="space-y-4">
        {runs.map((run) => {
          const isUndoing = isUndoingId === run.id;
          const isUndone = run.isUndone || run.status === 'undone';

          const getCategoryBadge = (category: string) => {
            switch (category) {
              case 'security_cve':
                return { label: 'Security CVE', color: 'bg-red-200 text-red-950 border-black' };
              case 'memory_leak':
                return { label: 'Memory Leak', color: 'bg-amber-200 text-amber-950 border-black' };
              case 'race_condition':
                return { label: 'Race Condition', color: 'bg-purple-200 text-purple-950 border-black' };
              case 'null_pointer':
                return { label: 'Null Pointer', color: 'bg-cyan-200 text-cyan-950 border-black' };
              default:
                return { label: 'Code Flaw', color: 'bg-emerald-200 text-emerald-950 border-black' };
            }
          };

          const catBadge = getCategoryBadge(run.bugCategory);
          const score = run.pipeline?.overallScore || 95;

          return (
            <div
              key={run.id}
              className={`border-2 border-black p-5 transition-all text-[#121212] ${
                isUndone
                  ? 'bg-neutral-100 opacity-70 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                
                {/* Left: Bug Info */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 border ${catBadge.color}`}>
                      {catBadge.label}
                    </span>

                    <span className="font-mono text-xs font-bold text-[#121212] bg-[#F9F7F2] px-2 py-0.5 border border-black">
                      {run.repoName}
                    </span>

                    <span className="text-xs font-mono text-[#121212]/70">
                      commit: <code className="font-bold text-black font-mono">{run.commitSha}</code>
                    </span>

                    {/* Status Pill */}
                    {isUndone ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-sans font-bold uppercase text-amber-950 bg-amber-200 px-2 py-0.5 border border-black">
                        <RotateCcw className="h-3 w-3" /> Undone (Rolled Back)
                      </span>
                    ) : run.status === 'pushed' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-sans font-bold uppercase text-emerald-950 bg-emerald-200 px-2 py-0.5 border border-black">
                        <CheckCircle2 className="h-3 w-3" /> Pushed &amp; Merged
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-sans font-bold uppercase text-cyan-950 bg-cyan-200 px-2 py-0.5 border border-black">
                        <GitPullRequest className="h-3 w-3" /> Pull Request Open
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif-heading text-lg font-bold text-[#121212] tracking-tight">
                    {run.bugTitle}
                  </h3>

                  <p className="text-xs font-sans text-[#121212]/80 leading-relaxed line-clamp-2">
                    {run.bugDescription || run.aiReasoning}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-[#121212]/70">
                    <span className="flex items-center gap-1 font-bold text-black">
                      <Cpu className="h-3.5 w-3.5 text-black" />
                      {run.modelUsed}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileCode2 className="h-3.5 w-3.5 text-[#121212]/60" />
                      {run.affectedFiles?.join(', ') || 'source file'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-[#121212]/60" />
                      {new Date(run.timestamp).toLocaleTimeString()}
                    </span>
                    {run.emailSent && (
                      <span className="flex items-center gap-1 font-bold text-emerald-900 bg-emerald-100 px-1.5 py-0.2 border border-emerald-700">
                        <Mail className="h-3 w-3" />
                        Report Emailed
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Pipeline Scorecard & Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:border-l-2 lg:border-black lg:pl-5">
                  
                  {/* Security Pipeline Badge */}
                  <button
                    onClick={() => onViewPipeline(run)}
                    className="flex flex-col items-center justify-center bg-[#F9F7F2] p-3 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-white transition-all min-w-[110px]"
                    title="View 5-Stage Code Review Pipeline"
                  >
                    <div className="flex items-center gap-1 text-[9px] uppercase font-sans font-bold tracking-widest text-[#121212]/70">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-800" />
                      Gate Score
                    </div>
                    <div className="text-xl font-bold font-serif-heading text-[#121212]">
                      {score}%
                    </div>
                    <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-black hover:underline mt-0.5">
                      Inspect AST
                    </span>
                  </button>

                  {/* Actions Group */}
                  <div className="flex flex-wrap sm:flex-col gap-2">
                    
                    {/* View Diff Button */}
                    <button
                      onClick={() => onViewDiff(run)}
                      className="flex items-center justify-center gap-1.5 border border-black bg-white px-3 py-1.5 text-xs font-sans font-bold uppercase tracking-wider text-[#121212] hover:bg-[#F9F7F2] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all"
                    >
                      <Eye className="h-3.5 w-3.5 text-black" />
                      View Diff
                    </button>

                    {/* AI Thought Process */}
                    {onOpenThoughtStream && (
                      <button
                        onClick={() => onOpenThoughtStream(run)}
                        className="flex items-center justify-center gap-1.5 border border-black bg-purple-100 px-3 py-1.5 text-xs font-sans font-bold uppercase tracking-wider text-purple-950 hover:bg-purple-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all"
                      >
                        <BrainCircuit className="h-3.5 w-3.5 text-purple-800" />
                        AI Thoughts
                      </button>
                    )}

                    {/* Pull Request Link */}
                    {run.pullRequestUrl && (
                      <a
                        href={run.pullRequestUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1 border border-black bg-white px-3 py-1.5 text-xs font-sans font-bold uppercase tracking-wider text-[#121212] hover:bg-[#F9F7F2] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                      >
                        <GitPullRequest className="h-3.5 w-3.5" />
                        PR #{run.pullRequestNumber || 'PR'}
                        <ArrowUpRight className="h-3 w-3" />
                      </a>
                    )}

                    {/* 1-Click Undo Button */}
                    {!isUndone && (
                      <button
                        onClick={() => onUndoFix(run)}
                        disabled={isUndoing}
                        className="flex items-center justify-center gap-1 border border-black bg-amber-200 px-3 py-1.5 text-xs font-sans font-bold uppercase tracking-wider text-amber-950 hover:bg-amber-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all disabled:opacity-50"
                        title="Revert this automated commit & PR"
                      >
                        <RotateCcw className={`h-3.5 w-3.5 ${isUndoing ? 'animate-spin' : ''}`} />
                        {isUndoing ? 'Reverting...' : 'Undo Fix'}
                      </button>
                    )}

                  </div>

                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

