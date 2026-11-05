import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BookmarkCheck, Bookmark, ChevronLeft, Send, Users, CheckCircle, X
} from 'lucide-react';
import { jobsApi, applicationsApi, savedJobsApi, extractError } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import type { Job } from '../../types';
import { PageSpinner, ErrorBanner, Spinner } from '../../components/ui';
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

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    jobsApi.get(parseInt(id))
      .then(data => { setJob(data); setError(''); })
      .catch(() => setError('Job not found or no longer available.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setSavingJob(true);
    try {
      if (saved) {
        await savedJobsApi.remove(job!.id);
        setSaved(false);
        toastSuccess('Removed from saved jobs.');
      } else {
        await savedJobsApi.save(job!.id);
        setSaved(true);
        toastSuccess('Job saved successfully!');
      }
    } catch (err) {
      toastError(extractError(err));
    } finally {
      setSavingJob(false);
    }
  };

  const handleApply = async () => {
    if (!isAuthenticated) { navigate('/login', { state: { from: `/jobs/${id}` } }); return; }
    setApplying(true);
    try {
      await applicationsApi.apply(job!.id, coverLetter || undefined);
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

  if (loading) return <div className="container-page py-12"><PageSpinner /></div>;
  if (error || !job) return (
    <div className="container-page py-12">
      <ErrorBanner message={error || 'Job not found.'} />
      <Link to="/jobs" className="btn btn-secondary mt-4">
        <ChevronLeft className="w-4 h-4" /> Back to Jobs
      </Link>
    </div>
  );

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
    <div className="container-page py-8 space-y-6">
      {/* Breadcrumb */}
      <div className="text-xs text-muted-foreground flex items-center gap-2">
        <Link to="/jobs" className="hover:text-foreground">Browse jobs</Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-sm">{job.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Job Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-8 space-y-6">
            {/* Top Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="badge badge-muted">
                {job.employment_type}
              </span>
              <span className="badge badge-success">
                Hiring
              </span>
            </div>

            {/* Title & Metadata */}
            <div>
              <h1 className="text-3xl font-black text-foreground mb-2">
                {job.title}
              </h1>
              <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-medium text-foreground">{companyName}</span>
                <span>·</span>
                <span>{job.municipality}</span>
                <span>·</span>
                <span>{job.employment_type}</span>
                <span>·</span>
                <span>{formatSalary(job.salary_min, job.salary_max)}</span>
                <span>·</span>
                <span>{postedText}</span>
              </p>
            </div>

            {/* About the Job */}
            <div className="pt-6 border-t border-border space-y-3">
              <h2 className="text-base font-bold text-foreground">
                About the job
              </h2>
              <div className="text-sm leading-relaxed text-foreground whitespace-pre-line">
                {job.description}
              </div>
            </div>

            {/* Required Skills */}
            {skills.length > 0 && (
              <div className="pt-6 border-t border-border space-y-3">
                <h2 className="text-base font-bold text-foreground">
                  Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map(skill => (
                    <span key={skill} className="badge badge-muted text-xs py-1.5 px-3">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sticky Sidebar ("Apply for this job") */}
        <aside className="space-y-6 lg:sticky lg:top-24">
          <div className="card p-6 space-y-5">
            <h2 className="text-base font-bold text-foreground">
              Apply for this job
            </h2>

            {applied ? (
              <div className="text-center py-4 bg-tertiary-soft/40 rounded-xl p-4">
                <CheckCircle className="w-8 h-8 text-tertiary mx-auto mb-2" />
                <p className="font-bold text-sm text-foreground mb-1">Application Sent</p>
                <p className="text-xs text-muted-foreground">
                  The employer has received your details.
                </p>
                <Link to="/applications" className="btn btn-secondary w-full mt-3 text-xs">
                  View My Applications
                </Link>
              </div>
            ) : isEmployer ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-2">
                  This is your job listing.
                </p>
                <Link
                  to={`/applications?jobId=${job.id}`}
                  id="btn-view-applicants"
                  className="btn btn-primary w-full text-xs font-bold"
                >
                  <Users className="w-4 h-4" /> View Applicants ({job.application_count ?? 0})
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Profile completeness hint */}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your profile is {user?.profile_completeness ?? 70}% complete. A complete profile helps employers notice you.
                </p>

                {/* Primary Yellow CTA */}
                <button
                  id="btn-apply-now"
                  onClick={() => isAuthenticated ? setShowApplyModal(true) : navigate('/login', { state: { from: `/jobs/${id}` } })}
                  className="btn btn-primary w-full text-xs font-bold"
                >
                  Apply now
                </button>

                {/* Secondary Save Button */}
                {isSeeker && (
                  <button
                    id="btn-save-job-detail"
                    onClick={handleSave}
                    disabled={savingJob}
                    className="btn btn-secondary w-full text-xs font-semibold"
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

      {/* Apply Modal Window */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setShowApplyModal(false)}
          />
          <div
            className="relative rounded-2xl p-6 w-full max-w-lg animate-scale-in"
            style={{
              backgroundColor: 'hsl(var(--surface))',
              border: '1px solid hsl(var(--border))',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 51,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">
                Apply for: {job.title}
              </h2>
              <button
                onClick={() => setShowApplyModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              Your profile information will be shared with <strong>{companyName}</strong>. You may optionally add a cover letter below.
            </p>

            <div className="mb-4">
              <label htmlFor="cover-letter" className="label text-xs">
                Cover Letter (optional)
              </label>
              <textarea
                id="cover-letter"
                className="input text-sm resize-none"
                rows={4}
                placeholder="Briefly introduce yourself and why you're interested in this role…"
                value={coverLetter}
                onChange={e => setCoverLetter(e.target.value)}
                maxLength={1000}
              />
              <p className="text-[11px] text-right mt-1 text-muted-foreground">
                {coverLetter.length}/1000
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowApplyModal(false)}
                className="btn btn-secondary text-xs px-4"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-apply"
                onClick={handleApply}
                disabled={applying}
                className="btn btn-primary text-xs px-5 font-bold"
              >
                {applying ? <Spinner size="sm" /> : <><Send className="w-3.5 h-3.5" /> Submit Application</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
