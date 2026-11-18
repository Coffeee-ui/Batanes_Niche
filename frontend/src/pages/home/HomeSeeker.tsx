import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Building2,
  Calendar,
  Heart,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { jobsApi, applicationsApi, usersApi, extractError } from '../../api/client';
import type { Job, Application, FollowedEmployer } from '../../types';
import JobCard from '../../components/ui/JobCard';
import { JobCardSkeleton, ProgressBar } from '../../components/ui';
import CombinedSearchBar from '../../components/forms/CombinedSearchBar';
import CategoryIcon, { CategoryTile } from '../../components/ui/CategoryIcon';

const SEEKER_CATEGORIES = [
  'Tourism',
  'Hotels',
  'Retail',
  'Transport',
  'Fishing',
  'Farming',
  'Construction',
];

export default function HomeSeeker() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [latestJobs, setLatestJobs] = useState<Job[]>([]);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [followedEmployers, setFollowedEmployers] = useState<FollowedEmployer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([
      jobsApi.featured().catch(() => [] as Job[]),
      jobsApi.recommendedJobs(4).catch(() => [] as Job[]),
      jobsApi.list({ page_size: 6 }).then(d => d.items).catch(() => [] as Job[]),
      applicationsApi.myApplications({ page_size: 4 }).then(d => d.items).catch(() => [] as Application[]),
      usersApi.listFollowedEmployers().catch(() => [] as FollowedEmployer[]),
    ])
      .then(([featured, recs, newest, apps, followed]) => {
        if (!active) return;
        setFeaturedJobs(featured.slice(0, 3));
        setRecommendedJobs(recs.slice(0, 4));
        setLatestJobs(newest.slice(0, 6));
        setRecentApplications(apps);
        setFollowedEmployers(followed.slice(0, 4));
      })
      .catch((err: unknown) => {
        if (active) setError(extractError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.full_name?.split(' ')[0] || user?.username || 'Job Seeker';

  const completeness = user?.profile_completeness ?? 65;

  const handleCategoryClick = (cat: string) => {
    navigate(`/jobs?category=${encodeURIComponent(cat)}`);
  };

  const renderStatusBadge = (status: string, stage?: string) => {
    const s = (stage || status || 'new').toLowerCase();
    switch (s) {
      case 'hired':
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-success/15 text-success border border-success/30">
            <CheckCircle className="w-3 h-3" /> Hired
          </span>
        );
      case 'interview':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/30">
            <Calendar className="w-3 h-3" /> Interview
          </span>
        );
      case 'shortlisted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            Shortlisted
          </span>
        );
      case 'reviewing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Reviewing
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-danger/15 text-danger border border-danger/30">
            <AlertCircle className="w-3 h-3" /> Not Selected
          </span>
        );
      case 'withdrawn':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
            Withdrawn
          </span>
        );
      default:
        // By specification: display as "Submitted" for job seekers
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-foreground border border-border">
            <Clock className="w-3 h-3 text-muted-foreground" /> Submitted
          </span>
        );
    }
  };

  return (
    <div className="container-page py-6 sm:py-8 space-y-6 sm:space-y-8 w-full max-w-full min-w-0">
      {/* Top Greeting Header */}
      <div className="space-y-1">
        <h1
          className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          {greeting}, {firstName}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Explore job matches tailored for you and keep track of your active applications across Batanes.
        </p>
      </div>

      {/* Main Combined Search Bar */}
      <CombinedSearchBar />

      {/* Category Chips / Tiles */}
      <div className="space-y-2 w-full max-w-full min-w-0">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Browse by category
        </p>
        <div className="w-full max-w-full overflow-hidden">
          <div className="flex sm:hidden overflow-x-auto gap-2 pb-1 -mx-4 px-4 no-scrollbar">
            {SEEKER_CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryClick(cat)}
                className="card p-2.5 shrink-0 flex items-center gap-2 hover:border-primary transition-colors min-h-[44px]"
              >
                <CategoryTile category={cat} size="sm" />
                <span className="text-xs font-bold text-foreground pr-1">{cat}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="hidden sm:flex flex-wrap gap-2">
          {SEEKER_CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryClick(cat)}
              className="chip flex items-center gap-2 hover:border-primary transition-all text-xs"
            >
              <CategoryIcon category={cat} className="w-3.5 h-3.5" />
              <span>{cat}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="card p-4 text-xs text-danger border-danger/30">
          {error}
        </div>
      )}

      {/* Two Column Layout (Per UI Spec) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: 1. Featured Jobs -> 2. Recommended Jobs -> 3. Other Latest Jobs */}
        <div className="lg:col-span-2 space-y-8">
          {/* SECTION 1: Featured Jobs */}
          {featuredJobs.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h2 className="text-base sm:text-lg font-bold text-foreground">
                    Featured Vacancies
                  </h2>
                </div>
                <Link to="/jobs" className="text-xs font-bold text-primary hover:underline">
                  View all
                </Link>
              </div>

              <div className="flex flex-col gap-3">
                {featuredJobs.map(job => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            </section>
          )}

          {/* SECTION 2: Recommended for you */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  Recommended for you
                </h2>
              </div>
              <Link to="/jobs" className="text-xs font-bold text-muted-foreground hover:text-foreground">
                View all
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                <JobCardSkeleton />
                <JobCardSkeleton />
              </div>
            ) : recommendedJobs.length === 0 ? (
              <div className="card p-6 text-center text-xs text-muted-foreground">
                Add skills and location to your profile to receive personalized job matches.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {recommendedJobs.map(job => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </section>

          {/* SECTION 3: Other Latest Openings */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Other Latest Openings
              </h2>
              <Link to="/jobs" className="text-xs font-bold text-muted-foreground hover:text-foreground">
                Browse all jobs
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                <JobCardSkeleton />
                <JobCardSkeleton />
              </div>
            ) : (
              <div className="space-y-3">
                {latestJobs.map(job => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Profile Completeness, Followed Employers, Recent Applications */}
        <div className="space-y-6">
          {/* Profile Completeness */}
          <div className="card p-5 bg-surface border border-border shadow-xs rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">
                Profile completeness
              </h3>
            </div>
            <ProgressBar value={completeness} max={100} showPercent={false} />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Add your skills, work experience, and a short bio to help local employers find you faster.
            </p>
            <div className="pt-1">
              <Link
                to="/profile"
                className="btn btn-secondary w-full text-xs font-semibold py-2 rounded-xl min-h-[44px] flex items-center justify-center gap-1.5"
              >
                Complete profile <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Followed Employers Section */}
          <div className="card p-5 bg-surface border border-border shadow-xs rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  Followed Employers
                </h3>
              </div>
              <Link
                to="/followed-employers"
                className="text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                View all
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2">
                <div className="h-10 rounded-xl bg-neutral-soft/50 animate-pulse" />
              </div>
            ) : followedEmployers.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2 text-center">
                You haven't followed any employers yet.{' '}
                <Link to="/employers" className="text-primary hover:underline">
                  Browse directory
                </Link>
              </p>
            ) : (
              <div className="divide-y divide-border/50">
                {followedEmployers.map(f => {
                  const emp = f.employer;
                  if (!emp) return null;
                  return (
                    <Link
                      key={f.id}
                      to={`/employers/${f.employer_id}`}
                      className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2 group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                          {emp.company_name}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {emp.municipality}, {emp.island}
                        </p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Applications */}
          <div className="card p-5 bg-surface border border-border shadow-xs rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">
                Recent applications
              </h3>
              <Link
                to="/applications"
                className="text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                View all
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2">
                <div className="h-10 rounded-xl bg-neutral-soft/50 animate-pulse" />
                <div className="h-10 rounded-xl bg-neutral-soft/50 animate-pulse" />
              </div>
            ) : recentApplications.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2 text-center">
                You haven't submitted any applications yet.
              </p>
            ) : (
              <div className="divide-y divide-border/50">
                {recentApplications.map(app => (
                  <div key={app.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground truncate">
                        {app.job?.title || app.job_title}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {app.job?.company_name || app.company_name}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {renderStatusBadge(app.status, app.stage)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
