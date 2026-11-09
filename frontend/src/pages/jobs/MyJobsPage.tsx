import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jobsApi, extractError } from '../../api/client';
import type { Job } from '../../types';
import { PageSpinner, EmptyState, ConfirmDialog } from '../../components/ui';
import { toastSuccess, toastError } from '../../components/ui/Toast';

export default function MyJobsPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'active' | 'closed'>('active');
  const [closeId, setCloseId] = useState<number | null>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    jobsApi.myJobs({ page_size: 50 })
      .then(d => { setJobs(d.items || []); setError(''); })
      .catch((err: unknown) => { setError(extractError(err)); setJobs([]); })
      .finally(() => setLoading(false));
  }, []);

  const handleClose = async () => {
    if (!closeId) return;
    setClosing(true);
    try {
      await jobsApi.close(closeId);
      setJobs(prev => prev.map(j => j.id === closeId ? { ...j, status: 'closed' as const } : j));
      toastSuccess('Job listing closed.');
      setCloseId(null);
    } catch (err) {
      toastError(extractError(err));
    } finally {
      setClosing(false);
    }
  };

  const filteredJobs = jobs.filter(j => tab === 'active' ? j.status === 'active' : j.status !== 'active');
  const closingJob = jobs.find(j => j.id === closeId);

  if (loading) return <div className="container-page py-12"><PageSpinner /></div>;

  return (
    <div className="container-page py-8 space-y-6">
      {/* Title & Post a Job Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-1">
            My jobs
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your openings and see who applied.
          </p>
        </div>
        <button
          onClick={() => navigate('/jobs/post')}
          id="btn-post-new-job"
          className="btn btn-primary text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm self-start sm:self-auto min-h-[44px]"
        >
          Post a job
        </button>
      </div>

      {/* Tabs: Active / Closed */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTab('active')}
          className={`chip ${tab === 'active' ? 'chip-active' : ''}`}
        >
          Active
        </button>
        <button
          type="button"
          onClick={() => setTab('closed')}
          className={`chip ${tab === 'closed' ? 'chip-active' : ''}`}
        >
          Closed
        </button>
      </div>

      {error && (
        <div className="card p-4 text-xs text-danger border-danger/30">
          {error}
        </div>
      )}

      {filteredJobs.length === 0 ? (
        <EmptyState
          title={tab === 'active' ? 'No active jobs' : 'No closed jobs'}
          description={tab === 'active' ? 'You have no active listings open for applications.' : 'No listings have been closed yet.'}
          action={
            tab === 'active' ? (
              <button onClick={() => navigate('/jobs/post')} className="btn btn-primary text-xs font-bold min-h-[44px]">
                Post a job
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredJobs.map(job => {
            const count = job.application_count ?? 0;
            const postedDate = new Date(job.created_at);
            const now = new Date();
            const diffDays = Math.max(0, Math.floor((now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24)));
            const postedText = diffDays === 0 ? 'Posted today' : diffDays === 1 ? 'Posted 1 day ago' : `Posted ${diffDays} days ago`;

            return (
              <div key={job.id} id={`my-job-${job.id}`} className="card p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Job Details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="badge badge-muted text-xs">
                        {job.employment_type}
                      </span>
                      <span className={`badge ${job.status === 'active' ? 'badge-success' : 'badge-muted'}`}>
                        {job.status === 'active' ? 'Active' : 'Closed'}
                      </span>
                    </div>

                    <Link to={`/jobs/${job.id}`}>
                      <h2 className="text-lg font-bold text-foreground hover:text-primary transition-colors">
                        {job.title}
                      </h2>
                    </Link>

                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>{job.municipality}</span>
                      <span>·</span>
                      <span>{job.employment_type}</span>
                      <span>·</span>
                      <span>{postedText}</span>
                    </p>
                  </div>

                  {/* Actions on right */}
                  <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                    <Link
                      to={`/applications?jobId=${job.id}`}
                      id={`btn-view-applicants-${job.id}`}
                      className="badge badge-warning text-xs font-semibold py-1.5 px-3 hover:opacity-90 transition-opacity min-h-[36px] flex items-center"
                    >
                      {count} {count === 1 ? 'applicant' : 'applicants'}
                    </Link>

                    <Link
                      to={`/jobs/${job.id}`}
                      id={`btn-view-job-${job.id}`}
                      className="btn btn-secondary text-xs px-4 py-2 font-semibold min-h-[38px]"
                    >
                      View
                    </Link>

                    {job.status === 'active' && (
                      <>
                        <Link
                          to={`/jobs/post?editId=${job.id}`}
                          id={`btn-edit-job-${job.id}`}
                          className="btn btn-secondary text-xs px-4 py-2 font-semibold min-h-[38px]"
                        >
                          Edit
                        </Link>

                        <button
                          id={`btn-close-job-${job.id}`}
                          onClick={() => setCloseId(job.id)}
                          className="btn btn-secondary text-xs px-4 py-2 font-semibold text-danger border-border hover:bg-danger/10 min-h-[38px]"
                        >
                          Close job
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Close Job Dialog (H: Confirm before close job) */}
      <ConfirmDialog
        isOpen={closeId !== null}
        title="Close job opening?"
        message="This will mark the job as closed. It will no longer appear in searches, and no new applications will be accepted."
        summaryCard={closingJob ? { jobTitle: closingJob.title, employer: closingJob.company_name || 'Your Company' } : undefined}
        confirmLabel="Yes, close it"
        cancelLabel="No, keep it"
        danger
        loading={closing}
        onConfirm={handleClose}
        onCancel={() => !closing && setCloseId(null)}
      />
    </div>
  );
}
