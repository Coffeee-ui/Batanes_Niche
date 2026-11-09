import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BookmarkCheck, Bookmark, ChevronLeft, Send, Users, CheckCircle, FileText
} from 'lucide-react';
import { jobsApi, applicationsApi, savedJobsApi, extractError } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import type { Job } from '../../types';
import { JobDetailSkeleton, ErrorBanner, Spinner, Modal, ConfirmDialog, CategoryBadge } from '../../components/ui';
import { toastSuccess, toastError } from '../../components/ui/Toast';

function formatSalary(min?: number, max?: number): string {
  if (!min && !max) return 'Salary negotiable';
  const fmt = (n: number) => `₱${n.toLocaleString()}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [saved, setSaved] = useState(false);
  const [savingJob, setSavingJob] = useState(false);
  const [showUnsaveConfirm, setShowUnsaveConfirm] = useState(false);

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [attachResume, setAttachResume] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    jobsApi.get(parseInt(id, 10))
      .then(data => { setJob(data); setError(''); })
      .catch(() => setError('Job not found or no longer available.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (user?.resume_url) {
      setAttachResume(true);
    }
  }, [user?.resume_url]);

  const handleSaveClick = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/jobs/${id}` } });
      return;
    }
    if (saved) {
      setShowUnsaveConfirm(true);
    } else {
      executeSave();
    }
  };

  const executeSave = async () => {
    setSavingJob(true);
    try {
      await savedJobsApi.save(job!.id);
      setSaved(true);
      toastSuccess('Job saved successfully!');
    } catch (err) {
      toastError(extractError(err));
    } finally {
      setSavingJob(false);
    }
  };

  const executeUnsave = async () => {
    setSavingJob(true);
    try {
      await savedJobsApi.remove(job!.id);
      setSaved(false);
      setShowUnsaveConfirm(false);
      toastSuccess('Removed from saved jobs.');
    } catch (err) {
      toastError(extractError(err));
    } finally {
      setSavingJob(false);
    }
  };

  const handleApply = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/jobs/${id}` } });
      return;
    }
    setApplying(true);
    try {
      await applicationsApi.apply(job!.id, coverLetter || undefined, attachResume);
      setApplied(true);
      setShowApplyModal(false);
      setJob(prev => prev ? { ...prev, application_count: (prev.application_count ?? 0) + 1 } : prev);
      toastSuccess('Application submitted successfully!');
    } catch (err) {
      toastError(extractError(err));
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <JobDetailSkeleton />;

  if (error || !job) {
    return (
      <div className="container-page py-12">
        <ErrorBanner message={error || 'Job not found.'} />
        <Link to="/jobs" className="btn btn-secondary mt-4 min-h-[44px]">
          <ChevronLeft className="w-4 h-4" /> Back to Jobs
        </Link>
      </div>
    );
  }

  const skills = job.required_skills?.split(',').map(s => s.trim()).filter(Boolean) ?? [];
  const isSeeker = !user || user.role === 'job_seeker';
  const isEmployer = user?.role === 'employer' && user.id === job.employer_id;
  const companyName = job.company_name || job.employer_name || 'Local employer';

  // Determine relative posted time
  const postedDate = new Date(job.created_at);
  const now = new Date();
  const diffDays = Math.max(0, Math.floor((now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24)));
  const postedText = diffDays === 0 ? 'Posted today' : diffDays === 1 ? 'Posted 1 day ago' : `Posted ${diffDays} days ago`;

  return (
    <div className="container-page py-8 space-y-6 pb-24 lg:pb-8">
      {/* Breadcrumb */}
      <div className="text-xs text-muted-foreground flex items-center gap-2">
        <Link to="/jobs" className="hover:text-foreground">Browse jobs</Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-sm">{job.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Job Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 sm:p-8 space-y-6">
            {/* Top Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {job.category && <CategoryBadge category={job.category} />}
              <span className="badge badge-muted">
                {job.employment_type}
              </span>
              <span className="badge badge-success">
                Hiring
              </span>
            </div>

            {/* Title & Metadata */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-2">
                {job.title}
              </h1>
              <p className="text-sm font-semibold text-foreground/90">
                {companyName}
              </p>
              <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                <span>{job.municipality}, Batanes</span>
                <span>·</span>
                <span>{postedText}</span>
                {job.application_count !== undefined && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {job.application_count} applicant{job.application_count !== 1 ? 's' : ''}
                    </span>
                  </>
                )}
              </p>
            </div>

            {/* Compensation summary card */}
            <div className="p-4 rounded-xl bg-neutral-soft border border-border flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground block">Salary rate</span>
                <span className="text-lg font-bold text-foreground">
                  {formatSalary(job.salary_min, job.salary_max)}
                </span>
              </div>
              <span className="badge badge-primary text-xs">
                {job.employment_type}
              </span>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-base font-bold text-foreground mb-3">
                About the role
              </h2>
              <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line space-y-2">
                {job.description}
              </div>
            </div>

            {/* Required Skills */}
            {skills.length > 0 && (
              <div>
                <h2 className="text-base font-bold text-foreground mb-3">
                  Required skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map(s => (
                    <span
                      key={s}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-neutral-soft text-foreground border border-border"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Card */}
        <aside className="space-y-6">
          <div className="card p-6 space-y-5">
            <h2 className="text-base font-bold text-foreground">
              Interested in this position?
            </h2>

            {applied ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>You have applied for this job!</span>
              </div>
            ) : isEmployer ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  You posted this listing. You can review applicants in your dashboard.
                </p>
                <Link
                  to={`/applications?jobId=${job.id}`}
                  className="btn btn-primary w-full text-xs font-bold min-h-[44px]"
                >
                  View applicants ({job.application_count ?? 0})
                </Link>
                <Link
                  to={`/jobs/post?editId=${job.id}`}
                  className="btn btn-secondary w-full text-xs font-semibold min-h-[44px]"
                >
                  Edit job
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  id="btn-apply-job"
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate('/login', { state: { from: `/jobs/${id}` } });
                      return;
                    }
                    setShowApplyModal(true);
                  }}
                  className="btn btn-primary w-full text-xs font-bold flex items-center justify-center gap-2 shadow-sm min-h-[44px]"
                >
                  <Send className="w-3.5 h-3.5" /> Apply now
                </button>

                {isSeeker && (
                  <button
                    id="btn-save-job-detail"
                    onClick={handleSaveClick}
                    disabled={savingJob}
                    className="btn btn-secondary w-full text-xs font-semibold min-h-[44px] flex items-center justify-center gap-1.5"
                  >
                    {saved ? (
                      <><BookmarkCheck className="w-4 h-4 text-primary fill-primary" /> Saved</>
                    ) : (
                      <><Bookmark className="w-4 h-4 text-muted-foreground" /> Save job</>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-border pt-4 space-y-4">
              <div>
                <p className="text-xs font-bold text-foreground mb-1">Location</p>
                <p className="text-xs text-muted-foreground">
                  {job.barangay ? `${job.barangay}, ${job.municipality}` : job.municipality}, Batanes
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-foreground mb-1">Contact</p>
                <p className="text-xs text-muted-foreground">
                  Shared after you apply.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Shared Apply Modal / Bottom Sheet */}
      <Modal
        isOpen={showApplyModal}
        onClose={() => !applying && setShowApplyModal(false)}
        title={`Apply for ${job.title}`}
        titleId="apply-modal-title"
        maxWidth="max-w-lg"
        asBottomSheet
      >
        <div className="space-y-4">
          {/* Summary Card */}
          <div className="rounded-xl p-3.5 bg-neutral-soft border border-border">
            <p className="font-bold text-sm text-foreground">{job.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{companyName}</p>
          </div>

          <p className="text-xs text-muted-foreground">
            Your profile information will be shared with <strong>{companyName}</strong>. You may optionally add a cover note below.
          </p>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="cover-letter" className="label text-xs mb-0">
                Cover Note (optional)
              </label>
              <span className="text-[11px] text-muted-foreground">
                {coverLetter.length}/1000
              </span>
            </div>
            <textarea
              id="cover-letter"
              aria-label="Cover letter"
              className="input text-base sm:text-sm resize-none"
              rows={4}
              placeholder="Tell the employer why you are a good fit"
              value={coverLetter}
              onChange={e => setCoverLetter(e.target.value)}
              maxLength={1000}
            />
          </div>

          {/* Optional Resume Attachment Choice */}
          {user?.resume_url ? (
            <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface cursor-pointer select-none hover:bg-neutral-soft/50 transition-colors">
              <input
                type="checkbox"
                checked={attachResume}
                onChange={e => setAttachResume(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
              />
              <div className="text-xs">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  Attach my resume (PDF or DOCX)
                </p>
                <p className="text-muted-foreground text-[11px]">
                  {user.resume_url.split('/').pop() || 'Resume file on profile'}
                </p>
              </div>
            </label>
          ) : (
            <div className="p-3 rounded-xl bg-neutral-soft/60 border border-border/80 text-xs text-muted-foreground">
              Tip: You can upload a resume in your <Link to="/profile" className="font-bold text-foreground underline">Profile</Link> to attach to applications.
            </div>
          )}

          {/* Mobile: stacked full-width buttons. Desktop: side-by-side */}
          <div className="flex md:hidden flex-col gap-2.5 pt-2">
            <button
              id="btn-confirm-apply-mobile"
              type="button"
              onClick={handleApply}
              disabled={applying}
              className="btn btn-primary w-full text-sm py-3 font-bold rounded-xl min-h-[44px]"
            >
              {applying ? <Spinner size="sm" /> : <><Send className="w-4 h-4" /> Submit application</>}
            </button>
            <button
              type="button"
              onClick={() => setShowApplyModal(false)}
              disabled={applying}
              className="btn btn-secondary w-full text-sm py-3 font-semibold rounded-xl min-h-[44px]"
            >
              Cancel
            </button>
          </div>

          <div className="hidden md:flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => setShowApplyModal(false)}
              disabled={applying}
              className="btn btn-secondary text-xs px-5 py-2.5 min-h-[44px]"
            >
              Cancel
            </button>
            <button
              id="btn-confirm-apply"
              type="button"
              onClick={handleApply}
              disabled={applying}
              className="btn btn-primary text-xs px-6 py-2.5 font-bold min-h-[44px]"
            >
              {applying ? <Spinner size="sm" /> : <><Send className="w-3.5 h-3.5" /> Submit application</>}
            </button>
          </div>
        </div>
      </Modal>

      {/* Unsave Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showUnsaveConfirm}
        title="Remove this saved job?"
        message="This job will be removed from your saved list. You can save it again any time."
        summaryCard={{ jobTitle: job.title, employer: companyName }}
        confirmLabel="Yes, remove it"
        cancelLabel="No, keep it"
        danger
        loading={savingJob}
        onConfirm={executeUnsave}
        onCancel={() => setShowUnsaveConfirm(false)}
      />

      {/* Mobile Sticky Bottom Action Bar (AUD-002-UX-05) */}
      {!isEmployer && !applied && (
        <div
          className="lg:hidden fixed bottom-16 left-0 right-0 z-30 border-t border-border p-3 px-4 flex items-center justify-between gap-3 shadow-lg bg-surface pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]"
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-foreground truncate">{job.title}</p>
            <p className="text-[11px] text-muted-foreground">{formatSalary(job.salary_min, job.salary_max)}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isSeeker && (
              <button
                type="button"
                onClick={handleSaveClick}
                disabled={savingJob}
                aria-label={saved ? 'Unsave job' : 'Save job'}
                className="w-11 h-11 rounded-xl border border-border flex items-center justify-center text-foreground hover:bg-neutral-soft"
              >
                {saved ? <BookmarkCheck className="w-5 h-5 text-primary fill-primary" /> : <Bookmark className="w-5 h-5 text-muted-foreground" />}
              </button>
            )}
            <button
              id="btn-sticky-apply-job"
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/login', { state: { from: `/jobs/${id}` } });
                  return;
                }
                setShowApplyModal(true);
              }}
              className="btn btn-primary text-xs font-bold px-5 py-2.5 min-h-[44px]"
            >
              Apply now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
