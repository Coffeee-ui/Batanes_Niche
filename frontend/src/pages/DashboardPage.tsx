import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase, Users, Bell, TrendingUp, Star, MapPin,
  ArrowRight, Clock, CheckCircle, Send, Bookmark
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { jobsApi, applicationsApi, usersApi, notificationsApi, extractError } from '../api/client';
import type { Job, Application, Candidate, Notification } from '../types';
import JobCard from '../components/ui/JobCard';
import { PageSpinner, ProgressBar, Skeleton } from '../components/ui';

// ============================================================
// Seeker Dashboard
// ============================================================
function SeekerDashboard() {
  const { user } = useAuth();
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [recJobs, apps, notifs] = await Promise.all([
          jobsApi.recommendations().catch(() => [] as Job[]),
          applicationsApi.myApplications({ page_size: 5 }).then(d => d.items).catch(() => [] as Application[]),
          notificationsApi.list().then(d => d.slice(0, 5)).catch(() => [] as Notification[]),
        ]);
        if (active) {
          setRecommendedJobs(recJobs);
          setMyApplications(apps);
          setNotifications(notifs);
        }
      } catch (err: unknown) {
        if (active) setError(extractError(err));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const appStatusColors: Record<string, string> = {
    pending: 'badge-warning',
    shortlisted: 'badge-primary',
    accepted: 'badge-success',
    rejected: 'badge-danger',
    withdrawn: 'badge-muted',
  };

  return (
    <div className="container-page py-8 space-y-8">
      {/* Welcome Banner */}
      <div
        className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, hsl(214 89% 42%) 0%, hsl(168 76% 38%) 100%)' }}
      >
        <div className="relative z-10">
          <p className="text-sm text-white/75 mb-1 font-medium">Welcome back,</p>
          <h1 className="text-2xl font-black mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {user?.full_name} 👋
          </h1>
          <p className="text-sm text-white/75">
            <MapPin className="inline w-3.5 h-3.5 mr-1" />
            {user?.municipality}, {user?.island}
          </p>
        </div>
        <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full opacity-10" style={{ background: 'white' }} />
        <div className="absolute right-20 -top-6 w-24 h-24 rounded-full opacity-10" style={{ background: 'white' }} />

        {/* Profile Completeness */}
        <div className="mt-6 pt-6 border-t border-white/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/80">Profile Completeness</span>
            <span className="text-sm font-bold">{user?.profile_completeness ?? 0}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${user?.profile_completeness ?? 0}%`,
                background: 'linear-gradient(90deg, hsl(35, 95%, 70%), hsl(35, 95%, 85%))',
              }}
            />
          </div>
          {(user?.profile_completeness ?? 0) < 100 && (
            <Link to="/profile" className="inline-block mt-3 text-xs text-white/80 underline underline-offset-2">
              Complete your profile →
            </Link>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: <Send className="w-5 h-5" />, label: 'Applications', value: myApplications.length + '+' },
          { icon: <Star className="w-5 h-5" />, label: 'Saved Jobs', value: '—' },
          { icon: <Bell className="w-5 h-5" />, label: 'Notifications', value: notifications.filter(n => !n.is_read).length },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2"
              style={{ background: 'hsl(var(--color-primary) / 0.1)', color: 'hsl(var(--color-primary))' }}
            >
              {s.icon}
            </div>
            <p className="text-xl font-black" style={{ color: 'hsl(var(--color-text))' }}>{s.value}</p>
            <p className="text-xs" style={{ color: 'hsl(var(--color-text-muted))' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Applications */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--color-text))' }}>
              Recent Applications
            </h2>
            <Link to="/applications" className="text-sm font-medium" style={{ color: 'hsl(var(--color-primary))' }}>
              View all <ArrowRight className="inline w-3.5 h-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="card p-4"><Skeleton className="h-4 w-full skeleton mb-2" /><Skeleton className="h-3 w-2/3 skeleton" /></div>)}
            </div>
          ) : myApplications.length === 0 ? (
            <div
              className="card p-8 text-center"
            >
              <Send className="w-8 h-8 mx-auto mb-3" style={{ color: 'hsl(var(--color-text-faint))' }} />
              <p className="text-sm" style={{ color: 'hsl(var(--color-text-muted))' }}>No applications yet.</p>
              <Link to="/jobs" className="btn btn-primary text-sm mt-4">Browse Jobs</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myApplications.map(app => (
                <div key={app.id} className="card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'hsl(var(--color-text))' }}>
                        {app.job_title}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--color-text-muted))' }}>
                        {app.company_name}
                      </p>
                    </div>
                    <span className={`badge shrink-0 ${appStatusColors[app.status]}`}>{app.status}</span>
                  </div>
                  <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'hsl(var(--color-text-faint))' }}>
                    <Clock className="w-3 h-3" />
                    {new Date(app.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommended Jobs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--color-text))' }}>
              Recommended for You
            </h2>
            <Link to="/jobs" className="text-sm font-medium" style={{ color: 'hsl(var(--color-primary))' }}>
              See all <ArrowRight className="inline w-3.5 h-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="card p-4"><Skeleton className="h-4 w-full skeleton mb-2" /><Skeleton className="h-3 w-3/4 skeleton" /></div>)}
            </div>
          ) : recommendedJobs.length === 0 ? (
            <div className="card p-8 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-3" style={{ color: 'hsl(var(--color-text-faint))' }} />
              <p className="text-sm" style={{ color: 'hsl(var(--color-text-muted))' }}>
                Complete your profile to get personalized recommendations.
              </p>
              <Link to="/profile" className="btn btn-primary text-sm mt-4">Update Profile</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendedJobs.slice(0, 4).map(job => (
                <JobCard key={job.id} job={job} compact />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Employer Dashboard
// ============================================================
function EmployerDashboard() {
  const { user } = useAuth();
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [recommendedCandidates, setRecommendedCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [jobsData, candsData] = await Promise.all([
          jobsApi.myJobs({ page_size: 5 }).then(d => d.items).catch(() => [] as Job[]),
          usersApi.recommendations().catch(() => [] as Candidate[]),
        ]);
        if (active) {
          setMyJobs(jobsData);
          setRecommendedCandidates(candsData);
        }
      } catch (err: unknown) {
        if (active) setError(extractError(err));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const totalApplicants = myJobs.reduce((sum, j) => sum + (j.application_count ?? 0), 0);
  const activeJobs = myJobs.filter(j => j.status === 'active').length;

  return (
    <div className="container-page py-8 space-y-8">
      {/* Welcome Banner */}
      <div
        className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, hsl(168 76% 32%) 0%, hsl(214 89% 40%) 100%)' }}
      >
        <div className="relative z-10">
          <p className="text-sm text-white/75 mb-1 font-medium">Welcome back,</p>
          <h1 className="text-2xl font-black mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {user?.employer_profile?.company_name || user?.full_name} 🏢
          </h1>
          <p className="text-sm text-white/75">
            <MapPin className="inline w-3.5 h-3.5 mr-1" />
            {user?.municipality}, {user?.island}
          </p>
        </div>
        <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full opacity-10" style={{ background: 'white' }} />

        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20">
          {[
            { label: 'Total Jobs', value: myJobs.length },
            { label: 'Active', value: activeJobs },
            { label: 'Applicants', value: totalApplicants },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-black">{s.value}</p>
              <p className="text-xs text-white/70">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Link to="/jobs/post" id="btn-post-new-job" className="btn btn-primary">
          <Briefcase className="w-4 h-4" /> Post New Job
        </Link>
        <Link to="/candidates" id="btn-browse-candidates" className="btn btn-secondary">
          <Users className="w-4 h-4" /> Browse Candidates
        </Link>
        <Link to="/jobs/my" id="btn-manage-jobs" className="btn btn-secondary">
          Manage Jobs <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Job Listings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--color-text))' }}>My Job Listings</h2>
            <Link to="/jobs/my" className="text-sm font-medium" style={{ color: 'hsl(var(--color-primary))' }}>
              View all <ArrowRight className="inline w-3.5 h-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="card p-4"><Skeleton className="h-4 w-full skeleton mb-2" /><Skeleton className="h-3 w-2/3 skeleton" /></div>)}
            </div>
          ) : myJobs.length === 0 ? (
            <div className="card p-8 text-center">
              <Briefcase className="w-8 h-8 mx-auto mb-3" style={{ color: 'hsl(var(--color-text-faint))' }} />
              <p className="text-sm mb-4" style={{ color: 'hsl(var(--color-text-muted))' }}>No jobs posted yet.</p>
              <Link to="/jobs/post" className="btn btn-primary text-sm">Post Your First Job</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myJobs.map(job => (
                <Link key={job.id} to={`/jobs/${job.id}`} className="card p-4 block">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'hsl(var(--color-text))' }}>{job.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--color-text-muted))' }}>
                        <MapPin className="inline w-3 h-3 mr-0.5" />{job.municipality}
                        <span className="mx-2">·</span>
                        <Users className="inline w-3 h-3 mr-0.5" />{job.application_count ?? 0} applicants
                      </p>
                    </div>
                    <span className={`badge shrink-0 ${job.status === 'active' ? 'badge-success' : 'badge-muted'}`}>
                      {job.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recommended Candidates */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--color-text))' }}>Top Candidates</h2>
            <Link to="/candidates" className="text-sm font-medium" style={{ color: 'hsl(var(--color-primary))' }}>
              All candidates <ArrowRight className="inline w-3.5 h-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="card p-4"><Skeleton className="h-4 w-full skeleton mb-2" /><Skeleton className="h-3 w-3/4 skeleton" /></div>)}
            </div>
          ) : recommendedCandidates.length === 0 ? (
            <div className="card p-8 text-center">
              <Users className="w-8 h-8 mx-auto mb-3" style={{ color: 'hsl(var(--color-text-faint))' }} />
              <p className="text-sm" style={{ color: 'hsl(var(--color-text-muted))' }}>
                Post a job to get candidate recommendations.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendedCandidates.slice(0, 5).map(c => (
                <div key={c.id} className="card p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ background: 'linear-gradient(135deg, hsl(var(--color-primary)), hsl(var(--color-secondary)))' }}
                    >
                      {c.full_name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate" style={{ color: 'hsl(var(--color-text))' }}>
                        {c.full_name}
                      </p>
                      <p className="text-xs" style={{ color: 'hsl(var(--color-text-muted))' }}>
                        {c.municipality} · {c.experience_years ?? 0}yr exp
                      </p>
                    </div>
                    <ProgressBar value={c.profile_completeness ?? 0} showPercent />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Dashboard Dispatcher
// ============================================================
export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <PageSpinner />;
  if (user?.role === 'employer') return <EmployerDashboard />;
  return <SeekerDashboard />;
}
