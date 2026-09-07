import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, MapPin, SlidersHorizontal, X, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { jobsApi, extractError } from '../../api/client';
import type { Job, JobFilters } from '../../types';
import JobCard from '../../components/ui/JobCard';
import { JobCardSkeleton, EmptyState } from '../../components/ui';

const MUNICIPALITIES = ['Basco', 'Itbayat', 'Ivana', 'Mahatao', 'Sabtang', 'Uyugan'];
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Seasonal', 'Freelance'];

export default function JobsPage() {
  const [params, setParams] = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const page = parseInt(params.get('page') || '1');
  const q = params.get('q') || '';
  const municipality = params.get('municipality') || '';
  const employment_type = params.get('employment_type') || '';
  const min_salary = params.get('min_salary') ? parseInt(params.get('min_salary')!) : undefined;

  const [searchInput, setSearchInput] = useState(q);
  const [error, setError] = useState('');

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const filters: JobFilters = { page, page_size: 12 };
      if (q) filters.q = q;
      if (municipality) filters.municipality = municipality;
      if (employment_type) filters.employment_type = employment_type;
      if (min_salary) filters.min_salary = min_salary;

      const data = await jobsApi.list(filters);
      setJobs(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err: unknown) {
      setError(extractError(err));
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [page, q, municipality, employment_type, min_salary]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setParams(next);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParam('q', searchInput);
  };

  const clearFilters = () => {
    setSearchInput('');
    setParams(new URLSearchParams());
  };

  const hasFilters = q || municipality || employment_type || min_salary;

  return (
    <div className="container-page py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2" style={{ color: 'hsl(var(--color-text))' }}>
          Browse Jobs
        </h1>
        <p className="text-sm" style={{ color: 'hsl(var(--color-text-muted))' }}>
          {total} job{total !== 1 ? 's' : ''} available across Batanes
        </p>
      </div>

      {/* Search & Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex-1 relative flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--color-text-faint))' }} />
            <input
              id="jobs-search-input"
              type="text"
              className="input pl-10 pr-4"
              placeholder="Search job title or skill…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
          </div>
          <button id="btn-jobs-search" type="submit" className="btn btn-primary px-5">
            <Search className="w-4 h-4" />
          </button>
        </form>

        <button
          id="btn-toggle-filters"
          onClick={() => setShowFilters(s => !s)}
          className={`btn btn-secondary gap-2 ${showFilters ? 'ring-2 ring-primary/30' : ''}`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {hasFilters && (
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: 'hsl(var(--color-danger))' }}
            />
          )}
        </button>

        {hasFilters && (
          <button id="btn-clear-filters" onClick={clearFilters} className="btn btn-ghost text-sm">
            <X className="w-4 h-4" /> Clear
          </button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div
          className="rounded-xl p-4 mb-6 animate-fade-in grid grid-cols-1 sm:grid-cols-3 gap-4"
          style={{
            background: 'hsl(var(--color-surface))',
            border: '1px solid hsl(var(--color-border))',
          }}
        >
          <div>
            <label className="label text-xs">Municipality</label>
            <select
              id="filter-municipality"
              className="input select text-sm"
              value={municipality}
              onChange={e => setParam('municipality', e.target.value)}
            >
              <option value="">All Municipalities</option>
              {MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">Employment Type</label>
            <select
              id="filter-employment-type"
              className="input select text-sm"
              value={employment_type}
              onChange={e => setParam('employment_type', e.target.value)}
            >
              <option value="">All Types</option>
              {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">Minimum Salary (₱/mo)</label>
            <select
              id="filter-min-salary"
              className="input select text-sm"
              value={min_salary?.toString() || ''}
              onChange={e => setParam('min_salary', e.target.value)}
            >
              <option value="">No minimum</option>
              <option value="10000">₱10,000</option>
              <option value="15000">₱15,000</option>
              <option value="20000">₱20,000</option>
              <option value="30000">₱30,000</option>
              <option value="50000">₱50,000</option>
            </select>
          </div>
        </div>
      )}

      {/* Active Filter Pills */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2 mb-6">
          {q && (
            <span className="badge badge-primary">
              "{q}"
              <button onClick={() => { setSearchInput(''); setParam('q', ''); }} aria-label="Remove search"><X className="w-3 h-3" /></button>
            </span>
          )}
          {municipality && (
            <span className="badge badge-primary">
              <MapPin className="w-3 h-3" /> {municipality}
              <button onClick={() => setParam('municipality', '')} aria-label="Remove municipality"><X className="w-3 h-3" /></button>
            </span>
          )}
          {employment_type && (
            <span className="badge badge-primary">
              {employment_type}
              <button onClick={() => setParam('employment_type', '')} aria-label="Remove type"><X className="w-3 h-3" /></button>
            </span>
          )}
        </div>
      )}

      {error && (
        <div
          className="rounded-xl p-4 mb-6 flex items-center gap-3 text-sm"
          style={{
            background: 'hsl(var(--color-danger) / 0.08)',
            border: '1px solid hsl(var(--color-danger) / 0.25)',
            color: 'hsl(var(--color-danger))',
          }}
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Job Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 12 }).map((_, i) => <JobCardSkeleton key={i} />)}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={<Search className="w-8 h-8" />}
          title="No jobs found"
          description={hasFilters ? 'Try adjusting your filters or search terms.' : 'No jobs have been posted yet. Check back soon!'}
          action={hasFilters ? (
            <button onClick={clearFilters} className="btn btn-secondary">Clear Filters</button>
          ) : undefined}
        />
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {jobs.map(job => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                id="btn-prev-page"
                disabled={page <= 1}
                onClick={() => setParam('page', String(page - 1))}
                className="btn btn-secondary p-2.5"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let p = i + 1;
                if (totalPages > 7) {
                  if (page <= 4) p = i + 1;
                  else if (page >= totalPages - 3) p = totalPages - 6 + i;
                  else p = page - 3 + i;
                }
                return (
                  <button
                    key={p}
                    id={`btn-page-${p}`}
                    onClick={() => setParam('page', String(p))}
                    className="btn w-9 h-9 text-sm"
                    style={
                      p === page
                        ? { background: 'linear-gradient(135deg, hsl(var(--color-primary)), hsl(var(--color-secondary)))', color: 'white' }
                        : { background: 'hsl(var(--color-surface))', border: '1px solid hsl(var(--color-border))', color: 'hsl(var(--color-text-muted))' }
                    }
                  >
                    {p}
                  </button>
                );
              })}
              <button
                id="btn-next-page"
                disabled={page >= totalPages}
                onClick={() => setParam('page', String(page + 1))}
                className="btn btn-secondary p-2.5"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
