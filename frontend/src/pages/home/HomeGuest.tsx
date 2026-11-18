import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Building2, Briefcase } from 'lucide-react';
import { jobsApi } from '../../api/client';
import type { JobPreview, Job } from '../../types';
import JobPreviewCard from '../../components/ui/JobPreviewCard';
import { JobCardSkeleton } from '../../components/ui';
import BatanesScene from '../../components/ui/BatanesScene';
import CombinedSearchBar from '../../components/forms/CombinedSearchBar';
import { CategoryTile } from '../../components/ui/CategoryIcon';

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
  const [recommendedJobs, setRecommendedJobs] = useState<JobPreview[]>([]);
  const [latestJobs, setLatestJobs] = useState<JobPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([
      jobsApi.featured().catch(() => [] as Job[]),
      jobsApi.preview({ page_size: 6 }).catch(() => [] as JobPreview[]),
    ])
      .then(([featuredFull, allPreviews]) => {
        if (!active) return;
        // Map featured full jobs to preview shapes
        const featuredPreviews: JobPreview[] = featuredFull.slice(0, 4).map(j => ({
          id: j.id,
          title: j.title,
          salary_min: j.salary_min,
          salary_max: j.salary_max,
          salary_type: j.salary_type,
          salary_period: j.salary_period,
          required_skills: j.required_skills,
          category: j.category,
        }));
        setFeaturedJobs(featuredPreviews.length > 0 ? featuredPreviews : allPreviews.slice(0, 3));
        setRecommendedJobs(allPreviews.slice(0, 6));
        setLatestJobs(allPreviews.slice(3, 9));
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
            Local openings from Basco to Itbayat. Find opportunities in your town, apply in minutes, and connect with trusted Batanes employers.
          </p>

          <div className="pt-2 w-full max-w-full">
            <CombinedSearchBar />
          </div>
        </section>

        {/* Popular Categories */}
        <section className="space-y-4 w-full max-w-full min-w-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              Popular on the islands
            </h2>
          </div>

          <div className="w-full max-w-full overflow-hidden">
            <div className="flex sm:grid sm:grid-cols-3 md:grid-cols-7 gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar">
              {FEATURED_CATEGORIES.map(cat => (
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
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 1: Featured Jobs (Per Section 7 Spec) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                Featured Vacancies
              </h2>
            </div>
            <Link
              to="/jobs"
              className="text-xs font-bold text-primary hover:underline"
            >
              View all
            </Link>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <JobCardSkeleton />
              <JobCardSkeleton />
              <JobCardSkeleton />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredJobs.map(job => (
                <JobPreviewCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </section>

        {/* Account Callout Banner for Guests */}
        <section>
          <div className="card p-6 sm:p-8 bg-surface border border-primary/30 shadow-sm rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <h3 className="text-xl font-bold text-foreground">
                Looking for work or hiring in Batanes?
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
                Create a free account to apply with one tap, bookmark vacancies, or post opportunities for local Ivatan talent.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/login"
                className="btn btn-secondary py-2.5 px-5 text-xs font-bold rounded-xl"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn btn-primary py-2.5 px-5 text-xs font-bold rounded-xl flex items-center gap-2"
              >
                Create Account <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* SECTION 2: Recommended Jobs (Per Section 7 Spec) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              Recommended Jobs
            </h2>
            <Link
              to="/jobs"
              className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
            </Link>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <JobCardSkeleton />
              <JobCardSkeleton />
              <JobCardSkeleton />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedJobs.map(job => (
                <JobPreviewCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </section>

        {/* SECTION 3: Other Latest Jobs (Per Section 7 Spec) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              Other Latest Openings
            </h2>
            <Link
              to="/jobs"
              className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              Browse all jobs
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
              {latestJobs.map(job => (
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
