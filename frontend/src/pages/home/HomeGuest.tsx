import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { jobsApi } from '../../api/client';
import type { JobPreview } from '../../types';
import JobPreviewCard from '../../components/ui/JobPreviewCard';
import { JobCardSkeleton } from '../../components/ui';
import BatanesScene from '../../components/ui/BatanesScene';
import CombinedSearchBar from '../../components/forms/CombinedSearchBar';
import { CategoryTile, getCategoryMeta } from '../../components/ui/CategoryIcon';

const FEATURED_CATEGORIES = [
  'Tourism',
  'Hotels',
  'Retail',
  'Transport',
  'Fishing',
  'Farming',
  'Construction',
];

export default function HomeGuest() {
  const navigate = useNavigate();
  const [featuredJobs, setFeaturedJobs] = useState<JobPreview[]>([]);
  const [justPostedJobs, setJustPostedJobs] = useState<JobPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    jobsApi
      .preview({ page_size: 10 })
      .then(data => {
        if (!active) return;
        // In the absence of a dedicated backend featured flag, newest jobs are used for featured
        setFeaturedJobs(data.slice(0, 4));
        setJustPostedJobs(data.slice(0, 6));
      })
      .catch(() => {
        if (active) setError('Unable to load job opportunities at this time.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleCategoryClick = (cat: string) => {
    navigate(`/jobs?category=${encodeURIComponent(cat)}`);
  };

  return (
    <div className="flex flex-col justify-between pt-4 sm:pt-8 w-full max-w-full min-w-0">
      <div className="container-page space-y-10 sm:space-y-16 w-full max-w-full min-w-0">
        {/* Hero Section */}
        <section className="text-center pt-4 sm:pt-8 pb-2 max-w-3xl mx-auto space-y-4 w-full min-w-0">
          <div className="inline-block">
            <span className="badge badge-success px-4 py-1.5 text-xs font-semibold">
              Made for the islands of Batanes
            </span>
          </div>

          <h1
            className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-foreground"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Work that keeps you close to home.
          </h1>

          <p className="text-sm sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Local openings from Basco to Itbayat. Find openings in your own town, apply in minutes, and hear back from local employers.
          </p>

          {/* Combined Search Bar (Two rows on mobile, pill on desktop) */}
          <div className="pt-2 w-full max-w-full">
            <CombinedSearchBar />
          </div>
        </section>

        {/* Popular Categories Tiles */}
        <section className="space-y-4 w-full max-w-full min-w-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              Popular on the islands
            </h2>
          </div>

          {/* Single horizontal swipe row on mobile, grid on sm+ */}
          <div className="w-full max-w-full overflow-hidden">
            <div className="flex sm:grid sm:grid-cols-3 md:grid-cols-7 gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar">
              {FEATURED_CATEGORIES.map(cat => {
                const meta = getCategoryMeta(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryClick(cat)}
                    className="card p-3 sm:p-4 text-left transition-all hover:border-primary group cursor-pointer shrink-0 w-28 sm:w-auto flex flex-col justify-between min-h-[44px]"
                  >
                    <CategoryTile category={cat} size="md" className="mb-2" />
                    <p className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {cat}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Mobile-Only: Featured this week (swipeable row) */}
        <section className="block sm:hidden space-y-3 w-full max-w-full min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="text-base font-bold text-foreground">Featured this week</h2>
            </div>
            <Link to="/jobs" className="text-xs font-bold text-muted-foreground hover:text-foreground">
              View all
            </Link>
          </div>

          <div className="w-full max-w-full overflow-hidden">
            {loading ? (
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
                <div className="w-64 shrink-0"><JobCardSkeleton /></div>
                <div className="w-64 shrink-0"><JobCardSkeleton /></div>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
                {featuredJobs.map(job => (
                  <div key={job.id} className="w-72 shrink-0">
                    <JobPreviewCard job={job} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Mobile-Only: Create Free Account Card */}
        <section className="block sm:hidden">
          <div className="card p-5 bg-surface border border-primary/40 shadow-sm rounded-2xl relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <h3 className="text-base font-bold text-foreground">
                Ready to find work in Batanes?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Create a free account to apply with one tap, save jobs, and hear directly from local employers.
              </p>
              <div className="pt-2">
                <Link
                  to="/register"
                  className="btn btn-primary w-full py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  Create a free account <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Latest Openings / Just Posted */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              Latest openings
            </h2>
            <Link
              to="/jobs"
              className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              View all jobs
            </Link>
          </div>

          {error && (
            <div className="card p-4 text-xs text-danger border-danger/30">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <JobCardSkeleton />
              <JobCardSkeleton />
              <JobCardSkeleton />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {justPostedJobs.map(job => (
                <JobPreviewCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Landscape SVG Scene */}
      <div className="mt-12 sm:mt-16 w-full">
        <BatanesScene />
      </div>
    </div>
  );
}

