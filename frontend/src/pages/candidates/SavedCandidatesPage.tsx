import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookmarkCheck, MapPin, Trash2, User as UserIcon, Briefcase } from 'lucide-react';
import { usersApi, extractError, resolveMediaUrl } from '../../api/client';
import { Spinner } from '../../components/ui';
import type { SavedCandidate } from '../../types';

export default function SavedCandidatesPage() {
  const [savedCandidates, setSavedCandidates] = useState<SavedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSaved = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await usersApi.listSavedCandidates();
      setSavedCandidates(data);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  const handleRemove = async (candidateId: number) => {
    try {
      await usersApi.removeSavedCandidate(candidateId);
      setSavedCandidates(prev => prev.filter(s => s.candidate_id !== candidateId));
    } catch (err) {
      alert(extractError(err));
    }
  };

  return (
    <div className="container-page py-8 space-y-6 max-w-5xl">
      {/* Top Header */}
      <div>
        <Link
          to="/candidates"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Find Candidates</span>
        </Link>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
          Saved Candidates
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review talent you have shortlisted for upcoming vacancies in Batanes.
        </p>
      </div>

      {loading && (
        <div className="py-16 text-center space-y-3">
          <Spinner size="lg" className="mx-auto" />
          <p className="text-sm text-muted-foreground">Loading saved candidates...</p>
        </div>
      )}

      {!loading && error && (
        <div className="card p-8 rounded-2xl border border-danger/20 bg-danger/5 text-center text-sm text-danger">
          {error}
        </div>
      )}

      {!loading && !error && savedCandidates.length === 0 && (
        <div className="card p-12 rounded-2xl border border-dashed border-border bg-surface text-center space-y-3">
          <BookmarkCheck className="w-10 h-10 text-muted-foreground mx-auto" />
          <h3 className="text-base font-bold text-foreground">No saved candidates yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Browse the candidate directory and bookmark promising job seekers to review later.
          </p>
          <Link to="/candidates" className="btn btn-primary text-xs font-semibold mt-2 inline-block">
            Find Candidates
          </Link>
        </div>
      )}

      {!loading && !error && savedCandidates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedCandidates.map(s => {
            const cand = s.candidate;
            const skillsList = cand?.skills ? cand.skills.split(',').map(sk => sk.trim()).filter(Boolean) : [];

            return (
              <div
                key={s.id}
                className="card p-5 rounded-2xl border border-border bg-surface hover:border-primary/50 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-base overflow-hidden shrink-0">
                        {cand?.profile_pic ? (
                          <img
                            src={resolveMediaUrl(cand.profile_pic) || cand.profile_pic}
                            alt={cand.full_name}
                            onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          cand?.full_name?.charAt(0).toUpperCase() || 'C'
                        )}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground">{cand?.full_name}</h3>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          {cand?.municipality}, {cand?.island}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemove(s.candidate_id)}
                      className="p-2 rounded-xl text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
                      title="Remove from saved"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {cand?.bio && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {cand.bio}
                    </p>
                  )}

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
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-border/60 mt-4 text-[11px] text-muted-foreground">
                  <span>Saved on {new Date(s.saved_at).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
