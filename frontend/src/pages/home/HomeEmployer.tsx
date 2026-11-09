import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Search,
  MapPin,
  Clock,
  Briefcase,
  GraduationCap,
  ChevronRight,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { jobsApi, applicationsApi, usersApi, extractError } from '../../api/client';
import type { Job, Application, Candidate } from '../../types';
import { Modal } from '../../components/ui';

const MUNICIPALITIES = [
  { label: 'All of Batanes', value: '' },
  { label: 'Basco', value: 'Basco' },
  { label: 'Mahatao', value: 'Mahatao' },
  { label: 'Ivana', value: 'Ivana' },
  { label: 'Uyugan', value: 'Uyugan' },
  { label: 'Sabtang', value: 'Sabtang' },
  { label: 'Itbayat', value: 'Itbayat' },
];

export default function HomeEmployer() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [recentApplicants, setRecentApplicants] = useState<Application[]>([]);
  const [recommendedCandidates, setRecommendedCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Find candidate search state
  const [candidateSkill, setCandidateSkill] = useState('');
  const [candidateMuni, setCandidateMuni] = useState('');

  // Candidate detail modal state
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([
      jobsApi.myJobs({ page_size: 20 }).then(d => d.items).catch(() => [] as Job[]),
      applicationsApi.myApplications({ page_size: 10 }).then(d => d.items).catch(() => [] as Application[]),
      usersApi.recommendations().catch(() => usersApi.candidates({ page_size: 6 }).then(d => d.items)).catch(() => [] as Candidate[]),
    ])
      .then(([jobs, apps, cands]) => {
        if (!active) return;
        setActiveJobs(jobs.filter(j => j.status === 'active'));
        setRecentApplicants(apps);
        setRecommendedCandidates(cands.slice(0, 6));
      })
      .catch((err: unknown) => {
        if (active) setError(extractError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Real clock greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const companyName = user?.company_name || user?.full_name || 'Employer';

  const primaryJobTitle = activeJobs[0]?.title || 'your open roles';

  const handleCandidateSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    usersApi
      .candidates({
        skill: candidateSkill.trim() || undefined,
        municipality: candidateMuni || undefined,
        page_size: 10,
      })
      .then(res => {
        setRecommendedCandidates(res.items || []);
      })
      .catch(err => {
        setError(extractError(err));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="container-page py-6 sm:py-8 space-y-6 sm:space-y-8 w-full max-w-full min-w-0">
      {/* Top Greeting & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            {greeting}, {companyName}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage your listings, review applicants, and connect with Ivatan talent.
          </p>
        </div>
        <div className="shrink-0">
          <Link
            to="/jobs/post"
            className="btn btn-primary text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs min-h-[44px] flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" /> Post a job
          </Link>
        </div>
      </div>

      {error && (
        <div className="card p-4 text-xs text-danger border-danger/30">
          {error}
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Recent Applicants & Your Active Jobs */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          {/* Recent Applicants Section (AUD-002-UX-08: Cards on < md, Table on >= md) */}
          <section className="card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Recent applicants
              </h2>
              <Link
                to="/applications"
                className="text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                View all
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2 py-4">
                <div className="h-12 rounded-xl bg-neutral-soft/50 animate-pulse" />
                <div className="h-12 rounded-xl bg-neutral-soft/50 animate-pulse" />
              </div>
            ) : recentApplicants.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                No applications received yet. Qualified candidates who apply will appear here.
              </p>
            ) : (
              <>
                {/* Mobile Card List (< md) */}
                <div className="md:hidden divide-y divide-border/50">
                  {recentApplicants.slice(0, 6).map(app => (
                    <div key={app.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground truncate">
                          {app.applicant?.full_name || app.seeker_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {app.job?.title || app.job_title}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {new Date(app.created_at).toLocaleDateString('en-PH', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span
                          className={`badge ${
                            app.status === 'accepted'
                              ? 'badge-success'
                              : app.status === 'rejected'
                              ? 'badge-danger'
                              : 'badge-warning'
                          }`}
                        >
                          {app.status}
                        </span>
                        <Link
                          to={`/applications?jobId=${app.job_id}`}
                          className="btn btn-primary text-xs py-1.5 px-3 rounded-lg min-h-[44px] flex items-center"
                        >
                          Review
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table (>= md) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-border/80 text-muted-foreground">
                        <th className="pb-2.5 font-bold uppercase tracking-wider">Applicant</th>
                        <th className="pb-2.5 font-bold uppercase tracking-wider">Job</th>
                        <th className="pb-2.5 font-bold uppercase tracking-wider">Applied</th>
                        <th className="pb-2.5 font-bold uppercase tracking-wider">Status</th>
                        <th className="pb-2.5 font-bold uppercase tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {recentApplicants.slice(0, 6).map(app => (
                        <tr key={app.id} className="hover:bg-neutral-soft/30 transition-colors">
                          <td className="py-3 font-semibold text-foreground">
                            {app.applicant?.full_name || app.seeker_name}
                          </td>
                          <td className="py-3 text-muted-foreground truncate max-w-[160px]">
                            {app.job?.title || app.job_title}
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {new Date(app.created_at).toLocaleDateString('en-PH', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="py-3">
                            <span
                              className={`badge ${
                                app.status === 'accepted'
                                  ? 'badge-success'
                                  : app.status === 'rejected'
                                  ? 'badge-danger'
                                  : 'badge-warning'
                              }`}
                            >
                              {app.status}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <Link
                              to={`/applications?jobId=${app.job_id}`}
                              className="btn btn-primary text-xs py-1.5 px-3 min-h-[44px] inline-flex items-center"
                            >
                              Review
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>

          {/* Your Active Jobs List */}
          <section className="card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Your active jobs
              </h2>
              <Link
                to="/jobs/my"
                className="text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                View all
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2 py-4">
                <div className="h-10 rounded-xl bg-neutral-soft/50 animate-pulse" />
                <div className="h-10 rounded-xl bg-neutral-soft/50 animate-pulse" />
              </div>
            ) : activeJobs.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  You have no active vacancies listed at the moment.
                </p>
                <Link to="/jobs/post" className="btn btn-primary text-xs font-bold py-2 px-4 inline-flex">
                  Post your first vacancy
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {activeJobs.map(job => (
                  <div key={job.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/jobs/${job.id}`}
                        className="text-sm font-bold text-foreground hover:text-primary transition-colors block truncate"
                      >
                        {job.title}
                      </Link>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        {job.municipality}, Batanes · {job.employment_type}
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <Link
                        to={`/jobs/${job.id}`}
                        className="btn btn-secondary text-xs px-3 py-1.5 min-h-[44px] flex items-center"
                      >
                        Manage
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Find Candidates & Recommended Candidates */}
        <div className="space-y-6 sm:space-y-8">
          {/* Find Candidates Search Card */}
          <div className="card p-5 bg-surface border border-border shadow-xs rounded-2xl space-y-3">
            <h3 className="text-sm font-bold text-foreground">
              Find candidates
            </h3>
            <p className="text-xs text-muted-foreground">
              Search local job seekers by specific skill and municipality.
            </p>
            <form onSubmit={handleCandidateSearch} className="space-y-3 pt-1">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  aria-label="Skill to search"
                  placeholder="Skill (e.g. Carpentry, Driver)"
                  value={candidateSkill}
                  onChange={e => setCandidateSkill(e.target.value)}
                  className="input pl-10 text-xs rounded-xl"
                />
              </div>

              <div>
                <select
                  aria-label="Filter candidates by municipality"
                  value={candidateMuni}
                  onChange={e => setCandidateMuni(e.target.value)}
                  className="select w-full text-xs rounded-xl"
                >
                  {MUNICIPALITIES.map(m => (
                    <option key={m.label} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full text-xs font-bold py-2.5 rounded-xl min-h-[44px]"
              >
                Search candidates
              </button>
            </form>
          </div>

          {/* Recommended for [job title] Candidate Cards */}
          <div className="card p-5 bg-surface border border-border shadow-xs rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <Sparkles className="w-4 h-4 text-primary shrink-0" />
                <h3 className="text-sm font-bold text-foreground truncate">
                  Recommended for {primaryJobTitle}
                </h3>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                <div className="h-16 rounded-xl bg-neutral-soft/50 animate-pulse" />
                <div className="h-16 rounded-xl bg-neutral-soft/50 animate-pulse" />
              </div>
            ) : recommendedCandidates.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2 text-center">
                No recommended profiles match current criteria.
              </p>
            ) : (
              <>
                {/* Mobile: Swipeable row */}
                <div className="flex sm:hidden gap-3 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
                  {recommendedCandidates.map(c => {
                    const skills = c.skills
                      ? c.skills.split(',').map(s => s.trim()).filter(Boolean).slice(0, 2)
                      : [];
                    return (
                      <div
                        key={c.id}
                        className="card p-3.5 bg-neutral-soft/20 border border-border w-64 shrink-0 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-foreground truncate">{c.full_name}</p>
                            <span className="badge badge-success text-[10px] px-2 py-0.5">Matched</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            {c.municipality}, {c.island}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {skills.map(s => (
                              <span key={s} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-soft text-foreground border border-border/50">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedCandidate(c)}
                          className="btn btn-secondary text-xs w-full py-1.5 mt-3 min-h-[44px]"
                        >
                          View profile
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop: Vertical Cards */}
                <div className="hidden sm:flex flex-col gap-3">
                  {recommendedCandidates.map(c => {
                    const skills = c.skills
                      ? c.skills.split(',').map(s => s.trim()).filter(Boolean).slice(0, 3)
                      : [];
                    return (
                      <div
                        key={c.id}
                        className="p-3.5 rounded-xl border border-border bg-neutral-soft/20 hover:border-primary/40 transition-colors flex flex-col justify-between gap-3"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-foreground truncate">{c.full_name}</p>
                            <span className="badge badge-success text-[10px] px-2 py-0.5">Matched</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            {c.municipality}, {c.island}
                          </p>
                          {skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {skills.map(s => (
                                <span key={s} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface text-foreground border border-border/50">
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedCandidate(c)}
                          className="btn btn-secondary text-xs w-full py-1.5 min-h-[44px]"
                        >
                          View profile
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Candidate Profile Modal (Ivatan Privacy Guarantee: Contact details protected) */}
      {selectedCandidate && (
        <Modal
          isOpen={!!selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          title={selectedCandidate.full_name}
          titleId="candidate-modal-title"
          maxWidth="max-w-lg"
          asBottomSheet
        >
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-header text-primary border border-border flex items-center justify-center font-bold text-xl shrink-0 shadow-xs">
                {selectedCandidate.full_name
                  .split(' ')
                  .map(p => p[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join('')
                  .toUpperCase() || 'C'}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-foreground">
                  {selectedCandidate.full_name}
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  {selectedCandidate.municipality}, {selectedCandidate.island}
                </p>
              </div>
            </div>

            {selectedCandidate.bio && (
              <div className="bg-neutral-soft/50 rounded-xl p-3.5 border border-border/50">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                  About
                </p>
                <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                  {selectedCandidate.bio}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-surface border border-border rounded-xl p-3">
                <p className="text-muted-foreground flex items-center gap-1 font-semibold mb-1">
                  <Briefcase className="w-3.5 h-3.5 text-muted-foreground" /> Experience
                </p>
                <p className="text-sm font-bold text-foreground">
                  {selectedCandidate.experience_years != null ? `${selectedCandidate.experience_years} years` : 'Not specified'}
                </p>
              </div>
              <div className="bg-surface border border-border rounded-xl p-3">
                <p className="text-muted-foreground flex items-center gap-1 font-semibold mb-1">
                  <GraduationCap className="w-3.5 h-3.5 text-muted-foreground" /> Education
                </p>
                <p className="text-sm font-bold text-foreground truncate">
                  {selectedCandidate.education || 'Not specified'}
                </p>
              </div>
            </div>

            {selectedCandidate.skills && (
              <div>
                <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                  Skills & Qualifications
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCandidate.skills.split(',').map(s => s.trim()).filter(Boolean).map(skill => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-soft text-foreground border border-border"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-border pt-4 text-xs text-muted-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary shrink-0" />
              <span>Contact details remain protected until this candidate applies to one of your openings.</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

