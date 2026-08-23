import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  GitBranch, 
  Github, 
  Cpu, 
  ShieldCheck, 
  Mail, 
  Check, 
  GitPullRequest,
  Zap
} from 'lucide-react';
import { OPENROUTER_MODELS } from '../data/models';
import { MonitoredRepo } from '../types';

interface AddRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRepo: (repo: Omit<MonitoredRepo, 'id' | 'lastCheckedAt' | 'totalFixes'>) => Promise<void>;
  userEmail: string;
}

export const AddRepoModal: React.FC<AddRepoModalProps> = ({
  isOpen,
  onClose,
  onAddRepo,
  userEmail
}) => {
  const [repoSlug, setRepoSlug] = useState('');
  const [branch, setBranch] = useState('main');
  const [openRouterModel, setOpenRouterModel] = useState('deepseek/deepseek-r1:free');
  const [autoMode, setAutoMode] = useState<'pr_only' | 'pr_and_push'>('pr_and_push');
  const [autoSweepOnPush, setAutoSweepOnPush] = useState(true);
  const [securityThreshold, setSecurityThreshold] = useState(85);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [alertEmail, setAlertEmail] = useState(userEmail || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoSlug.trim()) return;

    let owner = 'user';
    let repo = repoSlug.trim();
    if (repoSlug.includes('/')) {
      const parts = repoSlug.split('/');
      owner = parts[0].trim();
      repo = parts[1].trim();
    }

    setIsSubmitting(true);
    try {
      await onAddRepo({
        name: `${owner}/${repo}`,
        owner,
        repo,
        branch: branch.trim() || 'main',
        url: `https://github.com/${owner}/${repo}`,
        isLive: true,
        status: 'monitoring',
        autoMode,
        autoSweepOnPush,
        openRouterModel,
        securityThreshold,
        emailAlerts,
        alertEmail,
        isMockDemo: false,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto font-sans">
      <div className="relative w-full max-w-lg border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden my-8 text-[#121212]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black bg-[#F9F7F2] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border-2 border-black bg-black text-[#F9F7F2] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Github className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif-heading text-lg font-bold uppercase tracking-tight text-[#121212]">
                Connect GitHub Repository
              </h3>
              <p className="text-xs text-[#121212]/70 font-sans">
                Continuous Git commit watching &amp; high-context AI bug healing.
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-sans bg-white">
          
          {/* Repo Slug */}
          <div className="space-y-1">
            <label className="text-[#121212] font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Github className="h-3.5 w-3.5 text-black" />
              Repository (owner/repo or project):
            </label>
            <input
              type="text"
              required
              placeholder="e.g. facebook/react, vercel/next.js, or your-org/api"
              value={repoSlug}
              onChange={(e) => setRepoSlug(e.target.value)}
              className="w-full border border-black bg-[#F9F7F2] px-3 py-2 text-xs text-[#121212] placeholder-[#121212]/40 focus:outline-none font-mono shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          {/* Branch */}
          <div className="space-y-1">
            <label className="text-[#121212] font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <GitBranch className="h-3.5 w-3.5 text-black" />
              Target Watch Branch:
            </label>
            <input
              type="text"
              required
              placeholder="main or master or develop"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full border border-black bg-[#F9F7F2] px-3 py-2 text-xs text-[#121212] focus:outline-none font-mono shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          {/* AI Model */}
          <div className="space-y-1">
            <label className="text-[#121212] font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-black" />
              Reasoning AI Model:
            </label>
            <select
              value={openRouterModel}
              onChange={(e) => setOpenRouterModel(e.target.value)}
              className="w-full border border-black bg-white px-3 py-2 text-xs text-[#121212] font-mono focus:outline-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              {OPENROUTER_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.contextLength})
                </option>
              ))}
            </select>
          </div>

          {/* Auto-Sweep on Commit Push */}
          <div className="border border-black bg-[#F9F7F2] p-3 flex items-center justify-between shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-600" />
              <div>
                <span className="font-bold text-[#121212] block">Auto-Sweep on Push</span>
                <span className="text-[10px] text-[#121212]/70">Trigger AST &amp; Legal scan automatically on every git commit.</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAutoSweepOnPush(!autoSweepOnPush)}
              className={`px-2.5 py-1 text-xs font-mono font-bold border border-black uppercase ${
                autoSweepOnPush ? 'bg-emerald-200 text-emerald-950' : 'bg-white text-neutral-600'
              }`}
            >
              {autoSweepOnPush ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Auto Mode */}
          <div className="space-y-1">
            <label className="text-[#121212] font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <GitPullRequest className="h-3.5 w-3.5 text-black" />
              Autonomous Delivery Mode:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAutoMode('pr_only')}
                className={`border border-black px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                  autoMode === 'pr_only'
                    ? 'bg-black text-[#F9F7F2] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-white text-[#121212] hover:bg-[#F9F7F2]'
                }`}
              >
                Create PR Only
              </button>
              <button
                type="button"
                onClick={() => setAutoMode('pr_and_push')}
                className={`border border-black px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                  autoMode === 'pr_and_push'
                    ? 'bg-black text-[#F9F7F2] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-white text-[#121212] hover:bg-[#F9F7F2]'
                }`}
              >
                PR + Auto-Push
              </button>
            </div>
          </div>

          {/* Email Alert */}
          <div className="space-y-1">
            <label className="text-[#121212] font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-black" />              Alert Recipient (Optional):
            </label>
            <input
              type="email"
              value={alertEmail}
              onChange={(e) => setAlertEmail(e.target.value)}
              className="w-full border border-black bg-[#F9F7F2] px-3 py-2 text-xs text-[#121212] focus:outline-none font-mono shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          {/* Submit */}
          <div className="pt-3 border-t-2 border-black flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="border border-black bg-white px-3.5 py-1.5 text-xs font-bold uppercase text-[#121212] hover:bg-[#F9F7F2]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 border-2 border-black bg-black text-[#F9F7F2] px-4 py-1.5 text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-800 transition-all disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              {isSubmitting ? 'Connecting...' : 'Connect to Daemon'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

