import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Send,
  Clock,
  MapPin,
  Mail,
  Phone,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Briefcase,
  User,
  Calendar,
  ChevronRight,
  Filter,
  Download,
  X,
  MessageSquare,
} from 'lucide-react';
import { applicationsApi, jobsApi, usersApi, extractError } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { Application, Job } from '../types';
import { PageSpinner, EmptyState, ConfirmDialog, Modal, Spinner } from '../components/ui';
import { toastSuccess, toastError } from '../components/ui/Toast';

const PIPELINE_STAGES = [
  { key: 'all', label: 'All Applicants' },
  { key: 'new', label: 'Submitted' },
  { key: 'reviewing', label: 'Reviewing' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'interview', label: 'Interview' },
  { key: 'hired', label: 'Hired' },
  { key: 'rejected', label: 'Not Selected' },
];

export default function ApplicationsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isEmployer = user?.role === 'employer';

  const [applications, setApplications] = useState<Application[]>([]);
  const [employerJobs, setEmployerJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStage, setSelectedStage] = useState('all');

  const jobIdFromUrl = searchParams.get('jobId');
  const [selectedJobId, setSelectedJobId] = useState<string>(jobIdFromUrl || '');

  // Employer Applicant Drawer / Modal
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // Interview Invite Modal
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewType, setInterviewType] = useState('in-person');
  const [interviewLocation, setInterviewLocation] = useState('');
  const [interviewMessage, setInterviewMessage] = useState('');
  const [inviting, setInviting] = useState(false);

  // Reject Modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionTemplate, setRejectionTemplate] = useState('standard');
  const [rejectionMessage, setRejectionMessage] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Withdraw Modal
  const [withdrawApp, setWithdrawApp] = useState<Application | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  // Response to interview (Job Seeker)
  const [respondingAppId, setRespondingAppId] = useState<number | null>(null);

  // Load employer's jobs for filtering
  useEffect(() => {
    if (isEmployer) {
      jobsApi.myJobs({ page_size: 100 })
        .then(d => setEmployerJobs(d.items || []))
        .catch(() => setEmployerJobs([]));
    }
  }, [isEmployer]);

  const loadApplications = async (jobId?: number) => {
    setLoading(true);
    setError('');
    try {
      const data = await applicationsApi.myApplications({
        job_id: jobId,
        page_size: 100,
      });
      setApplications(data.items || []);
    } catch (err: unknown) {
      setError(extractError(err));
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const jId = selectedJobId ? parseInt(selectedJobId, 10) : undefined;
    loadApplications(isNaN(jId as number) ? undefined : jId);
  }, [selectedJobId, isEmployer]);

  const handleJobFilterChange = (newJobId: string) => {
    setSelectedJobId(newJobId);
    if (newJobId) {
      setSearchParams({ jobId: newJobId });
    } else {
      setSearchParams({});
    }
  };

  // Pipeline stage update
  const handleUpdateStage = async (appId: number, newStage: string) => {
    try {
      const updated = await applicationsApi.updateStage(appId, newStage);
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, stage: updated.stage, status: updated.status } : a));
      if (selectedApp && selectedApp.id === appId) {
        setSelectedApp(prev => prev ? { ...prev, stage: updated.stage, status: updated.status } : null);
      }
      toastSuccess(`Moved applicant to ${newStage}.`);
    } catch (err) {
      toastError(extractError(err));
    }
  };

  // Submit interview invitation
  const handleSendInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    setInviting(true);
    try {
      const updated = await applicationsApi.inviteToInterview(selectedApp.id, {
        interview_date: interviewDate,
        interview_type: interviewType,
        interview_location: interviewLocation || undefined,
        interview_message: interviewMessage || undefined,
      });
      setApplications(prev => prev.map(a => a.id === selectedApp.id ? { ...a, ...updated } : a));
      setSelectedApp(prev => prev ? { ...prev, ...updated } : null);
      setShowInterviewModal(false);
      toastSuccess('Interview invitation sent to applicant.');
    } catch (err) {
      toastError(extractError(err));
    } finally {
      setInviting(false);
    }
  };

  // Submit rejection
  const handleSendRejection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    setRejecting(true);
    try {
      const updated = await applicationsApi.rejectApplication(selectedApp.id, {
        rejection_template: rejectionTemplate,
        rejection_message: rejectionMessage || undefined,
      });
      setApplications(prev => prev.map(a => a.id === selectedApp.id ? { ...a, ...updated } : a));
      setSelectedApp(prev => prev ? { ...prev, ...updated } : null);
      setShowRejectModal(false);
      toastSuccess('Application marked as not selected.');
    } catch (err) {
      toastError(extractError(err));
    } finally {
      setRejecting(false);
    }
  };

  // Withdraw
  const handleConfirmWithdraw = async () => {
    if (!withdrawApp) return;
    setWithdrawing(true);
    try {
      await applicationsApi.withdraw(withdrawApp.id);
      setApplications(prev => prev.filter(a => a.id !== withdrawApp.id));
      setWithdrawApp(null);
      toastSuccess('Application withdrawn.');
    } catch (err) {
      toastError(extractError(err));
    } finally {
      setWithdrawing(false);
    }
  };

  // Seeker respond to interview
  const handleInterviewResponse = async (appId: number, response: 'accepted' | 'declined') => {
    setRespondingAppId(appId);
    try {
      const updated = await applicationsApi.respondToInterview(appId, response);
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, interview_status: updated.interview_status } : a));
      toastSuccess(response === 'accepted' ? 'Interview invitation accepted!' : 'Interview invitation declined.');
    } catch (err) {
      toastError(extractError(err));
    } finally {
      setRespondingAppId(null);
    }
  };

  // Filtered applications
  const filtered = useMemo(() => {
    if (selectedStage === 'all') return applications;
    return applications.filter(a => {
      const stage = a.stage || (a.status === 'pending' ? 'new' : a.status);
      return stage === selectedStage;
    });
  }, [applications, selectedStage]);

  const renderStatusBadge = (status: string, stage?: string) => {
    const s = (stage || status || 'new').toLowerCase();
    switch (s) {
      case 'hired':
      case 'accepted':
        return (
          <span className="badge badge-success font-bold">
            <CheckCircle className="w-3 h-3" /> Hired
          </span>
        );
      case 'interview':
        return (
          <span className="badge badge-primary font-bold">
            <Calendar className="w-3 h-3" /> Interview
          </span>
        );
      case 'shortlisted':
        return (
          <span className="badge badge-warning font-semibold">
            Shortlisted
          </span>
        );
      case 'reviewing':
        return (
          <span className="badge badge-warning font-semibold">
            Reviewing
          </span>
        );
      case 'rejected':
        return (
          <span className="badge badge-danger font-semibold">
            <XCircle className="w-3 h-3" /> Not Selected
          </span>
        );
      case 'withdrawn':
        return (
          <span className="badge badge-muted">
            Withdrawn
          </span>
        );
      default:
        return (
          <span className="badge badge-muted font-bold">
            <Clock className="w-3 h-3" /> Submitted
          </span>
        );
    }
  };

  if (loading) return <div className="container-page py-12"><PageSpinner /></div>;

  return (
    <div className="container-page py-8 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            {isEmployer ? 'Applicants' : 'My Applications'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isEmployer
              ? 'Review candidate profiles, schedule interviews, and track your recruitment pipeline.'
              : 'Track the status of your applications and interview invitations from Batanes employers.'}
          </p>
        </div>

        {/* Employer Filter by Vacancy */}
        {isEmployer && employerJobs.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <label htmlFor="filter-vacancy" className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
              Vacancy:
            </label>
            <select
              id="filter-vacancy"
              value={selectedJobId}
              onChange={e => handleJobFilterChange(e.target.value)}
              className="input select text-xs py-2 min-w-[200px]"
            >
              <option value="">All Vacancies ({employerJobs.length})</option>
              {employerJobs.map(j => (
                <option key={j.id} value={j.id.toString()}>
                  {j.title} ({j.application_count ?? 0})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Pipeline Stage Tabs for Employer */}
      {isEmployer && (
        <div className="flex border-b border-border gap-2 overflow-x-auto pb-1">
          {PIPELINE_STAGES.map(stage => {
            const count = stage.key === 'all'
              ? applications.length
              : applications.filter(a => (a.stage || 'new') === stage.key).length;

            return (
              <button
                key={stage.key}
                type="button"
                onClick={() => setSelectedStage(stage.key)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  selectedStage === stage.key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                }`}
              >
                <span>{stage.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedStage === stage.key ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <div className="card p-4 text-xs text-danger border-danger/30">
          {error}
        </div>
      )}

      {/* Empty State */}
      {filtered.length === 0 ? (
        <EmptyState
          title={isEmployer ? 'No applicants in this stage' : 'No applications yet'}
          description={
            isEmployer
              ? 'There are no candidate applications currently in this pipeline stage.'
              : 'Browse active job vacancies in Batanes and submit your application.'
          }
          action={
            !isEmployer ? (
              <Link to="/jobs" className="btn btn-primary text-xs font-bold min-h-[44px] inline-flex items-center gap-1.5">
                Browse Jobs
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {filtered.map(app => {
            const applicant = app.applicant;
            const job = app.job;

            return (
              <div
                key={app.id}
                className="card p-6 rounded-2xl border border-border bg-surface hover:border-primary/40 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {renderStatusBadge(app.status, app.stage)}
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">
                        Applied {new Date(app.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-foreground">
                      {isEmployer ? applicant?.full_name || 'Candidate' : job?.title || app.job_title}
                    </h2>

                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {isEmployer ? job?.title || 'Vacancy' : job?.company_name || app.company_name}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {isEmployer
                          ? `${applicant?.municipality || 'Batanes'}, ${applicant?.island || 'Batan Island'}`
                          : `${job?.municipality || 'Batanes'}, Batanes`}
                      </span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {isEmployer ? (
                      <button
                        type="button"
                        onClick={() => setSelectedApp(app)}
                        className="btn btn-primary text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5"
                      >
                        Review Profile & CV <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <>
                        <Link
                          to={`/jobs/${app.job_id}`}
                          className="btn btn-secondary text-xs px-3.5 py-2 font-semibold rounded-xl"
                        >
                          View Vacancy
                        </Link>
                        {app.stage !== 'hired' && app.status !== 'rejected' && app.status !== 'withdrawn' && (
                          <button
                            type="button"
                            onClick={() => setWithdrawApp(app)}
                            className="btn btn-secondary text-xs px-3 py-2 text-danger hover:bg-danger/10 border-border rounded-xl"
                          >
                            Withdraw
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Interview Scheduled Card (for Job Seeker or Employer) */}
                {app.interview_date && (
                  <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        Interview Scheduled: {new Date(app.interview_date).toLocaleString()}
                      </span>
                      {app.interview_status && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          app.interview_status === 'accepted'
                            ? 'bg-success/20 text-success'
                            : app.interview_status === 'declined'
                            ? 'bg-danger/20 text-danger'
                            : 'bg-primary/20 text-primary'
                        }`}>
                          {app.interview_status}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-foreground font-medium">
                      Type: {app.interview_type === 'in-person' ? 'In-Person Interview' : 'Online / Phone Interview'}
                      {app.interview_location ? ` · Location: ${app.interview_location}` : ''}
                    </p>
                    {app.interview_message && (
                      <p className="text-xs text-muted-foreground italic">"{app.interview_message}"</p>
                    )}

                    {/* Job seeker respond action */}
                    {!isEmployer && app.interview_status === 'pending' && (
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => handleInterviewResponse(app.id, 'accepted')}
                          disabled={respondingAppId === app.id}
                          className="btn btn-primary text-xs font-bold py-1.5 px-3 rounded-lg"
                        >
                          Accept Invitation
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInterviewResponse(app.id, 'declined')}
                          disabled={respondingAppId === app.id}
                          className="btn btn-secondary text-xs font-semibold py-1.5 px-3 rounded-lg text-danger hover:bg-danger/10"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Rejection Message (if rejected) */}
                {app.rejection_message && (
                  <div className="p-3.5 rounded-xl border border-border bg-muted/10 text-xs text-muted-foreground space-y-1">
                    <p className="font-semibold text-foreground">Employer Feedback:</p>
                    <p className="italic">"{app.rejection_message}"</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ==================================================== */}
      {/* EMPLOYER: APPLICANT DETAIL & PIPELINE MODAL */}
      {/* (Reference: Applicant · Detail, CV and stage.png) */}
      {/* ==================================================== */}
      {selectedApp && (
        <Modal
          isOpen={selectedApp !== null}
          onClose={() => setSelectedApp(null)}
          title={`Applicant: ${selectedApp.applicant?.full_name || 'Candidate'}`}
          titleId="applicant-modal-title"
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            {/* Applicant Summary */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-muted/20 border border-border">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xl overflow-hidden shrink-0">
                  {selectedApp.applicant?.profile_pic ? (
                    <img src={selectedApp.applicant.profile_pic} alt="" className="w-full h-full object-cover" />
                  ) : (
                    selectedApp.applicant?.full_name?.charAt(0).toUpperCase() || 'A'
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {selectedApp.applicant?.full_name}
                  </h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {selectedApp.applicant?.municipality}, {selectedApp.applicant?.island}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Applying for: <strong className="text-foreground">{selectedApp.job?.title}</strong>
                  </p>
                </div>
              </div>

              {/* Stage Selector */}
              <div className="text-right">
                <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                  Pipeline Stage
                </label>
                <select
                  value={selectedApp.stage || 'new'}
                  onChange={e => handleUpdateStage(selectedApp.id, e.target.value)}
                  className="input select text-xs font-bold py-1.5 px-3 min-w-[130px]"
                >
                  <option value="new">Submitted</option>
                  <option value="reviewing">Reviewing</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="interview">Interview</option>
                  <option value="hired">Hired</option>
                  <option value="rejected">Not Selected</option>
                </select>
              </div>
            </div>

            {/* Candidate Bio & Details */}
            {selectedApp.applicant?.bio && (
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Bio</h4>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {selectedApp.applicant.bio}
                </p>
              </div>
            )}

            {/* Skills */}
            {selectedApp.applicant?.skills && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedApp.applicant.skills.split(',').map(s => s.trim()).filter(Boolean).map(skill => (
                    <span key={skill} className="badge badge-primary text-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Cover Note */}
            {selectedApp.cover_letter && (
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Applicant's Cover Note</h4>
                <div className="p-3.5 rounded-xl border border-border bg-surface text-xs text-foreground/90 whitespace-pre-line leading-relaxed">
                  {selectedApp.cover_letter}
                </div>
              </div>
            )}

            {/* Screening Answers */}
            {selectedApp.answers && (
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Answers to Vacancy Questions</h4>
                <div className="p-3.5 rounded-xl border border-border bg-surface text-xs text-foreground/90 whitespace-pre-line leading-relaxed">
                  {selectedApp.answers}
                </div>
              </div>
            )}

            {/* CV Download / View Button */}
            {selectedApp.applicant?.resume_url && (
              <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <FileText className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="font-bold text-foreground">Curriculum Vitae / Resume</p>
                    <p className="text-[11px] text-muted-foreground">PDF / DOCX document uploaded by applicant</p>
                  </div>
                </div>
                <a
                  href={usersApi.downloadResumeUrl(selectedApp.seeker_id || selectedApp.applicant.seeker_id)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> Download CV
                </a>
              </div>
            )}

            {/* Contact details */}
            <div className="grid grid-cols-2 gap-3 text-xs p-3.5 rounded-xl border border-border bg-muted/10">
              <div>
                <span className="text-muted-foreground block text-[11px]">Email:</span>
                <span className="font-semibold text-foreground">{selectedApp.applicant?.email}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Phone:</span>
                <span className="font-semibold text-foreground">{selectedApp.applicant?.phone_number || 'Not provided'}</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between border-t border-border pt-4 gap-3">
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                className="btn btn-secondary text-xs px-4 py-2 font-bold text-danger border-border hover:bg-danger/10"
              >
                Reject Applicant
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowInterviewModal(true)}
                  className="btn btn-primary text-xs px-5 py-2 font-bold flex items-center gap-1.5"
                >
                  <Calendar className="w-4 h-4" /> Schedule Interview
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Interview Invitation Modal */}
      <Modal
        isOpen={showInterviewModal}
        onClose={() => !inviting && setShowInterviewModal(false)}
        title="Schedule Interview"
        titleId="interview-modal-title"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSendInterview} className="space-y-4">
          <div>
            <label className="label text-xs">Interview Date & Time *</label>
            <input
              type="datetime-local"
              value={interviewDate}
              onChange={e => setInterviewDate(e.target.value)}
              required
              className="input text-sm"
            />
          </div>

          <div>
            <label className="label text-xs">Interview Format *</label>
            <select
              value={interviewType}
              onChange={e => setInterviewType(e.target.value)}
              className="input select text-sm"
            >
              <option value="in-person">In-Person in Batanes</option>
              <option value="online">Online / Phone Call</option>
            </select>
          </div>

          <div>
            <label className="label text-xs">
              {interviewType === 'in-person' ? 'Location / Landmark' : 'Meeting Link / Phone'}
            </label>
            <input
              type="text"
              placeholder={interviewType === 'in-person' ? 'e.g. Basco Seaside Inn Conference Room' : 'e.g. Google Meet link or 0917-xxx-xxxx'}
              value={interviewLocation}
              onChange={e => setInterviewLocation(e.target.value)}
              className="input text-sm"
            />
          </div>

          <div>
            <label className="label text-xs">Message / Instructions (Optional)</label>
            <textarea
              rows={3}
              placeholder="e.g. Please bring a valid ID and physical copy of your documents."
              value={interviewMessage}
              onChange={e => setInterviewMessage(e.target.value)}
              className="input text-sm py-2"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowInterviewModal(false)}
              className="btn btn-secondary text-xs px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={inviting}
              className="btn btn-primary text-xs font-bold px-5 py-2 flex items-center gap-1.5"
            >
              {inviting ? <Spinner size="sm" /> : <>Send Invitation <Send className="w-3.5 h-3.5" /></>}
            </button>
          </div>
        </form>
      </Modal>

      {/* Rejection Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => !rejecting && setShowRejectModal(false)}
        title="Reject Candidate"
        titleId="reject-modal-title"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSendRejection} className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Select a template or provide feedback. The applicant will be courteously notified.
          </p>

          <div>
            <label className="label text-xs">Rejection Template</label>
            <select
              value={rejectionTemplate}
              onChange={e => setRejectionTemplate(e.target.value)}
              className="input select text-sm"
            >
              <option value="standard">Standard Courtesy Notice</option>
              <option value="volume">High Volume of Applicants</option>
              <option value="qualifications">Experience & Skill Mismatch</option>
              <option value="custom">Custom Message</option>
            </select>
          </div>

          <div>
            <label className="label text-xs">Additional Feedback (Optional)</label>
            <textarea
              rows={3}
              placeholder="Provide constructive feedback if applicable..."
              value={rejectionMessage}
              onChange={e => setRejectionMessage(e.target.value)}
              className="input text-sm py-2"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowRejectModal(false)}
              className="btn btn-secondary text-xs px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rejecting}
              className="btn btn-danger text-xs font-bold px-4 py-2"
            >
              {rejecting ? <Spinner size="sm" /> : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Withdraw Confirm Dialog */}
      <ConfirmDialog
        isOpen={withdrawApp !== null}
        title="Withdraw application?"
        message="Your application will be withdrawn. You will be able to reapply if the vacancy remains open."
        confirmLabel="Yes, withdraw"
        cancelLabel="Keep application"
        danger
        loading={withdrawing}
        onConfirm={handleConfirmWithdraw}
        onCancel={() => !withdrawing && setWithdrawApp(null)}
      />
    </div>
  );
}
