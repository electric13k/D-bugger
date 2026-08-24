import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Key, 
  Github, 
  Mail, 
  Cpu, 
  ShieldCheck, 
  Check, 
  Save, 
  Clock,
  Sparkles,
  Info,
  Slack,
  Bell
} from 'lucide-react';
import { OPENROUTER_MODELS } from '../data/models';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  onSaveSettings: (settings: any) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  onSaveSettings
}) => {
  const [openRouterKey, setOpenRouterKey] = useState(sessionStorage.getItem('dbugger_openrouter_key') || localStorage.getItem('repoheal_openrouter_key') || '');
  const [githubToken, setGithubToken] = useState(sessionStorage.getItem('dbugger_github_token') || localStorage.getItem('repoheal_github_token') || '');
  const [slackWebhook, setSlackWebhook] = useState(localStorage.getItem('dbugger_slack_webhook') || '');
  const [alertEmail, setAlertEmail] = useState(userEmail || localStorage.getItem('repoheal_alert_email') || '');
  const [pollInterval, setPollInterval] = useState(Number(localStorage.getItem('repoheal_poll_interval') || 30));
  const storedModel = sessionStorage.getItem('dbugger_default_model') || localStorage.getItem('repoheal_default_model') || '';
  const [defaultModel, setDefaultModel] = useState(OPENROUTER_MODELS.some((model) => model.id === storedModel) ? storedModel : (OPENROUTER_MODELS[0]?.id || ''));
  const [minSecurityScore, setMinSecurityScore] = useState(Number(localStorage.getItem('repoheal_min_security') || 85));
  const [browserNotifications, setBrowserNotifications] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleToggleBrowserNotif = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const res = await Notification.requestPermission();
      setBrowserNotifications(res === 'granted');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (openRouterKey.trim()) sessionStorage.setItem('dbugger_openrouter_key', openRouterKey.trim());
    else sessionStorage.removeItem('dbugger_openrouter_key');
    if (githubToken.trim()) sessionStorage.setItem('dbugger_github_token', githubToken.trim());
    else sessionStorage.removeItem('dbugger_github_token');
    sessionStorage.setItem('dbugger_default_model', defaultModel);
    localStorage.setItem('dbugger_slack_webhook', slackWebhook);
    localStorage.setItem('repoheal_alert_email', alertEmail);
    localStorage.setItem('repoheal_poll_interval', String(pollInterval));
    localStorage.setItem('repoheal_default_model', defaultModel);
    localStorage.setItem('repoheal_min_security', String(minSecurityScore));

    onSaveSettings({
      openRouterKey,
      githubToken,
      slackWebhook,
      alertEmail,
      pollInterval,
      defaultModel,
      minSecurityScore,
      browserNotifications
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden my-8 text-[#121212]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black bg-[#F9F7F2] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border-2 border-black bg-black text-[#F9F7F2] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif-heading text-lg font-bold uppercase tracking-tight text-[#121212]">
                Daemon &amp; Model Engine Settings
              </h3>
              <p className="text-xs font-sans text-[#121212]/70">
                Configure your OpenRouter model key for real AI analysis, GitHub credentials for real repository operations, Slack webhook, and security gates.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[520px] overflow-y-auto text-xs font-sans bg-white">
          
          {/* Info Card */}
          <div className="border border-black bg-[#F9F7F2] p-3.5 flex items-start gap-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Sparkles className="h-4 w-4 text-black shrink-0 mt-0.5" />
            <div className="text-[#121212]">
              <strong className="font-bold">Real AI requires your key:</strong> Enter your personal OpenRouter API key to run model analysis and generate patch proposals. Without it, D-Bugger runs diagnostics only.
            </div>
          </div>

          {/* OpenRouter API Key */}
          <div className="space-y-1">
            <label className="text-[#121212] font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-black" />
              OpenRouter API Key (Required for real AI analysis):
            </label>
            <input
              type="password"
              value={openRouterKey}
              onChange={(e) => setOpenRouterKey(e.target.value)}
               placeholder="sk-or-v1-... (required for real AI analysis)"
              className="w-full border border-black bg-[#F9F7F2] px-3 py-2 text-xs text-[#121212] placeholder-[#121212]/40 focus:outline-none font-mono shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            />
            <p className="text-[11px] text-[#121212]/60">
              Get an OpenRouter key at openrouter.ai to access higher token quotas.
            </p>
          </div>

          {/* GitHub Token */}
          <div className="space-y-1">
            <label className="text-[#121212] font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Github className="h-3.5 w-3.5 text-black" />
              GitHub Personal Access Token / MCP Token (Optional):
            </label>
            <input
              type="password"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              placeholder="ghp_... (required for real repository operations)"
              className="w-full border border-black bg-[#F9F7F2] px-3 py-2 text-xs text-[#121212] placeholder-[#121212]/40 focus:outline-none font-mono shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            />
            <p className="text-[11px] text-[#121212]/60">
              Requires <code className="bg-neutral-200 px-1">repo</code> permissions to create PRs and push commits to live private GitHub repositories.
            </p>
          </div>

          {/* Slack Webhook */}
          <div className="space-y-1">
            <label className="text-[#121212] font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Slack className="h-3.5 w-3.5 text-[#4A154B]" />
              Slack Incoming Webhook URL:
            </label>
            <input
              type="url"
              value={slackWebhook}
              onChange={(e) => setSlackWebhook(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              className="w-full border border-black bg-[#F9F7F2] px-3 py-2 text-xs text-[#121212] placeholder-[#121212]/40 focus:outline-none font-mono shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          {/* Default Model Selector */}
          <div className="space-y-1">
            <label className="text-[#121212] font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-black" />
              Default High-Context AI Model:
            </label>
            <select
              value={defaultModel}
              onChange={(e) => setDefaultModel(e.target.value)}
              className="w-full border border-black bg-[#F9F7F2] px-3 py-2 text-xs text-[#121212] font-mono focus:outline-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              {OPENROUTER_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.contextLength} ({m.provider})
                </option>
              ))}
            </select>
          </div>

          {/* Alert Email */}
          <div className="space-y-1">
            <label className="text-[#121212] font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-black" />
              Developer Notification Email (Optional):
            </label>
            <input
              type="email"
              value={alertEmail}
              onChange={(e) => setAlertEmail(e.target.value)}
              placeholder="developer@company.com"
              className="w-full border border-black bg-[#F9F7F2] px-3 py-2 text-xs text-[#121212] placeholder-[#121212]/40 focus:outline-none font-mono shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          {/* Sliders Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            
            {/* Poll Interval */}
            <div className="space-y-1 border border-black bg-[#F9F7F2] p-3 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <label className="text-[#121212] font-bold uppercase text-[11px] flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-black" />
                  Daemon Poll Interval:
                </span>
                <span className="font-mono text-black font-bold bg-white px-1.5 border border-black">{pollInterval}s</span>
              </label>
              <input
                type="range"
                min="10"
                max="120"
                step="5"
                value={pollInterval}
                onChange={(e) => setPollInterval(Number(e.target.value))}
                className="w-full accent-black mt-2"
              />
            </div>

            {/* Min Security Score */}
            <div className="space-y-1 border border-black bg-[#F9F7F2] p-3 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <label className="text-[#121212] font-bold uppercase text-[11px] flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-black" />
                  Min Pipeline Gate Score:
                </span>
                <span className="font-mono text-black font-bold bg-white px-1.5 border border-black">{minSecurityScore}%</span>
              </label>
              <input
                type="range"
                min="70"
                max="98"
                step="1"
                value={minSecurityScore}
                onChange={(e) => setMinSecurityScore(Number(e.target.value))}
                className="w-full accent-black mt-2"
              />
            </div>

          </div>

          {/* Browser Push Notifications */}
          <div className="border border-black bg-[#F9F7F2] p-3 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-black" />
              <div>
                <span className="font-bold text-xs uppercase text-[#121212] block">Browser Push Alerts</span>
                <span className="text-[10px] text-[#121212]/70">Desktop alerts for background fix completion</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleBrowserNotif}
              className={`px-3 py-1 text-xs font-sans font-bold uppercase border border-black transition-all ${
                browserNotifications ? 'bg-emerald-200 text-emerald-950' : 'bg-white text-black'
              }`}
            >
              {browserNotifications ? 'Enabled' : 'Request Permission'}
            </button>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t-2 border-black flex items-center justify-between">
            {savedSuccess ? (
              <span className="flex items-center gap-1 text-emerald-950 font-bold bg-emerald-200 px-2 py-0.5 border border-black">
                <Check className="h-4 w-4" /> Settings Saved!
              </span>
            ) : <span />}

            <button
              type="submit"
              className="flex items-center gap-1.5 border border-black bg-black text-[#F9F7F2] px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-800 active:translate-x-[1px] active:translate-y-[1px] transition-all"
            >
              <Save className="h-3.5 w-3.5" />
              Save Configuration
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
