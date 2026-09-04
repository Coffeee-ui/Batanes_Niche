import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Clock, AlertCircle } from 'lucide-react';
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
      .then(data => { setNotifications(data || []); setError(''); })
      .catch((err: unknown) => { setError(extractError(err)); setNotifications([]); })
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

  const unread = notifications.filter(n => !n.is_read).length;

  if (loading) return <div className="container-page py-12"><PageSpinner /></div>;

  return (
    <div className="container-page py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black mb-1" style={{ color: 'hsl(var(--color-text))' }}>Notifications</h1>
          <p className="text-sm" style={{ color: 'hsl(var(--color-text-muted))' }}>
            {unread > 0 ? `${unread} unread notification${unread !== 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        {unread > 0 && (
          <button
            id="btn-mark-all-read"
            onClick={handleMarkAll}
            disabled={markingAll}
            className="btn btn-secondary text-sm gap-2"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {error && (
        <div
          className="rounded-xl p-4 mb-6 flex items-center gap-3 text-sm"
          style={{
            background: 'hsl(var(--color-danger) / 0.08)',
            border: '1px solid hsl(var(--color-danger) / 0.25)',
            color: 'hsl(var(--color-danger))',
          }}
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-8 h-8" />}
          title="No notifications"
          description="You're all caught up! Notifications about applications, jobs, and more will appear here."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n.id}
              id={`notification-${n.id}`}
              className="card p-4 transition-all duration-200"
              style={!n.is_read ? { borderLeft: '3px solid hsl(var(--color-primary))' } : {}}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0">{typeIcons[n.type] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold" style={{ color: 'hsl(var(--color-text))' }}>
                      {n.title}
                      {!n.is_read && (
                        <span
                          className="ml-2 inline-block w-2 h-2 rounded-full"
                          style={{ background: 'hsl(var(--color-primary))' }}
                        />
                      )}
                    </p>
                  </div>
                  <p className="text-sm mt-1" style={{ color: 'hsl(var(--color-text-muted))' }}>{n.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <p className="text-xs flex items-center gap-1" style={{ color: 'hsl(var(--color-text-faint))' }}>
                      <Clock className="w-3 h-3" />
                      {new Date(n.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                    {n.link && (
                      <Link to={n.link} className="text-xs font-medium" style={{ color: 'hsl(var(--color-primary))' }}>
                        View →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
