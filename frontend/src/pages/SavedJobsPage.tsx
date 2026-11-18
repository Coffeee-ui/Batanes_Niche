import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, AlertCircle, ArrowLeft } from 'lucide-react';
import { savedJobsApi, extractError } from '../api/client';
import type { SavedJob } from '../types';
import { PageSpinner, EmptyState } from '../components/ui';
import { toastSuccess, toastError } from '../components/ui/Toast';
import JobCard from '../components/ui/JobCard';

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRemoved, setLastRemoved] = useState<SavedJob | null>(null);

  useEffect(() => {
    savedJobsApi.list()
      .then(data => {
        setSavedJobs(data || []);
        setError('');
      })
      .catch((err: unknown) => {
        setError(extractError(err));
        setSavedJobs([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSaveToggle = (jobId: number, saved: boolean) => {
    if (!saved) {
      const removed = savedJobs.find(sj => sj.job_id === jobId);
      if (removed) {
        setLastRemoved(removed);
      }
      setSavedJobs(prev => prev.filter(sj => sj.job_id !== jobId));
      toastSuccess('Job removed from saved list.');
    }
  };

  const handleUndo = async () => {
    if (!lastRemoved) return;
    try {
      await savedJobsApi.save(lastRemoved.job_id);
      setSavedJobs(prev => [lastRemoved, ...prev]);
      setLastRemoved(null);
      toastSuccess('Job restored to saved list.');
    } catch (err) {
      toastError(extractError(err));
    }
  };

  if (loading) {
    return (
      <div className="container-page py-12">
        <PageSpinner />
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-1 tracking-tight">
            Saved Jobs
          </h1>
          <p className="text-sm text-muted-foreground">
            {savedJobs.length} position{savedJobs.length !== 1 ? 's' : ''} saved for later application
          </p>
        </div>
        <div>
          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-foreground font-bold text-xs hover:opacity-95 active:scale-95 transition-all shadow-xs"
          >
            Browse all jobs
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-2xl p-4 mb-6 flex items-center gap-3 text-sm text-danger">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {lastRemoved && (
        <div className="bg-surface border border-primary/40 rounded-xl p-3 mb-6 flex items-center justify-between gap-3 text-xs shadow-xs animate-fade-in">
          <span>Removed <strong>{lastRemoved.job.title}</strong> from saved jobs.</span>
          <button
            onClick={handleUndo}
            className="font-bold text-primary hover:underline px-2 py-1 rounded"
          >
            Undo
          </button>
        </div>
      )}

      {savedJobs.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="w-8 h-8" />}
          title="No saved jobs yet"
          description="Bookmark job openings you find interesting across Batanes so you can review and apply when ready."
          action={
            <Link
              to="/jobs"
              className="inline-flex items-center px-6 py-2.5 rounded-full bg-primary text-foreground font-bold text-xs hover:opacity-95 transition-all shadow-xs"
            >
              Discover jobs
            </Link>
          }
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
          {savedJobs.map(({ id, job, saved_at }) => (
            <div key={id} className="relative flex flex-col">
              <JobCard
                job={job}
                isSaved={true}
                onSaveToggle={handleSaveToggle}
              />
              <p className="text-[11px] text-muted-foreground px-2 mt-1.5 flex items-center gap-1">
                Saved on {new Date(saved_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
