import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { jobsApi, extractError } from '../../api/client';
import type { Job, JobFilters } from '../../types';
import JobCard from '../../components/ui/JobCard';
import { JobCardSkeleton, EmptyState, Modal, CategoryIcon } from '../../components/ui';

const MUNICIPALITIES = [
  { label: 'All of Batanes', value: '' },
  { label: 'Basco', value: 'Basco' },
  { label: 'Mahatao', value: 'Mahatao' },
  { label: 'Ivana', value: 'Ivana' },
  { label: 'Uyugan', value: 'Uyugan' },
  { label: 'Sabtang', value: 'Sabtang' },
  { label: 'Itbayat', value: 'Itbayat' },
];

const CATEGORIES = [
  'Tourism',
  'Fishing',
  'Farming',
  'Construction',
  'Transport',
  'Retail',
  'Hospitality',
  'Healthcare',
  'Education',
  'Public Service',
];
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Seasonal', 'Contract'];

export default function JobsPage() {
  const [params, setParams] = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const page = parseInt(params.get('page') || '1', 10);
  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const municipality = params.get('municipality') || '';
  const employment_type = params.get('employment_type') || '';
  const sort = (params.get('sort') as 'newest' | 'salary_desc' | 'salary_asc') || 'newest';
  const min_salary = params.get('min_salary') ? parseInt(params.get('min_salary')!, 10) : undefined;

  const [searchInput, setSearchInput] = useState(q);
  const [error, setError] = useState('');

  // Keep local searchInput in sync when URL changes (e.g. back navigation or clear)
  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const filters: JobFilters = { page, page_size: 10 };
      if (q) filters.q = q;
      if (category) filters.category = category;
      if (municipality) filters.municipality = municipality;
      if (employment_type) filters.employment_type = employment_type;
      if (min_salary) filters.min_salary = min_salary;
      if (sort) filters.sort = sort;

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
  }, [page, q, category, municipality, employment_type, sort, min_salary]);

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
    setParam('q', searchInput.trim());
  };

  const clearFilters = () => {
    setSearchInput('');
    setParams(new URLSearchParams());
  };

  // DATA-02: Category toggling only affects 'category' param, NOT 'q'
  const toggleCategory = (cat: string) => {
    if (category.toLowerCase() === cat.toLowerCase()) {
      setParam('category', '');
    } else {
      setParam('category', cat);
    }
  };

  const toggleEmploymentType = (type: string) => {
    if (employment_type.toLowerCase() === type.toLowerCase()) {
      setParam('employment_type', '');
    } else {
      setParam('employment_type', type);
    }
  };

  const hasFilters = Boolean(q || category || municipality || employment_type || min_salary || sort !== 'newest');
  const activeFilterCount = [category, municipality, employment_type, q].filter(Boolean).length;

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
        className="card p-2 rounded-2xl sm:rounded-full shadow-md flex flex-col sm:flex-row items-center gap-2 max-w-4xl border-border"
      >
        <div className="flex-1 w-full pl-4 pr-2 py-2 flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            id="jobs-search-input"
            type="text"
            aria-label="Search jobs by title or keyword"
            placeholder="e.g. Front Desk Staff, Carpenter, Tour Guide"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-base sm:text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-border/60 px-3 py-1">
          <select
            id="filter-municipality"
            aria-label="Filter by municipality"
            value={municipality}
            onChange={e => setParam('municipality', e.target.value)}
            className="w-full sm:w-44 bg-transparent border-none outline-none text-base sm:text-xs text-foreground cursor-pointer py-2 pr-6"
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
          className="btn btn-primary rounded-full px-7 py-2.5 text-xs font-bold w-full sm:w-auto shrink-0 min-h-[44px]"
        >
          Search
        </button>
      </form>

      {/* Mobile Top Controls: Filter Button & Sort (< lg) */}
      <div className="flex lg:hidden items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="btn btn-secondary text-xs px-4 py-2 font-semibold flex items-center gap-2 min-h-[44px]"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary text-foreground font-bold text-[11px] flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* DATA-03: Sort Dropdown */}
        <div className="flex items-center gap-1.5">
          <label htmlFor="mobile-sort-select" className="sr-only">Sort jobs</label>
          <select
            id="mobile-sort-select"
            aria-label="Sort jobs"
            value={sort}
            onChange={e => setParam('sort', e.target.value)}
            className="select text-xs py-2 px-3 rounded-xl border border-border bg-surface text-foreground font-medium min-h-[44px]"
          >
            <option value="newest">Newest first</option>
            <option value="salary_desc">Salary high to low</option>
            <option value="salary_asc">Salary low to high</option>
          </select>
        </div>
      </div>

      {/* Two Column Layout: Left Filter Card, Right Jobs Stack */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Filter Card (Desktop Persistent Sidebar) */}
        <aside className="hidden lg:block card p-6 space-y-6 lg:sticky lg:top-24">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">
              Filters
            </h2>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 min-h-[36px]"
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
                const isActive = category.toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`chip ${isActive ? 'chip-active' : ''}`}
                  >
                    <CategoryIcon category={cat} className="w-3.5 h-3.5 mr-1.5" />
                    <span>{cat}</span>
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
            className="btn btn-secondary w-full text-xs font-semibold py-2.5 rounded-xl disabled:opacity-40 min-h-[44px]"
          >
            Clear filters
          </button>
        </aside>

        {/* Right Job List */}
        <main className="lg:col-span-3 space-y-4">
          {/* Desktop Sort Header */}
          <div className="hidden lg:flex items-center justify-between pb-1">
            <p className="text-xs text-muted-foreground font-medium">
              Showing <strong className="text-foreground">{jobs.length}</strong> of <strong className="text-foreground">{total}</strong> jobs
            </p>

            <div className="flex items-center gap-2">
              <label htmlFor="desktop-sort-select" className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                Sort by:
              </label>
              <select
                id="desktop-sort-select"
                aria-label="Sort jobs"
                value={sort}
                onChange={e => setParam('sort', e.target.value)}
                className="select text-xs py-1.5 px-3 rounded-xl border border-border bg-surface text-foreground font-medium"
              >
                <option value="newest">Newest first</option>
                <option value="salary_desc">Salary high to low</option>
                <option value="salary_asc">Salary low to high</option>
              </select>
            </div>
          </div>

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
                  <button onClick={clearFilters} className="btn btn-primary text-xs min-h-[44px]">
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
                className="btn btn-secondary text-xs gap-1 py-2 px-3 disabled:opacity-40 min-h-[44px]"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <span className="text-xs text-muted-foreground font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setParam('page', String(page + 1))}
                disabled={page >= totalPages}
                className="btn btn-secondary text-xs gap-1 py-2 px-3 disabled:opacity-40 min-h-[44px]"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Collapsible Filters Panel / Bottom Sheet (RESP-01 / Design E) */}
      <Modal
        isOpen={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        title="Filters"
        asBottomSheet
        maxWidth="max-w-md"
      >
        <div className="space-y-6 pt-1">
          {/* Category Section */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Category
            </h3>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => {
                const isActive = category.toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`chip ${isActive ? 'chip-active' : ''}`}
                  >
                    <CategoryIcon category={cat} className="w-3.5 h-3.5 mr-1.5" />
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Job Type Section */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Job Type
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

          {/* Municipality Selector */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Municipality
            </h3>
            <select
              aria-label="Filter by municipality"
              value={municipality}
              onChange={e => setParam('municipality', e.target.value)}
              className="select w-full text-xs py-3 px-4 rounded-xl border border-border bg-surface text-foreground font-medium min-h-[44px]"
            >
              {MUNICIPALITIES.map(m => (
                <option key={m.label} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Bottom Action Buttons: Show N Jobs & Clear */}
          <div className="flex flex-col gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="btn btn-primary w-full text-sm py-3 font-bold rounded-xl min-h-[44px]"
            >
              Show {total} jobs
            </button>
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  clearFilters();
                  setMobileFiltersOpen(false);
                }}
                className="btn btn-secondary w-full text-sm py-3 font-semibold rounded-xl min-h-[44px]"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
