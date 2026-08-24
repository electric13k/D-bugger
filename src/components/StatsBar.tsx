import React from 'react';
import { 
  GitPullRequest, 
  ShieldCheck, 
  RotateCcw, 
  Cpu, 
  GitBranch, 
  CheckCircle2, 
  Radio, 
  Clock 
} from 'lucide-react';
import { MonitoredRepo, BugFixRun } from '../types';

interface StatsBarProps {
  repos: MonitoredRepo[];
  fixRuns: BugFixRun[];
  daemonRunning: boolean;
}

export const StatsBar: React.FC<StatsBarProps> = ({ repos, fixRuns, daemonRunning }) => {
  const totalRuns = fixRuns.length;
  const activeReposCount = repos.filter(r => r.isLive).length;
  const verifiedRuns = fixRuns.filter(r => r.pullRequestUrl && r.pullRequestNumber && r.pushedCommitSha);
  const undoneCount = fixRuns.filter(r => r.isUndone || r.status === 'undone').length;
  const scoredRuns = fixRuns.filter(r => typeof r.pipeline?.overallScore === 'number' && r.pipeline.overallScore > 0);
  const avgSecurityScore = scoredRuns.length
    ? Math.round(scoredRuns.reduce((acc, r) => acc + (r.pipeline?.overallScore ?? 0), 0) / scoredRuns.length)
    : null;
  const modelRuns = fixRuns.filter(r => r.mcpToolLogs?.some(log => log.tool === 'ai_analysis' && log.output?.responseReceived));

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-8 text-[#121212]">
      
      {/* 1. Daemon Status Card */}
      <div className="bg-white border border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase font-sans font-bold tracking-widest text-[#121212]/60">Daemon State</span>
          <Radio className={`h-3.5 w-3.5 ${daemonRunning ? 'text-emerald-700' : 'text-slate-400'}`} />
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="font-serif-heading text-xl font-bold text-[#121212] tracking-tight">
            {daemonRunning ? 'Running' : 'Paused'}
          </span>
        </div>
        <p className="mt-1 text-[10px] font-mono uppercase tracking-tight text-[#121212]/60 truncate">Client heartbeat + D1 state</p>
      </div>

      {/* 2. Monitored Repos */}
      <div className="bg-white border border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase font-sans font-bold tracking-widest text-[#121212]/60">Watched Repos</span>
          <GitBranch className="h-3.5 w-3.5 text-black" />
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="font-serif-heading text-2xl font-bold text-[#121212]">{repos.length}</span>
          <span className="text-xs font-sans font-medium text-[#121212]/60">({activeReposCount} live)</span>
        </div>
        <p className="mt-1 text-[10px] font-mono uppercase tracking-tight text-[#121212]/60 truncate">Context sync requires GitHub token</p>
      </div>

      {/* 3. Automated Fixes */}
      <div className="bg-white border border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
        <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-sans font-bold tracking-widest text-[#121212]/60">Verified PRs</span>
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-serif-heading text-2xl font-bold text-[#121212]">{verifiedRuns.length}</span>
              <span className="text-xs font-sans font-bold text-emerald-800">of {totalRuns} runs</span>
        </div>
        <p className="mt-1 text-[10px] font-mono uppercase tracking-tight text-[#121212]/60 truncate">{verifiedRuns.length} verified deliveries</p>
      </div>

      {/* 4. Security Pass Rate */}
      <div className="bg-white border border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase font-sans font-bold tracking-widest text-[#121212]/60">Review Gate</span>
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-serif-heading text-2xl font-bold text-[#121212]">{avgSecurityScore === null ? '—' : `${avgSecurityScore}%`}</span>
              <span className="text-xs font-sans font-bold text-emerald-800">recorded</span>
            </div>
            <p className="mt-1 text-[10px] font-mono uppercase tracking-tight text-[#121212]/60 truncate">No independent CI implied</p>
      </div>

      {/* 5. OpenRouter Models */}
      <div className="bg-white border border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase font-sans font-bold tracking-widest text-[#121212]/60">Inference</span>
          <Cpu className="h-3.5 w-3.5 text-black" />
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-serif-heading text-2xl font-bold text-[#121212]">{modelRuns.length}</span>
        </div>
        <p className="mt-1 text-[10px] font-mono uppercase tracking-tight text-[#121212]/60 truncate">model responses recorded</p>
      </div>

      {/* 6. Undo Rollbacks */}
      <div className="bg-white border border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase font-sans font-bold tracking-widest text-[#121212]/60">Undo Center</span>
          <RotateCcw className="h-3.5 w-3.5 text-amber-700" />
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="font-serif-heading text-2xl font-bold text-[#121212]">{undoneCount}</span>
              <span className="text-xs font-sans font-bold text-amber-800">confirmed</span>
        </div>
        <p className="mt-1 text-[10px] font-mono uppercase tracking-tight text-[#121212]/60 truncate">GitHub undo records</p>
      </div>

    </div>
  );
};

