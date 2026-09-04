import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, BookmarkX, MapPin, Banknote, AlertCircle } from 'lucide-react';
import { savedJobsApi, extractError } from '../api/client';
import type { SavedJob } from '../types';
import { PageSpinner, EmptyState, ConfirmDialog } from '../components/ui';
import { toastSuccess, toastError } from '../components/ui/Toast';
import JobCard from '../components/ui/JobCard';

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    savedJobsApi.list()
      .then(data => { setSavedJobs(data || []); setError(''); })
      .catch((err: unknown) => { setError(extractError(err)); setSavedJobs([]); })
      .finally(() => setLoading(false));
  }, []);

  const handleUnsave = async (jobId: number) => {
    try {
      await savedJobsApi.remove(jobId);
      setSavedJobs(prev => prev.filter(sj => sj.job_id !== jobId));
      toastSuccess('Job removed from saved list.');
    } catch (err) {
      toastError(extractError(err));
    }
  };

  if (loading) return <div className="container-page py-12"><PageSpinner /></div>;

  return (
    <div className="container-page py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black mb-1" style={{ color: 'hsl(var(--color-text))' }}>Saved Jobs</h1>
          <p className="text-sm" style={{ color: 'hsl(var(--color-text-muted))' }}>
            {savedJobs.length} saved job{savedJobs.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link to="/jobs" className="btn btn-secondary text-sm">
          Browse Jobs
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

      {savedJobs.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="w-8 h-8" />}
          title="No saved jobs"
          description="Bookmark jobs you're interested in and come back to apply later."
          action={<Link to="/jobs" className="btn btn-primary">Browse Jobs</Link>}
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {savedJobs.map(({ id, job, saved_at }) => (
            <div key={id} className="relative">
              <JobCard job={job} isSaved onSaveToggle={(_jobId, saved) => { if (!saved) setSavedJobs(prev => prev.filter(sj => sj.job_id !== job.id)); }} />
              <p className="text-xs mt-1 px-1" style={{ color: 'hsl(var(--color-text-faint))' }}>
                Saved {new Date(saved_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
