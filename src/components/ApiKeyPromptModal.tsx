import React, { useState, useEffect } from 'react';
import { 
  X, 
  Key, 
  Cpu, 
  Github, 
  Slack, 
  Bell, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  ExternalLink,
  ArrowRight,
  Info,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { OPENROUTER_MODELS } from '../data/models';

interface ApiKeyPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveKeys: (data: {
    openRouterKey: string;
    selectedModel: string;
    githubToken: string;
    slackWebhook: string;
  }) => void;
}

export const ApiKeyPromptModal: React.FC<ApiKeyPromptModalProps> = ({
  isOpen,
  onClose,
  onSaveKeys
}) => {
  const [openRouterKey, setOpenRouterKey] = useState(sessionStorage.getItem('dbugger_openrouter_key') || localStorage.getItem('repoheal_openrouter_key') || '');
  const storedModel = sessionStorage.getItem('dbugger_default_model') || localStorage.getItem('repoheal_default_model') || '';
  const [selectedModel, setSelectedModel] = useState(OPENROUTER_MODELS.some((model) => model.id === storedModel) ? storedModel : (OPENROUTER_MODELS[0]?.id || ''));
  const [githubToken, setGithubToken] = useState(sessionStorage.getItem('dbugger_github_token') || localStorage.getItem('repoheal_github_token') || '');
  const [slackWebhook, setSlackWebhook] = useState(localStorage.getItem('dbugger_slack_webhook') || '');

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestNotification = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        new Notification('D-Bugger Notifications Active', {
          body: 'You will receive real-time alerts when automated bug fixes or PRs are completed.'
        });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveKey = openRouterKey.trim();
    sessionStorage.setItem('dbugger_openrouter_key', effectiveKey.trim());
    sessionStorage.setItem('dbugger_default_model', selectedModel);
    sessionStorage.setItem('dbugger_github_token', githubToken.trim());
    localStorage.removeItem('repoheal_openrouter_key');
    localStorage.removeItem('repoheal_github_token');
    localStorage.setItem('repoheal_default_model', selectedModel);
    localStorage.setItem('dbugger_slack_webhook', slackWebhook.trim());

    onSaveKeys({
      openRouterKey: effectiveKey,
      selectedModel,
      githubToken: githubToken.trim(),
      slackWebhook: slackWebhook.trim()
    });

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl border-2 border-black bg-white shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] overflow-hidden my-8 text-[#121212] font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black bg-[#F9F7F2] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border-2 border-black bg-black text-[#F9F7F2] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif-heading text-lg font-bold uppercase tracking-tight text-[#121212]">
                  API Keys &amp; Service Integrations
                </h3>
                <span className="text-[10px] font-mono font-bold bg-amber-200 text-amber-950 px-2 py-0.5 border border-black uppercase">
                  Required Setup
                </span>
              </div>
              <p className="text-xs text-[#121212]/70">
                Provide your OpenRouter credentials, GitHub token, Slack webhook, and notification access.
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

        {/* Step Indicator */}
        <div className="grid grid-cols-4 border-b-2 border-black bg-[#F9F7F2]/50 text-center text-xs font-bold uppercase tracking-wider divide-x-2 divide-black">
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className={`py-2 px-1 flex items-center justify-center gap-1.5 transition-colors ${
              activeStep === 1 ? 'bg-black text-[#F9F7F2]' : 'text-[#121212] hover:bg-white'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">1. OpenRouter</span>
            <span className="sm:hidden">1. AI</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep(2)}
            className={`py-2 px-1 flex items-center justify-center gap-1.5 transition-colors ${
              activeStep === 2 ? 'bg-black text-[#F9F7F2]' : 'text-[#121212] hover:bg-white'
            }`}
          >
            <Github className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">2. GitHub PAT</span>
            <span className="sm:hidden">2. Git</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep(3)}
            className={`py-2 px-1 flex items-center justify-center gap-1.5 transition-colors ${
              activeStep === 3 ? 'bg-black text-[#F9F7F2]' : 'text-[#121212] hover:bg-white'
            }`}
          >
            <Slack className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">3. Slack Alert</span>
            <span className="sm:hidden">3. Slack</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep(4)}
            className={`py-2 px-1 flex items-center justify-center gap-1.5 transition-colors ${
              activeStep === 4 ? 'bg-black text-[#F9F7F2]' : 'text-[#121212] hover:bg-white'
            }`}
          >
            <Bell className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">4. Push Alerts</span>
            <span className="sm:hidden">4. Push</span>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[460px] overflow-y-auto bg-white">
          
          {/* STEP 1: OPENROUTER API & MODEL SELECTION */}
          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="border-2 border-black bg-[#F9F7F2] p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="h-5 w-5 text-black shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-serif-heading text-sm font-bold uppercase text-[#121212]">
                      OpenRouter High-Context AI Models
                    </h4>
                    <p className="text-xs text-[#121212]/80 mt-1 leading-relaxed">
                      Enter your personal <strong>OpenRouter API Key</strong> for real model analysis and patch proposals. Without a key, no AI run is started.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-black bg-white p-3 text-xs text-[#121212]/80">
                AI analysis is unavailable until a user-owned OpenRouter key is entered. Without that key, no AI request is made.
              </div>

              <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-[#121212] flex items-center justify-between">
                    <span>OpenRouter API Key:</span>
                    <a
                      href="https://openrouter.ai/keys"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-mono text-black underline flex items-center gap-0.5"
                    >
                      Get OpenRouter Key <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </label>
                  <input
                    type="password"
                    value={openRouterKey}
                    onChange={(e) => setOpenRouterKey(e.target.value)}
                    placeholder="sk-or-v1-xxxxxxxxxxxxxxxx"
                    className="w-full border border-black bg-[#F9F7F2] px-3 py-2 text-xs text-[#121212] font-mono focus:outline-none placeholder-[#121212]/40 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                  />
              </div>

              {/* STEP NAVIGATION */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-[#121212] block">
                  Select AI Reasoning Engine / Model:
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full border border-black bg-[#F9F7F2] px-3 py-2 text-xs text-[#121212] font-mono focus:outline-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                >
                  {OPENROUTER_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.contextLength} ({m.provider}) {m.isFree ? '• [FREE TIER]' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#121212]/70 font-mono">
                  DeepSeek-R1 and Gemini 2.0 Flash support massive 128k–1M context windows to ingest entire multi-file repository ASTs and call graphs.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="flex items-center gap-1 border border-black bg-black text-[#F9F7F2] px-4 py-1.5 text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-800"
                >
                  Next: GitHub MCP Auth &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: GITHUB MCP TOKEN */}
          {activeStep === 2 && (
            <div className="space-y-4">
              <div className="border-2 border-black bg-[#F9F7F2] p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-start gap-2.5">
                  <Github className="h-5 w-5 text-black shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-serif-heading text-sm font-bold uppercase text-[#121212]">
                      GitHub Model Context Protocol (MCP) Token
                    </h4>
                    <p className="text-xs text-[#121212]/80 mt-1 leading-relaxed">
                      Provide a GitHub Personal Access Token (PAT) with <code>repo</code> permissions. This gives the background daemon agentic capabilities to open PRs, push defensive commits, and create 1-click revert branches on your repositories.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-[#121212] flex items-center justify-between">
                  <span>GitHub Personal Access Token (PAT):</span>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-mono text-black underline flex items-center gap-0.5"
                  >
                    Generate Token on GitHub <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </label>
                <input
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx (required for real repositories)"
                  className="w-full border border-black bg-[#F9F7F2] px-3 py-2 text-xs text-[#121212] font-mono focus:outline-none placeholder-[#121212]/40 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                />
                <p className="text-[11px] text-[#121212]/70 font-mono">
                  A GitHub token is required to read repository source and deliver branches, commits, or pull requests. Without a GitHub token and repository, no analysis runs.
                </p>
              </div>

              <div className="pt-2 flex justify-between">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="border border-black bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-[#F9F7F2]"
                >
                  &larr; Back
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="flex items-center gap-1 border border-black bg-black text-[#F9F7F2] px-4 py-1.5 text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-800"
                >
                  Next: Slack Alerts &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SLACK WEBHOOK */}
          {activeStep === 3 && (
            <div className="space-y-4">
              <div className="border-2 border-black bg-[#F9F7F2] p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-start gap-2.5">
                  <Slack className="h-5 w-5 text-[#4A154B] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-serif-heading text-sm font-bold uppercase text-[#121212]">
                      Slack Real-Time Notifications
                    </h4>
                    <p className="text-xs text-[#121212]/80 mt-1 leading-relaxed">
                      Connect your team Slack channel to receive instant rich alerts whenever a bug is detected, patched, reviewed, or rolled back.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-[#121212] flex items-center justify-between">
                  <span>Slack Incoming Webhook URL (Optional):</span>
                  <a
                    href="https://api.slack.com/messaging/webhooks"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-mono text-black underline flex items-center gap-0.5"
                  >
                    Create Webhook on Slack <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </label>
                <input
                  type="url"
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                  placeholder="https://hooks.slack.com/services/T00/B00/XXXX"
                  className="w-full border border-black bg-[#F9F7F2] px-3 py-2 text-xs text-[#121212] font-mono focus:outline-none placeholder-[#121212]/40 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>

              <div className="pt-2 flex justify-between">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="border border-black bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-[#F9F7F2]"
                >
                  &larr; Back
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(4)}
                  className="flex items-center gap-1 border border-black bg-black text-[#F9F7F2] px-4 py-1.5 text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-800"
                >
                  Next: Push Alerts &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: BROWSER NOTIFICATIONS */}
          {activeStep === 4 && (
            <div className="space-y-4">
              <div className="border-2 border-black bg-[#F9F7F2] p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-start gap-2.5">
                  <Bell className="h-5 w-5 text-black shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-serif-heading text-sm font-bold uppercase text-[#121212]">
                      Browser Desktop Push Alerts
                    </h4>
                    <p className="text-xs text-[#121212]/80 mt-1 leading-relaxed">
                      Enable desktop notifications to get instant alerts even when working in other tabs or your IDE when background fixes complete.
                    </p>
                  </div>
                </div>
              </div>

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
                    Enable Push Notifications
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-900 bg-emerald-100 px-2 py-1 border border-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" /> Active &amp; Ready
                  </span>
                )}
              </div>

              <div className="pt-2 flex justify-between">
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="border border-black bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-[#F9F7F2]"
                >
                  &larr; Back
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1 border-2 border-black bg-black text-[#F9F7F2] px-5 py-2 text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-800"
                >
                  <Check className="h-4 w-4" />
                  Save &amp; Activate Daemon
                </button>
              </div>
            </div>
          )}

          {isSaved && (
            <div className="border-2 border-black bg-emerald-100 p-3 text-xs font-bold text-emerald-950 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-800" />
              API credentials and integration preferences saved successfully!
            </div>
          )}

        </form>

        {/* Footer */}
        <div className="flex items-center justify-between border-t-2 border-black bg-[#F9F7F2] px-6 py-3">
          <span className="text-[11px] font-mono text-[#121212]/70">
            Keys are securely stored in your browser session and verified by the daemon.
          </span>

          <button
            onClick={onClose}
            className="border border-black bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#121212] hover:bg-[#F9F7F2] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
