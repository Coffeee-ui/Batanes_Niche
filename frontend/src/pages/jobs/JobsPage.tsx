import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { jobsApi, extractError } from '../../api/client';
import type { Job, JobFilters } from '../../types';
import JobCard from '../../components/ui/JobCard';
import { JobCardSkeleton, EmptyState } from '../../components/ui';

const MUNICIPALITIES = [
  { label: 'All of Batanes', value: '' },
  { label: 'Basco', value: 'Basco' },
  { label: 'Mahatao', value: 'Mahatao' },
  { label: 'Ivana', value: 'Ivana' },
  { label: 'Uyugan', value: 'Uyugan' },
  { label: 'Sabtang', value: 'Sabtang' },
  { label: 'Itbayat', value: 'Itbayat' },
];

const CATEGORIES = ['Tourism', 'Fishing', 'Farming', 'Construction', 'Transport', 'Retail'];
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Seasonal', 'Contract'];

export default function JobsPage() {
  const [params, setParams] = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

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
      const filters: JobFilters = { page, page_size: 10 };
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

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

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

  const toggleCategory = (cat: string) => {
    if (q === cat) {
      setParam('q', '');
      setSearchInput('');
    } else {
      setParam('q', cat);
      setSearchInput(cat);
    }
  };

  const toggleEmploymentType = (type: string) => {
    if (employment_type === type) {
      setParam('employment_type', '');
    } else {
      setParam('employment_type', type);
    }
  };

  const hasFilters = Boolean(q || municipality || employment_type || min_salary);

  return (
    <div className="container-page py-8 space-y-8">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-3xl font-black text-foreground mb-1">
          Browse jobs
        </h1>
        <p className="text-sm text-muted-foreground">
          Openings across the six municipalities of Batanes.
        </p>
      </div>

      {/* Pill-Shaped Top Search Bar */}
      <form
        onSubmit={handleSearch}
        className="card p-2 rounded-full shadow-md flex flex-col sm:flex-row items-center gap-2 max-w-4xl border-border"
      >
        <div className="flex-1 w-full pl-4 pr-2 py-2 flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            id="jobs-search-input"
            type="text"
            placeholder="Job or keyword"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-border/60 px-3 py-1">
          <select
            id="filter-municipality"
            value={municipality}
            onChange={e => setParam('municipality', e.target.value)}
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
          id="btn-jobs-search"
          type="submit"
          className="btn btn-primary rounded-full px-7 py-2.5 text-xs font-bold w-full sm:w-auto shrink-0"
          style={{ minHeight: '44px' }}
        >
          Search
        </button>
      </form>

      {/* Two Column Layout: Left Filter Card, Right Jobs Stack */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Filter Card */}
        <aside className="card p-6 space-y-6 lg:sticky lg:top-24">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">
              Filters
            </h2>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Category
            </h3>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => {
                const isActive = q.toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`chip ${isActive ? 'chip-active' : ''}`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Job Type Chips */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Job type
            </h3>
            <div className="flex flex-wrap gap-2">
              {EMPLOYMENT_TYPES.map(type => {
                const isActive = employment_type.toLowerCase() === type.toLowerCase();
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleEmploymentType(type)}
                    className={`chip ${isActive ? 'chip-active' : ''}`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clear Filters Button */}
          <button
            id="btn-clear-filters"
            type="button"
            onClick={clearFilters}
            disabled={!hasFilters}
            className="btn btn-secondary w-full text-xs font-semibold py-2.5 rounded-xl disabled:opacity-40"
          >
            Clear filters
          </button>
        </aside>

        {/* Right Job List */}
        <main className="lg:col-span-3 space-y-4">
          {error && (
            <div className="card p-4 text-xs text-danger border-danger/30">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <JobCardSkeleton key={i} />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <EmptyState
              title="No jobs found"
              description="No listings match your search criteria. Try removing some filters or search for another skill."
              action={
                hasFilters ? (
                  <button onClick={clearFilters} className="btn btn-primary text-xs">
                    Clear all filters
                  </button>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-4">
              {jobs.map(job => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-border">
              <button
                onClick={() => setParam('page', String(page - 1))}
                disabled={page <= 1}
                className="btn btn-secondary text-xs gap-1 py-2 px-3 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <span className="text-xs text-muted-foreground font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setParam('page', String(page + 1))}
                disabled={page >= totalPages}
                className="btn btn-secondary text-xs gap-1 py-2 px-3 disabled:opacity-40"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
