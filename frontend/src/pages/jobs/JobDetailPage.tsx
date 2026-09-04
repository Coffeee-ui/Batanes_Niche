import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin, Banknote, Clock, Briefcase, Users, BookmarkCheck, Bookmark,
  ChevronLeft, Send, Building2, AlertCircle, CheckCircle, X
} from 'lucide-react';
import { jobsApi, applicationsApi, savedJobsApi, extractError } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import type { Job } from '../../types';
import { PageSpinner, ErrorBanner, Spinner } from '../../components/ui';
import { toastSuccess, toastError } from '../../components/ui/Toast';

function formatSalary(min?: number, max?: number): string {
  if (!min && !max) return 'Salary negotiable';
  const fmt = (n: number) => `₱${n.toLocaleString()}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)} / month`;
  if (min) return `From ${fmt(min)} / month`;
  return `Up to ${fmt(max!)} / month`;
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
        toastSuccess('Job saved!');
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
  const isSeeker = user?.role === 'job_seeker';
  const isEmployer = user?.role === 'employer' && user.id === job.employer_id;

  return (
    <div className="container-page py-8">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        id="btn-back-to-jobs"
        className="btn btn-ghost text-sm mb-6 -ml-2"
      >
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                {/* Company logo placeholder */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-xl font-black text-white"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--color-primary)), hsl(var(--color-secondary)))' }}
                >
                  {(job.company_name || job.employer_name || job.title || 'J').charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-black mb-1" style={{ color: 'hsl(var(--color-text))' }}>
                    {job.title}
                  </h1>
                  <p className="text-sm font-medium" style={{ color: 'hsl(var(--color-text-muted))' }}>
                    {job.company_name || job.employer_name || 'Batanes Employer'}
                  </p>
                </div>
              </div>

              {/* Status badge */}
              <span className={`badge shrink-0 ${job.status === 'active' ? 'badge-success' : 'badge-muted'}`}>
                {job.status}
              </span>
            </div>

            {/* Meta Details */}
            <div
              className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6"
              style={{ borderTop: '1px solid hsl(var(--color-border-subtle))' }}
            >
              {[
                { icon: <MapPin className="w-4 h-4" />, label: 'Location', value: job.barangay ? `${job.barangay}, ${job.municipality}` : `${job.municipality}, ${job.island}` },
                { icon: <Briefcase className="w-4 h-4" />, label: 'Type', value: job.employment_type },
                { icon: <Banknote className="w-4 h-4" />, label: 'Salary', value: formatSalary(job.salary_min, job.salary_max) },
                { icon: <Clock className="w-4 h-4" />, label: 'Posted', value: new Date(job.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) },
                ...(job.application_count !== undefined ? [{ icon: <Users className="w-4 h-4" />, label: 'Applicants', value: `${job.application_count}` }] : []),
              ].map(item => (
                <div key={item.label}>
                  <div className="flex items-center gap-2 mb-1" style={{ color: 'hsl(var(--color-text-muted))' }}>
                    {item.icon}
                    <span className="text-xs font-medium">{item.label}</span>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: 'hsl(var(--color-text))' }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="card p-6">
            <h2 className="text-lg font-bold mb-4" style={{ color: 'hsl(var(--color-text))' }}>
              Job Description
            </h2>
            <div
              className="text-sm leading-relaxed whitespace-pre-wrap"
              style={{ color: 'hsl(var(--color-text-muted))' }}
            >
              {job.description}
            </div>
          </div>

          {/* Required Skills */}
          {skills.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-bold mb-4" style={{ color: 'hsl(var(--color-text))' }}>
                Required Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {skills.map(skill => (
                  <span key={skill} className="badge badge-primary text-sm">{skill}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Apply Card */}
          <div
            className="card p-5 sticky top-20"
          >
            {applied ? (
              <div className="text-center py-4">
                <CheckCircle className="w-10 h-10 mx-auto mb-3" style={{ color: 'hsl(var(--color-success))' }} />
                <p className="font-semibold mb-1" style={{ color: 'hsl(var(--color-text))' }}>Application Sent!</p>
                <p className="text-xs" style={{ color: 'hsl(var(--color-text-muted))' }}>
                  The employer will review your profile.
                </p>
                <Link to="/applications" className="btn btn-secondary w-full mt-4 text-sm">
                  View My Applications
                </Link>
              </div>
            ) : isEmployer ? (
              <div>
                <p className="text-sm font-semibold mb-3" style={{ color: 'hsl(var(--color-text))' }}>
                  Your Listing
                </p>
                <Link to={`/jobs/${job.id}/applicants`} id="btn-view-applicants" className="btn btn-primary w-full text-sm">
                  <Users className="w-4 h-4" /> View Applicants
                </Link>
                <Link to={`/jobs/${job.id}/edit`} id="btn-edit-job" className="btn btn-secondary w-full text-sm mt-2">
                  Edit Job
                </Link>
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold mb-1" style={{ color: 'hsl(var(--color-text))' }}>
                  Interested in this role?
                </p>
                <p className="text-xs mb-4" style={{ color: 'hsl(var(--color-text-muted))' }}>
                  Apply now — your profile will be shared with the employer.
                </p>
                {job.status === 'active' ? (
                  <>
                    <button
                      id="btn-apply-now"
                      onClick={() => isAuthenticated ? setShowApplyModal(true) : navigate('/login', { state: { from: `/jobs/${id}` } })}
                      className="btn btn-primary w-full text-sm"
                    >
                      <Send className="w-4 h-4" />
                      {isAuthenticated ? 'Apply Now' : 'Sign In to Apply'}
                    </button>
                    {isSeeker && (
                      <button
                        id="btn-save-job-detail"
                        onClick={handleSave}
                        disabled={savingJob}
                        className="btn btn-secondary w-full text-sm mt-2"
                      >
                        {savingJob ? <Spinner size="sm" /> : saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                        {saved ? 'Saved' : 'Save Job'}
                      </button>
                    )}
                  </>
                ) : (
                  <div
                    className="px-4 py-3 rounded-lg text-sm text-center font-medium"
                    style={{ background: 'hsl(var(--color-border))', color: 'hsl(var(--color-text-muted))' }}
                  >
                    This listing is closed
                  </div>
                )}
              </>
            )}
          </div>

          {/* Company Info Card */}
          <div className="card p-5">
            <h3 className="text-sm font-bold mb-3" style={{ color: 'hsl(var(--color-text))' }}>
              About the Employer
            </h3>
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
                style={{ background: 'linear-gradient(135deg, hsl(var(--color-primary) / 0.7), hsl(var(--color-secondary) / 0.7))' }}
              >
                {(job.company_name || job.employer_name || job.title || 'J').charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'hsl(var(--color-text))' }}>
                  {job.company_name || job.employer_name || 'Batanes Employer'}
                </p>
                <p className="text-xs flex items-center gap-1" style={{ color: 'hsl(var(--color-text-muted))' }}>
                  <MapPin className="w-3 h-3" /> {job.municipality}, Batanes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowApplyModal(false)} />
          <div
            className="relative rounded-2xl p-6 w-full max-w-lg animate-scale-in"
            style={{ background: 'hsl(var(--color-surface))', boxShadow: 'var(--shadow-lg)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--color-text))' }}>
                Apply for: {job.title}
              </h2>
              <button onClick={() => setShowApplyModal(false)} className="btn-ghost p-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm mb-4" style={{ color: 'hsl(var(--color-text-muted))' }}>
              Your profile will be sent to <strong>{job.company_name || job.employer_name}</strong>.
              You may add a cover letter below.
            </p>
            <div className="mb-4">
              <label htmlFor="cover-letter" className="label">
                Cover Letter <span style={{ color: 'hsl(var(--color-text-faint))' }}>(optional)</span>
              </label>
              <textarea
                id="cover-letter"
                className="input resize-none"
                rows={5}
                placeholder="Briefly introduce yourself and why you're a great fit…"
                value={coverLetter}
                onChange={e => setCoverLetter(e.target.value)}
                maxLength={1000}
              />
              <p className="text-xs text-right mt-1" style={{ color: 'hsl(var(--color-text-faint))' }}>
                {coverLetter.length}/1000
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowApplyModal(false)} className="btn btn-secondary flex-1">
                Cancel
              </button>
              <button
                id="btn-confirm-apply"
                onClick={handleApply}
                disabled={applying}
                className="btn btn-primary flex-1"
              >
                {applying ? <Spinner size="sm" /> : <><Send className="w-4 h-4" /> Submit Application</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
