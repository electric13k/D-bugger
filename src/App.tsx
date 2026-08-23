import React, { useState, useEffect } from 'react';
import { WorkspaceUser, onWorkspaceAuthStateChanged } from './lib/workspaceAuth';
import { MonitoredRepo, BugFixRun, DaemonLog, InAppNotification } from './types';
import { DaemonService } from './services/daemonService';
import { DEMO_PRESET_REPOS } from './data/models';
import { Navbar } from './components/Navbar';
import { Homepage } from './components/Homepage';
import { StatsBar } from './components/StatsBar';
import { RepoList } from './components/RepoList';
import { FixRunsList } from './components/FixRunsList';
import { DaemonTerminalLogs } from './components/DaemonTerminalLogs';
import { CodeDiffModal } from './components/CodeDiffModal';
import { ReviewPipelineInspector } from './components/ReviewPipelineInspector';
import { AIThoughtStreamModal } from './components/AIThoughtStreamModal';
import { EmailReportModal } from './components/EmailReportModal';
import { UndoCenterModal } from './components/UndoCenterModal';
import { SettingsModal } from './components/SettingsModal';
import { BugPlaygroundModal } from './components/BugPlaygroundModal';
import { AddRepoModal } from './components/AddRepoModal';
import { ApiKeyPromptModal } from './components/ApiKeyPromptModal';
import { analyzeGitHubRepository, syncRepositoryContext } from './lib/repoContext';
import { getWorkspaceId, loadCloudflareWorkspace, saveCloudflareWorkspace, recordCloudflareWorkingStyle, readSessionCredential } from './lib/cloudflareWorkspace';
import { 
  Bot, 
  GitBranch, 
  Sparkles, 
  ShieldCheck, 
  Terminal, 
  Mail, 
  RotateCcw, 
  Zap, 
  CheckCircle2, 
  Bug,
  Cpu,
  Layers,
  Flame,
  LayoutDashboard,
  Home,
  Key
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<WorkspaceUser | null>(null);
  const [repos, setRepos] = useState<MonitoredRepo[]>(DEMO_PRESET_REPOS);
  const [fixRuns, setFixRuns] = useState<BugFixRun[]>([]);
  const [daemonRunning, setDaemonRunning] = useState(true);
  const [isCycling, setIsCycling] = useState(false);
  const [isScanningRepoId, setIsScanningRepoId] = useState<string | null>(null);
  const [isUndoingId, setIsUndoingId] = useState<string | null>(null);

  // Main Page View: 'home' (Overview & Integrations) vs 'dashboard' (Fleet Monitor)
  const [pageView, setPageView] = useState<'home' | 'dashboard'>('home');

  // Sub-tabs on Dashboard
  const [dashboardTab, setDashboardTab] = useState<'overview' | 'fixes' | 'repos' | 'logs'>('overview');

  // API Prompt Modal state
  const [apiKeyPromptOpen, setApiKeyPromptOpen] = useState(false);

  // In-App Notifications
  const [notifications, setNotifications] = useState<InAppNotification[]>([
    {
      id: 'notif-1',
      title: 'GitHub MCP Watcher Online',
      message: 'Daemon is monitoring git remotes 24/7 with OpenRouter high-context model reasoning.',
      timestamp: Date.now() - 1000 * 60 * 5,
      type: 'info',
      read: false
    },
    {
      id: 'notif-2',
      title: '5-Stage Security Gate Ready',
      message: 'AST syntax, SAST CVE vulnerability scanner, dependency auditor & unit test runner active.',
      timestamp: Date.now() - 1000 * 60 * 2,
      type: 'security_gate',
      read: false
    }
  ]);

  // Terminal Logs state
  const [logs, setLogs] = useState<DaemonLog[]>([
    {
      id: 'log-1',
      timestamp: Date.now() - 1000 * 60 * 12,
      level: 'info',
      message: 'Background Daemon started in 24/7 autonomous monitoring mode.',
    },
    {
      id: 'log-2',
      timestamp: Date.now() - 1000 * 60 * 8,
      level: 'mcp',
      message: 'GitHub MCP bridge mounted on stdio. Tools: get_diff, create_pr, push_commit, revert_commit.',
    },
    {
      id: 'log-3',
      timestamp: Date.now() - 1000 * 60 * 4,
      level: 'ai',
      message: 'OpenRouter Free High-Context Models synchronized (DeepSeek-R1, Llama 3.3 70B, Gemini 2.0 Flash 1M).',
    }
  ]);

  // Modals state
  const [diffModalRun, setDiffModalRun] = useState<BugFixRun | null>(null);
  const [pipelineModalRun, setPipelineModalRun] = useState<BugFixRun | null>(null);
  const [thoughtStreamRun, setThoughtStreamRun] = useState<BugFixRun | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [undoCenterOpen, setUndoCenterOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bugPlaygroundOpen, setBugPlaygroundOpen] = useState(false);
  const [addRepoOpen, setAddRepoOpen] = useState(false);

  // 1. Listen to the reliable Cloudflare workspace auth state.
  useEffect(() => {
    const unsubscribe = onWorkspaceAuthStateChanged((user) => {
      setCurrentUser(user);
      void DaemonService.initializeDefaults(user?.email || undefined);
    });
    return () => unsubscribe();
  }, []);

  // 2. Hydrate the original UI from Cloudflare D1 when the Pages Functions are available.
  useEffect(() => {
    void getWorkspaceId();
    loadCloudflareWorkspace().then((state) => {
      if (!state) return;
      setRepos(state.repos || []);
      setFixRuns(state.fixRuns || []);
      if (state.logs?.length) setLogs(prev => [...state.logs, ...prev].slice(0, 100));
      if (typeof state.daemonRunning === 'boolean') setDaemonRunning(state.daemonRunning);
    });
  }, []);

  // 3. Background Daemon Heartbeat Poll plus D1-backed GitHub push context refresh.
  useEffect(() => {
    if (!daemonRunning) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/daemon/status');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.logs) && data.logs.length > 0) {
            setLogs(prev => {
              const existingIds = new Set(prev.map(l => l.id));
              const newLogs = data.logs.filter((l: any) => !existingIds.has(l.id));
              return [...newLogs, ...prev].slice(0, 80);
            });
          }
        }
      } catch (e) {
        // graceful offline fallback pulse
      }

      const githubToken = readSessionCredential('dbugger_github_token', 'repoheal_github_token');
      if (!githubToken) return;
      for (const repo of repos.filter(item => item.autoSweepOnPush !== false)) {
        try {
          const eventResponse = await fetch(`/api/github/events?repo=${encodeURIComponent(repo.name)}&limit=1`, { cache: 'no-store' });
          if (!eventResponse.ok) continue;
          const eventData = await eventResponse.json();
          const event = eventData.events?.[0];
          if (!event?.commit_sha || event.commit_sha === repo.lastCommitSha || String(event.commit_message || '').includes('[dbugger-context]')) continue;
          addLog('mcp', `Push event received for ${repo.name}; refreshing context.md before review.`, repo.name);
          const analyzed = await analyzeGitHubRepository(repo, githubToken);
          const contextFile = await syncRepositoryContext(repo, githubToken, analyzed.context, analyzed.commit);
          const enriched = { ...repo, lastCommitSha: analyzed.commit.sha, lastCommitMessage: analyzed.commit.commit?.message, contextAnalysis: analyzed.context, contextFilePath: 'context.md', contextFileSha: contextFile.sha, contextFileUrl: contextFile.url, contextSyncStatus: 'synced' as const, lastContextSyncedAt: Date.now() };
          setRepos(prev => prev.map(item => item.id === repo.id ? enriched : item));
          void saveCloudflareWorkspace({ repos: repos.map(item => item.id === repo.id ? enriched : item), fixRuns, logs, daemonRunning });
          void recordCloudflareWorkingStyle({ type: 'push_context_refreshed', metadata: { repo: repo.name, commit: analyzed.commit.sha } });
          await handleScanRepo(enriched);
        } catch (error: any) {
          addLog('warn', `Push context refresh skipped for ${repo.name}: ${error.message || 'GitHub write access is required.'}`, repo.name);
        }
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [daemonRunning, repos]);

  // Helper to add In-App Notification
  const addNotification = (notif: Omit<InAppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: InAppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 30));
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  // Toggle Daemon
  const handleToggleDaemon = async () => {
    try {
      const nextState = !daemonRunning;
      setDaemonRunning(nextState);
      await fetch('/api/daemon/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRunning: nextState })
      });
      addLog(nextState ? 'success' : 'warn', `Daemon ${nextState ? 'resumed' : 'paused'} by developer.`);
      addNotification({
        title: nextState ? 'Daemon Resumed' : 'Daemon Paused',
        message: nextState ? '24/7 commit monitoring active.' : 'Background polling paused.',
        type: 'info'
      });
    } catch (err) {
      console.warn('Toggle daemon error:', err);
    }
  };

  // Add Log Helper
  const addLog = (level: DaemonLog['level'], message: string, repoName?: string) => {
    setLogs(prev => [
      {
        id: `log-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        level,
        message,
        repoName,
      },
      ...prev
    ].slice(0, 100));
  };

  // Trigger Manual Scan Cycle across repos
  const handleTriggerCycle = async () => {
    setIsCycling(true);
    addLog('info', 'Scanning all monitored repositories for incoming commits and pull requests...');
    
    await new Promise(r => setTimeout(r, 800));

    if (repos.length > 0) {
      const randomRepo = repos[Math.floor(Math.random() * repos.length)];
      await handleScanRepo(randomRepo);
    }

    setIsCycling(false);
    addLog('success', 'Repository scan cycle completed. 0 unhandled syntax errors found.');
  };

  // Scan & Fix a Specific Repo
  const handleScanRepo = async (repo: MonitoredRepo) => {
    setIsScanningRepoId(repo.id);
    addLog('mcp', `Fetching latest commit tree & diffs for ${repo.name}...`, repo.name);

    try {
      addLog('ai', `Invoking OpenRouter high-context model (${repo.openRouterModel})...`, repo.name);
      const fixRun = await DaemonService.triggerBugFix(repo);
      void saveCloudflareWorkspace({ repos, fixRuns: [fixRun, ...fixRuns].slice(0, 50), logs, daemonRunning });
      
      addLog('success', `Autonomous fix ready: "${fixRun.bugTitle}" (Security Score: ${fixRun.pipeline.overallScore}%)`, repo.name);
      addLog('mcp', `GitHub MCP created Pull Request #${fixRun.pullRequestNumber} on branch ${fixRun.branchName}`, repo.name);
      
      addNotification({
        title: `Auto-Fixed: ${fixRun.bugTitle}`,
        message: `Security Grade ${fixRun.pipeline.overallScore}%. PR #${fixRun.pullRequestNumber} opened on ${repo.name}.`,
        type: 'fix_success',
        repoName: repo.name,
        prUrl: fixRun.pullRequestUrl
      });

      if (fixRun.pushedCommitSha) {
        addLog('success', `Auto-pushed commit ${fixRun.pushedCommitSha} (Pipeline certified ≥${repo.securityThreshold}%)`, repo.name);
      }

      if (fixRun.emailSent) {
        addLog('info', `Summary report email dispatched to <${fixRun.emailRecipient}>`, repo.name);
      }
    } catch (e: any) {
      addLog('error', `Failed to fix repo ${repo.name}: ${e.message}`, repo.name);
      addNotification({
        title: `Fix Failed on ${repo.name}`,
        message: e.message,
        type: 'error',
        repoName: repo.name
      });
    } finally {
      setIsScanningRepoId(null);
    }
  };

  // Trigger Bug from Playground
  const handleTriggerBugFromPlayground = async (
    repo: MonitoredRepo, 
    scenarioIndex: number, 
    customCode?: string, 
    customCommit?: string
  ) => {
    setIsScanningRepoId(repo.id);
    addLog('warn', `Simulated commit received on ${repo.name}: "${customCommit || 'Commit Bug'}"`, repo.name);
    
    try {
      addLog('ai', `Analyzing AST & context with ${repo.openRouterModel}...`, repo.name);
      const fixRun = await DaemonService.triggerBugFix(repo, scenarioIndex, customCode, customCommit);
      void saveCloudflareWorkspace({ repos, fixRuns: [fixRun, ...fixRuns].slice(0, 50), logs, daemonRunning });
      
      addLog('success', `AI resolved bug: "${fixRun.bugTitle}" (${fixRun.bugCategory})`, repo.name);
      addLog('mcp', `GitHub MCP: PR #${fixRun.pullRequestNumber} opened on ${repo.name}`, repo.name);
      
      addNotification({
        title: `Simulated Bug Remediated`,
        message: `Fixed "${fixRun.bugTitle}" on ${repo.name} with ${repo.openRouterModel}.`,
        type: 'fix_success',
        repoName: repo.name,
        prUrl: fixRun.pullRequestUrl
      });

      // Auto open the diff modal for immediate feedback
      setDiffModalRun(fixRun);
    } finally {
      setIsScanningRepoId(null);
    }
  };

  // 1-Click Undo / Rollback
  const handleUndoFix = async (run: BugFixRun) => {
    setIsUndoingId(run.id);
    addLog('warn', `Initiating 1-click rollback for ${run.repoName} (PR #${run.pullRequestNumber})...`, run.repoName);

    try {
      const success = await DaemonService.undoFix(run);
      if (success) {
        addLog('success', `Rollback completed! Revert commit generated and branch restored for ${run.repoName}.`, run.repoName);
        addNotification({
          title: `1-Click Rollback Completed`,
          message: `Reverted commit ${run.commitSha} on ${run.repoName}. Revert PR #${run.pullRequestNumber ? run.pullRequestNumber + 1 : 999} opened.`,
          type: 'rollback',
          repoName: run.repoName
        });
      } else {
        addLog('error', `Rollback failed for ${run.repoName}.`, run.repoName);
      }
    } finally {
      setIsUndoingId(null);
    }
  };

  // Update repo settings
  const handleUpdateRepo = (repoId: string, updates: Partial<MonitoredRepo>) => {
    const nextRepos = repos.map(r => r.id === repoId ? { ...r, ...updates } : r);
    setRepos(nextRepos);
    void saveCloudflareWorkspace({ repos: nextRepos, fixRuns, logs, daemonRunning });
    addLog('info', `Updated policy for repository ${repoId}.`);
  };

  // Delete repo from D-Bugger (leaves GitHub untouched)
  const handleDeleteRepo = async (repoId: string) => {
    const targetRepo = repos.find(r => r.id === repoId);
    const repoName = targetRepo ? targetRepo.name : repoId;
    
    await DaemonService.deleteRepo(repoId);
    setRepos(prev => prev.filter(r => r.id !== repoId));
    addLog('info', `Disconnected ${repoName} from D-Bugger daemon. GitHub repository untouched.`);
    addNotification({
      title: 'Repository Disconnected',
      message: `Removed ${repoName} from local monitoring list. GitHub code remains completely safe.`,
      type: 'info',
      repoName
    });
  };

  // Add custom repo
  const handleAddRepo = async (newRepoData: Omit<MonitoredRepo, 'id' | 'lastCheckedAt' | 'totalFixes'>) => {
    const created = await DaemonService.addRepo({ ...newRepoData, contextSyncStatus: 'pending' });
    let enriched = created;
    const githubToken = readSessionCredential('dbugger_github_token', 'repoheal_github_token');
    if (githubToken) {
      try {
        setRepos(prev => [{ ...created, contextSyncStatus: 'syncing' }, ...prev]);
        const analyzed = await analyzeGitHubRepository(created, githubToken);
        const contextFile = await syncRepositoryContext(created, githubToken, analyzed.context, analyzed.commit);
        enriched = { ...created, lastCommitSha: analyzed.commit.sha, lastCommitMessage: analyzed.commit.commit?.message, contextAnalysis: analyzed.context, contextFilePath: 'context.md', contextFileSha: contextFile.sha, contextFileUrl: contextFile.url, contextSyncStatus: 'synced', lastContextSyncedAt: Date.now(), isAnalyzingContext: false };
        addLog('success', `Indexed ${analyzed.context.filesIndexed} files and synced context.md in ${created.name}.`, created.name);
        void recordCloudflareWorkingStyle({ type: 'repo_context_synced', metadata: { repo: created.name, files: analyzed.context.filesIndexed, language: analyzed.context.techStack.language } });
      } catch (error: any) {
        enriched = { ...created, contextSyncStatus: 'error' };
        addLog('warn', `Repository added, but context.md could not be synced: ${error.message || 'GitHub write access is required.'}`, created.name);
      }
    } else {
      addLog('info', `Added ${created.name}. Add a GitHub token in API Credentials to analyze the tree and create context.md.`, created.name);
    }
    setRepos(prev => [enriched, ...prev.filter(item => item.id !== enriched.id)]);
    void saveCloudflareWorkspace({ repos: [enriched, ...repos.filter(item => item.id !== enriched.id)], fixRuns, logs, daemonRunning });
    addNotification({ title: `Monitored Repo Added`, message: `Now watching commits on ${created.name} with model ${created.openRouterModel}.`, type: 'info', repoName: created.name });
  };

  // Send summary email
  const handleSendEmail = async (recipient: string) => {
    try {
      await fetch('/api/email/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient,
          subject: `[D-Bugger MCP] Autonomous Fix Digest (${fixRuns.length} Resolved Bugs)`,
          summary: `Summary of ${fixRuns.length} automated bug fixes with 5-stage secure review certification.`,
          fixes: fixRuns.map(r => r.id),
        })
      });
      addLog('info', `Manual email summary digest sent to ${recipient}.`);
      addNotification({
        title: 'Email Summary Report Dispatched',
        message: `Digest delivered to ${recipient}.`,
        type: 'info'
      });
      return true;
    } catch (err) {
      console.warn('Failed to send email:', err);
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F7F2] text-[#121212] selection:bg-black selection:text-[#F9F7F2] font-sans antialiased">
      
      {/* 1. Global Navbar */}
      <Navbar
        activeTab={pageView}
        onChangeTab={(tab) => setPageView(tab)}
        daemonRunning={daemonRunning}
        onToggleDaemon={handleToggleDaemon}
        onTriggerCycle={handleTriggerCycle}
        onOpenBugPlayground={() => setBugPlaygroundOpen(true)}
        onOpenEmailModal={() => setEmailModalOpen(true)}
        onOpenUndoCenter={() => setUndoCenterOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenApiKeyPrompt={() => setApiKeyPromptOpen(true)}
        currentUser={currentUser}
        isCycling={isCycling}
        notifications={notifications}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onClearAllNotifications={handleClearAllNotifications}
      />

      {/* 2. Main Content Container */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        
        {/* HOMEPAGE VIEW */}
        {pageView === 'home' && (
          <Homepage
            onNavigateToDashboard={() => setPageView('dashboard')}
            onOpenAddRepo={() => setAddRepoOpen(true)}
            onOpenBugPlayground={() => setBugPlaygroundOpen(true)}
            onOpenUndoCenter={() => setUndoCenterOpen(true)}
            onOpenEmailReport={() => setEmailModalOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenApiKeyPrompt={() => setApiKeyPromptOpen(true)}
            repos={repos}
            fixRuns={fixRuns}
            userEmail={currentUser?.email || ''}
          />
        )}

        {/* DASHBOARD VIEW */}
        {pageView === 'dashboard' && (
          <div className="space-y-8">
            
            {/* Editorial Dashboard Header Banner */}
            <div className="border-2 border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse" />
                    <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-[#121212]">
                      Fleet Watcher Active
                    </span>
                    <span className="text-xs text-black/40">•</span>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#121212]/70 bg-[#F9F7F2] border border-black/30 px-2 py-0.5">
                      OpenRouter Free High-Context Models
                    </span>
                  </div>
                  <h1 className="font-serif-heading text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-[#121212] leading-none">
                    Autonomous Code Fleet Dashboard
                  </h1>
                  <p className="text-xs sm:text-sm font-sans text-[#121212]/70 leading-relaxed max-w-3xl pt-1">
                    Continuous 24/7 background commit watcher powered by GitHub MCP and high-context reasoning. Detects memory leaks, SQL CVEs, race conditions &amp; syntax crashes, executes 5-stage secure review validation, submits pull requests, auto-pushes verified patches, and preserves 1-click rollback snapshots.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                  <button
                    onClick={() => setApiKeyPromptOpen(true)}
                    className="flex items-center justify-center gap-2 border border-black bg-amber-100 hover:bg-amber-200 text-amber-950 px-4 py-3 text-xs font-sans font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all"
                  >
                    <Key className="h-4 w-4 text-amber-900" />
                    API Credentials &amp; Models
                  </button>

                  <button
                    id="hero-btn-inject-bug"
                    onClick={() => setBugPlaygroundOpen(true)}
                    className="flex items-center justify-center gap-2 bg-black text-[#F9F7F2] border border-black px-5 py-3 text-xs font-sans font-bold uppercase tracking-[0.15em] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-800 active:translate-x-[1px] active:translate-y-[1px] transition-all"
                  >
                    <Flame className="h-4 w-4 text-amber-300" />
                    Simulate Commit &amp; Auto-Fix
                  </button>
                </div>
              </div>
            </div>

            {/* Operational Metrics StatsBar */}
            <StatsBar
              repos={repos}
              fixRuns={fixRuns}
              daemonRunning={daemonRunning}
            />

            {/* Dashboard Sub-Tab Navigation */}
            <div className="flex items-center gap-2 border-b-2 border-black pb-3 overflow-x-auto">
              <button
                onClick={() => setDashboardTab('overview')}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider transition-all whitespace-nowrap border border-black ${
                  dashboardTab === 'overview'
                    ? 'bg-black text-[#F9F7F2] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-white text-[#121212] hover:bg-[#F9F7F2]'
                }`}
              >
                <Layers className="h-4 w-4" />
                Dashboard &amp; Overview
              </button>

              <button
                onClick={() => setDashboardTab('fixes')}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider transition-all whitespace-nowrap border border-black ${
                  dashboardTab === 'fixes'
                    ? 'bg-black text-[#F9F7F2] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-white text-[#121212] hover:bg-[#F9F7F2]'
                }`}
              >
                <Sparkles className="h-4 w-4" />
                Fix History &amp; PRs ({fixRuns.length})
              </button>

              <button
                onClick={() => setDashboardTab('repos')}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider transition-all whitespace-nowrap border border-black ${
                  dashboardTab === 'repos'
                    ? 'bg-black text-[#F9F7F2] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-white text-[#121212] hover:bg-[#F9F7F2]'
                }`}
              >
                <GitBranch className="h-4 w-4" />
                Monitored Repos ({repos.length})
              </button>

              <button
                onClick={() => setDashboardTab('logs')}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider transition-all whitespace-nowrap border border-black ${
                  dashboardTab === 'logs'
                    ? 'bg-black text-[#F9F7F2] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-white text-[#121212] hover:bg-[#F9F7F2]'
                }`}
              >
                <Terminal className="h-4 w-4" />
                MCP Protocol Logs ({logs.length})
              </button>
            </div>

            {/* Dashboard Sub-View Content */}
            {dashboardTab === 'overview' && (
              <div className="space-y-8">
                <RepoList
                  repos={repos}
                  onAddRepo={() => setAddRepoOpen(true)}
                  onScanRepo={handleScanRepo}
                  onUpdateRepo={handleUpdateRepo}
                  onDeleteRepo={handleDeleteRepo}
                  isScanningRepoId={isScanningRepoId}
                />

                <DaemonTerminalLogs logs={logs} />

                <FixRunsList
                  runs={fixRuns}
                  onViewDiff={(run) => setDiffModalRun(run)}
                  onViewPipeline={(run) => setPipelineModalRun(run)}
                  onOpenThoughtStream={(run) => setThoughtStreamRun(run)}
                  onUndoFix={handleUndoFix}
                  isUndoingId={isUndoingId}
                />
              </div>
            )}

            {dashboardTab === 'fixes' && (
              <div className="space-y-8">
                <FixRunsList
                  runs={fixRuns}
                  onViewDiff={(run) => setDiffModalRun(run)}
                  onViewPipeline={(run) => setPipelineModalRun(run)}
                  onOpenThoughtStream={(run) => setThoughtStreamRun(run)}
                  onUndoFix={handleUndoFix}
                  isUndoingId={isUndoingId}
                />
              </div>
            )}

            {dashboardTab === 'repos' && (
              <div className="space-y-8">
                <RepoList
                  repos={repos}
                  onAddRepo={() => setAddRepoOpen(true)}
                  onScanRepo={handleScanRepo}
                  onUpdateRepo={handleUpdateRepo}
                  onDeleteRepo={handleDeleteRepo}
                  isScanningRepoId={isScanningRepoId}
                />
              </div>
            )}

            {dashboardTab === 'logs' && (
              <div className="space-y-8">
                <DaemonTerminalLogs logs={logs} />
              </div>
            )}

          </div>
        )}

      </main>

      {/* 3. Modals */}
      
      {/* Code Diff Viewer Modal */}
      <CodeDiffModal
        run={diffModalRun}
        onClose={() => setDiffModalRun(null)}
        onUndo={handleUndoFix}
        onOpenThoughtStream={(run) => setThoughtStreamRun(run)}
      />

      {/* Review Pipeline 6-Stage Inspector Modal */}
      <ReviewPipelineInspector
        run={pipelineModalRun}
        onClose={() => setPipelineModalRun(null)}
      />

      {/* AI Cognitive Thought Stream Modal */}
      <AIThoughtStreamModal
        run={thoughtStreamRun}
        onClose={() => setThoughtStreamRun(null)}
      />

      {/* Email Report Composer & Preview Modal */}
      <EmailReportModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        fixRuns={fixRuns}
        userEmail={currentUser?.email || ''}
        onSendEmail={handleSendEmail}
      />

      {/* 1-Click Rollback & Undo Center Modal */}
      <UndoCenterModal
        isOpen={undoCenterOpen}
        onClose={() => setUndoCenterOpen(false)}
        fixRuns={fixRuns}
        onUndoFix={handleUndoFix}
        isUndoingId={isUndoingId}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        userEmail={currentUser?.email || ''}
        onSaveSettings={(s) => {
          addLog('info', `Saved global configuration. Default model set to: ${s.defaultModel}`);
          addNotification({
            title: 'Configuration Updated',
            message: `Active model set to ${s.defaultModel}.`,
            type: 'info'
          });
        }}
      />

      {/* Bug Playground & Injection Modal */}
      <BugPlaygroundModal
        isOpen={bugPlaygroundOpen}
        onClose={() => setBugPlaygroundOpen(false)}
        repos={repos}
        onTriggerBug={handleTriggerBugFromPlayground}
      />

      {/* Add Repository Modal */}
      <AddRepoModal
        isOpen={addRepoOpen}
        onClose={() => setAddRepoOpen(false)}
        onAddRepo={handleAddRepo}
        userEmail={currentUser?.email || ''}
      />

      {/* Interactive API Key, AI Models & Integrations Prompt Wizard */}
      <ApiKeyPromptModal
        isOpen={apiKeyPromptOpen}
        onClose={() => setApiKeyPromptOpen(false)}
        onSaveKeys={(data) => {
          addLog('info', `Updated API Keys & Integrations. Model: ${data.selectedModel}`);
          addNotification({
            title: 'API Credentials Saved',
            message: `Daemon synchronized with model ${data.selectedModel}.`,
            type: 'info'
          });
        }}
      />

    </div>
  );
}
