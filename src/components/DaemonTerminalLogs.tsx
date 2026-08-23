import React, { useState } from 'react';
import { 
  Terminal, 
  Trash2, 
  Filter, 
  Activity, 
  Cpu, 
  GitBranch, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { DaemonLog } from '../types';

interface DaemonTerminalLogsProps {
  logs: DaemonLog[];
  onClearLogs?: () => void;
}

export const DaemonTerminalLogs: React.FC<DaemonTerminalLogsProps> = ({ logs, onClearLogs }) => {
  const [filter, setFilter] = useState<'all' | 'mcp' | 'ai' | 'success' | 'warn'>('all');

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    if (filter === 'mcp') return log.level === 'mcp';
    if (filter === 'ai') return log.level === 'ai' || log.message.includes('AI') || log.message.includes('model');
    if (filter === 'success') return log.level === 'success';
    if (filter === 'warn') return log.level === 'warn' || log.level === 'error';
    return true;
  });

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'mcp':
        return <span className="text-cyan-300 font-bold font-mono">[MCP]</span>;
      case 'ai':
        return <span className="text-purple-300 font-bold font-mono">[AI-OR]</span>;
      case 'success':
        return <span className="text-emerald-400 font-bold font-mono">[PASS]</span>;
      case 'warn':
        return <span className="text-amber-300 font-bold font-mono">[WARN]</span>;
      case 'error':
        return <span className="text-rose-400 font-bold font-mono">[ERR]</span>;
      default:
        return <span className="text-neutral-400 font-bold font-mono">[SYS]</span>;
    }
  };

  return (
    <div className="border-2 border-black bg-black p-5 font-mono text-xs shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] mb-8 text-[#F9F7F2]">
      
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-emerald-400" />
          <span className="font-sans font-bold uppercase tracking-wider text-[#F9F7F2]">
            Daemon &amp; MCP Protocol Telemetry
          </span>
          <span className="bg-neutral-800 border border-neutral-700 px-1.5 py-0.5 text-[9px] text-emerald-400 uppercase font-mono">
            STDIO WebSocket
          </span>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', 'mcp', 'ai', 'success', 'warn'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-2 py-0.5 text-[10px] font-sans font-bold uppercase tracking-wider transition-colors border ${
                filter === tab
                  ? 'bg-white text-black border-white'
                  : 'text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Log Output */}
      <div className="h-48 overflow-y-auto space-y-1.5 pr-2 font-mono scrollbar-thin scrollbar-thumb-neutral-800">
        {filteredLogs.length === 0 ? (
          <div className="text-neutral-500 text-center py-8">
            No telemetry records matching filter &quot;{filter}&quot;
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 text-neutral-300 leading-relaxed hover:bg-neutral-900/80 px-1.5 py-0.5">
              <span className="text-neutral-500 shrink-0 select-none text-[11px]">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className="shrink-0">{getLevelBadge(log.level)}</span>
              {log.repoName && (
                <span className="text-neutral-300 shrink-0 font-bold">
                  [{log.repoName}]
                </span>
              )}
              <span className="text-[#F9F7F2] break-all">{log.message}</span>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between border-t border-neutral-800 pt-2.5 mt-3 text-[10px] text-neutral-400 uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <span>MCP Hook Ingress Active on <code>/api/daemon/webhook</code></span>
        </div>
        <span className="font-mono">{filteredLogs.length} events logged</span>
      </div>

    </div>
  );
};

