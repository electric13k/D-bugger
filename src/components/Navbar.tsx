import React, { useState } from 'react';
import { 
  Bot, 
  Play, 
  Pause, 
  RefreshCw, 
  Bug, 
  Mail, 
  RotateCcw, 
  Settings, 
  ShieldCheck, 
  Cpu, 
  Github, 
  LogIn, 
  LogOut,
  Sparkles,
  Radio,
  Flame,
  Terminal,
  LayoutDashboard,
  Home,
  Key
} from 'lucide-react';
import { signOutWorkspace, WorkspaceUser } from '../lib/workspaceAuth';
import { readSessionCredential } from '../lib/cloudflareWorkspace';
import { NotificationCenter } from './NotificationCenter';
import { InAppNotification } from '../types';

interface NavbarProps {
  activeTab: 'home' | 'dashboard';
  onChangeTab: (tab: 'home' | 'dashboard') => void;
  daemonRunning: boolean;
  onToggleDaemon: () => void;
  onTriggerCycle: () => void;
  onOpenBugPlayground: () => void;
  onOpenEmailModal: () => void;
  onOpenUndoCenter: () => void;
  onOpenSettings: () => void;
  onOpenApiKeyPrompt: () => void;
  onOpenEmailAuth: () => void;
  currentUser: WorkspaceUser | null;
  isCycling: boolean;
  notifications: InAppNotification[];
  onMarkAllNotificationsRead: () => void;
  onClearAllNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onChangeTab,
  daemonRunning,
  onToggleDaemon,
  onTriggerCycle,
  onOpenBugPlayground,
  onOpenEmailModal,
  onOpenUndoCenter,
  onOpenSettings,
  onOpenApiKeyPrompt,
  onOpenEmailAuth,
  currentUser,
  isCycling,
  notifications,
  onMarkAllNotificationsRead,
  onClearAllNotifications,
}) => {
  const hasCustomKey = Boolean(readSessionCredential('dbugger_openrouter_key', 'repoheal_openrouter_key'));

  const handleAuth = async () => {
    if (currentUser) {
      await signOutWorkspace();
    } else {
      onOpenEmailAuth();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-black bg-[#F9F7F2]/95 backdrop-blur-md text-[#121212]">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left: Brand & Editorial Header */}
        <div className="flex items-center gap-4">
          <div 
            onClick={() => onChangeTab('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="flex h-11 w-11 items-center justify-center bg-black text-[#F9F7F2] border border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] group-hover:bg-neutral-800 transition-colors">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif-heading text-2xl font-black uppercase tracking-tight text-[#121212] leading-none">
                  D-Bugger
                </span>
                <span className="bg-black text-[#F9F7F2] px-2 py-0.5 text-[9px] font-sans font-bold uppercase tracking-widest">
                  MCP Daemon
                </span>
              </div>
              <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#121212]/60 mt-0.5 hidden sm:block">
                GitHub Evidence & AI Review
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 border border-black bg-white p-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ml-2">
            <button
              onClick={() => onChangeTab('home')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-sans font-bold uppercase tracking-wider transition-all ${
                activeTab === 'home'
                  ? 'bg-black text-[#F9F7F2]'
                  : 'text-[#121212] hover:bg-[#F9F7F2]'
              }`}
            >
              <Home className="h-3.5 w-3.5" />
              Overview
            </button>
            <button
              onClick={() => onChangeTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-sans font-bold uppercase tracking-wider transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-black text-[#F9F7F2]'
                  : 'text-[#121212] hover:bg-[#F9F7F2]'
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Dashboard
            </button>
          </nav>
        </div>

        {/* Center: Daemon Status Badge */}
        <div className="hidden sm:flex items-center gap-2 border border-black bg-white px-3.5 py-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {daemonRunning && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-600 opacity-75"></span>
              )}
              <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${daemonRunning ? 'bg-emerald-600' : 'bg-amber-600'}`}></span>
            </span>
            <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#121212]">
              Daemon: <strong className={daemonRunning ? 'text-emerald-700' : 'text-amber-700'}>{daemonRunning ? 'Active' : 'Paused'}</strong>
            </span>
          </div>

          <div className="h-3.5 w-px bg-black/20 mx-1"></div>

          <button
            id="btn-toggle-daemon"
            onClick={onToggleDaemon}
            className={`flex items-center gap-1 text-[10px] font-sans font-bold uppercase tracking-widest px-2 py-0.5 transition-colors ${
              daemonRunning 
                ? 'text-amber-800 hover:bg-amber-100 border border-transparent hover:border-amber-300' 
                : 'text-emerald-800 hover:bg-emerald-100 border border-transparent hover:border-emerald-300'
            }`}
            title={daemonRunning ? "Pause background watcher" : "Resume background watcher"}
          >
            {daemonRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {daemonRunning ? 'Pause' : 'Resume'}
          </button>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          
          {/* Trigger Cycle Button */}
          <button
            id="btn-trigger-cycle"
            onClick={onTriggerCycle}
            disabled={isCycling}
            className="flex items-center gap-1.5 border border-black bg-white px-3 py-1.5 text-xs font-sans font-bold uppercase tracking-wider text-[#121212] hover:bg-[#F9F7F2] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all disabled:opacity-50"
            title="Scan monitored repositories for new commits"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isCycling ? 'animate-spin text-black' : ''}`} />
            <span className="hidden lg:inline">{isCycling ? 'Sweeping...' : 'Manual Sweep'}</span>
          </button>

          {/* Test Bug Playground Button */}
          <button
            id="btn-test-bug-playground"
            onClick={onOpenBugPlayground}
            className="flex items-center gap-1.5 bg-black text-[#F9F7F2] border border-black px-3 py-1.5 text-xs font-sans font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#222222] active:translate-x-[1px] active:translate-y-[1px] transition-all"
          >
            <Flame className="h-3.5 w-3.5 text-amber-300" />
            <span className="hidden sm:inline">Inject Bug</span>
          </button>

          {/* Email Digest Modal */}
          <button
            id="btn-email-reports"
            onClick={onOpenEmailModal}
            className="border border-black bg-white p-2 text-[#121212] hover:bg-[#F9F7F2] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all"
            title="Email Summary Reports"
          >
            <Mail className="h-4 w-4" />
          </button>

          {/* Undo Center Modal */}
          <button
            id="btn-undo-center"
            onClick={onOpenUndoCenter}
            className="border border-black bg-white p-2 text-[#121212] hover:bg-[#F9F7F2] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all"
            title="1-Click Undo & Rollback History"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          {/* Live Notification Center Dropdown */}
          <NotificationCenter
            notifications={notifications}
            onMarkAllAsRead={onMarkAllNotificationsRead}
            onClearAll={onClearAllNotifications}
          />

          {/* API Credentials & Integration Keys */}
          <button
            id="btn-api-keys-setup"
            onClick={onOpenApiKeyPrompt}
            className="flex items-center gap-1.5 border border-black bg-amber-100 hover:bg-amber-200 text-amber-950 px-2.5 py-1.5 text-xs font-sans font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all"
            title="OpenRouter, GitHub, and Slack API Keys"
          >
            <Key className="h-3.5 w-3.5 text-amber-900" />
            <span className="hidden xl:inline">{hasCustomKey ? 'API Keys Active' : 'Configure API'}</span>
          </button>

          {/* Settings Modal */}
          <button
            id="btn-settings-modal"
            onClick={onOpenSettings}
            className="border border-black bg-white p-2 text-[#121212] hover:bg-[#F9F7F2] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all"
            title="System Configuration & API Keys"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* User Auth Profile */}
          <div className="pl-1 border-l border-black/20">
            {currentUser ? (
              <div className="flex items-center gap-2">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="h-8 w-8 rounded-none border border-black"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center bg-black text-[#F9F7F2] text-xs font-bold font-sans">
                    {currentUser.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <button
                  id="btn-logout"
                  onClick={handleAuth}
                  className="border border-black bg-white p-1.5 text-[#121212] hover:bg-[#F9F7F2] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                  title="Sign Out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                id="btn-login-google"
                onClick={handleAuth}
                className="flex items-center gap-1.5 border border-black bg-white px-2.5 py-1.5 text-xs font-sans font-bold uppercase tracking-wider text-[#121212] hover:bg-[#F9F7F2] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <LogIn className="h-3.5 w-3.5 text-black" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
