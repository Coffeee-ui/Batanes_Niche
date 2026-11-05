import React, { useState, useEffect } from 'react';
import { Search, MapPin, Users, X, AlertCircle, Briefcase, GraduationCap, Clock, CheckCircle } from 'lucide-react';
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
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

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

  useEffect(() => {
    load(q, municipality);
  }, [q, municipality]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQ(searchInput);
  };

  return (
    <div className="container-page py-8">
      {/* Page Title & Subtitle */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-1 tracking-tight">
          Candidate Directory
        </h1>
        <p className="text-sm text-muted">
          {total} job seeker{total !== 1 ? 's' : ''} actively looking for opportunities across Batanes
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-surface border border-border rounded-2xl p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              id="candidates-search"
              type="text"
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-border bg-background text-foreground placeholder:text-muted/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              placeholder="Search by name, skill, or title…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
          </div>
          <button
            id="btn-search-candidates"
            type="submit"
            className="px-5 py-2.5 rounded-full bg-primary text-foreground font-bold text-sm hover:opacity-95 active:scale-95 transition-all flex items-center justify-center shrink-0"
          >
            <Search className="w-4 h-4 mr-1.5" />
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          <select
            id="filter-candidates-municipality"
            className="px-4 py-2.5 rounded-full border border-border bg-background text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all min-w-[170px]"
            value={municipality}
            onChange={e => setMunicipality(e.target.value)}
          >
            <option value="">All Municipalities</option>
            {MUNICIPALITIES.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {(q || municipality || searchInput) && (
            <button
              id="btn-clear-candidate-filters"
              type="button"
              onClick={() => {
                setQ('');
                setSearchInput('');
                setMunicipality('');
              }}
              className="px-3.5 py-2.5 rounded-full border border-border bg-background text-muted hover:text-foreground text-sm font-medium transition-colors flex items-center gap-1 shrink-0"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Privacy Notice Card */}
      <div className="bg-highlight/40 border border-primary/20 rounded-2xl px-5 py-3.5 mb-6 text-xs text-foreground/80 flex items-start gap-3">
        <span className="text-base shrink-0 mt-0.5">🔒</span>
        <div className="leading-relaxed">
          <strong className="font-semibold text-foreground">Ivatan Privacy Guarantee:</strong> Contact details (email and phone number) are protected. They are automatically shared with employers only after an applicant submits an application to your opening.
        </div>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-2xl p-4 mb-6 flex items-center gap-3 text-sm text-danger">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Candidate Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="No candidates found"
          description="Try broadening your search terms or selecting a different municipality."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
          {candidates.map(c => {
            const skills = c.skills?.split(',').map(s => s.trim()).filter(Boolean) ?? [];
            const displaySkills = skills.slice(0, 4);
            const remainingCount = skills.length - displaySkills.length;
            const initials = c.full_name
              .split(' ')
              .map(p => p[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')
              .toUpperCase() || 'C';

            return (
              <div
                key={c.id}
                id={`candidate-${c.id}`}
                className="bg-surface border border-border rounded-2xl p-5 hover:border-primary/60 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top: Avatar & Candidate Info */}
                  <div className="flex items-start gap-3.5 mb-4">
                    <div className="w-12 h-12 rounded-full bg-header text-primary border border-border flex items-center justify-center font-bold text-base shrink-0 shadow-sm">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base font-bold text-foreground truncate">
                        {c.full_name}
                      </h2>
                      <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-muted" />
                        {c.municipality}, {c.island}
                      </p>
                      <p className="text-xs text-muted/80 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-muted" />
                        {c.experience_years != null ? `${c.experience_years} yr${c.experience_years !== 1 ? 's' : ''} experience` : 'Experience not listed'}
                      </p>
                    </div>
                  </div>

                  {/* Bio */}
                  {c.bio ? (
                    <p className="text-xs text-muted line-clamp-2 leading-relaxed mb-3">
                      "{c.bio}"
                    </p>
                  ) : (
                    <p className="text-xs text-muted/60 italic mb-3">
                      Ivatan talent ready for local opportunities.
                    </p>
                  )}

                  {/* Skills Chips */}
                  {displaySkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {displaySkills.map(s => (
                        <span
                          key={s}
                          className="px-2.5 py-1 rounded-full text-xs font-medium bg-neutral text-foreground border border-border/50"
                        >
                          {s}
                        </span>
                      ))}
                      {remainingCount > 0 && (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-neutral text-muted border border-border/50">
                          +{remainingCount}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom: Profile Progress & View Button */}
                <div className="pt-3 border-t border-border mt-2 space-y-3">
                  <ProgressBar
                    value={c.profile_completeness ?? 0}
                    label="Profile completeness"
                    showPercent
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedCandidate(c)}
                    className="w-full py-2.5 rounded-full border border-border text-foreground hover:bg-neutral font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    View profile
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Candidate Profile Details Modal */}
      {selectedCandidate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setSelectedCandidate(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-surface border border-border rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-5"
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedCandidate(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-muted hover:text-foreground hover:bg-neutral transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Candidate Identity */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-header text-primary border border-border flex items-center justify-center font-bold text-xl shrink-0 shadow-sm">
                {selectedCandidate.full_name
                  .split(' ')
                  .map(p => p[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join('')
                  .toUpperCase() || 'C'}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-bold text-foreground">
                  {selectedCandidate.full_name}
                </h3>
                <p className="text-xs text-muted flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-muted" />
                  {selectedCandidate.municipality}, {selectedCandidate.island}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/20 text-foreground border border-primary/30">
                    Candidate
                  </span>
                  <span className="text-xs text-muted">
                    {selectedCandidate.profile_completeness ?? 0}% complete
                  </span>
                </div>
              </div>
            </div>

            {/* Bio */}
            {selectedCandidate.bio && (
              <div className="bg-neutral/40 rounded-2xl p-4 border border-border/50">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                  About
                </p>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {selectedCandidate.bio}
                </p>
              </div>
            )}

            {/* Experience & Education */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-surface border border-border rounded-xl p-3">
                <p className="text-muted flex items-center gap-1 font-semibold mb-1">
                  <Briefcase className="w-3.5 h-3.5 text-muted" /> Experience
                </p>
                <p className="text-sm font-bold text-foreground">
                  {selectedCandidate.experience_years != null ? `${selectedCandidate.experience_years} years` : 'Not specified'}
                </p>
              </div>
              <div className="bg-surface border border-border rounded-xl p-3">
                <p className="text-muted flex items-center gap-1 font-semibold mb-1">
                  <GraduationCap className="w-3.5 h-3.5 text-muted" /> Education
                </p>
                <p className="text-sm font-bold text-foreground">
                  {selectedCandidate.education || 'Not specified'}
                </p>
              </div>
            </div>

            {/* Skills */}
            {selectedCandidate.skills && (
              <div>
                <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                  Skills & Qualifications
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidate.skills.split(',').map(s => s.trim()).filter(Boolean).map(skill => (
                    <span
                      key={skill}
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-neutral text-foreground border border-border"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Privacy contact disclaimer */}
            <div className="border-t border-border pt-4 text-xs text-muted flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary shrink-0" />
              <span>Contact info will be accessible once the candidate submits an application.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
