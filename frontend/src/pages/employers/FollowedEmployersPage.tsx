import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, HeartOff, ArrowLeft, ArrowRight, Briefcase } from 'lucide-react';
import { usersApi, extractError, resolveMediaUrl } from '../../api/client';
import { Spinner } from '../../components/ui';
import type { FollowedEmployer } from '../../types';

export default function FollowedEmployersPage() {
  const [followed, setFollowed] = useState<FollowedEmployer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFollowed = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await usersApi.listFollowedEmployers();
      setFollowed(data);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowed();
  }, []);

  const handleUnfollow = async (employerId: number) => {
    try {
      await usersApi.unfollowEmployer(employerId);
      setFollowed(prev => prev.filter(f => f.employer_id !== employerId));
    } catch (err) {
      alert(extractError(err));
    }
  };

  return (
    <div className="container-page py-8 space-y-6 max-w-5xl">
      <div>
        <Link
          to="/employers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Employer Directory</span>
        </Link>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
          Followed Employers
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Stay updated with job opportunities from the Batanes businesses you care about.
        </p>
      </div>

      {loading && (
        <div className="py-16 text-center space-y-3">
          <Spinner size="lg" className="mx-auto" />
          <p className="text-sm text-muted-foreground">Loading followed employers...</p>
        </div>
      )}

      {!loading && error && (
        <div className="card p-8 rounded-2xl border border-danger/20 bg-danger/5 text-center text-sm text-danger">
          {error}
        </div>
      )}

      {!loading && !error && followed.length === 0 && (
        <div className="card p-12 rounded-2xl border border-dashed border-border bg-surface text-center space-y-3">
          <Building2 className="w-10 h-10 text-muted-foreground mx-auto" />
          <h3 className="text-base font-bold text-foreground">You are not following any employers yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Browse our employer directory to discover local businesses and follow them to receive updates when they post new vacancies.
          </p>
          <Link to="/employers" className="btn btn-primary text-xs font-semibold mt-2 inline-block">
            Browse Employers
          </Link>
        </div>
      )}

      {!loading && !error && followed.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {followed.map(f => {
            const emp = f.employer;
            if (!emp) return null;

            return (
              <div
                key={f.id}
                className="card p-5 rounded-2xl border border-border bg-surface hover:border-primary/50 transition-all flex flex-col justify-between"
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
                        emp.company_name?.charAt(0).toUpperCase() || 'E'
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUnfollow(f.employer_id)}
                      className="p-2 rounded-xl text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
                      title="Unfollow employer"
                    >
                      <HeartOff className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-foreground">{emp.company_name}</h3>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {emp.municipality}, {emp.island}
                    </p>
                  </div>

                  {emp.company_description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {emp.company_description}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-border/60 mt-4 flex items-center justify-between text-xs font-bold text-primary">
                  <Link
                    to={`/employers/${f.employer_id}`}
                    className="inline-flex items-center gap-1 hover:underline"
                  >
                    View Profile <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
