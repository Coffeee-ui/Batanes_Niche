import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Send, Clock, MapPin, Mail, Phone, FileText, CheckCircle,
  XCircle, AlertCircle, Briefcase, User, ExternalLink, Filter, RotateCcw
} from 'lucide-react';
import { applicationsApi, jobsApi, extractError } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { Application, Job } from '../types';
import { PageSpinner, EmptyState, ConfirmDialog } from '../components/ui';
import { toastSuccess, toastError } from '../components/ui/Toast';

const statusColors: Record<string, string> = {
  pending: 'badge-warning',
  accepted: 'badge-success',
  rejected: 'badge-danger',
  withdrawn: 'badge-muted',
};

type ModalAction = 'accept' | 'reject' | 'withdraw' | 'reopen';

interface ActionModalState {
  isOpen: boolean;
  type: ModalAction;
  app: Application | null;
}

export default function ApplicationsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isEmployer = user?.role === 'employer';

  const [applications, setApplications] = useState<Application[]>([]);
  const [employerJobs, setEmployerJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected job for employer filtering
  const jobIdFromUrl = searchParams.get('jobId');
  const [selectedJobId, setSelectedJobId] = useState<string>(jobIdFromUrl || '');

  // Confirmation modal state
  const [actionModal, setActionModal] = useState<ActionModalState>({
    isOpen: false,
    type: 'withdraw',
    app: null,
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Load employer's jobs for filtering
  useEffect(() => {
    if (isEmployer) {
      jobsApi.myJobs({ page_size: 100 })
        .then(d => setEmployerJobs(d.items || []))
        .catch(() => setEmployerJobs([]));
    }
  }, [isEmployer]);

  // Load applications
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

  // Handle job filter change
  const handleJobFilterChange = (newJobId: string) => {
    setSelectedJobId(newJobId);
    if (newJobId) {
      setSearchParams({ jobId: newJobId });
    } else {
      setSearchParams({});
    }
  };

  // Open confirmation modal
  const openActionModal = (app: Application, type: ModalAction) => {
    setActionModal({
      isOpen: true,
      type,
      app,
    });
  };

  const closeActionModal = () => {
    if (!actionLoading) {
      setActionModal({
        isOpen: false,
        type: 'withdraw',
        app: null,
      });
    }
  };

  // Execute confirmed modal action
  const handleConfirmAction = async () => {
    const { type, app } = actionModal;
    if (!app) return;

    setActionLoading(true);
    try {
      if (type === 'withdraw') {
        await applicationsApi.withdraw(app.id);
        setApplications(prev =>
          prev.map(a => (a.id === app.id ? { ...a, status: 'withdrawn' } : a))
        );
        toastSuccess('Application withdrawn successfully.');
      } else if (type === 'accept') {
        await applicationsApi.updateStatus(app.id, 'accepted');
        setApplications(prev =>
          prev.map(a => (a.id === app.id ? { ...a, status: 'accepted' } : a))
        );
        toastSuccess(`Accepted applicant ${app.applicant?.full_name || 'candidate'}.`);
      } else if (type === 'reject') {
        await applicationsApi.updateStatus(app.id, 'rejected');
        setApplications(prev =>
          prev.map(a => (a.id === app.id ? { ...a, status: 'rejected' } : a))
        );
        toastSuccess(`Application marked as rejected.`);
      } else if (type === 'reopen') {
        await applicationsApi.updateStatus(app.id, 'pending');
        setApplications(prev =>
          prev.map(a => (a.id === app.id ? { ...a, status: 'pending' } : a))
        );
        toastSuccess('Application status reset to pending.');
      }
      closeActionModal();
    } catch (err: unknown) {
      toastError(extractError(err));
    } finally {
      setActionLoading(false);
    }
  };

  // Filter applications by status
  const filtered = useMemo(() => {
    if (!statusFilter) return applications;
    return applications.filter(a => a.status === statusFilter);
  }, [applications, statusFilter]);

  // Modal display details
  const modalDetails = useMemo(() => {
    const { type, app } = actionModal;
    const applicantName = app?.applicant?.full_name || app?.seeker_name || 'the candidate';
    const jobTitle = app?.job?.title || app?.job_title || 'this position';

    switch (type) {
      case 'accept':
        return {
          title: 'Accept Applicant?',
          message: `Are you sure you want to accept ${applicantName} for '${jobTitle}'? The applicant will be notified immediately.`,
          confirmLabel: 'Accept Candidate',
          danger: false,
        };
      case 'reject':
        return {
          title: 'Reject Application?',
          message: `Are you sure you want to reject ${applicantName}'s application for '${jobTitle}'?`,
          confirmLabel: 'Reject Application',
          danger: true,
        };
      case 'withdraw':
        return {
          title: 'Withdraw Application?',
          message: isEmployer
            ? `Withdraw ${applicantName}'s application for '${jobTitle}'?`
            : `Are you sure you want to withdraw your application for '${jobTitle}'? You will be able to reapply later if the job listing remains active.`,
          confirmLabel: 'Withdraw Application',
          danger: true,
        };
      case 'reopen':
        return {
          title: 'Reset to Pending?',
          message: `Reset application for ${applicantName} back to pending evaluation status?`,
          confirmLabel: 'Reset to Pending',
          danger: false,
        };
    }
  }, [actionModal, isEmployer]);

  if (loading && applications.length === 0) {
    return <div className="container-page py-12"><PageSpinner /></div>;
  }

  return (
    <div className="container-page py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black mb-1" style={{ color: 'hsl(var(--color-text))' }}>
            {isEmployer ? 'Job Applicants' : 'My Applications'}
          </h1>
          <p className="text-sm" style={{ color: 'hsl(var(--color-text-muted))' }}>
            {applications.length} total application{applications.length !== 1 ? 's' : ''}
            {isEmployer && selectedJobId && (
              <span> · Filtered by job posting</span>
            )}
          </p>
        </div>
        <div>
          {isEmployer ? (
            <Link to="/jobs/my" id="btn-back-to-my-jobs" className="btn btn-secondary text-sm">
              <Briefcase className="w-4 h-4" /> Manage My Jobs
            </Link>
          ) : (
            <Link to="/jobs" className="btn btn-primary text-sm">
              <Send className="w-4 h-4" /> Find Jobs
            </Link>
          )}
        </div>
      </div>

      {/* Error alert banner */}
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

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Employer Job selector */}
        {isEmployer && employerJobs.length > 0 && (
          <div className="sm:w-64">
            <label htmlFor="filter-job-select" className="sr-only">Filter by Job</label>
            <div className="relative">
              <select
                id="filter-job-select"
                className="input select text-xs py-2 w-full font-medium"
                value={selectedJobId}
                onChange={e => handleJobFilterChange(e.target.value)}
              >
                <option value="">All Job Listings ({employerJobs.length})</option>
                {employerJobs.map(j => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.application_count ?? 0})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Status filter tabs */}
        <div className="flex gap-2 flex-wrap flex-1 items-center">
          {['', 'pending', 'accepted', 'rejected', 'withdrawn'].map(s => (
            <button
              key={s || 'all'}
              id={`filter-${s || 'all'}`}
              type="button"
              onClick={() => setStatusFilter(s)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150"
              style={
                statusFilter === s
                  ? { background: 'linear-gradient(135deg, hsl(var(--color-primary)), hsl(var(--color-secondary)))', color: 'white' }
                  : { background: 'hsl(var(--color-bg-alt))', color: 'hsl(var(--color-text-muted))', border: '1px solid hsl(var(--color-border))' }
              }
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
              <span className="ml-1.5 opacity-70">
                {s ? applications.filter(a => a.status === s).length : applications.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Applications list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={isEmployer ? <User className="w-8 h-8" /> : <Send className="w-8 h-8" />}
          title={statusFilter ? `No ${statusFilter} applications` : 'No applications found'}
          description={
            isEmployer
              ? (statusFilter ? 'Try selecting a different status filter.' : 'No candidates have applied to this listing yet.')
              : (statusFilter ? 'Try selecting a different filter.' : 'Start applying to jobs in Batanes!')
          }
          action={!isEmployer && !statusFilter ? <Link to="/jobs" className="btn btn-primary">Browse Jobs</Link> : undefined}
        />
      ) : isEmployer ? (
        /* EMPLOYER VIEW: Full Candidate Profiles */
        <div className="space-y-4">
          {filtered.map(app => {
            const applicant = app.applicant;
            const applicantName = applicant?.full_name || app.seeker_name || 'Applicant';
            const skills = applicant?.skills?.split(',').map(s => s.trim()).filter(Boolean) ?? [];

            return (
              <div
                key={app.id}
                id={`application-${app.id}`}
                className="card p-6 transition-all hover:shadow-md"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  {/* Left: Applicant details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-4 mb-3">
                      {/* Avatar */}
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-lg shrink-0"
                        style={{ background: 'linear-gradient(135deg, hsl(var(--color-primary)), hsl(var(--color-secondary)))' }}
                      >
                        {applicantName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h2 className="text-lg font-bold truncate" style={{ color: 'hsl(var(--color-text))' }}>
                            {applicantName}
                          </h2>
                          <span className={`badge ${statusColors[app.status]}`}>
                            {app.status}
                          </span>
                        </div>
                        <p className="text-xs mt-0.5 flex items-center gap-1 font-medium" style={{ color: 'hsl(var(--color-text-muted))' }}>
                          <Briefcase className="w-3.5 h-3.5" />
                          Applied for:{' '}
                          <Link
                            to={`/jobs/${app.job_id}`}
                            className="font-semibold underline underline-offset-2 hover:text-primary"
                            style={{ color: 'hsl(var(--color-text))' }}
                          >
                            {app.job?.title || app.job_title || 'Position'}
                          </Link>
                        </p>
                      </div>
                    </div>

                    {/* Authorized Contact info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 my-4 p-3.5 rounded-xl text-xs" style={{ background: 'hsl(var(--color-bg-alt))' }}>
                      <div className="flex items-center gap-2" style={{ color: 'hsl(var(--color-text))' }}>
                        <Mail className="w-4 h-4 text-primary shrink-0" />
                        <span className="truncate">{applicant?.email || 'Email not provided'}</span>
                      </div>
                      <div className="flex items-center gap-2" style={{ color: 'hsl(var(--color-text))' }}>
                        <Phone className="w-4 h-4 text-primary shrink-0" />
                        <span>{applicant?.phone_number || 'Phone not provided'}</span>
                      </div>
                      <div className="flex items-center gap-2" style={{ color: 'hsl(var(--color-text))' }}>
                        <MapPin className="w-4 h-4 text-primary shrink-0" />
                        <span>{applicant?.municipality || 'Batanes'}, {applicant?.island || 'Batan Island'}</span>
                      </div>
                    </div>

                    {/* Background details: Experience, Education */}
                    <div className="flex flex-wrap gap-4 text-xs mb-3" style={{ color: 'hsl(var(--color-text-muted))' }}>
                      {applicant?.experience_years !== undefined && (
                        <span>
                          <strong>Experience:</strong> {applicant.experience_years} year{applicant.experience_years !== 1 ? 's' : ''}
                        </span>
                      )}
                      {applicant?.education && (
                        <span>
                          <strong>Education:</strong> {applicant.education}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Applied {new Date(app.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Skills */}
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {skills.map(s => (
                          <span key={s} className="badge badge-primary text-xs py-0.5 px-2">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Bio */}
                    {applicant?.bio && (
                      <p className="text-xs mb-3 line-clamp-2" style={{ color: 'hsl(var(--color-text-muted))' }}>
                        <em>"{applicant.bio}"</em>
                      </p>
                    )}

                    {/* Cover Letter */}
                    {app.cover_letter && (
                      <div
                        className="mt-3 p-3 rounded-lg text-xs leading-relaxed"
                        style={{ background: 'hsl(var(--color-surface))', border: '1px solid hsl(var(--color-border))' }}
                      >
                        <p className="font-semibold mb-1" style={{ color: 'hsl(var(--color-text))' }}>Cover Letter:</p>
                        <p className="whitespace-pre-wrap" style={{ color: 'hsl(var(--color-text-muted))' }}>{app.cover_letter}</p>
                      </div>
                    )}

                    {/* Resume link */}
                    {(app.resume_url || applicant?.resume_url) && (
                      <div className="mt-3">
                        <a
                          href={app.resume_url || applicant?.resume_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" /> View Resume Document <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-row lg:flex-col gap-2 shrink-0 lg:min-w-36 justify-end items-stretch">
                    {app.status === 'pending' && (
                      <>
                        <button
                          id={`btn-accept-applicant-${app.id}`}
                          type="button"
                          onClick={() => openActionModal(app, 'accept')}
                          className="btn btn-primary text-xs py-2 px-3 flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Accept
                        </button>
                        <button
                          id={`btn-reject-applicant-${app.id}`}
                          type="button"
                          onClick={() => openActionModal(app, 'reject')}
                          className="btn btn-secondary text-xs py-2 px-3 flex items-center justify-center gap-1.5 text-danger"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    )}

                    {app.status === 'accepted' && (
                      <button
                        id={`btn-revert-applicant-${app.id}`}
                        type="button"
                        onClick={() => openActionModal(app, 'reopen')}
                        className="btn btn-secondary text-xs py-2 px-3 flex items-center justify-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Re-evaluate
                      </button>
                    )}

                    {app.status === 'rejected' && (
                      <button
                        id={`btn-reconsider-applicant-${app.id}`}
                        type="button"
                        onClick={() => openActionModal(app, 'reopen')}
                        className="btn btn-secondary text-xs py-2 px-3 flex items-center justify-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reconsider
                      </button>
                    )}

                    {app.status === 'withdrawn' && (
                      <span className="text-xs font-medium text-center py-2 text-muted">
                        Withdrawn by candidate
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* JOB SEEKER VIEW: Submitted Applications */
        <div className="space-y-4">
          {filtered.map(app => (
            <div key={app.id} id={`application-${app.id}`} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/jobs/${app.job_id}`}
                    className="text-base font-semibold hover:underline"
                    style={{ color: 'hsl(var(--color-text))' }}
                  >
                    {app.job_title}
                  </Link>
                  {app.company_name && (
                    <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--color-text-muted))' }}>
                      {app.company_name}
                    </p>
                  )}
                  {app.cover_letter && (
                    <p className="text-xs mt-2 line-clamp-2" style={{ color: 'hsl(var(--color-text-faint))' }}>
                      "{app.cover_letter}"
                    </p>
                  )}
                  <p className="text-xs mt-3 flex items-center gap-1" style={{ color: 'hsl(var(--color-text-faint))' }}>
                    <Clock className="w-3 h-3" />
                    Applied {new Date(app.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-3 shrink-0">
                  <span className={`badge ${statusColors[app.status]}`}>{app.status}</span>
                  {(app.status === 'pending' || app.status === 'accepted') && (
                    <button
                      id={`btn-withdraw-${app.id}`}
                      type="button"
                      onClick={() => openActionModal(app, 'withdraw')}
                      className="text-xs font-medium hover:underline text-danger"
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Accessible Reusable Action Modal */}
      <ConfirmDialog
        isOpen={actionModal.isOpen}
        title={modalDetails.title}
        message={modalDetails.message}
        confirmLabel={modalDetails.confirmLabel}
        danger={modalDetails.danger}
        loading={actionLoading}
        onConfirm={handleConfirmAction}
        onCancel={closeActionModal}
      />
    </div>
  );
}
