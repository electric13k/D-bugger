import React, { useState } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  ShieldCheck, 
  Slack, 
  X, 
  Trash2, 
  Check, 
  ExternalLink,
  Info
} from 'lucide-react';
import { InAppNotification } from '../types';

interface NotificationCenterProps {
  notifications: InAppNotification[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onSelectNotification?: (notification: InAppNotification) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAllAsRead,
  onClearAll,
  onSelectNotification
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: InAppNotification['type']) => {
    switch (type) {
      case 'fix_success':
        return <CheckCircle2 className="h-4 w-4 text-emerald-800" />;
      case 'security_gate':
        return <ShieldCheck className="h-4 w-4 text-black" />;
      case 'rollback':
        return <RotateCcw className="h-4 w-4 text-amber-900" />;
      case 'slack_alert':
        return <Slack className="h-4 w-4 text-[#4A154B]" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-700" />;
      default:
        return <Info className="h-4 w-4 text-neutral-800" />;
    }
  };

  return (
    <div className="relative font-sans">
      
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center border border-black bg-white p-2 text-[#121212] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#F9F7F2] active:translate-x-[1px] active:translate-y-[1px] transition-all"
        title="In-App Real-Time Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center border border-black bg-red-600 px-1 text-[9px] font-bold text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Tray */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-[#121212] overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-black bg-[#F9F7F2] px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-black" />
                <span className="font-serif-heading text-xs font-bold uppercase tracking-wider text-[#121212]">
                  Live Notification Center ({notifications.length})
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="text-[10px] font-sans font-bold uppercase tracking-wider text-black hover:underline"
                    title="Mark all as read"
                  >
                    Read All
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-neutral-200 border border-black"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Notification Items List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-black/10">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#121212]/60 font-mono">
                  No active notifications. Live repository polling is idle until a connected repository and credentials are available.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      onSelectNotification?.(notif);
                    }}
                    className={`p-3 text-xs transition-colors cursor-pointer hover:bg-[#F9F7F2] ${
                      !notif.read ? 'bg-amber-50/70 border-l-4 border-l-black' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0">
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-bold text-[#121212] truncate text-xs">
                            {notif.title}
                          </h4>
                          <span className="text-[10px] text-[#121212]/60 font-mono shrink-0">
                            {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#121212]/80 mt-0.5 leading-snug">
                          {notif.message}
                        </p>
                        {notif.repoName && (
                          <div className="mt-1 flex items-center gap-2">
                            <span className="font-mono text-[10px] text-black font-bold bg-neutral-100 px-1 border border-neutral-300">
                              {notif.repoName}
                            </span>
                            {notif.prUrl && (
                              <a
                                href={notif.prUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[10px] text-black font-mono font-bold flex items-center gap-0.5 hover:underline"
                              >
                                View PR <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="flex items-center justify-between border-t-2 border-black bg-[#F9F7F2] px-4 py-2">
                <span className="text-[10px] font-mono text-[#121212]/70">
                  {unreadCount} unread alert{unreadCount !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={onClearAll}
                  className="flex items-center gap-1 text-[10px] font-sans font-bold uppercase tracking-wider text-red-900 hover:underline"
                >
                  <Trash2 className="h-3 w-3" /> Clear History
                </button>
              </div>
            )}

          </div>
        </>
      )}

    </div>
  );
};
