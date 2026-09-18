import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Banknote, ArrowRight, Lock } from 'lucide-react';
import type { JobPreview } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface JobPreviewCardProps {
  job: JobPreview;
}

function formatSalary(min?: number, max?: number): string {
  if (!min && !max) return 'Salary negotiable';
  const fmt = (n: number) =>
    n >= 1000 ? `₱${(n / 1000).toFixed(0)}k` : `₱${n.toLocaleString()}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

export default function JobPreviewCard({ job }: JobPreviewCardProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleAction = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAuthenticated) {
      navigate(`/jobs/${job.id}`);
    } else {
      navigate('/login', { state: { from: `/jobs/${job.id}` } });
    }
  };

  const rawSkills = job.required_skills?.split(',').map(s => s.trim()).filter(Boolean) ?? [];

  return (
    <div
      id={`job-preview-card-${job.id}`}
      className="card p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-md group"
      style={{
        background: 'hsl(var(--color-surface))',
        border: '1px solid hsl(var(--color-border-subtle))',
      }}
    >
      <div>
        {/* Header with Role Icon and Preview Badge */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'hsl(var(--color-primary) / 0.1)',
              color: 'hsl(var(--color-primary))',
            }}
          >
            <Briefcase className="w-5 h-5" />
          </div>
          <span
            className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
            style={{
              background: 'hsl(var(--color-bg-alt))',
              color: 'hsl(var(--color-text-muted))',
              border: '1px solid hsl(var(--color-border-subtle))',
            }}
          >
            Preview
          </span>
        </div>

        {/* Job Title */}
        <h3
          className="text-lg font-bold mb-3 line-clamp-2 transition-colors duration-150"
          style={{
            fontFamily: 'Outfit, sans-serif',
            color: 'hsl(var(--color-text))',
            wordBreak: 'break-word',
          }}
          title={job.title}
        >
          {job.title}
        </h3>

        {/* Salary */}
        <div className="mb-4">
          <p className="text-xs uppercase tracking-wider font-bold mb-1" style={{ color: 'hsl(var(--color-text-faint))' }}>
            Salary
          </p>
          <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'hsl(var(--color-text))' }}>
            <Banknote className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--color-primary))' }} />
            <span>{formatSalary(job.salary_min, job.salary_max)}</span>
          </div>
        </div>

        {/* Required Skills */}
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wider font-bold mb-2" style={{ color: 'hsl(var(--color-text-faint))' }}>
            Required Skills
          </p>
          {rawSkills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {rawSkills.map(skill => (
                <span
                  key={skill}
                  className="badge badge-muted text-xs font-medium px-2.5 py-1"
                  style={{ wordBreak: 'break-word' }}
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs italic" style={{ color: 'hsl(var(--color-text-faint))' }}>
              No specific skills listed
            </p>
          )}
        </div>
      </div>

      {/* Footer / CTA */}
      <div
        className="pt-4 mt-auto space-y-3"
        style={{ borderTop: '1px solid hsl(var(--color-border-subtle))' }}
      >
        {!isAuthenticated && (
          <div
            className="flex items-center gap-1.5 text-xs font-medium"
            style={{ color: 'hsl(var(--color-text-muted))' }}
          >
            <Lock className="w-3.5 h-3.5 shrink-0" style={{ color: 'hsl(var(--color-warning))' }} />
            <span>Sign up or log in to view full job details.</span>
          </div>
        )}

        <button
          id={`btn-view-details-${job.id}`}
          onClick={handleAction}
          className="btn btn-secondary w-full py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 group-hover:border-primary transition-all"
        >
          <span>View Full Details</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
