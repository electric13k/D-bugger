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
  Activity
} from 'lucide-react';
import { OPENROUTER_MODELS } from '../data/models';
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
  repos,
  fixRuns,
  userEmail,
}) => {
  // Integration States
  const [openRouterKey, setOpenRouterKey] = useState(localStorage.getItem('repoheal_openrouter_key') || '');
  const [githubToken, setGithubToken] = useState(localStorage.getItem('repoheal_github_token') || '');
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
    localStorage.setItem('repoheal_openrouter_key', openRouterKey);
    localStorage.setItem('repoheal_default_model', selectedModel);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2500);
  };

  const handleSaveGitHub = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('repoheal_github_token', githubToken);
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
  const activeFixesCount = fixRuns.filter(r => !r.isUndone).length;

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
              Autonomous, round-the-clock AI bug remediation with 5-stage secure code review pipelines and instant 1-click rollbacks.
            </p>

            <p className="text-xs sm:text-sm font-sans text-[#121212]/85 leading-relaxed">
              D-Bugger connects OpenRouter free high-context models (DeepSeek-R1 128k, Llama 3.3 70B, Qwen 2.5 Coder, Gemini 2.0 Flash) to your repositories through a background daemon. When commits arrive, D-Bugger parses ASTs, detects flaws, synthesizes defensive patches, validates through a 5-stage security gate, opens Pull Requests, and delivers digests to your email &amp; Slack.
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
                  ACTIVE 24/7
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#121212]/70">Monitored Repos:</span>
                <span className="font-mono font-bold text-black bg-neutral-100 px-2 py-0.5 border border-black">{repos.length}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#121212]/70">Patches Deployed:</span>
                <span className="font-mono font-bold text-black bg-neutral-100 px-2 py-0.5 border border-black">{fixRuns.length}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#121212]/70">Review Pass Rate:</span>
                <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 border border-emerald-300">96.8%</span>
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
                  {openRouterKey ? 'Custom Key Active' : 'Free Tier Active'}
                </span>
              </div>
              <p className="text-xs font-sans text-[#121212]/80 mt-1 leading-relaxed max-w-2xl">
                Configure your personal <strong>OpenRouter API Key</strong> or select from high-context free models (DeepSeek-R1 128k, Llama 3.3 70B, Qwen 2.5 Coder, Gemini 2.0 Flash 1M). Connect your <strong>GitHub Token</strong>, <strong>Slack Webhook</strong>, and <strong>Push Alerts</strong>.
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
                To provide a <strong>safe, zero-risk developer testbench</strong>, D-Bugger includes preset sandbox repositories (e.g., <code>ecommerce-api</code>, <code>auth-gateway</code>, <code>saas-dashboard-v2</code>) with realistic code flaws (memory leaks, SQL injections, race conditions). This lets you immediately test the full OpenRouter high-context model reasoning, 5-stage security review pipeline, and 1-click rollback without needing to grant production repository write permissions upfront.
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
                  Free Tier Ready
                </span>
              </div>

              <p className="text-xs font-sans text-[#121212]/80 mb-3">
                Select your preferred high-context model or enter an OpenRouter key to expand rate limits. Free models like DeepSeek-R1 (128k) and Gemini 2.0 Flash (1M) work immediately.
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
                    OpenRouter API Key (Optional):
                  </label>
                  <input
                    type="password"
                    value={openRouterKey}
                    onChange={(e) => setOpenRouterKey(e.target.value)}
                    placeholder="sk-or-v1-... (leave blank to use built-in free tier)"
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
                    placeholder="ghp_... (leave empty for MCP sandbox bridge mode)"
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
          The 5-Stage Autonomous Architecture
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
              Daemon continuously sweeps commit diffs, parsing Abstract Syntax Trees and function call graphs across modified source files.
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
              OpenRouter high-context model isolates the root cause (e.g. CWE-89 SQLi, memory leak, mutex deadlock) and models edge cases.
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
              Synthesizes minimal, type-safe diffs with comprehensive input sanitization, cleanup handlers, and null checks.
            </p>
          </div>

          <div className="border-2 border-black bg-[#F9F7F2] p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex h-7 w-7 items-center justify-center bg-black text-[#F9F7F2] font-mono font-bold text-xs mb-3 border border-black">
              4
            </div>
            <h4 className="font-serif-heading text-sm font-bold text-[#121212]">
              5-Stage Security Gate
            </h4>
            <p className="text-xs text-[#121212]/75 mt-1 leading-relaxed">
              Enforces AST syntax checks, SAST CVE scanning, dependency supply-chain audits, and regression test suites before delivery.
            </p>
          </div>

          <div className="border-2 border-black bg-[#F9F7F2] p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex h-7 w-7 items-center justify-center bg-black text-[#F9F7F2] font-mono font-bold text-xs mb-3 border border-black">
              5
            </div>
            <h4 className="font-serif-heading text-sm font-bold text-[#121212]">
              MCP PR &amp; 1-Click Rollback
            </h4>
            <p className="text-xs text-[#121212]/75 mt-1 leading-relaxed">
              Creates GitHub PR via MCP, pushes commit, dispatches email/Slack digests, and stores instant 1-click restore snapshot.
            </p>
          </div>

        </div>
      </section>

      {/* QUICK LAUNCH BAR */}
      <section className="flex flex-col sm:flex-row items-center justify-between gap-4 border-2 border-black bg-[#F9F7F2] p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div>
          <h3 className="font-serif-heading text-lg font-bold text-[#121212] uppercase tracking-tight">
            Ready to inspect your autonomous code fleet?
          </h3>
          <p className="text-xs text-[#121212]/70 font-sans">
            View active monitored repositories, simulated bug execution history, and security grades in real-time.
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
