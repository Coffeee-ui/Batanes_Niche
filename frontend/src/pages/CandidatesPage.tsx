import React, { useState, useEffect } from 'react';
import { Search, MapPin, Users, SlidersHorizontal, X, AlertCircle } from 'lucide-react';
import { usersApi, extractError } from '../api/client';
import type { Candidate } from '../types';
import { JobCardSkeleton, EmptyState, ProgressBar } from '../components/ui';

const MUNICIPALITIES = ['Basco', 'Itbayat', 'Ivana', 'Mahatao', 'Sabtang', 'Uyugan'];

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const load = async (query: string, muni: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await usersApi.candidates({ q: query || undefined, municipality: muni || undefined, page_size: 50 });
      setCandidates(data.items || []);
      setTotal(data.total || 0);
    } catch (err: unknown) {
      setError(extractError(err));
      setCandidates([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(q, municipality); }, [q, municipality]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQ(searchInput);
  };

  return (
    <div className="container-page py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black mb-2" style={{ color: 'hsl(var(--color-text))' }}>Candidate Directory</h1>
        <p className="text-sm" style={{ color: 'hsl(var(--color-text-muted))' }}>
          {total} job seeker{total !== 1 ? 's' : ''} actively looking for opportunities in Batanes
        </p>
      </div>

      {/* Search Row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--color-text-faint))' }} />
            <input
              id="candidates-search"
              type="text"
              className="input pl-10"
              placeholder="Search by name or skill…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
          </div>
          <button id="btn-search-candidates" type="submit" className="btn btn-primary px-5">
            <Search className="w-4 h-4" />
          </button>
        </form>
        <select
          id="filter-candidates-municipality"
          className="input select sm:w-48"
          value={municipality}
          onChange={e => setMunicipality(e.target.value)}
        >
          <option value="">All Municipalities</option>
          {MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        {(q || municipality) && (
          <button
            id="btn-clear-candidate-filters"
            onClick={() => { setQ(''); setSearchInput(''); setMunicipality(''); }}
            className="btn btn-ghost text-sm"
          >
            <X className="w-4 h-4" /> Clear
          </button>
        )}
      </div>

      {/* Privacy notice */}
      <div
        className="rounded-xl px-4 py-3 mb-6 text-xs flex items-start gap-2"
        style={{
          background: 'hsl(var(--color-primary) / 0.06)',
          border: '1px solid hsl(var(--color-primary) / 0.15)',
          color: 'hsl(var(--color-primary))',
        }}
      >
        <span className="shrink-0 mt-0.5">🔒</span>
        <span>
          Contact information (email, phone) is hidden to protect job seekers' privacy.
          It is only revealed to employers once a candidate applies to one of your active job listings.
        </span>
      </div>

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

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => <JobCardSkeleton key={i} />)}
        </div>
      ) : candidates.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="No candidates found"
          description="Try different search terms or clear filters."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {candidates.map(c => {
            const skills = c.skills?.split(',').map(s => s.trim()).filter(Boolean).slice(0, 4) ?? [];
            return (
              <div key={c.id} id={`candidate-${c.id}`} className="card p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-black text-white shrink-0"
                    style={{ background: 'linear-gradient(135deg, hsl(var(--color-primary)), hsl(var(--color-secondary)))' }}
                  >
                    {c.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate" style={{ color: 'hsl(var(--color-text))' }}>
                      {c.full_name}
                    </p>
                    <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'hsl(var(--color-text-muted))' }}>
                      <MapPin className="w-3 h-3" />{c.municipality}, {c.island}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--color-text-muted))' }}>
                      {c.experience_years != null ? `${c.experience_years}yr experience` : 'Experience N/A'}
                    </p>
                  </div>
                </div>

                {c.bio && (
                  <p className="text-xs mb-3 line-clamp-2 leading-relaxed" style={{ color: 'hsl(var(--color-text-muted))' }}>
                    {c.bio}
                  </p>
                )}

                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {skills.map(s => <span key={s} className="badge badge-muted text-xs">{s}</span>)}
                    {(c.skills?.split(',').length ?? 0) > 4 && (
                      <span className="badge badge-muted text-xs">+{(c.skills?.split(',').length ?? 0) - 4}</span>
                    )}
                  </div>
                )}

                <div className="pt-3" style={{ borderTop: '1px solid hsl(var(--color-border-subtle))' }}>
                  <ProgressBar
                    value={c.profile_completeness ?? 0}
                    label="Profile"
                    showPercent
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
