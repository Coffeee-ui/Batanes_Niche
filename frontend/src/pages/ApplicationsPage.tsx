import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Send, Clock, MapPin, ChevronDown, X, AlertCircle } from 'lucide-react';
import { applicationsApi, extractError } from '../api/client';
import type { Application } from '../types';
import { PageSpinner, EmptyState, ConfirmDialog } from '../components/ui';
import { toastSuccess, toastError } from '../components/ui/Toast';

const statusColors: Record<string, string> = {
  pending: 'badge-warning',
  shortlisted: 'badge-primary',
  accepted: 'badge-success',
  rejected: 'badge-danger',
  withdrawn: 'badge-muted',
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [withdrawId, setWithdrawId] = useState<number | null>(null);

  useEffect(() => {
    applicationsApi.myApplications({ page_size: 50 })
      .then(d => { setApplications(d.items || []); setError(''); })
      .catch((err: unknown) => { setError(extractError(err)); setApplications([]); })
      .finally(() => setLoading(false));
  }, []);

  const handleWithdraw = async () => {
    if (!withdrawId) return;
    try {
      await applicationsApi.withdraw(withdrawId);
      setApplications(prev => prev.filter(a => a.id !== withdrawId));
      toastSuccess('Application withdrawn.');
    } catch (err) {
      toastError(extractError(err));
    } finally {
      setWithdrawId(null);
    }
  };

  const filtered = filter ? applications.filter(a => a.status === filter) : applications;

  if (loading) return <div className="container-page py-12"><PageSpinner /></div>;

  return (
    <div className="container-page py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black mb-1" style={{ color: 'hsl(var(--color-text))' }}>My Applications</h1>
          <p className="text-sm" style={{ color: 'hsl(var(--color-text-muted))' }}>
            {applications.length} total application{applications.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link to="/jobs" className="btn btn-primary text-sm">
          <Send className="w-4 h-4" /> Find Jobs
        </Link>
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

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {['', 'pending', 'shortlisted', 'accepted', 'rejected', 'withdrawn'].map(s => (
          <button
            key={s || 'all'}
            id={`filter-${s || 'all'}`}
            onClick={() => setFilter(s)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150"
            style={
              filter === s
                ? { background: 'linear-gradient(135deg, hsl(var(--color-primary)), hsl(var(--color-secondary)))', color: 'white' }
                : { background: 'hsl(var(--color-bg-alt))', color: 'hsl(var(--color-text-muted))', border: '1px solid hsl(var(--color-border))' }
            }
          >
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
            <span className="ml-1.5 opacity-70">
              {s ? applications.filter(a => a.status === s).length : applications.length}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Send className="w-8 h-8" />}
          title={filter ? `No ${filter} applications` : 'No applications yet'}
          description={filter ? 'Try selecting a different filter.' : 'Start applying to jobs in Batanes!'}
          action={!filter ? <Link to="/jobs" className="btn btn-primary">Browse Jobs</Link> : undefined}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map(app => (
            <div key={app.id} id={`application-${app.id}`} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/jobs/${app.job_id}`}
                    className="text-base font-semibold hover:underline"
                    style={{ color: 'hsl(var(--color-text))' }}
                  >
                    {app.job_title}
                  </Link>
                  {app.company_name && (
                    <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--color-text-muted))' }}>
                      {app.company_name}
                    </p>
                  )}
                  {app.cover_letter && (
                    <p className="text-xs mt-2 line-clamp-2" style={{ color: 'hsl(var(--color-text-faint))' }}>
                      "{app.cover_letter}"
                    </p>
                  )}
                  <p className="text-xs mt-3 flex items-center gap-1" style={{ color: 'hsl(var(--color-text-faint))' }}>
                    <Clock className="w-3 h-3" />
                    Applied {new Date(app.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-3 shrink-0">
                  <span className={`badge ${statusColors[app.status]}`}>{app.status}</span>
                  {app.status === 'pending' && (
                    <button
                      id={`btn-withdraw-${app.id}`}
                      onClick={() => setWithdrawId(app.id)}
                      className="text-xs font-medium hover:underline"
                      style={{ color: 'hsl(var(--color-danger))' }}
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={withdrawId !== null}
        title="Withdraw Application?"
        message="This will remove your application. You can reapply later if the job is still open."
        confirmLabel="Withdraw"
        danger
        onConfirm={handleWithdraw}
        onCancel={() => setWithdrawId(null)}
      />
    </div>
  );
}
