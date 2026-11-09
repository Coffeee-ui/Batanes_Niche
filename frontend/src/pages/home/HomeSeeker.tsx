import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Clock, CheckCircle, AlertCircle, ChevronRight, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { jobsApi, applicationsApi, extractError } from '../../api/client';
import type { Job, Application } from '../../types';
import JobCard from '../../components/ui/JobCard';
import { JobCardSkeleton, ProgressBar } from '../../components/ui';
import CombinedSearchBar from '../../components/forms/CombinedSearchBar';
import CategoryIcon, { CategoryTile, getCategoryMeta } from '../../components/ui/CategoryIcon';

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

  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [justPostedJobs, setJustPostedJobs] = useState<Job[]>([]);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([
      jobsApi.recommendations().catch(() => [] as Job[]),
      jobsApi.list({ page_size: 6 }).then(d => d.items).catch(() => [] as Job[]),
      applicationsApi.myApplications({ page_size: 4 }).then(d => d.items).catch(() => [] as Application[]),
    ])
      .then(([recs, newest, apps]) => {
        if (!active) return;
        setRecommendedJobs(recs.slice(0, 4));
        setJustPostedJobs(newest.slice(0, 6));
        setRecentApplications(apps);
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

  // Real clock greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.full_name?.split(' ')[0] || user?.username || 'Job Seeker';

  const completeness = user?.profile_completeness ?? 65;

  const handleCategoryClick = (cat: string) => {
    navigate(`/jobs?category=${encodeURIComponent(cat)}`);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
            <CheckCircle className="w-3 h-3" /> Accepted
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-danger/15 text-danger border border-danger/30">
            <AlertCircle className="w-3 h-3" /> Rejected
          </span>
        );
      case 'withdrawn':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-soft text-muted-foreground border border-border">
            Withdrawn
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3" /> Pending
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
          Find your next job in Batanes and track your current applications.
        </p>
      </div>

      {/* Main Combined Search Bar (Two rows on mobile, pill on desktop) */}
      <CombinedSearchBar />

      {/* Category Chips / Tiles */}
      <div className="space-y-2 w-full max-w-full min-w-0">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Browse by category
        </p>
        {/* Mobile: horizontal swipe row of tiles; Desktop: wrap of chips */}
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

      {/* Two Column Layout (Side-by-side on lg+, stacked on mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Recommended For You & Just Posted */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recommended for you */}
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
              <>
                {/* Mobile: swipeable cards row */}
                <div className="flex sm:hidden gap-3 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
                  {recommendedJobs.map(job => (
                    <div key={job.id} className="w-72 shrink-0">
                      <JobCard job={job} />
                    </div>
                  ))}
                </div>

                {/* Desktop: vertical list */}
                <div className="hidden sm:flex flex-col gap-3">
                  {recommendedJobs.map(job => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Just posted */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Just posted
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
                {justPostedJobs.map(job => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Recent Applications & Profile Completeness */}
        <div className="space-y-6">
          {/* Profile Completeness (Progress bar with hint text only, NO percentage count) */}
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

          {/* Recent Applications (With Status Badges, NO Count Stats) */}
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
                      {renderStatusBadge(app.status)}
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

