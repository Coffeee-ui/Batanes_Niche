import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  User as UserIcon,
  MapPin,
  Bookmark,
  BookmarkCheck,
  RefreshCw,
  GraduationCap,
  Briefcase,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usersApi, extractError, resolveMediaUrl } from '../../api/client';
import { Spinner } from '../../components/ui';
import type { Candidate, SavedCandidate } from '../../types';

const MUNICIPALITIES = ['All', 'Basco', 'Itbayat', 'Ivana', 'Mahatao', 'Sabtang', 'Uyugan'];
const EMPLOYMENT_TYPES = ['All', 'Full-time', 'Part-time', 'Contract', 'Seasonal', 'Freelance'];

export default function FindCandidatesPage() {
  const { user } = useAuth();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [savedCandidateIds, setSavedCandidateIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [query, setQuery] = useState('');
  const [municipality, setMunicipality] = useState('All');
  const [employmentType, setEmploymentType] = useState('All');
  const [minExperience, setMinExperience] = useState<number | undefined>();

  const fetchSavedCandidates = async () => {
    try {
      const savedList = await usersApi.listSavedCandidates();
      const ids = new Set(savedList.map((s: SavedCandidate) => s.candidate_id));
      setSavedCandidateIds(ids);
    } catch {}
  };

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await usersApi.candidates({
        skill: query.trim() || undefined,
        municipality: municipality !== 'All' ? municipality : undefined,
        desired_employment_type: employmentType !== 'All' ? employmentType : undefined,
        experience_years: minExperience,
        page_size: 50,
      });
      setCandidates(res.items);
      await fetchSavedCandidates();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }, [query, municipality, employmentType, minExperience]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCandidates();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchCandidates]);

  const handleToggleSave = async (candidateId: number) => {
    const isSaved = savedCandidateIds.has(candidateId);
    try {
      if (isSaved) {
        await usersApi.removeSavedCandidate(candidateId);
        setSavedCandidateIds(prev => {
          const next = new Set(prev);
          next.delete(candidateId);
          return next;
        });
      } else {
        await usersApi.saveCandidate(candidateId);
        setSavedCandidateIds(prev => new Set(prev).add(candidateId));
      }
    } catch (err) {
      alert(extractError(err));
    }
  };

  return (
    <div className="container-page py-8 space-y-6">
      {/* Header with Saved Candidates link */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Find Candidates
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discover qualified Ivatan job seekers open to new opportunities across Batanes.
          </p>
        </div>
        <Link
          to="/candidates/saved"
          className="btn btn-secondary text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 shrink-0"
        >
          <Bookmark className="w-4 h-4 text-primary" />
          <span>Saved Candidates ({savedCandidateIds.size})</span>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="card p-4 rounded-2xl border border-border bg-surface space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by skills (e.g. Electrical, Cooking, Tour Guiding)..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="input pl-10 text-sm w-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={municipality}
              onChange={e => setMunicipality(e.target.value)}
              className="input select text-sm min-w-[140px]"
            >
              {MUNICIPALITIES.map(m => (
                <option key={m} value={m}>
                  {m === 'All' ? 'All Municipalities' : m}
                </option>
              ))}
            </select>

            <select
              value={employmentType}
              onChange={e => setEmploymentType(e.target.value)}
              className="input select text-sm min-w-[140px]"
            >
              {EMPLOYMENT_TYPES.map(t => (
                <option key={t} value={t}>
                  {t === 'All' ? 'All Job Types' : t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-16 text-center space-y-3">
          <Spinner size="lg" className="mx-auto" />
          <p className="text-sm text-muted-foreground">Searching candidates...</p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="card p-8 rounded-2xl border border-danger/20 bg-danger/5 text-center space-y-4">
          <p className="text-sm text-danger font-medium">{error}</p>
          <button
            type="button"
            onClick={fetchCandidates}
            className="btn btn-secondary inline-flex items-center gap-2 text-xs font-semibold mx-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && candidates.length === 0 && (
        <div className="card p-12 rounded-2xl border border-dashed border-border bg-surface text-center space-y-3">
          <UserIcon className="w-10 h-10 text-muted-foreground mx-auto" />
          <h3 className="text-base font-bold text-foreground">No discoverable candidates found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Try adjusting your search criteria or removing filters to view more candidates.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setMunicipality('All');
              setEmploymentType('All');
              setMinExperience(undefined);
            }}
            className="btn btn-secondary text-xs font-semibold mt-2"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Candidates Grid */}
      {!loading && !error && candidates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidates.map(cand => {
            const isSaved = savedCandidateIds.has(cand.id);
            const skillsList = cand.skills ? cand.skills.split(',').map(s => s.trim()).filter(Boolean) : [];

            return (
              <div
                key={cand.id}
                className="card p-5 rounded-2xl border border-border bg-surface hover:border-primary/50 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-base overflow-hidden shrink-0">
                        {cand.profile_pic ? (
                          <img
                            src={resolveMediaUrl(cand.profile_pic) || cand.profile_pic}
                            alt={cand.full_name}
                            onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          cand.full_name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground">
                          {cand.full_name}
                        </h3>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          {cand.municipality}, {cand.island}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleSave(cand.id)}
                      className={`p-2 rounded-xl transition-colors ${
                        isSaved
                          ? 'text-primary bg-primary/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                      title={isSaved ? 'Remove from saved' : 'Save candidate'}
                    >
                      {isSaved ? <BookmarkCheck className="w-4 h-4 fill-current" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                  </div>

                  {cand.bio && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {cand.bio}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-1">
                    {cand.experience_years !== undefined && cand.experience_years > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-[11px] font-medium">
                        <Briefcase className="w-3 h-3" />
                        {cand.experience_years} {cand.experience_years === 1 ? 'yr' : 'yrs'} exp
                      </span>
                    )}
                    {cand.desired_employment_type && (
                      <span className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-medium">
                        {cand.desired_employment_type}
                      </span>
                    )}
                    {cand.education && (
                      <span className="flex items-center gap-1 text-[11px]">
                        <GraduationCap className="w-3 h-3" />
                        {cand.education}
                      </span>
                    )}
                  </div>

                  {skillsList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {skillsList.slice(0, 4).map(skill => (
                        <span
                          key={skill}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
                        >
                          {skill}
                        </span>
                      ))}
                      {skillsList.length > 4 && (
                        <span className="text-[10px] text-muted-foreground px-1.5 py-0.5">
                          +{skillsList.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-border/60 mt-4 text-[11px] text-muted-foreground">
                  <span>CV accessible after candidate applies to your vacancies.</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
