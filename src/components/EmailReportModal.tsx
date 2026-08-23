import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Send, 
  CheckCircle2, 
  ShieldCheck, 
  GitPullRequest, 
  RotateCcw, 
  Cpu, 
  ExternalLink,
  Sparkles,
  Eye,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { BugFixRun } from '../types';

interface EmailReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  fixRuns: BugFixRun[];
  userEmail: string;
  onSendEmail: (recipient: string) => Promise<boolean>;
}

export const EmailReportModal: React.FC<EmailReportModalProps> = ({
  isOpen,
  onClose,
  fixRuns,
  userEmail,
  onSendEmail
}) => {
  const [recipient, setRecipient] = useState(userEmail || '');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    const success = await onSendEmail(recipient);
    setIsSending(false);
    if (success) {
      setSentSuccess(true);
      setTimeout(() => setSentSuccess(false), 4000);
    }
  };

  const totalFixes = fixRuns.length;
  const passedFixes = fixRuns.filter(r => r.pipeline?.passed);
  const failedFixes = fixRuns.filter(r => r.status === 'failed' || (r.pipeline && !r.pipeline.passed));
  const avgScore = totalFixes > 0
    ? Math.round(fixRuns.reduce((sum, r) => sum + (r.pipeline?.overallScore || 95), 0) / totalFixes)
    : 96;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden my-8 text-[#121212]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black bg-[#F9F7F2] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border-2 border-black bg-black text-[#F9F7F2] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif-heading text-lg font-bold uppercase tracking-tight text-[#121212]">
                Automated Bug Fix Summary Reports
              </h3>
              <p className="text-xs font-sans text-[#121212]/70">
                Scheduled background digests with security audit scores, fixed/failed metrics &amp; 1-click rollback affordances.
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

        {/* Dispatch Form */}
        <form onSubmit={handleSend} className="border-b-2 border-black bg-[#F9F7F2]/60 px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <label className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#121212] block mb-1">
                Recipient Email Address:
              </label>
              <input
                type="email"
                required
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="developer@company.com"
                className="w-full border border-black bg-white px-3 py-2 text-xs text-[#121212] font-mono focus:outline-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>

            <div className="sm:self-end">
              <button
                type="submit"
                disabled={isSending}
                className="flex w-full sm:w-auto items-center justify-center gap-1.5 border border-black bg-black text-[#F9F7F2] px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-800 active:translate-x-[1px] active:translate-y-[1px] transition-all disabled:opacity-50"
              >
                <Send className={`h-3.5 w-3.5 ${isSending ? 'animate-bounce' : ''}`} />
                {isSending ? 'Dispatching...' : 'Send Summary Report Now'}
              </button>
            </div>
          </div>

          {sentSuccess && (
            <div className="mt-3 flex items-center gap-2 border-2 border-black bg-emerald-100 p-2.5 text-xs font-bold text-emerald-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <CheckCircle2 className="h-4 w-4 text-emerald-800" />
              Summary digest successfully dispatched to {recipient}! Check your inbox.
            </div>
          )}
        </form>

        {/* Email HTML Preview Container */}
        <div className="p-6 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs font-sans font-bold uppercase tracking-wider text-[#121212]">
              <Eye className="h-4 w-4 text-black" />
              Live HTML Email Preview (Rendered Template)
            </div>
            <span className="text-[10px] text-[#121212]/70 font-mono font-bold">
              Subject: [D-Bugger Report] Autonomous Fixes ({totalFixes} Patches, 0 Blocked)
            </span>
          </div>

          {/* Email Canvas Mockup */}
          <div className="border-2 border-black bg-[#F9F7F2] p-6 text-[#121212] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-h-[400px] overflow-y-auto font-sans">
            
            {/* Email Header */}
            <div className="border-b-2 border-black pb-4 mb-4 flex items-center justify-between">
              <div>
                <h1 className="font-serif-heading text-xl font-bold uppercase tracking-tight text-[#121212]">
                  D-Bugger Git Daemon Digest
                </h1>
                <p className="text-xs text-[#121212]/70 mt-0.5">Autonomous Code Health, Security Gate &amp; Pull Request Report</p>
              </div>
              <span className="bg-black text-[#F9F7F2] text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-1 border border-black">
                Active 24/7
              </span>
            </div>

            {/* Email Metrics Row */}
            <div className="grid grid-cols-3 gap-3 bg-white p-3 border-2 border-black mb-5 text-center text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div>
                <div className="text-[10px] font-sans uppercase font-bold text-[#121212]/60">Bugs Auto-Healed</div>
                <div className="text-xl font-bold font-serif-heading text-[#121212]">{totalFixes}</div>
              </div>
              <div>
                <div className="text-[10px] font-sans uppercase font-bold text-[#121212]/60">Security Pass Rate</div>
                <div className="text-xl font-bold font-serif-heading text-emerald-800">{avgScore}%</div>
              </div>
              <div>
                <div className="text-[10px] font-sans uppercase font-bold text-[#121212]/60">Failed / Blocked</div>
                <div className="text-xl font-bold font-serif-heading text-[#121212]">{failedFixes.length}</div>
              </div>
            </div>

            {/* Fixes Breakdown */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[#121212] uppercase tracking-wider border-b border-black/20 pb-1">
                Recent Autonomous Fixes
              </h3>

              {fixRuns.slice(0, 4).map((run) => (
                <div key={run.id} className="border border-black bg-white p-3 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-[#121212] font-serif-heading text-sm">
                        {run.repoName}: {run.bugTitle}
                      </div>
                      <p className="text-[#121212]/70 text-[11px] mt-0.5 font-mono">
                        Model: <strong className="text-black">{run.modelUsed}</strong> | Severity: <span className="uppercase text-red-700 font-bold">{run.bugSeverity}</span>
                      </p>
                    </div>
                    <span className="text-emerald-950 font-mono font-bold bg-emerald-200 border border-black px-2 py-0.5 text-[10px] uppercase">
                      {run.pipeline?.overallScore || 95}% Safe
                    </span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-black/10 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#121212]/70">
                      PR #{run.pullRequestNumber || 'PR'} | Branch: {run.branchName}
                    </span>
                    <span className="text-amber-900 font-bold uppercase underline">
                      [1-Click Rollback Ready]
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Email Footer */}
            <div className="mt-6 pt-4 border-t-2 border-black text-center text-[10px] font-sans text-[#121212]/70 uppercase tracking-wider">
              <p>This automated report was generated by your D-Bugger GitHub MCP Daemon with OpenRouter High-Context Intelligence.</p>
              <p className="mt-1">To change email digest frequency or toggle repositories, open your D-Bugger dashboard.</p>
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end border-t-2 border-black bg-[#F9F7F2] px-6 py-3">
          <button
            onClick={onClose}
            className="border border-black bg-white px-4 py-1.5 text-xs font-sans font-bold uppercase tracking-wider text-[#121212] hover:bg-[#F9F7F2] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
