import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import { notificationsApi, extractError } from '../api/client';
import type { Notification } from '../types';
import { PageSpinner, EmptyState } from '../components/ui';
import { toastSuccess, toastError } from '../components/ui/Toast';

const typeIcons: Record<string, string> = {
  new_application: '📋',
  application_status: '📊',
  job_recommendation: '⭐',
  system: '🔔',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    notificationsApi.list()
      .then(data => {
        setNotifications(data || []);
        setError('');
      })
      .catch((err: unknown) => {
        setError(extractError(err));
        setNotifications([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await notificationsApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toastSuccess('All notifications marked as read.');
    } catch (err) {
      toastError(extractError(err));
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    if (n.is_read) return;
    try {
      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item));
      await notificationsApi.markRead(n.id);
    } catch {
      // non-blocking
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="container-page py-12">
        <PageSpinner />
      </div>
    );
  }

  return (
    <div className="container-page py-8 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-1 tracking-tight">
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread update${unreadCount !== 1 ? 's' : ''}`
              : 'You are all caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            id="btn-mark-all-read"
            type="button"
            onClick={handleMarkAll}
            disabled={markingAll}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border bg-surface text-foreground font-semibold text-xs hover:bg-neutral transition-colors shadow-xs"
          >
            <CheckCheck className="w-4 h-4 text-muted-foreground" />
            Mark all read
          </button>
        )}
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-2xl p-4 mb-6 flex items-center gap-3 text-sm text-danger">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-8 h-8" />}
          title="No notifications"
          description="Updates about applications, postings, and local opportunities will appear here."
        />
      ) : (
        <div className="bg-surface border border-border rounded-2xl divide-y divide-border overflow-hidden shadow-sm">
          {notifications.map(n => {
            const isUnread = !n.is_read;
            return (
              <div
                key={n.id}
                id={`notification-${n.id}`}
                onClick={() => handleNotificationClick(n)}
                className={`p-4 sm:p-5 transition-colors relative flex items-start gap-4 ${
                  isUnread
                    ? 'bg-highlight/30 hover:bg-highlight/40 cursor-pointer'
                    : 'hover:bg-neutral/40'
                }`}
              >
                {/* Unread Accent Indicator */}
                {isUnread && (
                  <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
                )}

                {/* Icon Circle */}
                <div className="w-10 h-10 rounded-full bg-header text-primary border border-border flex items-center justify-center text-lg shrink-0 shadow-xs">
                  {typeIcons[n.type] || '🔔'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-sm font-bold text-foreground">
                      {n.title}
                    </h2>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {n.message}
                  </p>
                  <div className="flex items-center justify-between gap-3 mt-3 text-xs">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(n.created_at).toLocaleDateString('en-PH', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                    {n.link && (
                      <Link
                        to={n.link}
                        onClick={e => {
                          e.stopPropagation();
                          handleNotificationClick(n);
                        }}
                        className="font-bold text-xs text-foreground hover:underline inline-flex items-center gap-1"
                      >
                        View details <ChevronRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
