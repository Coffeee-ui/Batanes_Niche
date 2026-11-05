import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Briefcase } from 'lucide-react';
import { jobsApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { JobPreview } from '../types';
import JobPreviewCard from '../components/ui/JobPreviewCard';
import { JobCardSkeleton } from '../components/ui';
import BatanesScene from '../components/ui/BatanesScene';

const MUNICIPALITIES = [
  { label: 'All of Batanes', value: '' },
  { label: 'Basco', value: 'Basco' },
  { label: 'Mahatao', value: 'Mahatao' },
  { label: 'Ivana', value: 'Ivana' },
  { label: 'Uyugan', value: 'Uyugan' },
  { label: 'Sabtang · by boat', value: 'Sabtang' },
  { label: 'Itbayat · by boat', value: 'Itbayat' },
];

const CATEGORIES = [
  { name: 'Tourism', color: '#FDF3D6' },
  { name: 'Fishing', color: '#D8F0E0' },
  { name: 'Farming', color: '#FDF3D6' },
  { name: 'Construction', color: '#D8F0E0' },
  { name: 'Transport', color: '#FDF3D6' },
  { name: 'Retail', color: '#D8F0E0' },
];

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchQ, setSearchQ] = useState('');
  const [searchMuni, setSearchMuni] = useState('');
  const [featuredJobs, setFeaturedJobs] = useState<JobPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    jobsApi.preview({ page_size: 6 })
      .then(data => {
        if (active) setFeaturedJobs(data);
      })
      .catch(() => {
        if (active) setError('Unable to load job opportunities at this time.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQ) params.set('q', searchQ);
    if (searchMuni) params.set('municipality', searchMuni);
    navigate(`/jobs?${params.toString()}`);
  };

  const handleMuniChipClick = (muni: string) => {
    navigate(`/jobs?municipality=${encodeURIComponent(muni)}`);
  };

  const handleCategoryClick = (cat: string) => {
    navigate(`/jobs?q=${encodeURIComponent(cat)}`);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between pt-8">
      <div className="container-page space-y-16">
        {/* Hero Section */}
        <section className="text-center pt-8 pb-4 max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-block mb-6">
            <span className="badge badge-success px-4 py-1.5 text-xs font-semibold">
              Made for the islands of Batanes
            </span>
          </div>

          {/* Heading */}
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-4 text-foreground"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Work that keeps you close to home.
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            Find openings in your own town, apply in minutes, and hear back from local employers.
          </p>

          {/* Pill-Shaped Search Form */}
          <form
            onSubmit={handleSearch}
            className="card p-2 rounded-full shadow-md flex flex-col sm:flex-row items-center gap-2 max-w-2xl mx-auto border-border"
          >
            <div className="flex-1 w-full pl-4 pr-2 py-2 flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                id="hero-search-input"
                type="text"
                placeholder="Job or keyword"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-border/60 px-2 py-1">
              <select
                id="hero-municipality-select"
                value={searchMuni}
                onChange={e => setSearchMuni(e.target.value)}
                className="w-full sm:w-44 bg-transparent border-none outline-none text-xs text-foreground cursor-pointer py-2 pr-6"
              >
                {MUNICIPALITIES.map(m => (
                  <option key={m.label} value={m.value} className="bg-surface text-foreground">
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              id="btn-hero-search"
              type="submit"
              className="btn btn-primary rounded-full px-6 py-2.5 text-xs font-bold w-full sm:w-auto shrink-0"
              style={{ minHeight: '44px' }}
            >
              Search jobs
            </button>
          </form>

          {/* Quick Municipality Chips */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {MUNICIPALITIES.filter(m => m.value !== '').map(m => (
              <button
                key={m.label}
                type="button"
                onClick={() => handleMuniChipClick(m.value)}
                className="chip text-xs hover:border-primary"
              >
                {m.label}
              </button>
            ))}
          </div>
        </section>

        {/* Popular on the Islands */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">
            Popular on the islands
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {CATEGORIES.map(cat => (
              <button
                key={cat.name}
                type="button"
                onClick={() => handleCategoryClick(cat.name)}
                className="card p-4 text-left transition-all hover:border-primary group cursor-pointer"
              >
                <div
                  className="w-8 h-8 rounded-lg mb-4"
                  style={{ backgroundColor: cat.color }}
                />
                <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  {cat.name}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* Latest Openings */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">
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
              {Array.from({ length: 6 }).map((_, i) => (
                <JobCardSkeleton key={i} />
              ))}
            </div>
          ) : featuredJobs.length === 0 ? (
            <div className="card p-8 text-center text-sm text-muted-foreground">
              No active job openings found right now. Check back soon!
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredJobs.map(job => (
                <JobPreviewCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </section>

        {/* Split Action Cards: Looking for Work / Hiring in Batanes */}
        <section className="grid md:grid-cols-2 gap-6 pt-4">
          {/* Job Seeker Card */}
          <div className="card p-8 flex flex-col justify-between">
            <div className="space-y-2 mb-6">
              <h3 className="text-2xl font-bold text-foreground">
                Looking for work?
              </h3>
              <p className="text-sm text-muted-foreground">
                Create a profile once and apply to local jobs with a few taps.
              </p>
            </div>
            <div>
              <Link
                to="/register"
                className="btn btn-primary text-xs font-bold px-6 py-3 rounded-xl inline-block"
              >
                Create job seeker account
              </Link>
            </div>
          </div>

          {/* Employer Card */}
          <div
            className="rounded-2xl p-8 flex flex-col justify-between"
            style={{
              backgroundColor: 'hsl(var(--header))',
              color: 'hsl(var(--header-foreground))',
            }}
          >
            <div className="space-y-2 mb-6">
              <h3 className="text-2xl font-bold text-white">
                Hiring in Batanes?
              </h3>
              <p className="text-sm text-header-foreground">
                Post a job and review applicants from your own dashboard.
              </p>
            </div>
            <div>
              <Link
                to={isAuthenticated && user?.role === 'employer' ? '/jobs/post' : '/login'}
                className="btn btn-primary text-xs font-bold px-6 py-3 rounded-xl inline-block"
              >
                Post a job
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Island Landscape Illustration above footer */}
      <div className="mt-12">
        <BatanesScene />
      </div>
    </div>
  );
}
