import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Briefcase, Users, TrendingUp, ArrowRight,
  ChevronRight, Waves, Mountain, Wind, Lock, AlertCircle, LogIn, UserPlus
} from 'lucide-react';
import { jobsApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { JobPreview } from '../types';
import JobPreviewCard from '../components/ui/JobPreviewCard';
import { JobCardSkeleton } from '../components/ui';

const MUNICIPALITIES = ['Basco', 'Itbayat', 'Ivana', 'Mahatao', 'Sabtang', 'Uyugan'];

const featureCards = [
  {
    icon: <MapPin className="w-6 h-6" />,
    title: 'Hyper-Local',
    desc: 'Every job is in Batanes. No generic listings from Manila or abroad.',
    color: 'hsl(214, 89%, 52%)',
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Ivatan Community',
    desc: 'Built for the Ivatan people, by people who understand the local employment landscape.',
    color: 'hsl(168, 76%, 42%)',
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: 'Smart Matching',
    desc: 'Our skill + location scoring surfaces the most relevant candidates and jobs first.',
    color: 'hsl(35, 95%, 58%)',
  },
];

const platformHighlights = [
  { label: 'Municipalities Covered', value: '6', icon: <MapPin className="w-5 h-5" /> },
  { label: 'Major Island Groups', value: '3', icon: <Mountain className="w-5 h-5" /> },
  { label: 'Hyper-Localized Focus', value: '100%', icon: <Briefcase className="w-5 h-5" /> },
  { label: 'Community Tailored', value: 'Ivatan', icon: <Users className="w-5 h-5" /> },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchQ, setSearchQ] = useState('');
  const [searchMuni, setSearchMuni] = useState('');
  const [featuredJobs, setFeaturedJobs] = useState<JobPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = () => {
    setLoading(true);
    setError(null);
    jobsApi.preview({ page_size: 6 })
      .then(data => setFeaturedJobs(data))
      .catch(() => setError('Unable to load job opportunities at this time.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQ) params.set('q', searchQ);
    if (searchMuni) params.set('municipality', searchMuni);
    navigate(`/jobs?${params.toString()}`);
  };

  return (
    <div>
      {/* Hero Section */}
      <section
        className="relative overflow-visible"
        style={{
          background: 'linear-gradient(135deg, hsl(214 89% 12%) 0%, hsl(200 80% 18%) 50%, hsl(168 76% 15%) 100%)',
          minHeight: '85vh',
        }}
      >
        {/* Decorative background shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
            style={{ background: 'hsl(168 76% 42%)' }}
          />
          <div
            className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-10"
            style={{ background: 'hsl(214 89% 52%)' }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-5"
            style={{ background: 'radial-gradient(circle, white, transparent)' }}
          />
        </div>

        {/* Ambient icons */}
        <Waves className="absolute bottom-8 right-8 w-32 h-32 text-white opacity-5" />
        <Mountain className="absolute top-20 left-4 w-24 h-24 text-white opacity-5" />
        <Wind className="absolute top-8 right-1/4 w-20 h-20 text-white opacity-5" />

        <div className="container-page relative z-10 pt-28 pb-20">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8 animate-fade-in"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <MapPin className="w-4 h-4" />
              The #1 Job Portal for Batanes, Philippines
            </div>

            {/* Headline */}
            <h1
              className="text-5xl sm:text-6xl font-black mb-6 animate-fade-in text-white"
              style={{ animationDelay: '80ms', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.03em' }}
            >
              Find Work in{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, hsl(168, 90%, 65%), hsl(35, 95%, 70%))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Batanes
              </span>
              , Stay Home
            </h1>

            <p
              className="text-lg text-white/70 mb-10 max-w-xl mx-auto leading-relaxed animate-fade-in"
              style={{ animationDelay: '160ms' }}
            >
              A hyper-localized employment platform exclusively for the Ivatan people.
              Discover local opportunities in Basco, Itbayat, Sabtang and beyond.
            </p>

            {/* Search Bar */}
            <form
              onSubmit={handleSearch}
              className="animate-fade-in flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto"
              style={{ animationDelay: '240ms' }}
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--color-hero-input-placeholder))' }} />
                <input
                  id="hero-search-input"
                  type="text"
                  placeholder="Job title or skill…"
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 rounded-xl text-sm font-medium"
                  style={{
                    background: 'hsl(var(--color-hero-input-bg))',
                    border: '1px solid hsl(var(--color-border-subtle))',
                    outline: 'none',
                    color: 'hsl(var(--color-hero-input-text))',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                  }}
                />
              </div>
              <select
                id="hero-municipality-select"
                value={searchMuni}
                onChange={e => setSearchMuni(e.target.value)}
                className="py-4 px-4 rounded-xl text-sm font-medium sm:w-44"
                style={{
                  background: 'hsl(var(--color-hero-input-bg))',
                  border: '1px solid hsl(var(--color-border-subtle))',
                  outline: 'none',
                  color: 'hsl(var(--color-hero-input-text))',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  paddingRight: '2.5rem',
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%234b5563' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '1rem 1rem',
                  cursor: 'pointer',
                }}
              >
                <option value="">All Municipalities</option>
                {MUNICIPALITIES.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <button
                id="btn-hero-search"
                type="submit"
                className="btn btn-primary py-4 px-6 rounded-xl text-sm"
                style={{ boxShadow: '0 4px 20px hsl(168 76% 42% / 0.5)' }}
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            </form>

            {/* Quick links */}
            <div
              className="flex flex-wrap justify-center gap-2 mt-6 animate-fade-in"
              style={{ animationDelay: '320ms' }}
            >
              {['Tourism', 'Government', 'Fishing', 'Education', 'Healthcare'].map(tag => (
                <button
                  key={tag}
                  onClick={() => navigate(`/jobs?q=${tag}`)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 hover:scale-105"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.8)',
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none">
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ height: '60px', width: '100%' }}>
            <path
              d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z"
              fill="hsl(var(--color-bg))"
            />
          </svg>
        </div>
      </section>

      {/* Platform Highlights Section (Authentic facts, strictly no fabricated counts) */}
      <section className="py-12" style={{ background: 'hsl(var(--color-bg))' }}>
        <div className="container-page">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
            {platformHighlights.map(item => (
              <div
                key={item.label}
                className="card p-5 text-center"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'hsl(var(--color-primary) / 0.1)', color: 'hsl(var(--color-primary))' }}
                >
                  {item.icon}
                </div>
                <p
                  className="text-2xl font-black mb-1"
                  style={{ fontFamily: 'Outfit, sans-serif', color: 'hsl(var(--color-text))' }}
                >
                  {item.value}
                </p>
                <p className="text-xs" style={{ color: 'hsl(var(--color-text-muted))' }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16" style={{ background: 'hsl(var(--color-bg-alt))' }}>
        <div className="container-page">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-3" style={{ color: 'hsl(var(--color-text))' }}>
              Why <span className="gradient-text">Batanes Niche</span>?
            </h2>
            <p className="text-sm max-w-md mx-auto" style={{ color: 'hsl(var(--color-text-muted))' }}>
              Not a generic job board. Built exclusively for Batanes.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 stagger-children">
            {featureCards.map(f => (
              <div key={f.title} className="card p-6">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-white"
                  style={{ background: f.color }}
                >
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'hsl(var(--color-text))' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--color-text-muted))' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Jobs Section — Public Job Preview */}
      <section className="py-16" style={{ background: 'hsl(var(--color-bg))' }}>
        <div className="container-page">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-2" style={{ background: 'hsl(var(--color-primary) / 0.1)', color: 'hsl(var(--color-primary))' }}>
                <Briefcase className="w-3.5 h-3.5" />
                Public Job Preview
              </div>
              <h2 className="text-2xl font-black mb-1" style={{ color: 'hsl(var(--color-text))' }}>
                Latest Opportunities
              </h2>
              <p className="text-sm" style={{ color: 'hsl(var(--color-text-muted))' }}>
                Preview available positions. Authenticated users can view complete job descriptions and employer details.
              </p>
            </div>
            <Link to="/jobs" id="link-view-all-jobs" className="btn btn-secondary text-sm self-start sm:self-auto">
              Browse All Jobs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Authentication Callout Banner for Unauthenticated Visitors */}
          {!isAuthenticated && (
            <div
              className="rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--color-primary) / 0.08), hsl(var(--color-secondary) / 0.08))',
                border: '1px solid hsl(var(--color-primary) / 0.2)',
              }}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: 'hsl(var(--color-primary))', color: 'white' }}
                >
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold mb-0.5" style={{ color: 'hsl(var(--color-text))' }}>
                    Sign up or log in to view full job details.
                  </h4>
                  <p className="text-xs" style={{ color: 'hsl(var(--color-text-muted))' }}>
                    Full job descriptions, employer names, exact locations, and direct applications require an account.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <Link
                  to="/login"
                  id="link-preview-login"
                  className="btn btn-secondary text-xs py-2 px-4 rounded-xl flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </Link>
                <Link
                  to="/register"
                  id="link-preview-register"
                  className="btn btn-primary text-xs py-2 px-4 rounded-xl flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Create Account
                </Link>
              </div>
            </div>
          )}

          {/* Job Previews Grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => <JobCardSkeleton key={i} />)}
            </div>
          ) : error ? (
            <div
              className="card p-8 text-center flex flex-col items-center justify-center"
              style={{ border: '1px dashed hsl(var(--color-border))' }}
            >
              <AlertCircle className="w-8 h-8 mb-2" style={{ color: 'hsl(var(--color-warning))' }} />
              <p className="text-sm font-medium mb-3" style={{ color: 'hsl(var(--color-text))' }}>{error}</p>
              <button
                onClick={fetchJobs}
                className="btn btn-secondary text-xs px-4 py-2"
              >
                Try Again
              </button>
            </div>
          ) : featuredJobs.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
              {featuredJobs.map(job => (
                <JobPreviewCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div
              className="text-center py-16 px-4 rounded-2xl"
              style={{
                background: 'hsl(var(--color-bg-alt))',
                border: '1px dashed hsl(var(--color-border))',
                color: 'hsl(var(--color-text-muted))',
              }}
            >
              <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <h3 className="text-base font-bold mb-1" style={{ color: 'hsl(var(--color-text))' }}>
                No active jobs posted at this time
              </h3>
              <p className="text-xs max-w-sm mx-auto">
                Check back soon or register an account to receive alerts as soon as employers post new positions.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="py-20"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--color-primary)) 0%, hsl(var(--color-secondary)) 100%)',
        }}
      >
        <div className="container-page text-center">
          <h2
            className="text-3xl sm:text-4xl font-black text-white mb-4"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            {isAuthenticated ? 'Ready to discover more opportunities?' : 'Ready to find your next opportunity?'}
          </h2>
          <p className="text-white/75 mb-8 max-w-md mx-auto">
            {isAuthenticated
              ? 'Visit your dashboard to view personalized matches and track applications.'
              : 'Join Ivatan professionals already finding meaningful work on Batanes Niche.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                id="cta-dashboard"
                className="btn text-sm px-8 py-3.5 rounded-xl font-bold bg-white"
                style={{ color: 'hsl(var(--color-primary-dark))' }}
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                to="/register"
                id="cta-register"
                className="btn text-sm px-8 py-3.5 rounded-xl font-bold bg-white"
                style={{ color: 'hsl(var(--color-primary-dark))' }}
              >
                Create Free Account
              </Link>
            )}
            <Link
              to="/jobs"
              id="cta-browse"
              className="btn text-sm px-8 py-3.5 rounded-xl font-bold text-white"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.4)' }}
            >
              Browse Jobs <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
