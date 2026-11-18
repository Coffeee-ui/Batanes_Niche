import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Play,
  Pause,
  XCircle,
  Archive,
  Edit,
  Eye,
  Users,
  CheckCircle,
  Sparkles,
  MapPin,
  Clock,
  MoreVertical,
} from 'lucide-react';
import { jobsApi, extractError } from '../../api/client';
import type { Job, JobStatus } from '../../types';
import { PageSpinner, EmptyState, ConfirmDialog, Modal, Spinner } from '../../components/ui';
import { toastSuccess, toastError } from '../../components/ui/Toast';

const STATUS_TABS = [
  { key: 'all', label: 'All Vacancies' },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Drafts' },
  { key: 'paused', label: 'Paused' },
  { key: 'closed', label: 'Closed' },
  { key: 'archived', label: 'Archived' },
];

export default function MyJobsPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState<string>('all');

  // Action modals
  const [closeModalJob, setCloseModalJob] = useState<Job | null>(null);
  const [closeOption, setCloseOption] = useState<'reviewing' | 'ended'>('reviewing');
  const [closing, setClosing] = useState(false);

  const [archiveModalJob, setArchiveModalJob] = useState<Job | null>(null);
  const [archiving, setArchiving] = useState(false);

  const fetchJobs = () => {
    setLoading(true);
    jobsApi.myJobs({ page_size: 50, include_closed: true })
      .then(d => { setJobs(d.items || []); setError(''); })
      .catch((err: unknown) => { setError(extractError(err)); setJobs([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleUpdateStatus = async (jobId: number, status: string) => {
    try {
      await jobsApi.updateStatus(jobId, status);
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: status as JobStatus } : j));
      toastSuccess(`Vacancy ${status === 'published' ? 'published' : status === 'paused' ? 'paused' : 'updated'}.`);
    } catch (err) {
      toastError(extractError(err));
    }
  };

  const handleConfirmClose = async () => {
    if (!closeModalJob) return;
    setClosing(true);
    try {
      await jobsApi.closeJob(closeModalJob.id, closeOption);
      setJobs(prev => prev.map(j => j.id === closeModalJob.id ? { ...j, status: 'closed', close_option: closeOption } : j));
      toastSuccess('Vacancy closed.');
      setCloseModalJob(null);
    } catch (err) {
      toastError(extractError(err));
    } finally {
      setClosing(false);
    }
  };

  const handleConfirmArchive = async () => {
    if (!archiveModalJob) return;
    setArchiving(true);
    try {
      await jobsApi.close(archiveModalJob.id);
      setJobs(prev => prev.map(j => j.id === archiveModalJob.id ? { ...j, status: 'archived' } : j));
      toastSuccess('Vacancy archived.');
      setArchiveModalJob(null);
    } catch (err) {
      toastError(extractError(err));
    } finally {
      setArchiving(false);
    }
  };

  const filteredJobs = jobs.filter(j => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'published') return j.status === 'published' || j.status === 'active';
    return j.status === selectedTab;
  });

  if (loading) return <div className="container-page py-12"><PageSpinner /></div>;

  const renderStatusBadge = (status: string, isFeatured?: boolean) => {
    const s = status.toLowerCase();
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {isFeatured && (
          <span className="badge badge-primary font-bold">
            <Sparkles className="w-3 h-3" /> Featured
          </span>
        )}
        {s === 'published' || s === 'active' ? (
          <span className="badge badge-success font-bold">Published</span>
        ) : s === 'draft' ? (
          <span className="badge badge-muted">Draft</span>
        ) : s === 'paused' ? (
          <span className="badge badge-warning font-semibold">Paused</span>
        ) : s === 'closed' ? (
          <span className="badge badge-muted">Closed</span>
        ) : (
          <span className="badge badge-muted">Archived</span>
        )}
      </div>
    );
  };

  return (
    <div className="container-page py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Vacancies
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your vacancy listings, pipeline candidates, and posting statuses.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/jobs/post')}
          id="btn-post-new-job"
          className="btn btn-primary text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 self-start sm:self-auto min-h-[44px]"
        >
          <Plus className="w-4 h-4" /> Post a Vacancy
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-border gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSelectedTab(tab.key)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors whitespace-nowrap ${
              selectedTab === tab.key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="card p-4 text-xs text-danger border-danger/30">
          {error}
        </div>
      )}

      {filteredJobs.length === 0 ? (
        <EmptyState
          title="No vacancies in this view"
          description="You do not have any job listings matching this status filter."
          action={
            <button
              type="button"
              onClick={() => navigate('/jobs/post')}
              className="btn btn-primary text-xs font-bold min-h-[44px]"
            >
              Post a Vacancy
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredJobs.map(job => {
            const count = job.application_count ?? 0;
            const isClosedOrArchived = job.status === 'closed' || job.status === 'archived';
            const isPublished = job.status === 'published' || job.status === 'active';
            const isPaused = job.status === 'paused';
            const isDraft = job.status === 'draft';

            return (
              <div
                key={job.id}
                id={`my-job-${job.id}`}
                className="card p-6 rounded-2xl border border-border bg-surface hover:border-primary/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {renderStatusBadge(job.status, job.is_featured)}
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{job.employment_type}</span>
                  </div>

                  <Link to={`/jobs/${job.id}`}>
                    <h2 className="text-lg font-bold text-foreground hover:text-primary transition-colors">
                      {job.title}
                    </h2>
                  </Link>

                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {job.municipality}, Batanes
                    </span>
                    <span>·</span>
                    <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                  </p>
                </div>

                {/* Actions Bar */}
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <Link
                    to={`/applications?jobId=${job.id}`}
                    id={`btn-view-applicants-${job.id}`}
                    className="btn btn-secondary text-xs font-bold py-2 px-3.5 rounded-xl flex items-center gap-1.5"
                  >
                    <Users className="w-4 h-4 text-primary" />
                    <span>{count} {count === 1 ? 'Applicant' : 'Applicants'}</span>
                  </Link>

                  <Link
                    to={`/jobs/${job.id}`}
                    id={`btn-view-job-${job.id}`}
                    className="btn btn-secondary text-xs px-3.5 py-2 font-semibold rounded-xl"
                  >
                    Preview
                  </Link>

                  {/* Status Modification Controls */}
                  {isDraft && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(job.id, 'published')}
                      className="btn btn-primary text-xs px-3.5 py-2 font-bold rounded-xl flex items-center gap-1"
                    >
                      <Play className="w-3.5 h-3.5" /> Publish
                    </button>
                  )}

                  {isPublished && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(job.id, 'paused')}
                      className="btn btn-secondary text-xs px-3.5 py-2 font-semibold rounded-xl flex items-center gap-1"
                      title="Temporarily pause applications"
                    >
                      <Pause className="w-3.5 h-3.5" /> Pause
                    </button>
                  )}

                  {isPaused && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(job.id, 'published')}
                      className="btn btn-primary text-xs px-3.5 py-2 font-bold rounded-xl flex items-center gap-1"
                    >
                      <Play className="w-3.5 h-3.5" /> Resume
                    </button>
                  )}

                  {!isClosedOrArchived && (
                    <>
                      <Link
                        to={`/jobs/post?editId=${job.id}`}
                        id={`btn-edit-job-${job.id}`}
                        className="btn btn-secondary text-xs px-3 py-2 font-semibold rounded-xl"
                        title="Edit vacancy details"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => setCloseModalJob(job)}
                        className="btn btn-secondary text-xs px-3 py-2 font-semibold text-danger border-border hover:bg-danger/10 rounded-xl"
                        title="Close vacancy"
                      >
                        Close
                      </button>
                    </>
                  )}

                  {job.status === 'closed' && (
                    <button
                      type="button"
                      onClick={() => setArchiveModalJob(job)}
                      className="btn btn-secondary text-xs px-3 py-2 font-semibold text-muted-foreground hover:text-foreground rounded-xl flex items-center gap-1"
                    >
                      <Archive className="w-3.5 h-3.5" /> Archive
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Close Vacancy Dialog (Reviewing vs Ended) */}
      <Modal
        isOpen={closeModalJob !== null}
        onClose={() => !closing && setCloseModalJob(null)}
        title="Close Vacancy"
        titleId="close-vacancy-title"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Closing <strong>{closeModalJob?.title}</strong> will immediately stop new applications from being submitted.
          </p>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 rounded-xl border border-border bg-muted/20 cursor-pointer">
              <input
                type="radio"
                name="close-option"
                checked={closeOption === 'reviewing'}
                onChange={() => setCloseOption('reviewing')}
                className="mt-1 w-4 h-4 text-primary focus:ring-primary"
              />
              <div className="text-xs">
                <p className="font-bold text-foreground">Reviewing Existing Applicants</p>
                <p className="text-muted-foreground">Keep candidate pipeline open to review, interview, and decide on existing applicants.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-border bg-muted/20 cursor-pointer">
              <input
                type="radio"
                name="close-option"
                checked={closeOption === 'ended'}
                onChange={() => setCloseOption('ended')}
                className="mt-1 w-4 h-4 text-primary focus:ring-primary"
              />
              <div className="text-xs">
                <p className="font-bold text-foreground">Hiring Complete / Ended</p>
                <p className="text-muted-foreground">Hiring process is fully finished or cancelled.</p>
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCloseModalJob(null)}
              className="btn btn-secondary text-xs px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmClose}
              disabled={closing}
              className="btn btn-danger text-xs px-4 py-2 font-bold"
            >
              {closing ? <Spinner size="sm" /> : 'Confirm Close'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Archive Vacancy Dialog */}
      <ConfirmDialog
        isOpen={archiveModalJob !== null}
        title="Archive this vacancy?"
        message="Archived vacancies are permanently hidden from recruitment lists."
        confirmLabel="Yes, archive"
        cancelLabel="Cancel"
        danger
        loading={archiving}
        onConfirm={handleConfirmArchive}
        onCancel={() => !archiving && setArchiveModalJob(null)}
      />
    </div>
  );
}
