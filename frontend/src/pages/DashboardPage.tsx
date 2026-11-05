import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { jobsApi, applicationsApi, savedJobsApi, extractError } from '../api/client';
import type { Job, Application, SavedJob } from '../types';
import JobCard from '../components/ui/JobCard';
import { PageSpinner, ProgressBar, JobCardSkeleton } from '../components/ui';

// ============================================================
// Seeker Dashboard
// ============================================================
function SeekerDashboard() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [recJobs, apps, saved] = await Promise.all([
          jobsApi.recommendations().catch(() => [] as Job[]),
          applicationsApi.myApplications({ page_size: 5 }).then(d => d.items).catch(() => [] as Application[]),
          savedJobsApi.list().catch(() => [] as SavedJob[]),
        ]);
        if (active) {
          setRecommendedJobs(recJobs);
          setMyApplications(apps);
          setSavedJobs(saved);
        }
      } catch (err: unknown) {
        if (active) setError(extractError(err));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const interviewsCount = myApplications.filter(a => a.status === 'accepted').length;
  const greeting = isDark ? 'Good evening' : 'Good morning';
  const completeness = user?.profile_completeness ?? 70;

  return (
    <div className="container-page py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-1">
            {greeting}
          </h1>
          <p className="text-sm text-muted-foreground">
            Track your applications and find new jobs near you.
          </p>
        </div>
        <div>
          <button
            onClick={() => navigate('/jobs')}
            className="btn btn-primary text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm"
          >
            Browse jobs
          </button>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-6">
          <p className="text-xs font-semibold text-muted-foreground mb-1">Applications</p>
          <p className="text-3xl font-black text-foreground">{myApplications.length}</p>
        </div>
        <div className="card p-6">
          <p className="text-xs font-semibold text-muted-foreground mb-1">Interviews</p>
          <p className="text-3xl font-black text-foreground">{interviewsCount}</p>
        </div>
        <div className="card p-6">
          <p className="text-xs font-semibold text-muted-foreground mb-1">Saved jobs</p>
          <p className="text-3xl font-black text-foreground">{savedJobs.length}</p>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Recommended for you & Recent applications */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recommended Jobs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">
                Recommended for you
              </h2>
              <Link to="/jobs" className="text-xs font-semibold text-muted-foreground hover:text-foreground">
                See all
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                <JobCardSkeleton />
                <JobCardSkeleton />
              </div>
            ) : recommendedJobs.length === 0 ? (
              <div className="card p-8 text-center text-xs text-muted-foreground">
                No personalized recommendations yet. Browse all jobs to find opportunities.
              </div>
            ) : (
              <div className="space-y-4">
                {recommendedJobs.slice(0, 3).map(job => (
                  <JobCard key={job.id} job={job} compact />
                ))}
              </div>
            )}
          </div>

          {/* Recent Applications Card */}
          <div className="card p-6 space-y-4">
            <h2 className="text-base font-bold text-foreground">
              Recent applications
            </h2>

            {loading ? (
              <p className="text-xs text-muted-foreground">Loading recent applications…</p>
            ) : myApplications.length === 0 ? (
              <p className="text-xs text-muted-foreground">You haven't submitted any applications yet.</p>
            ) : (
              <div className="divide-y divide-border/50">
                {myApplications.slice(0, 5).map(app => {
                  const jobTitle = app.job?.title || app.job_title || 'Position';
                  const location = app.job?.municipality || 'Batanes';
                  const isAccepted = app.status === 'accepted';
                  const isPending = app.status === 'pending';

                  return (
                    <div key={app.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {jobTitle} · <span className="font-normal text-muted-foreground">{location}</span>
                        </p>
                      </div>
                      <span className={`badge ${
                        isAccepted ? 'badge-success' : isPending ? 'badge-warning' : 'badge-muted'
                      }`}>
                        {isAccepted ? 'Interview' : isPending ? 'Pending' : app.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Profile Completeness Card */}
        <aside className="space-y-6">
          <div className="card p-6 space-y-4">
            <h2 className="text-base font-bold text-foreground">
              Profile completeness
            </h2>

            <p className="text-3xl font-black text-tertiary">
              {completeness}%
            </p>

            <ProgressBar value={completeness} />

            <p className="text-xs text-muted-foreground leading-relaxed">
              Add your skills and a short bio to reach 100%.
            </p>

            <Link
              to="/profile"
              className="btn btn-secondary w-full text-xs font-semibold py-2.5 rounded-xl block text-center"
            >
              Complete profile
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ============================================================
// Employer Dashboard
// ============================================================
function EmployerDashboard() {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const [jobsData, appsData] = await Promise.all([
          jobsApi.myJobs({ page_size: 50 }).then(d => d.items).catch(() => [] as Job[]),
          applicationsApi.myApplications({ page_size: 20 }).then(d => d.items).catch(() => [] as Application[]),
        ]);
        if (active) {
          setMyJobs(jobsData);
          setApplications(appsData);
        }
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const greeting = isDark ? 'Good evening' : 'Good morning';
  const activeJobs = myJobs.filter(j => j.status === 'active').length;
  const totalApplicants = myJobs.reduce((sum, j) => sum + (j.application_count ?? 0), 0) || applications.length;
  const interviewsCount = applications.filter(a => a.status === 'accepted').length;
  const hiredCount = applications.filter(a => a.status === 'accepted').length;

  return (
    <div className="container-page py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-1">
            {greeting}
          </h1>
          <p className="text-sm text-muted-foreground">
            Here is what is happening with your job posts.
          </p>
        </div>
        <div>
          <button
            onClick={() => navigate('/jobs/post')}
            className="btn btn-primary text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm"
          >
            Post a job
          </button>
        </div>
      </div>

      {/* 4 KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-6">
          <p className="text-xs font-semibold text-muted-foreground mb-1">Active jobs</p>
          <p className="text-3xl font-black text-foreground">{activeJobs}</p>
        </div>
        <div className="card p-6">
          <p className="text-xs font-semibold text-muted-foreground mb-1">New applicants</p>
          <p className="text-3xl font-black text-foreground">{totalApplicants}</p>
        </div>
        <div className="card p-6">
          <p className="text-xs font-semibold text-muted-foreground mb-1">Interviews</p>
          <p className="text-3xl font-black text-foreground">{interviewsCount}</p>
        </div>
        <div className="card p-6">
          <p className="text-xs font-semibold text-muted-foreground mb-1">Hired</p>
          <p className="text-3xl font-black text-foreground">{hiredCount}</p>
        </div>
      </div>

      {/* Recent Applicants Table Card */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">
            Recent applicants
          </h2>
          <Link to="/applications" className="text-xs font-semibold text-muted-foreground hover:text-foreground">
            View all
          </Link>
        </div>

        {loading ? (
          <p className="text-xs text-muted-foreground py-4">Loading applicants…</p>
        ) : applications.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">
            No applicants yet. Post a job to start receiving candidates.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-3 font-semibold">Applicant</th>
                  <th className="pb-3 font-semibold">Job</th>
                  <th className="pb-3 font-semibold">Applied</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {applications.slice(0, 6).map(app => {
                  const applicantName = app.applicant?.full_name || app.seeker_name || 'Applicant';
                  const jobTitle = app.job?.title || app.job_title || 'Position';
                  const isAccepted = app.status === 'accepted';
                  const isPending = app.status === 'pending';

                  return (
                    <tr key={app.id} className="hover:bg-neutral-soft/30 transition-colors">
                      <td className="py-3 font-bold text-foreground">
                        {applicantName}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {jobTitle}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {new Date(app.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-3">
                        <span className={`badge ${
                          isAccepted ? 'badge-success' : isPending ? 'badge-warning' : 'badge-muted'
                        }`}>
                          {isAccepted ? 'Interview' : isPending ? 'Pending' : app.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          to={`/applications?jobId=${app.job_id}`}
                          className="font-bold text-foreground hover:underline"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Main Dashboard Export
// ============================================================
export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <PageSpinner />;
  if (user?.role === 'employer') return <EmployerDashboard />;
  return <SeekerDashboard />;
}
