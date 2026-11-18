import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Briefcase,
  ArrowLeft,
  Heart,
  Share2,
  Flag,
  Calendar,
  DollarSign,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usersApi, jobsApi, extractError } from '../../api/client';
import { Spinner } from '../../components/ui';
import type { Employer, Job } from '../../types';

export default function EmployerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [employer, setEmployer] = useState<Employer | null>(null);
  const [vacancies, setVacancies] = useState<Job[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Misleading information');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const employerId = parseInt(id || '0', 10);

  const fetchData = useCallback(async () => {
    if (!employerId) return;
    setLoading(true);
    setError('');
    try {
      const emp = await usersApi.employerProfile(employerId);
      setEmployer(emp);

      // Fetch active vacancies
      const jobsRes = await jobsApi.list({ page_size: 50 });
      const empJobs = jobsRes.items.filter(j => j.employer_id === employerId);
      setVacancies(empJobs);

      // Check following status if user is job seeker
      if (user?.role === 'job_seeker') {
        const followStatus = await usersApi.isFollowingEmployer(employerId);
        setIsFollowing(followStatus.is_following);
      }
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }, [employerId, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleFollow = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/employers/${employerId}` } });
      return;
    }
    if (user.role !== 'job_seeker') return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await usersApi.unfollowEmployer(employerId);
        setIsFollowing(false);
      } else {
        await usersApi.followEmployer(employerId);
        setIsFollowing(true);
      }
    } catch (err) {
      alert(extractError(err));
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    setReportSubmitting(true);
    try {
      await usersApi.submitReport('employer', employerId, reportReason, reportDetails);
      setReportSuccess(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSuccess(false);
        setReportDetails('');
      }, 1500);
    } catch (err) {
      alert(extractError(err));
    } finally {
      setReportSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container-page py-16 text-center space-y-3">
        <Spinner size="lg" className="mx-auto" />
        <p className="text-sm text-muted-foreground">Loading employer profile...</p>
      </div>
    );
  }

  if (error || !employer) {
    return (
      <div className="container-page py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-foreground">Employer not found</h2>
        <p className="text-sm text-muted-foreground">{error || 'This employer profile could not be loaded.'}</p>
        <Link to="/employers" className="btn btn-primary inline-flex items-center gap-2 text-xs font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-8 space-y-8 max-w-4xl">
      {/* Top Breadcrumb */}
      <div>
        <Link
          to="/employers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Employer Directory</span>
        </Link>
      </div>

      {/* Hero Card */}
      <div className="card p-6 sm:p-8 rounded-2xl border border-border bg-surface space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-2xl overflow-hidden shrink-0">
              {employer.profile_pic ? (
                <img src={employer.profile_pic} alt={employer.company_name} className="w-full h-full object-cover" />
              ) : (
                employer.company_name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {employer.company_name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {employer.company_address || `${employer.municipality}, ${employer.island}`}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  {employer.industry || employer.business_type || 'Local Enterprise'}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {user?.role === 'job_seeker' && (
              <button
                type="button"
                onClick={handleToggleFollow}
                disabled={followLoading}
                className={`btn flex-1 sm:flex-none text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
                  isFollowing
                    ? 'btn-secondary text-danger border-danger/30 hover:bg-danger/10'
                    : 'btn-primary'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFollowing ? 'fill-current' : ''}`} />
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}

            <button
              type="button"
              onClick={handleShare}
              className="btn btn-secondary text-xs font-semibold p-2.5 rounded-xl text-muted-foreground hover:text-foreground"
              title="Share profile link"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="btn btn-secondary text-xs font-semibold p-2.5 rounded-xl text-muted-foreground hover:text-danger"
              title="Report employer"
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>
        </div>

        {copied && (
          <div className="px-3 py-1.5 rounded-lg bg-success/10 text-success border border-success/20 text-xs font-semibold inline-block">
            Link copied to clipboard!
          </div>
        )}

        {/* About Organization */}
        <div className="pt-6 border-t border-border/60 space-y-2">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
            About Organization
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {employer.company_description ||
              'This employer has not added a detailed description yet. You can explore their active job vacancies below or follow them for future job openings in Batanes.'}
          </p>
        </div>
      </div>

      {/* Active Vacancies Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            Active Vacancies ({vacancies.length})
          </h2>
        </div>

        {vacancies.length === 0 ? (
          <div className="card p-8 rounded-2xl border border-dashed border-border bg-surface text-center space-y-2">
            <Briefcase className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-bold text-foreground">No active vacancies at this time</p>
            <p className="text-xs text-muted-foreground">
              Follow this employer to receive notifications when they post new openings.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {vacancies.map(job => (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
                className="card p-5 rounded-2xl border border-border bg-surface hover:border-primary/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                      {job.title}
                    </h3>
                    {job.is_featured && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {job.municipality}, {job.island}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      ₱{job.salary_min.toLocaleString()} – ₱{job.salary_max.toLocaleString()}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-medium">
                      {job.employment_type}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform shrink-0">
                  <span>View Details</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in">
          <div className="card p-6 rounded-2xl border border-border bg-surface max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Report Employer</h3>
            {reportSuccess ? (
              <p className="text-xs text-success font-semibold py-4 text-center">
                Report submitted. Thank you for helping keep Batanes Niche safe.
              </p>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-3">
                <div>
                  <label className="label text-xs">Reason</label>
                  <select
                    value={reportReason}
                    onChange={e => setReportReason(e.target.value)}
                    className="input select text-sm"
                  >
                    <option value="Misleading information">Misleading information</option>
                    <option value="Fraudulent or scam vacancy">Fraudulent or scam vacancy</option>
                    <option value="Inappropriate conduct">Inappropriate conduct</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="label text-xs">Details (Optional)</label>
                  <textarea
                    rows={3}
                    value={reportDetails}
                    onChange={e => setReportDetails(e.target.value)}
                    placeholder="Provide additional context..."
                    className="input text-sm py-2"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="btn btn-secondary text-xs px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    className="btn btn-primary text-xs px-4 py-2 font-bold"
                  >
                    {reportSubmitting ? <Spinner size="sm" /> : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
