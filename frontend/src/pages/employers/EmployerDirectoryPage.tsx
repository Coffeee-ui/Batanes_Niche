import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Building2, MapPin, Briefcase, RefreshCw, ArrowRight } from 'lucide-react';
import { usersApi, extractError, resolveMediaUrl } from '../../api/client';
import { Spinner } from '../../components/ui';
import type { Employer } from '../../types';

const MUNICIPALITIES = ['All', 'Basco', 'Itbayat', 'Ivana', 'Mahatao', 'Sabtang', 'Uyugan'];

export default function EmployerDirectoryPage() {
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [query, setQuery] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState('All');
  const [onlyWithVacancies, setOnlyWithVacancies] = useState(false);

  const fetchEmployers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await usersApi.employers({
        company: query.trim() || undefined,
        municipality: selectedMunicipality !== 'All' ? selectedMunicipality : undefined,
        has_vacancies: onlyWithVacancies ? true : undefined,
      });
      setEmployers(data);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }, [query, selectedMunicipality, onlyWithVacancies]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmployers();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchEmployers]);

  return (
    <div className="container-page py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
          Employer Directory
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Discover verified local enterprises, organizations, and businesses operating across Batanes.
        </p>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="card p-4 rounded-2xl border border-border bg-surface space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search companies by name or keywords..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="input pl-10 text-sm w-full"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedMunicipality}
              onChange={e => setSelectedMunicipality(e.target.value)}
              className="input select text-sm min-w-[150px]"
            >
              {MUNICIPALITIES.map(m => (
                <option key={m} value={m}>
                  {m === 'All' ? 'All Municipalities' : m}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={onlyWithVacancies}
                onChange={e => setOnlyWithVacancies(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              Active Vacancies Only
            </label>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-16 text-center space-y-3">
          <Spinner size="lg" className="mx-auto" />
          <p className="text-sm text-muted-foreground">Loading employer directory...</p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="card p-8 rounded-2xl border border-danger/20 bg-danger/5 text-center space-y-4">
          <p className="text-sm text-danger font-medium">{error}</p>
          <button
            type="button"
            onClick={fetchEmployers}
            className="btn btn-secondary inline-flex items-center gap-2 text-xs font-semibold mx-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && employers.length === 0 && (
        <div className="card p-12 rounded-2xl border border-dashed border-border bg-surface text-center space-y-3">
          <Building2 className="w-10 h-10 text-muted-foreground mx-auto" />
          <h3 className="text-base font-bold text-foreground">No employers found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            We couldn't find any employers matching your current filters. Try adjusting your search query or municipality.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSelectedMunicipality('All');
              setOnlyWithVacancies(false);
            }}
            className="btn btn-secondary text-xs font-semibold mt-2"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Employers Grid */}
      {!loading && !error && employers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employers.map(emp => (
            <Link
              key={emp.id}
              to={`/employers/${emp.id}`}
              className="card p-5 rounded-2xl border border-border bg-surface hover:border-primary/50 transition-all hover:shadow-md flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-lg overflow-hidden shrink-0">
                    {emp.profile_pic ? (
                      <img
                        src={resolveMediaUrl(emp.profile_pic) || emp.profile_pic}
                        alt={emp.company_name}
                        onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      emp.company_name.charAt(0).toUpperCase()
                    )}
                  </div>
                  {emp.active_vacancies_count > 0 ? (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-success/15 text-success border border-success/30">
                      {emp.active_vacancies_count} {emp.active_vacancies_count === 1 ? 'vacancy' : 'vacancies'}
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      No open roles
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                    {emp.company_name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{emp.municipality}, {emp.island}</span>
                  </div>
                </div>

                {emp.company_description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {emp.company_description}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-primary mt-4">
                <span>{emp.industry || emp.business_type || 'Local Enterprise'}</span>
                <span className="inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  View Profile <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
