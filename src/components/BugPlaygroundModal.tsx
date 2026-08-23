import React, { useState } from 'react';
import { 
  X, 
  Bug, 
  Play, 
  Flame, 
  Code2, 
  Cpu, 
  GitBranch, 
  ShieldAlert, 
  Zap,
  Sparkles
} from 'lucide-react';
import { BUG_SCENARIOS, OPENROUTER_MODELS } from '../data/models';
import { MonitoredRepo } from '../types';

interface BugPlaygroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  repos: MonitoredRepo[];
  onTriggerBug: (repo: MonitoredRepo, scenarioIndex: number, customCode?: string, customCommit?: string) => Promise<void>;
}

export const BugPlaygroundModal: React.FC<BugPlaygroundModalProps> = ({
  isOpen,
  onClose,
  repos,
  onTriggerBug
}) => {
  const [selectedRepoId, setSelectedRepoId] = useState(repos[0]?.id || '');
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customCommit, setCustomCommit] = useState('fix: untested rapid change in payment engine');
  const [customCode, setCustomCode] = useState(`function processOrder(order) {
  // Bug: Missing null check and infinite recursion on retry
  if (order.status !== 'success') {
    return processOrder(order);
  }
  return order.total * taxRate;
}`);
  const [isInjecting, setIsInjecting] = useState(false);

  if (!isOpen) return null;

  const currentScenario = BUG_SCENARIOS[selectedScenarioIndex] || BUG_SCENARIOS[0];
  const targetRepo = repos.find(r => r.id === selectedRepoId) || repos[0];

  const handleInject = async () => {
    if (!targetRepo) return;
    setIsInjecting(true);
    try {
      if (isCustomMode) {
        await onTriggerBug(targetRepo, -1, customCode, customCommit);
      } else {
        await onTriggerBug(targetRepo, selectedScenarioIndex);
      }
      onClose();
    } finally {
      setIsInjecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden my-8 text-[#121212]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black bg-[#F9F7F2] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border-2 border-black bg-red-200 text-red-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Bug className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif-heading text-lg font-bold uppercase tracking-tight text-[#121212]">
                Bug Simulation Bench &amp; Live MCP Trigger
              </h3>
              <p className="text-xs font-sans text-[#121212]/70">
                Simulate a real commit flaw to trigger background AST sweep, AI patch synthesis, and test suites.
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

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto text-xs font-sans bg-white">
          
          {/* Target Repo Picker */}
          <div className="space-y-1">
            <label className="text-[#121212] font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <GitBranch className="h-3.5 w-3.5 text-black" />
              Target Monitored Repository:
            </label>
            <select
              value={selectedRepoId}
              onChange={(e) => setSelectedRepoId(e.target.value)}
              className="w-full border border-black bg-[#F9F7F2] px-3 py-2 text-xs text-[#121212] font-mono focus:outline-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              {repos.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.branch}) — Model: {r.openRouterModel}
                </option>
              ))}
            </select>
          </div>

          {/* Scenario Mode Toggle */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[#121212] font-bold uppercase tracking-wider text-[11px]">Select Bug Scenario:</span>
            <div className="flex items-center gap-1 border border-black bg-white p-0.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <button
                type="button"
                onClick={() => setIsCustomMode(false)}
                className={`px-3 py-1 text-xs font-sans font-bold uppercase tracking-wider transition-colors ${
                  !isCustomMode ? 'bg-black text-[#F9F7F2]' : 'text-[#121212] hover:bg-[#F9F7F2]'
                }`}
              >
                Preset Scenarios
              </button>
              <button
                type="button"
                onClick={() => setIsCustomMode(true)}
                className={`px-3 py-1 text-xs font-sans font-bold uppercase tracking-wider transition-colors ${
                  isCustomMode ? 'bg-black text-[#F9F7F2]' : 'text-[#121212] hover:bg-[#F9F7F2]'
                }`}
              >
                Custom Bug Code
              </button>
            </div>
          </div>

          {!isCustomMode ? (
            <div className="space-y-3">
              {/* Preset Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {BUG_SCENARIOS.map((scenario, index) => {
                  const isSelected = selectedScenarioIndex === index;
                  return (
                    <div
                      key={scenario.id}
                      onClick={() => setSelectedScenarioIndex(index)}
                      className={`cursor-pointer border p-3 transition-all ${
                        isSelected
                          ? 'border-2 border-black bg-[#F9F7F2] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                          : 'border-neutral-300 bg-white hover:border-black'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
                        <span className="text-[#121212]">
                          {scenario.category.replace('_', ' ')}
                        </span>
                        <span className="border border-black bg-white px-1 py-0.2 font-mono">{scenario.severity}</span>
                      </div>
                      <h4 className="font-serif-heading text-sm font-bold text-[#121212] line-clamp-1">
                        {scenario.title}
                      </h4>
                      <p className="text-[11px] font-sans text-[#121212]/70 mt-1 line-clamp-2">
                        {scenario.bugExplanation}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Selected Scenario Code Preview */}
              <div className="border border-black bg-[#F9F7F2] p-3 font-mono text-[11px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between text-[#121212]/80 mb-1.5 font-bold">
                  <span>File: <strong className="text-black">{currentScenario.file}</strong></span>
                  <span className="text-red-800">commit: &quot;{currentScenario.commitMsg}&quot;</span>
                </div>
                <pre className="text-red-950 overflow-x-auto whitespace-pre-wrap max-h-36 bg-red-50 p-2.5 border border-red-300 font-mono">
                  {currentScenario.originalCode}
                </pre>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[#121212] font-bold uppercase text-[11px]">Commit Message:</label>
                <input
                  type="text"
                  value={customCommit}
                  onChange={(e) => setCustomCommit(e.target.value)}
                  className="w-full border border-black bg-[#F9F7F2] px-3 py-1.5 text-xs text-[#121212] font-mono focus:outline-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#121212] font-bold uppercase text-[11px]">Buggy Source Code:</label>
                <textarea
                  rows={6}
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  className="w-full border border-black bg-[#F9F7F2] p-3 text-xs text-[#121212] font-mono focus:outline-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t-2 border-black bg-[#F9F7F2] px-6 py-4">
          <div className="flex items-center gap-1.5 text-xs font-sans font-bold text-[#121212]">
            <Zap className="h-4 w-4 text-black" />
            Daemon will analyze with <strong className="font-mono text-black underline">{targetRepo?.openRouterModel || 'AI'}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="border border-black bg-white px-3 py-1.5 text-xs font-sans font-bold uppercase tracking-wider text-[#121212] hover:bg-[#F9F7F2] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              Cancel
            </button>

            <button
              onClick={handleInject}
              disabled={isInjecting || !targetRepo}
              className="flex items-center gap-1.5 border border-black bg-black text-[#F9F7F2] px-4 py-1.5 text-xs font-sans font-bold uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-800 active:translate-x-[1px] active:translate-y-[1px] transition-all disabled:opacity-50"
            >
              <Flame className={`h-4 w-4 ${isInjecting ? 'animate-bounce' : ''}`} />
              {isInjecting ? 'Autonomous Daemon Healing...' : 'Simulate Commit & Auto-Fix'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

