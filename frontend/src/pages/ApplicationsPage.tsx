import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Send, Clock, MapPin, Mail, Phone, FileText, CheckCircle,
  XCircle, AlertCircle, Briefcase, User, ExternalLink, Filter, RotateCcw, ChevronRight
} from 'lucide-react';
import { applicationsApi, jobsApi, extractError } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { Application, Job } from '../types';
import { PageSpinner, EmptyState, ConfirmDialog } from '../components/ui';
import { toastSuccess, toastError } from '../components/ui/Toast';

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
          title: 'Accept Candidate',
          message: `Are you sure you want to accept ${applicantName} for '${jobTitle}'? The candidate will be notified immediately.`,
          confirmLabel: 'Accept Candidate',
          danger: false,
        };
      case 'reject':
        return {
          title: 'Reject Application',
          message: `Are you sure you want to decline ${applicantName}'s application for '${jobTitle}'?`,
          confirmLabel: 'Reject Application',
          danger: true,
        };
      case 'withdraw':
        return {
          title: 'Withdraw Application',
          message: isEmployer
            ? `Withdraw ${applicantName}'s application for '${jobTitle}'?`
            : `Are you sure you want to withdraw your application for '${jobTitle}'? You may reapply later if the job is still active.`,
          confirmLabel: 'Withdraw Application',
          danger: true,
        };
      case 'reopen':
        return {
          title: 'Reset to Pending',
          message: `Reset application for ${applicantName} back to pending evaluation status?`,
          confirmLabel: 'Reset Status',
          danger: false,
        };
    }
  }, [actionModal, isEmployer]);

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
            <CheckCircle className="w-3 h-3" />
            Accepted
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-danger/15 text-danger border border-danger/30">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      case 'withdrawn':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-neutral text-muted border border-border">
            Withdrawn
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-primary/20 text-foreground border border-primary/40">
            <Clock className="w-3 h-3 text-foreground" />
            Pending
          </span>
        );
    }
  };

  if (loading && applications.length === 0) {
    return <div className="container-page py-12"><PageSpinner /></div>;
  }

  const tabs = [
    { id: '', label: 'All', count: applications.length },
    { id: 'pending', label: 'Pending', count: applications.filter(a => a.status === 'pending').length },
    { id: 'accepted', label: 'Accepted', count: applications.filter(a => a.status === 'accepted').length },
    { id: 'rejected', label: 'Rejected', count: applications.filter(a => a.status === 'rejected').length },
    { id: 'withdrawn', label: 'Withdrawn', count: applications.filter(a => a.status === 'withdrawn').length },
  ];

  return (
    <div className="container-page py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-1 tracking-tight">
            {isEmployer ? 'Job Applicants' : 'My Applications'}
          </h1>
          <p className="text-sm text-muted">
            {applications.length} total application{applications.length !== 1 ? 's' : ''}
            {isEmployer && selectedJobId && <span> · Filtered by selected job</span>}
          </p>
        </div>
        <div>
          {isEmployer ? (
            <Link
              to="/jobs/my"
              id="btn-back-to-my-jobs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-surface text-foreground font-semibold text-xs hover:bg-neutral transition-colors shadow-xs"
            >
              <Briefcase className="w-3.5 h-3.5 text-muted" /> Manage my job listings
            </Link>
          ) : (
            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-foreground font-bold text-xs hover:opacity-95 active:scale-95 transition-all shadow-xs"
            >
              <Send className="w-3.5 h-3.5" /> Browse open jobs
            </Link>
          )}
        </div>
      </div>

      {/* Error alert banner */}
      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-2xl p-4 mb-6 flex items-center gap-3 text-sm text-danger">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters & Status Tabs */}
      <div className="bg-surface border border-border rounded-2xl p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Status filter tabs */}
        <div className="flex gap-2 flex-wrap items-center">
          {tabs.map(tab => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id || 'all'}
                id={`filter-${tab.id || 'all'}`}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-primary text-foreground font-bold shadow-xs'
                    : 'bg-background text-muted hover:text-foreground border border-border'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[11px] ${
                  isActive ? 'bg-foreground/15 text-foreground' : 'bg-neutral text-muted'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Employer Job selector */}
        {isEmployer && employerJobs.length > 0 && (
          <div className="min-w-[220px]">
            <label htmlFor="filter-job-select" className="sr-only">Filter by Job</label>
            <select
              id="filter-job-select"
              className="w-full px-4 py-2 rounded-full border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
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
        )}
      </div>

      {/* Applications list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={isEmployer ? <User className="w-8 h-8" /> : <Send className="w-8 h-8" />}
          title={statusFilter ? `No ${statusFilter} applications` : 'No applications found'}
          description={
            isEmployer
              ? (statusFilter ? 'Try selecting a different status filter.' : 'No candidates have applied to your active listings yet.')
              : (statusFilter ? 'Try selecting a different filter.' : 'Start discovering opportunities across the islands of Batanes!')
          }
          action={!isEmployer && !statusFilter ? (
            <Link to="/jobs" className="px-6 py-2.5 rounded-full bg-primary text-foreground font-bold text-xs">
              Browse Jobs
            </Link>
          ) : undefined}
        />
      ) : isEmployer ? (
        /* EMPLOYER VIEW: Full Candidate Profiles */
        <div className="space-y-4">
          {filtered.map(app => {
            const applicant = app.applicant;
            const applicantName = applicant?.full_name || app.seeker_name || 'Applicant';
            const skills = applicant?.skills?.split(',').map(s => s.trim()).filter(Boolean) ?? [];
            const initials = applicantName
              .split(' ')
              .map(p => p[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')
              .toUpperCase() || 'A';

            return (
              <div
                key={app.id}
                id={`application-${app.id}`}
                className="bg-surface border border-border rounded-2xl p-6 shadow-sm hover:border-primary/50 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  {/* Left: Applicant details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-4 mb-3">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-header text-primary border border-border flex items-center justify-center font-bold text-base shrink-0 shadow-sm">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h2 className="text-lg font-bold text-foreground truncate">
                            {applicantName}
                          </h2>
                          {renderStatusBadge(app.status)}
                        </div>
                        <p className="text-xs text-muted mt-1 flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-muted" />
                          <span>Applied for: </span>
                          <Link
                            to={`/jobs/${app.job_id}`}
                            className="font-bold text-foreground hover:underline"
                          >
                            {app.job?.title || app.job_title || 'Position'}
                          </Link>
                        </p>
                      </div>
                    </div>

                    {/* Authorized Contact info */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-4 p-3.5 rounded-xl bg-background border border-border/60 text-xs">
                      <div className="flex items-center gap-2 text-foreground truncate">
                        <Mail className="w-3.5 h-3.5 text-muted shrink-0" />
                        <span className="truncate">{applicant?.email || 'Email not provided'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground">
                        <Phone className="w-3.5 h-3.5 text-muted shrink-0" />
                        <span>{applicant?.phone_number || 'Phone not provided'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground">
                        <MapPin className="w-3.5 h-3.5 text-muted shrink-0" />
                        <span>{applicant?.municipality || 'Batanes'}, {applicant?.island || 'Batan Island'}</span>
                      </div>
                    </div>

                    {/* Background details: Experience, Education */}
                    <div className="flex flex-wrap gap-4 text-xs text-muted mb-3">
                      {applicant?.experience_years !== undefined && (
                        <span>
                          <strong className="text-foreground">Experience:</strong> {applicant.experience_years} year{applicant.experience_years !== 1 ? 's' : ''}
                        </span>
                      )}
                      {applicant?.education && (
                        <span>
                          <strong className="text-foreground">Education:</strong> {applicant.education}
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
                          <span key={s} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral text-foreground border border-border/50">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Bio */}
                    {applicant?.bio && (
                      <p className="text-xs text-muted italic mb-3 line-clamp-2">
                        "{applicant.bio}"
                      </p>
                    )}

                    {/* Cover Letter */}
                    {app.cover_letter && (
                      <div className="mt-3 p-3.5 rounded-xl bg-neutral/50 border border-border text-xs leading-relaxed">
                        <p className="font-bold text-foreground mb-1">Cover Note:</p>
                        <p className="text-muted whitespace-pre-wrap">{app.cover_letter}</p>
                      </div>
                    )}

                    {/* Resume link */}
                    {(app.resume_url || applicant?.resume_url) && (
                      <div className="mt-3">
                        <a
                          href={app.resume_url || applicant?.resume_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" /> View resume attachment <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-row lg:flex-col gap-2 shrink-0 lg:min-w-36 justify-end items-stretch pt-2 lg:pt-0">
                    {app.status === 'pending' && (
                      <>
                        <button
                          id={`btn-accept-applicant-${app.id}`}
                          type="button"
                          onClick={() => openActionModal(app, 'accept')}
                          className="px-4 py-2 rounded-full bg-primary text-foreground font-bold text-xs hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Accept
                        </button>
                        <button
                          id={`btn-reject-applicant-${app.id}`}
                          type="button"
                          onClick={() => openActionModal(app, 'reject')}
                          className="px-4 py-2 rounded-full border border-border bg-surface text-danger font-semibold text-xs hover:bg-danger/10 transition-colors flex items-center justify-center gap-1.5"
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
                        className="px-4 py-2 rounded-full border border-border bg-surface text-muted hover:text-foreground font-semibold text-xs hover:bg-neutral transition-colors flex items-center justify-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Re-evaluate
                      </button>
                    )}

                    {app.status === 'rejected' && (
                      <button
                        id={`btn-reconsider-applicant-${app.id}`}
                        type="button"
                        onClick={() => openActionModal(app, 'reopen')}
                        className="px-4 py-2 rounded-full border border-border bg-surface text-muted hover:text-foreground font-semibold text-xs hover:bg-neutral transition-colors flex items-center justify-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reconsider
                      </button>
                    )}

                    {app.status === 'withdrawn' && (
                      <span className="text-xs font-medium text-center py-2 text-muted">
                        Withdrawn by applicant
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* JOB SEEKER VIEW: Clean Card-Table Hybrid List */
        <div className="space-y-3">
          {filtered.map(app => (
            <div
              key={app.id}
              id={`application-${app.id}`}
              className="bg-surface border border-border rounded-2xl p-5 shadow-sm hover:border-primary/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <Link
                    to={`/jobs/${app.job_id}`}
                    className="text-base font-bold text-foreground hover:underline truncate"
                  >
                    {app.job_title || app.job?.title || 'Job Listing'}
                  </Link>
                  {renderStatusBadge(app.status)}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                  {app.company_name && (
                    <span className="font-semibold text-foreground/80">{app.company_name}</span>
                  )}
                  {app.job?.municipality && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {app.job.municipality}, {app.job.island}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Applied {new Date(app.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                {app.cover_letter && (
                  <p className="text-xs text-muted/70 italic mt-2 line-clamp-1">
                    "{app.cover_letter}"
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                {(app.status === 'pending' || app.status === 'accepted') && (
                  <button
                    id={`btn-withdraw-${app.id}`}
                    type="button"
                    onClick={() => openActionModal(app, 'withdraw')}
                    className="px-3.5 py-1.5 rounded-full border border-border text-danger hover:bg-danger/10 text-xs font-semibold transition-colors"
                  >
                    Withdraw
                  </button>
                )}
                <Link
                  to={`/jobs/${app.job_id}`}
                  className="px-4 py-2 rounded-full bg-primary text-foreground font-bold text-xs hover:opacity-95 active:scale-95 transition-all inline-flex items-center gap-1"
                >
                  View details <ChevronRight className="w-3.5 h-3.5" />
                </Link>
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
