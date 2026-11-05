import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import type { Job } from '../../types';
import { savedJobsApi, extractError } from '../../api/client';
import { toastSuccess, toastError } from './Toast';
import { useAuth } from '../../contexts/AuthContext';

interface JobCardProps {
  job: Job;
  compact?: boolean;
  onSaveToggle?: (jobId: number, saved: boolean) => void;
  isSaved?: boolean;
}

function formatSalary(min?: number, max?: number): string {
  if (!min && !max) return 'Salary negotiable';
  const fmt = (n: number) =>
    n >= 1000 ? `₱${(n / 1000).toFixed(0)}k` : `₱${n.toLocaleString()}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

export default function JobCard({ job, compact, onSaveToggle, isSaved: initialSaved }: JobCardProps) {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(initialSaved ?? false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;
    setSaving(true);
    try {
      if (saved) {
        await savedJobsApi.remove(job.id);
        setSaved(false);
        toastSuccess('Job removed from saved list.');
        onSaveToggle?.(job.id, false);
      } else {
        await savedJobsApi.save(job.id);
        setSaved(true);
        toastSuccess('Job saved successfully!');
        onSaveToggle?.(job.id, true);
      }
    } catch (err) {
      toastError(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  const isEmployer = user?.role === 'employer';
  const skills = job.required_skills?.split(',').map(s => s.trim()).filter(Boolean) ?? [];

  // Determine relative posted time
  const postedDate = new Date(job.created_at);
  const now = new Date();
  const diffDays = Math.max(0, Math.floor((now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24)));
  const postedText = diffDays === 0 ? 'Posted today' : diffDays === 1 ? 'Posted 1 day ago' : `Posted ${diffDays} days ago`;

  const locationText = job.barangay ? `${job.barangay}, ${job.municipality}` : job.municipality;
  const companyName = job.company_name || job.employer_name || 'Batanes Employer';

  return (
    <div
      id={`job-card-${job.id}`}
      className="card p-5 group hover:border-primary/50 transition-all flex flex-col justify-between"
    >
      <div>
        {/* Top Badges & Actions */}
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="badge badge-muted">
              {job.employment_type}
            </span>
            <span className="badge badge-success">
              Hiring
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isAuthenticated && !isEmployer && (
              <button
                id={`btn-save-job-${job.id}`}
                onClick={handleSave}
                disabled={saving}
                className="p-2 rounded-xl border border-border text-foreground hover:bg-neutral-soft transition-colors"
                aria-label={saved ? 'Unsave job' : 'Save job'}
              >
                {saved ? (
                  <BookmarkCheck className="w-4 h-4 text-primary fill-primary" />
                ) : (
                  <Bookmark className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            )}

            <button
              onClick={() => navigate(`/jobs/${job.id}`)}
              className="btn btn-primary px-4 py-2 text-xs font-bold rounded-xl"
              style={{ minHeight: '38px' }}
            >
              View job
            </button>
          </div>
        </div>

        {/* Title */}
        <Link to={`/jobs/${job.id}`} className="block">
          <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors mb-1">
            {job.title}
          </h3>
        </Link>

        {/* Company & Meta info */}
        <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
          <span className="font-medium text-foreground">{companyName}</span>
          <span>·</span>
          <span>{locationText}</span>
          <span>·</span>
          <span>{formatSalary(job.salary_min, job.salary_max)}</span>
          {!compact && job.application_count !== undefined && (
            <>
              <span>·</span>
              <span>{job.application_count} applicant{job.application_count !== 1 ? 's' : ''}</span>
            </>
          )}
          <span>·</span>
          <span>{postedText}</span>
        </div>

        {/* Skills */}
        {skills.length > 0 && !compact && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-border/40">
            {skills.slice(0, 4).map(skill => (
              <span key={skill} className="badge badge-muted text-[11px] font-normal">
                {skill}
              </span>
            ))}
            {skills.length > 4 && (
              <span className="badge badge-muted text-[11px] font-normal">
                +{skills.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
