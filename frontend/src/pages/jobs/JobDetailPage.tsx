import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BookmarkCheck,
  Bookmark,
  ChevronLeft,
  Send,
  Users,
  CheckCircle,
  FileText,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Briefcase,
  AlertCircle,
  Building2,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { jobsApi, applicationsApi, savedJobsApi, usersApi, extractError } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import type { Job, Application } from '../../types';
import {
  JobDetailSkeleton,
  ErrorBanner,
  Spinner,
  Modal,
  ConfirmDialog,
  CategoryBadge,
  SignInPromptModal,
} from '../../components/ui';
import { toastSuccess, toastError } from '../../components/ui/Toast';

function formatSalary(job: Job): string {
  const min = job.salary_min;
  const max = job.salary_max;
  const period = job.salary_period ? `/${job.salary_period}` : '/mo';

  if (job.salary_type === 'negotiable') return 'Salary negotiable';
  if (!min && !max) return 'Salary negotiable';

  const fmt = (n: number) => `₱${n.toLocaleString()}`;
  if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)} ${period}`;
  if (min) return `${fmt(min)} ${period}`;
  return `Up to ${fmt(max!)} ${period}`;
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Existing application check
  const [existingApp, setExistingApp] = useState<Application | null>(null);
  const [checkingApp, setCheckingApp] = useState(false);

  // Saved job state
  const [saved, setSaved] = useState(false);
  const [savingJob, setSavingJob] = useState(false);
  const [showUnsaveConfirm, setShowUnsaveConfirm] = useState(false);

  // Guest sign-in prompt modal
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [promptMessage, setPromptMessage] = useState({ title: '', desc: '' });

  // Multi-step Application modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyStep, setApplyStep] = useState(1);
  const [coverLetter, setCoverLetter] = useState('');
  const [attachResume, setAttachResume] = useState(true);
  const [answers, setAnswers] = useState('');
  const [applying, setApplying] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);

  const jobId = parseInt(id || '0', 10);

  useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    jobsApi.get(jobId)
      .then(data => {
        setJob(data);
        setError('');
      })
      .catch(() => setError('Job not found or no longer available.'))
      .finally(() => setLoading(false));
  }, [jobId]);

  // Check if current user has already applied or saved this job
  useEffect(() => {
    if (!isAuthenticated || !jobId) return;

    if (user?.role === 'job_seeker') {
      setCheckingApp(true);
      applicationsApi.myApplications({ job_id: jobId })
        .then(res => {
          const found = res.items.find(a => a.job_id === jobId && a.status !== 'withdrawn');
          if (found) setExistingApp(found);
        })
        .catch(() => {})
        .finally(() => setCheckingApp(false));

      savedJobsApi.list()
        .then(list => {
          const isSaved = list.some(s => s.job_id === jobId);
          setSaved(isSaved);
        })
        .catch(() => {});
    }
  }, [isAuthenticated, jobId, user]);

  const handleSaveClick = () => {
    if (!isAuthenticated) {
      setPromptMessage({
        title: 'Sign in to save this job',
        desc: 'Bookmark opportunities to easily review and apply for them later.',
      });
      setShowSignInPrompt(true);
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
      await savedJobsApi.save(jobId);
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
      await savedJobsApi.remove(jobId);
      setSaved(false);
      setShowUnsaveConfirm(false);
      toastSuccess('Removed from saved jobs.');
    } catch (err) {
      toastError(extractError(err));
    } finally {
      setSavingJob(false);
    }
  };

  const handleOpenApplyModal = () => {
    if (!isAuthenticated) {
      setPromptMessage({
        title: 'Sign in to apply',
        desc: 'Submit your application, share your profile, and receive updates directly from local employers.',
      });
      setShowSignInPrompt(true);
      return;
    }
    setApplyStep(1);
    setShowApplyModal(true);
  };

  const handleSubmitApplication = async () => {
    setApplying(true);
    try {
      const app = await applicationsApi.apply(jobId, coverLetter || undefined, attachResume, answers || undefined);
      setExistingApp(app);
      setShowApplyModal(false);
      setJob(prev => prev ? { ...prev, application_count: (prev.application_count ?? 0) + 1 } : prev);
      toastSuccess('Application submitted successfully!');
    } catch (err) {
      toastError(extractError(err));
    } finally {
      setApplying(false);
    }
  };

  const handleWithdrawApplication = async () => {
    if (!existingApp) return;
    setWithdrawing(true);
    try {
      await applicationsApi.withdraw(existingApp.id);
      setExistingApp(null);
      setShowWithdrawConfirm(false);
      setJob(prev => prev ? { ...prev, application_count: Math.max(0, (prev.application_count ?? 1) - 1) } : prev);
      toastSuccess('Application withdrawn.');
    } catch (err) {
      toastError(extractError(err));
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) return <JobDetailSkeleton />;

  if (error || !job) {
    return (
      <div className="container-page py-12">
        <ErrorBanner message={error || 'Job not found.'} />
        <Link to="/jobs" className="btn btn-secondary mt-4 min-h-[44px] inline-flex items-center gap-1.5">
          <ChevronLeft className="w-4 h-4" /> Back to Jobs
        </Link>
      </div>
    );
  }

  const skills = job.required_skills?.split(',').map(s => s.trim()).filter(Boolean) ?? [];
  const isSeeker = !user || user.role === 'job_seeker';
  const isEmployer = user?.role === 'employer' && user.id === job.employer_id;
  const companyName = job.company_name || job.employer_name || 'Local Employer';

  // Relative posted time
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
              {job.is_featured && (
                <span className="badge badge-primary font-bold">
                  Featured
                </span>
              )}
              {job.category && <CategoryBadge category={job.category} />}
              <span className="badge badge-muted">
                {job.employment_type}
              </span>
              {job.work_arrangement && (
                <span className="badge badge-muted capitalize">
                  {job.work_arrangement}
                </span>
              )}
              <span className="badge badge-success">
                Hiring
              </span>
            </div>

            {/* Title & Metadata */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-2">
                {job.title}
              </h1>
              <Link
                to={`/employers/${job.employer_id}`}
                className="text-sm font-bold text-primary hover:underline flex items-center gap-1.5"
              >
                <Building2 className="w-4 h-4" />
                <span>{companyName}</span>
              </Link>
              <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 mt-2">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {job.street_or_landmark ? `${job.street_or_landmark}, ` : ''}
                  {job.barangay ? `${job.barangay}, ` : ''}
                  {job.municipality}, Batanes
                </span>
                <span>·</span>
                <span>{postedText}</span>
                {job.application_deadline && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1 text-primary">
                      <Calendar className="w-3.5 h-3.5" />
                      Deadline: {new Date(job.application_deadline).toLocaleDateString()}
                    </span>
                  </>
                )}
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

            {/* Compensation Card */}
            <div className="p-4 rounded-xl bg-muted/20 border border-border flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground block">Salary Rate</span>
                <span className="text-lg font-bold text-foreground">
                  {formatSalary(job)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground block">Employment</span>
                <span className="text-xs font-bold text-foreground">
                  {job.employment_type} {job.work_arrangement ? `(${job.work_arrangement})` : ''}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h2 className="text-base font-bold text-foreground">
                About the vacancy
              </h2>
              <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line space-y-2">
                {job.description}
              </div>
            </div>

            {/* Required Skills */}
            {skills.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-base font-bold text-foreground">
                  Required skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map(s => (
                    <span
                      key={s}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && (
              <div className="space-y-3">
                <h2 className="text-base font-bold text-foreground">
                  Benefits & Perks
                </h2>
                <div className="p-4 rounded-xl bg-muted/10 border border-border text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {job.benefits}
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

            {/* Existing Application Status Card (Reference: Apply · already applied · Day.png) */}
            {existingApp ? (
              <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-success" />
                    Application Status
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 uppercase">
                    {existingApp.stage || 'Submitted'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You submitted your application on {new Date(existingApp.created_at).toLocaleDateString()}. The employer will reach out if shortlisted.
                </p>

                {existingApp.stage !== 'hired' && existingApp.status !== 'rejected' && (
                  <button
                    type="button"
                    onClick={() => setShowWithdrawConfirm(true)}
                    disabled={withdrawing}
                    className="text-xs font-semibold text-danger hover:underline pt-1 block"
                  >
                    Withdraw Application
                  </button>
                )}
              </div>
            ) : isEmployer ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  You posted this listing. You can review applicants in your dashboard.
                </p>
                <Link
                  to={`/applications?jobId=${job.id}`}
                  className="btn btn-primary w-full text-xs font-bold min-h-[44px] flex items-center justify-center"
                >
                  View applicants ({job.application_count ?? 0})
                </Link>
                <Link
                  to={`/jobs/post?editId=${job.id}`}
                  className="btn btn-secondary w-full text-xs font-semibold min-h-[44px] flex items-center justify-center"
                >
                  Edit vacancy
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  id="btn-apply-job"
                  type="button"
                  onClick={handleOpenApplyModal}
                  className="btn btn-primary w-full text-xs font-bold flex items-center justify-center gap-2 shadow-sm min-h-[44px]"
                >
                  <Send className="w-3.5 h-3.5" /> Apply now
                </button>

                {isSeeker && (
                  <button
                    id="btn-save-job-detail"
                    type="button"
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

            {/* Location & Details Summary */}
            <div className="border-t border-border pt-4 space-y-4">
              <div>
                <p className="text-xs font-bold text-foreground mb-1">Location</p>
                <p className="text-xs text-muted-foreground">
                  {job.street_or_landmark ? `${job.street_or_landmark}, ` : ''}
                  {job.barangay ? `${job.barangay}, ` : ''}
                  {job.municipality}, Batanes
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-foreground mb-1">Company</p>
                <Link to={`/employers/${job.employer_id}`} className="text-xs text-primary hover:underline">
                  {companyName}
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Multi-step Application Modal (Reference: Apply · Step 1 to 3 & Step 4) */}
      <Modal
        isOpen={showApplyModal}
        onClose={() => !applying && setShowApplyModal(false)}
        title={`Apply for ${job.title}`}
        titleId="apply-modal-title"
        maxWidth="max-w-lg"
        asBottomSheet
      >
        <div className="space-y-4">
          {/* Progress */}
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Step {applyStep} of 3</span>
            <span>
              {applyStep === 1
                ? 'CV & Resume'
                : applyStep === 2
                ? 'Cover Note'
                : 'Review & Submit'}
            </span>
          </div>
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(applyStep / 3) * 100}%` }}
            />
          </div>

          {/* STEP 1: CV / Resume */}
          {applyStep === 1 && (
            <div className="space-y-4 pt-2">
              <h4 className="text-sm font-bold text-foreground">Attach your CV / Resume</h4>
              {user?.resume_url ? (
                <label className="flex items-center gap-3 p-3.5 rounded-xl border border-primary/30 bg-primary/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={attachResume}
                    onChange={e => setAttachResume(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-foreground flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-primary" />
                      Attach profile resume
                    </p>
                    <p className="text-muted-foreground text-[11px]">
                      Verified PDF / DOCX file on your profile
                    </p>
                  </div>
                </label>
              ) : (
                <div className="p-4 rounded-xl bg-muted/20 border border-border text-xs text-muted-foreground">
                  You haven't uploaded a CV to your profile yet. You can still apply and your profile details will be submitted to {companyName}.
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setApplyStep(2)}
                  className="btn btn-primary text-xs font-bold px-6 py-2.5 rounded-xl flex items-center gap-1.5"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Cover Note / Screening Questions */}
          {applyStep === 2 && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="label text-xs">Cover Note (Optional)</label>
                <textarea
                  rows={4}
                  value={coverLetter}
                  onChange={e => setCoverLetter(e.target.value)}
                  placeholder="Introduce yourself to the employer and share why you are interested in this vacancy..."
                  className="input text-sm py-2"
                  maxLength={1000}
                />
              </div>

              {job.application_questions && (
                <div>
                  <label className="label text-xs">Employer Questions</label>
                  <p className="text-[11px] text-muted-foreground mb-2">
                    {job.application_questions}
                  </p>
                  <textarea
                    rows={3}
                    value={answers}
                    onChange={e => setAnswers(e.target.value)}
                    placeholder="Your answers to the employer's questions..."
                    className="input text-sm py-2"
                  />
                </div>
              )}

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setApplyStep(1)}
                  className="btn btn-secondary text-xs px-4 py-2"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setApplyStep(3)}
                  className="btn btn-primary text-xs font-bold px-6 py-2.5 rounded-xl flex items-center gap-1.5"
                >
                  Review Application <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Review and Submit (Reference: Apply · Step 4 · Review and submit.png) */}
          {applyStep === 3 && (
            <div className="space-y-4 pt-2">
              <h4 className="text-sm font-bold text-foreground">Review your application</h4>
              <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-2 text-xs">
                <p><strong>Applying for:</strong> {job.title}</p>
                <p><strong>Employer:</strong> {companyName}</p>
                <p><strong>Location:</strong> {job.municipality}, Batanes</p>
                <p><strong>Applicant:</strong> {user?.full_name}</p>
                <p><strong>Attached Resume:</strong> {attachResume && user?.resume_url ? 'Yes (Profile CV)' : 'None'}</p>
                {coverLetter && (
                  <div className="pt-2 border-t border-border/40">
                    <p className="font-semibold text-foreground">Cover Note:</p>
                    <p className="text-muted-foreground italic line-clamp-3">"{coverLetter}"</p>
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setApplyStep(2)}
                  className="btn btn-secondary text-xs px-4 py-2"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmitApplication}
                  disabled={applying}
                  className="btn btn-primary text-xs font-bold px-6 py-2.5 rounded-xl flex items-center gap-2"
                >
                  {applying ? <Spinner size="sm" /> : <><Send className="w-3.5 h-3.5" /> Submit Application</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Guest Sign-in Prompt Modal */}
      <SignInPromptModal
        isOpen={showSignInPrompt}
        onClose={() => setShowSignInPrompt(false)}
        title={promptMessage.title}
        description={promptMessage.desc}
      />

      {/* Withdraw Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showWithdrawConfirm}
        title="Withdraw your application?"
        message="Are you sure you want to withdraw? You will be able to reapply later if the vacancy remains open."
        confirmLabel="Yes, withdraw"
        cancelLabel="Keep application"
        danger
        loading={withdrawing}
        onConfirm={handleWithdrawApplication}
        onCancel={() => setShowWithdrawConfirm(false)}
      />

      {/* Unsave Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showUnsaveConfirm}
        title="Remove from saved jobs?"
        message="This job will be removed from your saved list."
        confirmLabel="Remove"
        cancelLabel="Cancel"
        danger
        loading={savingJob}
        onConfirm={executeUnsave}
        onCancel={() => setShowUnsaveConfirm(false)}
      />
    </div>
  );
}
