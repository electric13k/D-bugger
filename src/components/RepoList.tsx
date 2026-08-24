import React, { useState } from 'react';
import { 
  GitBranch, 
  Plus, 
  ExternalLink, 
  Play, 
  Settings2, 
  ShieldCheck, 
  Cpu, 
  Clock, 
  Mail, 
  Check, 
  Flame,
  Lock,
  GitPullRequest,
  Trash2,
  Zap,
  Radio,
  AlertTriangle,
  Github,
  CheckCircle2
} from 'lucide-react';
import { MonitoredRepo } from '../types';
import { OPENROUTER_MODELS } from '../data/models';

interface RepoListProps {
  repos: MonitoredRepo[];
  onAddRepo: () => void;
  onScanRepo: (repo: MonitoredRepo) => void;
  onUpdateRepo: (repoId: string, updates: Partial<MonitoredRepo>) => void;
  onDeleteRepo: (repoId: string) => void;
  isScanningRepoId: string | null;
}

export const RepoList: React.FC<RepoListProps> = ({
  repos,
  onAddRepo,
  onScanRepo,
  onUpdateRepo,
  onDeleteRepo,
  isScanningRepoId
}) => {
  const [repoToDelete, setRepoToDelete] = useState<MonitoredRepo | null>(null);

  const confirmDelete = () => {
    if (repoToDelete) {
      onDeleteRepo(repoToDelete.id);
      setRepoToDelete(null);
    }
  };

  return (
    <div className="border-2 border-black bg-white p-6 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] mb-8 text-[#121212]">
      
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b-2 border-black pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-serif-heading text-xl sm:text-2xl font-bold uppercase tracking-tight text-[#121212]">
              Monitored GitHub Repositories
            </span>
            <span className="border border-black bg-[#F9F7F2] px-2 py-0.5 text-[9px] font-mono font-bold uppercase">
              GitHub Context &bull; Push Sweep
            </span>
          </div>
          <p className="text-xs font-sans text-[#121212]/70 mt-1">
            D-Bugger reads connected repository commits, gathers Gridscape context, and produces a reviewable diagnosis. GitHub mutation requires verified evidence and authorization.
          </p>
        </div>

        <button
          id="btn-add-monitored-repo"
          onClick={onAddRepo}
          className="flex items-center justify-center gap-1.5 bg-black text-[#F9F7F2] border border-black px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-800 active:translate-x-[1px] active:translate-y-[1px] transition-all shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          Connect Repository
        </button>
      </div>

      {/* Repos List / Empty State */}
      {repos.length === 0 ? (
        <div className="border-2 border-dashed border-black/30 bg-[#F9F7F2] p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-4">
            <Github className="h-6 w-6 text-black" />
          </div>
          <h3 className="font-serif-heading text-lg font-bold uppercase tracking-tight text-[#121212]">
            No Repositories Connected to D-Bugger Yet
          </h3>
          <p className="text-xs text-[#121212]/70 max-w-md mx-auto mt-2 leading-relaxed">
            Connect a public or private GitHub repository to read its current source, refresh context.md, gather Gridscape research, and produce a reviewable code proposal. Tests and GitHub delivery are never assumed.
          </p>
          <div className="mt-5">
            <button
              onClick={onAddRepo}
              className="inline-flex items-center gap-2 border-2 border-black bg-black text-[#F9F7F2] px-5 py-2.5 text-xs font-sans font-bold uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-800 active:translate-x-[1px] active:translate-y-[1px]"
            >
              <Plus className="h-4 w-4" />
              Connect Your First Repository
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {repos.map((repo) => {
            const isScanning = isScanningRepoId === repo.id;
            const currentModel = OPENROUTER_MODELS.find(m => m.id === repo.openRouterModel) || OPENROUTER_MODELS[0];
            const autoSweepEnabled = repo.autoSweepOnPush !== false;

            return (
              <div
                key={repo.id}
                className="flex flex-col justify-between border border-black bg-[#F9F7F2] p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                {/* Top metadata */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-1.5 font-mono text-sm font-bold text-[#121212] hover:underline"
                      >
                        {repo.name}
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 text-[11px] font-mono text-[#121212]/80 bg-white px-2 py-0.5 border border-black">
                          <GitBranch className="h-2.5 w-2.5 text-black" />
                          {repo.branch}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Active status pill */}
                      <span className={`inline-flex items-center gap-1 text-[10px] font-mono uppercase font-bold px-2 py-0.5 border border-black ${
                        repo.isLive
                          ? 'bg-emerald-200 text-emerald-950'
                          : 'bg-white text-[#121212]/60'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${repo.isLive ? 'bg-emerald-700 animate-pulse' : 'bg-slate-400'}`} />
                        {repo.isLive ? 'Watching' : 'Paused'}
                      </span>

                      {/* Delete from D-Bugger button */}
                      <button
                        title="Disconnect from D-Bugger (Leaves remote GitHub untouched)"
                        onClick={() => setRepoToDelete(repo)}
                        className="border border-black bg-white hover:bg-red-100 text-red-700 p-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Auto-Sweep on Commit Push Toggle */}
                  <div className="mt-3 border border-black bg-white p-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <Zap className={`h-3.5 w-3.5 ${autoSweepEnabled ? 'text-amber-600' : 'text-neutral-400'}`} />
                      <span className="font-bold text-[11px] uppercase tracking-wider text-[#121212]">
                        Auto-Sweep on Push
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onUpdateRepo(repo.id, { autoSweepOnPush: !autoSweepEnabled })}
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 border border-black uppercase transition-all ${
                        autoSweepEnabled
                          ? 'bg-emerald-200 text-emerald-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {autoSweepEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  {/* Model Selector & Pipeline mode */}
                  <div className="mt-3 space-y-2.5 text-xs">
                    
                    {/* High Context Model Selector */}
                    <div>
                      <label className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#121212]/80 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Cpu className="h-3 w-3 text-black" />
                          AI Reasoning Model
                        </span>
                        <span className="text-[10px] text-black font-mono font-bold">{currentModel.contextLength}</span>
                      </label>
                      <select
                        value={repo.openRouterModel}
                        onChange={(e) => onUpdateRepo(repo.id, { openRouterModel: e.target.value })}
                        className="mt-1 w-full border border-black bg-white px-2.5 py-1.5 text-xs text-[#121212] font-mono focus:outline-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                      >
                        {OPENROUTER_MODELS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.contextLength})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Action Mode Toggle: review-only delivery preferences */}
                    <div>
                      <label className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#121212]/80 flex items-center gap-1">
                        <GitPullRequest className="h-3 w-3 text-black" />
                        Auto-Fix Delivery Strategy
                      </label>
                      <div className="mt-1 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => onUpdateRepo(repo.id, { autoMode: 'pr_only' })}
                          className={`px-2 py-1 text-[11px] font-sans font-bold uppercase transition-all border border-black ${
                            repo.autoMode === 'pr_only'
                              ? 'bg-black text-[#F9F7F2] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                              : 'bg-white text-[#121212] hover:bg-[#F9F7F2]'
                          }`}
                        >
                          PR Review
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateRepo(repo.id, { autoMode: 'pr_and_push' })}
                          className={`px-2 py-1 text-[11px] font-sans font-bold uppercase transition-all border border-black ${
                            repo.autoMode === 'pr_and_push'
                              ? 'bg-black text-[#F9F7F2] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                              : 'bg-white text-[#121212] hover:bg-[#F9F7F2]'
                          }`}
                        >
                          PR Review + Delivery
                        </button>
                      </div>
                    </div>

                    {/* Security threshold */}
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-black/10">
                      <span className="flex items-center gap-1 text-[#121212]/70 font-sans font-medium">
                        <ShieldCheck className="h-3 w-3 text-emerald-800" />
                        Review Gate Threshold:
                      </span>
                      <span className="font-mono font-bold text-emerald-900 bg-emerald-100 px-1.5 py-0.5 border border-emerald-800">
                        ≥{repo.securityThreshold || 85}%
                      </span>
                    </div>

                  </div>
                </div>

                {/* Bottom Actions & Stats */}
                <div className="mt-4 pt-3 border-t-2 border-black flex items-center justify-between">
                  <div className="text-[11px] font-mono text-[#121212]/70">
                    <span className="font-bold text-[#121212]">{repo.totalFixes || 0}</span> recorded runs
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onScanRepo(repo)}
                      disabled={isScanning}
                      className="flex items-center gap-1 border border-black bg-white px-3 py-1 text-xs font-sans font-bold uppercase text-[#121212] hover:bg-[#F9F7F2] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all disabled:opacity-50"
                    >
                      <Play className={`h-3 w-3 ${isScanning ? 'animate-spin' : ''}`} />
                      {isScanning ? 'Scanning...' : 'Sweep Now'}
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal to Delete Repo from D-Bugger */}
      {repoToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md border-2 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] font-sans">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black bg-red-100 text-red-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif-heading text-lg font-bold text-[#121212]">
                  Disconnect from D-Bugger?
                </h3>
                <p className="text-xs text-[#121212]/80 mt-1">
                  Are you sure you want to stop monitoring <strong className="font-mono text-black">{repoToDelete.name}</strong>?
                </p>
              </div>
            </div>

            <div className="mt-4 border-2 border-black bg-[#F9F7F2] p-3 text-xs text-[#121212]/90 leading-relaxed">
              <strong>Note on Safety:</strong> This action will <strong>ONLY</strong> remove this repository from your D-Bugger dashboard and stop automated bug sweeping. Your code, branches, and commits on GitHub will <strong>remain completely untouched and safe</strong>.
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRepoToDelete(null)}
                className="border border-black bg-white px-4 py-2 text-xs font-bold uppercase text-[#121212] hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="border-2 border-black bg-red-600 text-white px-4 py-2 text-xs font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-red-700"
              >
                Disconnect Repository
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

