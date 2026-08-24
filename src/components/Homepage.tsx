import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Cpu, 
  Github, 
  Slack, 
  Bell, 
  ShieldCheck, 
  RotateCcw, 
  Mail, 
  Play, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Code2, 
  Flame, 
  Info, 
  GitBranch, 
  Layers, 
  Check, 
  RefreshCw,
  Trash2,
  ExternalLink,
  Zap,
  Activity,
  Network
} from 'lucide-react';
import { OPENROUTER_MODELS } from '../data/models';
import { readSessionCredential } from '../lib/cloudflareWorkspace';
import { MonitoredRepo, BugFixRun } from '../types';
import { DaemonService } from '../services/daemonService';

interface HomepageProps {
  onNavigateToDashboard: () => void;
  onOpenAddRepo: () => void;
  onOpenBugPlayground: () => void;
  onOpenUndoCenter: () => void;
  onOpenEmailReport: () => void;
  onOpenSettings: () => void;
  onOpenApiKeyPrompt: () => void;
  onOpenGridscapeResearch: () => void;
  repos: MonitoredRepo[];
  fixRuns: BugFixRun[];
  userEmail: string;
}

export const Homepage: React.FC<HomepageProps> = ({
  onNavigateToDashboard,
  onOpenAddRepo,
  onOpenBugPlayground,
  onOpenUndoCenter,
  onOpenEmailReport,
  onOpenSettings,
  onOpenApiKeyPrompt,
  onOpenGridscapeResearch,
  repos,
  fixRuns,
  userEmail,
}) => {
  // Integration States
  const [openRouterKey, setOpenRouterKey] = useState(readSessionCredential('dbugger_openrouter_key', 'repoheal_openrouter_key'));
  const [githubToken, setGithubToken] = useState(readSessionCredential('dbugger_github_token', 'repoheal_github_token'));
  const [slackWebhook, setSlackWebhook] = useState(localStorage.getItem('dbugger_slack_webhook') || '');
  const [selectedModel, setSelectedModel] = useState(localStorage.getItem('repoheal_default_model') || 'deepseek/deepseek-r1:free');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  const [keySaved, setKeySaved] = useState(false);
  const [ghSaved, setGhSaved] = useState(false);
  const [slackSaved, setSlackSaved] = useState(false);
  const [isTestingSlack, setIsTestingSlack] = useState(false);
  const [slackTestSuccess, setSlackTestSuccess] = useState(false);
  const [isClearingRepos, setIsClearingRepos] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleSaveOpenRouter = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem('dbugger_openrouter_key', openRouterKey.trim());
    sessionStorage.setItem('dbugger_default_model', selectedModel);
    localStorage.removeItem('repoheal_openrouter_key');
    localStorage.setItem('repoheal_default_model', selectedModel);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2500);
  };

  const handleSaveGitHub = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem('dbugger_github_token', githubToken.trim());
    localStorage.removeItem('repoheal_github_token');
    setGhSaved(true);
    setTimeout(() => setGhSaved(false), 2500);
  };

  const handleSaveSlack = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('dbugger_slack_webhook', slackWebhook);
    setSlackSaved(true);
    setTimeout(() => setSlackSaved(false), 2500);
  };

  const handleTestSlack = async () => {
    if (!slackWebhook) return;
    setIsTestingSlack(true);
    try {
      await fetch('/api/slack/send-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: slackWebhook,
          repoName: 'acme/ecommerce-api',
          bugTitle: 'Test Slack Webhook Alert from D-Bugger',
          bugCategory: 'integration_test',
          severity: 'medium',
          prUrl: 'https://github.com/acme/ecommerce-api/pull/101',
          score: 98,
          actionType: 'fix_applied'
        })
      });
      setSlackTestSuccess(true);
      setTimeout(() => setSlackTestSuccess(false), 3000);
    } catch (e) {
      console.warn('Slack test error:', e);
    } finally {
      setIsTestingSlack(false);
    }
  };

  const handleRequestNotification = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        new Notification('D-Bugger Notification Enabled', {
          body: 'You will now receive instant desktop alerts for automated bug fixes and security reviews.'
        });
      }
    }
  };

  const handleClearRepos = async () => {
    if (window.confirm('Clear sandbox demo repositories? You can add your own real GitHub repositories or reload demo repos at any time.')) {
      setIsClearingRepos(true);
      await DaemonService.clearDemoRepos();
      setIsClearingRepos(false);
    }
  };

  const handleResetDemoRepos = async () => {
    setIsClearingRepos(true);
    await DaemonService.resetToDemoRepos(userEmail);
    setIsClearingRepos(false);
  };

  const demoReposCount = repos.filter(r => r.isMockDemo).length;
  const verifiedDeliveryRuns = fixRuns.filter(r => r.pullRequestUrl && r.pullRequestNumber && r.pushedCommitSha);
  const activeFixesCount = verifiedDeliveryRuns.filter(r => !r.isUndone).length;
  const scoredRuns = fixRuns.filter(r => typeof r.pipeline?.overallScore === 'number' && r.pipeline.overallScore > 0);
  const recordedReviewRate = scoredRuns.length ? `${Math.round(scoredRuns.reduce((sum, r) => sum + (r.pipeline?.overallScore ?? 0), 0) / scoredRuns.length)}%` : '—';

  return (
    <div className="space-y-8 font-sans text-[#121212]">
      
      {/* Editorial Masthead Hero */}
      <section className="border-2 border-black bg-[#F9F7F2] p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-black text-[#F9F7F2] text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-0.5 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                Autonomous Git Daemon
              </span>
              <span className="text-xs font-mono font-bold text-[#121212]/80">
                v2.4.0 • OpenRouter &amp; GitHub MCP Engine
              </span>
            </div>

            <h1 className="font-serif-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#121212] leading-none">
              D-Bugger
            </h1>
            
            <p className="text-base sm:text-lg font-serif-heading text-[#121212]/80 italic">
              Evidence-backed GitHub diagnostics, user-owned AI analysis, and reviewable code proposals with verified delivery only when authorized.
            </p>

            <p className="text-xs sm:text-sm font-sans text-[#121212]/85 leading-relaxed">
              D-Bugger reads connected repositories through GitHub and uses your own OpenRouter key for model analysis. When commits arrive, it gathers Gridscape context, diagnoses changed code, proposes a patch, records evidence in the agent console, and only performs GitHub delivery when authorized.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={onNavigateToDashboard}
                className="flex items-center gap-2 border-2 border-black bg-black text-[#F9F7F2] px-5 py-2.5 text-xs font-sans font-bold uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-800 active:translate-x-[1px] active:translate-y-[1px] transition-all"
              >
                <Activity className="h-4 w-4" />
                Launch Live Dashboard
                <ArrowRight className="h-4 w-4 ml-1" />
              </button>

              <button
                onClick={onOpenBugPlayground}
                className="flex items-center gap-2 border-2 border-black bg-white text-[#121212] px-4 py-2.5 text-xs font-sans font-bold uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-[#F9F7F2] active:translate-x-[1px] active:translate-y-[1px] transition-all"
              >
                <Flame className="h-4 w-4 text-red-600" />
                Simulate Bug Ingestion
              </button>

              <button
                onClick={onOpenGridscapeResearch}
                className="flex items-center gap-1.5 border border-black bg-violet-100 text-violet-950 px-3.5 py-2 text-xs font-sans font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-violet-200 transition-all"
              >
                <Network className="h-3.5 w-3.5" />
                Research with Gridscape
              </button>

              <button
                onClick={onOpenUndoCenter}
                className="flex items-center gap-1.5 border border-black bg-amber-100 text-amber-950 px-3.5 py-2 text-xs font-sans font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-amber-200 transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Rollback Center ({activeFixesCount})
              </button>
            </div>
          </div>

          {/* Masthead Stats Box */}
          <div className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-w-[260px] space-y-3.5">
            <div className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#121212]/70 border-b border-black pb-1">
              Live System Status
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#121212]/70">Daemon State:</span>
                <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 border border-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                  {githubToken ? 'READY' : 'CREDENTIALS NEEDED'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#121212]/70">Monitored Repos:</span>
                <span className="font-mono font-bold text-black bg-neutral-100 px-2 py-0.5 border border-black">{repos.length}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#121212]/70">Verified PRs:</span>
                <span className="font-mono font-bold text-black bg-neutral-100 px-2 py-0.5 border border-black">{verifiedDeliveryRuns.length}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#121212]/70">Recorded Score:</span>
                <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 border border-emerald-300">{recordedReviewRate}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-black/10 text-[10px] font-mono text-[#121212]/60 text-center">
              Target: <strong className="text-black">{userEmail || 'workspace only'}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* PROMINENT API KEY & INTEGRATION SETUP BANNER */}
      <section className="border-2 border-black bg-amber-50 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center border-2 border-black bg-amber-300 text-amber-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif-heading text-base font-bold uppercase tracking-tight text-[#121212]">
                  API Credentials &amp; AI Model Setup
                </h3>
                <span className="text-[10px] font-mono font-bold bg-black text-[#F9F7F2] px-2 py-0.5 uppercase">
                  {openRouterKey ? 'AI Key Active' : 'Diagnostics Only'}
                </span>
              </div>
              <p className="text-xs font-sans text-[#121212]/80 mt-1 leading-relaxed max-w-2xl">
                Add your personal <strong>OpenRouter API Key</strong> for real model analysis and patch proposals. Without it, D-Bugger runs diagnostics only. Connect your <strong>GitHub Token</strong> so real repository source and commits can be read, then configure <strong>Slack Webhook</strong> and <strong>Push Alerts</strong> if needed.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenApiKeyPrompt}
              className="flex items-center gap-1.5 border-2 border-black bg-black text-[#F9F7F2] px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-800 active:translate-x-[1px] active:translate-y-[1px] transition-all"
            >
              <Cpu className="h-4 w-4" />
              Configure API Keys &amp; Models
            </button>
          </div>
        </div>
      </section>

      {/* WHY PRELOADED REPOSITORIES CALLOUT BANNER */}
      <section className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center border-2 border-black bg-amber-200 text-amber-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0 mt-0.5">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif-heading text-base font-bold uppercase tracking-tight text-[#121212]">
                Why are there preloaded repositories in this workspace?
              </h3>
              <p className="text-xs font-sans text-[#121212]/80 mt-1 leading-relaxed max-w-3xl">
                For safe UI inspection, D-Bugger includes preset sandbox records (e.g., <code>ecommerce-api</code>, <code>auth-gateway</code>, <code>saas-dashboard-v2</code>). They are local review data only: they do not call OpenRouter, read GitHub, run tests, create branches, open PRs, or provide rollback evidence.
              </p>
              <p className="text-xs font-sans text-[#121212]/70 mt-1">
                You can easily clear the sandbox and connect your personal or organization GitHub repositories, or reload demo repositories at any time.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 self-start">
            <button
              onClick={onOpenAddRepo}
              className="flex items-center justify-center gap-1.5 border border-black bg-black text-[#F9F7F2] px-3.5 py-2 text-xs font-sans font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-800 active:translate-x-[1px] active:translate-y-[1px] transition-all"
            >
              <Github className="h-3.5 w-3.5" />
              Connect Real GitHub Repo
            </button>

            {repos.length > 0 ? (
              <button
                onClick={handleClearRepos}
                disabled={isClearingRepos}
                className="flex items-center justify-center gap-1.5 border border-black bg-white text-red-900 px-3 py-1.5 text-xs font-sans font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-red-50 transition-all disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear Sandbox Repos
              </button>
            ) : (
              <button
                onClick={handleResetDemoRepos}
                disabled={isClearingRepos}
                className="flex items-center justify-center gap-1.5 border border-black bg-white text-black px-3 py-1.5 text-xs font-sans font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#F9F7F2] transition-all disabled:opacity-50"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reload Demo Repos
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 4 CORE INTEGRATIONS & AUTH CONFIGURATION CARDS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <div>
            <h2 className="font-serif-heading text-xl font-bold uppercase tracking-tight text-[#121212]">
              Engine Integrations &amp; Credentials
            </h2>
            <p className="text-xs font-sans text-[#121212]/70">
              Configure OpenRouter high-context models, GitHub MCP authorization, Slack alerts, and browser push.
            </p>
          </div>
          <button
            onClick={onOpenSettings}
            className="text-xs font-sans font-bold uppercase tracking-wider underline text-black hover:text-neutral-600"
          >
            All Advanced Settings &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* 1. OpenRouter Key & Model Selection */}
          <div className="border-2 border-black bg-[#F9F7F2] p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center border border-black bg-black text-[#F9F7F2]">
                    <Cpu className="h-4 w-4" />
                  </div>
                  <h3 className="font-serif-heading text-sm font-bold uppercase text-[#121212]">
                    1. OpenRouter High-Context AI
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase bg-emerald-200 text-emerald-950 px-2 py-0.5 border border-black">
                  {openRouterKey ? 'AI Key Active' : 'Diagnostics Only'}
                </span>
              </div>

              <p className="text-xs font-sans text-[#121212]/80 mb-3">
                Select the model to use after you provide your own OpenRouter key. D-Bugger will display the model response summary and evidence in AI Thoughts; without a key, only local deterministic diagnostics run.
              </p>

              <form onSubmit={handleSaveOpenRouter} className="space-y-2.5">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#121212] block mb-1">
                    Select AI Reasoning Engine:
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full border border-black bg-white px-2.5 py-1.5 text-xs text-[#121212] font-mono focus:outline-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                  >
                    {OPENROUTER_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} — {m.contextLength} ({m.provider})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-[#121212] block mb-1">
                    OpenRouter API Key (Required for real AI analysis):
                  </label>
                  <input
                    type="password"
                    value={openRouterKey}
                    onChange={(e) => setOpenRouterKey(e.target.value)}
                    placeholder="sk-or-v1-... (required for real AI analysis)"
                    className="w-full border border-black bg-white px-2.5 py-1.5 text-xs text-[#121212] font-mono focus:outline-none placeholder-[#121212]/40 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>

                <div className="pt-1 flex items-center justify-between">
                  {keySaved && (
                    <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Model Engine Saved!
                    </span>
                  )}
                  <button
                    type="submit"
                    className="ml-auto border border-black bg-black text-[#F9F7F2] px-3 py-1.5 text-xs font-sans font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-800 active:translate-x-[1px] active:translate-y-[1px] transition-all"
                  >
                    Save Model Config
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* 2. GitHub MCP Authorization */}
          <div className="border-2 border-black bg-[#F9F7F2] p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center border border-black bg-black text-[#F9F7F2]">
                    <Github className="h-4 w-4" />
                  </div>
                  <h3 className="font-serif-heading text-sm font-bold uppercase text-[#121212]">
                    2. GitHub MCP Daemon Auth
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase bg-white text-black px-2 py-0.5 border border-black">
                  MCP Protocol
                </span>
              </div>

              <p className="text-xs font-sans text-[#121212]/80 mb-3">
                Authorize D-Bugger with a GitHub Personal Access Token (PAT) with <code>repo</code> permissions to allow automated branch generation, PR opening, and commit pushing.
              </p>

              <form onSubmit={handleSaveGitHub} className="space-y-2.5">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#121212] block mb-1">
                    GitHub Personal Access Token (PAT):
                  </label>
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="ghp_... (required for real repositories)"
                    className="w-full border border-black bg-white px-2.5 py-1.5 text-xs text-[#121212] font-mono focus:outline-none placeholder-[#121212]/40 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                  />
                  <p className="text-[10px] text-[#121212]/60 mt-1 font-mono">
                    Permissions needed: <code>repo</code> (read commits, write branches &amp; PRs).
                  </p>
                </div>

                <div className="pt-1 flex items-center justify-between">
                  {ghSaved && (
                    <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Token Stored!
                    </span>
                  )}
                  <button
                    type="submit"
                    className="ml-auto border border-black bg-black text-[#F9F7F2] px-3 py-1.5 text-xs font-sans font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-800 active:translate-x-[1px] active:translate-y-[1px] transition-all"
                  >
                    Save GitHub Token
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* 3. Slack Webhook Alerts */}
          <div className="border-2 border-black bg-[#F9F7F2] p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center border border-black bg-[#4A154B] text-white">
                    <Slack className="h-4 w-4" />
                  </div>
                  <h3 className="font-serif-heading text-sm font-bold uppercase text-[#121212]">
                    3. Slack Real-Time Alerts
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase bg-amber-200 text-amber-950 px-2 py-0.5 border border-black">
                  Instant Channel Feed
                </span>
              </div>

              <p className="text-xs font-sans text-[#121212]/80 mb-3">
                Receive instant rich messages in your team Slack channel whenever D-Bugger detects a commit bug, deploys a PR, or executes a rollback.
              </p>

              <form onSubmit={handleSaveSlack} className="space-y-2.5">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#121212] block mb-1">
                    Slack Incoming Webhook URL:
                  </label>
                  <input
                    type="url"
                    value={slackWebhook}
                    onChange={(e) => setSlackWebhook(e.target.value)}
                    placeholder="https://hooks.slack.com/services/T00/B00/XXXX"
                    className="w-full border border-black bg-white px-2.5 py-1.5 text-xs text-[#121212] font-mono focus:outline-none placeholder-[#121212]/40 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>

                <div className="pt-1 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleTestSlack}
                    disabled={!slackWebhook || isTestingSlack}
                    className="border border-black bg-white px-2.5 py-1.5 text-xs font-sans font-bold uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-[#F9F7F2] disabled:opacity-40"
                  >
                    {isTestingSlack ? 'Testing...' : 'Send Test Alert'}
                  </button>

                  {slackTestSuccess && (
                    <span className="text-[11px] font-bold text-emerald-800">
                      Alert sent to Slack!
                    </span>
                  )}

                  <button
                    type="submit"
                    className="border border-black bg-black text-[#F9F7F2] px-3 py-1.5 text-xs font-sans font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-800 active:translate-x-[1px] active:translate-y-[1px] transition-all"
                  >
                    Save Webhook
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* 4. Native Browser Notifications */}
          <div className="border-2 border-black bg-[#F9F7F2] p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center border border-black bg-black text-[#F9F7F2]">
                    <Bell className="h-4 w-4" />
                  </div>
                  <h3 className="font-serif-heading text-sm font-bold uppercase text-[#121212]">
                    4. Browser Desktop Push
                  </h3>
                </div>
                <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 border border-black ${
                  notificationPermission === 'granted' ? 'bg-emerald-200 text-emerald-950' : 'bg-white text-black'
                }`}>
                  {notificationPermission === 'granted' ? 'Enabled' : 'Permission Needed'}
                </span>
              </div>

              <p className="text-xs font-sans text-[#121212]/80 mb-3">
                Enable native desktop notifications so you get alerted in real time when background daemon runs complete, even when working in another tab or IDE.
              </p>

              <div className="space-y-3 pt-2">
                <div className="border border-black bg-white p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#121212] block">Current Permission Status:</span>
                    <span className="font-mono text-xs uppercase text-[#121212]/70 font-bold">
                      {notificationPermission}
                    </span>
                  </div>

                  {notificationPermission !== 'granted' ? (
                    <button
                      type="button"
                      onClick={handleRequestNotification}
                      className="border border-black bg-black text-[#F9F7F2] px-3 py-1.5 text-xs font-sans font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-800"
                    >
                      Enable Push Alerts
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-900 bg-emerald-100 px-2 py-1 border border-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" /> Active &amp; Ready
                    </span>
                  )}
                </div>
                
                <p className="text-[11px] text-[#121212]/60 font-mono">
                  Notifications trigger automatically on bug fixes, pipeline pass/fail gates, and rollback requests.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* EDITORIAL HOW IT WORKS SECTION */}
      <section className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="font-serif-heading text-xl font-bold uppercase tracking-tight text-[#121212] border-b-2 border-black pb-2 mb-6">
          The 5-Stage Evidence Workflow
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 font-sans">
          
          <div className="border-2 border-black bg-[#F9F7F2] p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex h-7 w-7 items-center justify-center bg-black text-[#F9F7F2] font-mono font-bold text-xs mb-3 border border-black">
              1
            </div>
            <h4 className="font-serif-heading text-sm font-bold text-[#121212]">
              AST &amp; Call Ingestion
            </h4>
            <p className="text-xs text-[#121212]/75 mt-1 leading-relaxed">
              A live sweep reads the connected repository’s current commit, changed-file patch, and available source through the authorized GitHub API.
            </p>
          </div>

          <div className="border-2 border-black bg-[#F9F7F2] p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex h-7 w-7 items-center justify-center bg-black text-[#F9F7F2] font-mono font-bold text-xs mb-3 border border-black">
              2
            </div>
            <h4 className="font-serif-heading text-sm font-bold text-[#121212]">
              Vulnerability Analysis
            </h4>
            <p className="text-xs text-[#121212]/75 mt-1 leading-relaxed">
              With your session-only OpenRouter key, the selected model receives the repository snapshot and automatic Gridscape context and returns a concise analysis summary.
            </p>
          </div>

          <div className="border-2 border-black bg-[#F9F7F2] p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex h-7 w-7 items-center justify-center bg-black text-[#F9F7F2] font-mono font-bold text-xs mb-3 border border-black">
              3
            </div>
            <h4 className="font-serif-heading text-sm font-bold text-[#121212]">
              Defensive Patching
            </h4>
            <p className="text-xs text-[#121212]/75 mt-1 leading-relaxed">
              The returned model proposal, or a clearly labeled deterministic diagnostic fallback, is shown as code and diff evidence for human review.
            </p>
          </div>

          <div className="border-2 border-black bg-[#F9F7F2] p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex h-7 w-7 items-center justify-center bg-black text-[#F9F7F2] font-mono font-bold text-xs mb-3 border border-black">
              4
            </div>
            <h4 className="font-serif-heading text-sm font-bold text-[#121212]">
              Validation Evidence
            </h4>
            <p className="text-xs text-[#121212]/75 mt-1 leading-relaxed">
              Pipeline fields report only stored evidence. D-Bugger does not claim AST, SAST, dependency, legal, or regression results without an independent runner or CI record.
            </p>
          </div>

          <div className="border-2 border-black bg-[#F9F7F2] p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex h-7 w-7 items-center justify-center bg-black text-[#F9F7F2] font-mono font-bold text-xs mb-3 border border-black">
              5
            </div>
            <h4 className="font-serif-heading text-sm font-bold text-[#121212]">
              Authorized GitHub Delivery
            </h4>
            <p className="text-xs text-[#121212]/75 mt-1 leading-relaxed">
              Only an authorized, complete GitHub delivery record can expose PR or undo actions. Email and Slack are optional notifications, not proof of delivery or testing.
            </p>
          </div>

        </div>
      </section>

      {/* QUICK LAUNCH BAR */}
      <section className="flex flex-col sm:flex-row items-center justify-between gap-4 border-2 border-black bg-[#F9F7F2] p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div>
          <h3 className="font-serif-heading text-lg font-bold text-[#121212] uppercase tracking-tight">
            Ready to inspect your connected repositories?
          </h3>
          <p className="text-xs text-[#121212]/70 font-sans">
            View active monitored repositories, real diagnostics, evidence-backed fix proposals, and verified GitHub delivery in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onNavigateToDashboard}
            className="flex items-center gap-2 border-2 border-black bg-black text-[#F9F7F2] px-5 py-2.5 text-xs font-sans font-bold uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-800 active:translate-x-[1px] active:translate-y-[1px] transition-all"
          >
            Enter Dashboard
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

    </div>
  );
};
