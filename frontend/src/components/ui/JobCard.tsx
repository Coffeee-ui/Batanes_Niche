import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Banknote, Bookmark, BookmarkCheck, Building2, Users } from 'lucide-react';
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

const employmentTypeColors: Record<string, string> = {
  'Full-time': 'badge-primary',
  'Part-time': 'badge-success',
  'Contract': 'badge-warning',
  'Seasonal': 'badge-muted',
  'Freelance': 'badge-danger',
};

export default function JobCard({ job, compact, onSaveToggle, isSaved: initialSaved }: JobCardProps) {
  const { isAuthenticated, user } = useAuth();
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
  const skills = job.required_skills?.split(',').map(s => s.trim()).filter(Boolean).slice(0, 3) ?? [];

  return (
    <Link
      to={`/jobs/${job.id}`}
      id={`job-card-${job.id}`}
      className="card block p-5 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Company */}
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, hsl(var(--color-primary) / 0.8), hsl(var(--color-secondary) / 0.8))' }}
            >
              {(job.company_name || job.employer_name || job.title || 'J').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: 'hsl(var(--color-text-muted))' }}>
                {job.company_name || job.employer_name || 'Batanes Employer'}
              </p>
            </div>
          </div>

          {/* Title */}
          <h3
            className="text-base font-semibold mb-2 group-hover:underline decoration-dotted underline-offset-2 transition-all"
            style={{ color: 'hsl(var(--color-text))' }}
          >
            {job.title}
          </h3>

          {/* Meta row */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs" style={{ color: 'hsl(var(--color-text-muted))' }}>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {job.barangay ? `${job.barangay}, ${job.municipality}` : job.municipality}
            </span>
            <span className="flex items-center gap-1">
              <Banknote className="w-3.5 h-3.5" />
              {formatSalary(job.salary_min, job.salary_max)}
            </span>
            {!compact && job.application_count !== undefined && (
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {job.application_count} applicant{job.application_count !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {/* Employment type badge */}
          <span className={employmentTypeColors[job.employment_type] || 'badge-muted'}>
            {job.employment_type}
          </span>

          {/* Save button (only for job seekers) */}
          {isAuthenticated && !isEmployer && (
            <button
              id={`btn-save-job-${job.id}`}
              onClick={handleSave}
              disabled={saving}
              className="p-1.5 rounded-lg transition-all duration-150 hover:scale-110"
              style={{
                background: saved ? 'hsl(var(--color-primary) / 0.1)' : 'transparent',
                color: saved ? 'hsl(var(--color-primary))' : 'hsl(var(--color-text-faint))',
              }}
              aria-label={saved ? 'Unsave job' : 'Save job'}
            >
              {saved
                ? <BookmarkCheck className="w-4 h-4" />
                : <Bookmark className="w-4 h-4" />
              }
            </button>
          )}
        </div>
      </div>

      {/* Skills */}
      {skills.length > 0 && !compact && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3" style={{ borderTop: '1px solid hsl(var(--color-border-subtle))' }}>
          {skills.map(skill => (
            <span key={skill} className="badge badge-muted text-xs">{skill}</span>
          ))}
          {(job.required_skills?.split(',').length ?? 0) > 3 && (
            <span className="badge badge-muted text-xs">
              +{(job.required_skills?.split(',').length ?? 0) - 3} more
            </span>
          )}
        </div>
      )}

      {/* Posted date */}
      <p className="text-xs mt-3" style={{ color: 'hsl(var(--color-text-faint))' }}>
        <Clock className="inline w-3 h-3 mr-1" />
        Posted {new Date(job.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
      </p>
    </Link>
  );
}
