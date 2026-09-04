import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Users, MapPin, Edit3, Trash2, Eye, MoreVertical, AlertCircle } from 'lucide-react';
import { jobsApi, extractError } from '../../api/client';
import type { Job } from '../../types';
import { PageSpinner, EmptyState, ConfirmDialog } from '../../components/ui';
import { toastSuccess, toastError } from '../../components/ui/Toast';

export default function MyJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [closeId, setCloseId] = useState<number | null>(null);
  const [actionMenuId, setActionMenuId] = useState<number | null>(null);

  useEffect(() => {
    jobsApi.myJobs({ page_size: 50 })
      .then(d => { setJobs(d.items || []); setError(''); })
      .catch((err: unknown) => { setError(extractError(err)); setJobs([]); })
      .finally(() => setLoading(false));
  }, []);

  const handleClose = async () => {
    if (!closeId) return;
    try {
      await jobsApi.close(closeId);
      setJobs(prev => prev.map(j => j.id === closeId ? { ...j, status: 'closed' as const } : j));
      toastSuccess('Job listing closed.');
    } catch (err) {
      toastError(extractError(err));
    } finally {
      setCloseId(null);
    }
  };

  if (loading) return <div className="container-page py-12"><PageSpinner /></div>;

  return (
    <div className="container-page py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black mb-1" style={{ color: 'hsl(var(--color-text))' }}>My Job Listings</h1>
          <p className="text-sm" style={{ color: 'hsl(var(--color-text-muted))' }}>
            {jobs.length} listing{jobs.length !== 1 ? 's' : ''}
            {' · '}
            {jobs.filter(j => j.status === 'active').length} active
          </p>
        </div>
        <Link to="/jobs/post" id="btn-post-new-job" className="btn btn-primary text-sm">
          <Briefcase className="w-4 h-4" /> Post New Job
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

      {jobs.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="w-8 h-8" />}
          title="No job listings yet"
          description="Post your first job to start finding qualified Ivatan candidates."
          action={<Link to="/jobs/post" className="btn btn-primary">Post a Job</Link>}
        />
      ) : (
        <div className="space-y-4">
          {jobs.map(job => (
            <div key={job.id} id={`my-job-${job.id}`} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <Link
                      to={`/jobs/${job.id}`}
                      className="text-base font-bold hover:underline"
                      style={{ color: 'hsl(var(--color-text))' }}
                    >
                      {job.title}
                    </Link>
                    <span className={`badge ${job.status === 'active' ? 'badge-success' : 'badge-muted'}`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: 'hsl(var(--color-text-muted))' }}>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{job.municipality}
                    </span>
                    <span>{job.employment_type}</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />{job.application_count ?? 0} applicant{job.application_count !== 1 ? 's' : ''}
                    </span>
                    <span>Posted {new Date(job.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/jobs/${job.id}/applicants`}
                    id={`btn-view-applicants-${job.id}`}
                    className="btn btn-secondary text-xs py-2 px-3"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Applicants ({job.application_count ?? 0})
                  </Link>
                  <Link
                    to={`/jobs/${job.id}`}
                    id={`btn-view-job-${job.id}`}
                    className="btn btn-ghost p-2"
                    aria-label="View job"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  {job.status === 'active' && (
                    <button
                      id={`btn-close-job-${job.id}`}
                      onClick={() => setCloseId(job.id)}
                      className="btn btn-ghost p-2 text-red-500"
                      aria-label="Close job"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={closeId !== null}
        title="Close Job Listing?"
        message="This will mark the job as closed. It will no longer appear in searches, and no new applications will be accepted."
        confirmLabel="Close Listing"
        danger
        onConfirm={handleClose}
        onCancel={() => setCloseId(null)}
      />
    </div>
  );
}
