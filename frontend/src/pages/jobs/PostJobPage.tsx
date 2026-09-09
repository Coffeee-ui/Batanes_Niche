import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, Banknote, FileText } from 'lucide-react';
import { jobsApi, extractError } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import type { JobCreate } from '../../types';
import { Spinner } from '../../components/ui';
import { toastSuccess, toastError } from '../../components/ui/Toast';
import SkillSelector from '../../components/forms/SkillSelector';

const MUNICIPALITIES = ['Basco', 'Itbayat', 'Ivana', 'Mahatao', 'Sabtang', 'Uyugan'];
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Seasonal', 'Freelance'];

export default function PostJobPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [form, setForm] = useState<JobCreate>({
    title: '',
    description: '',
    municipality: user?.municipality || '',
    barangay: '',
    salary_min: undefined,
    salary_max: undefined,
    employment_type: 'Full-time',
    required_skills: '',
  });

  const set = (k: keyof JobCreate) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const val = e.target.value;
    setForm(f => ({ ...f, [k]: val === '' ? undefined : val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.salary_min && form.salary_max && form.salary_min > form.salary_max) {
      toastError('Minimum salary cannot exceed maximum salary.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        salary_min: form.salary_min ? Number(form.salary_min) : undefined,
        salary_max: form.salary_max ? Number(form.salary_max) : undefined,
        barangay: form.barangay || undefined,
        required_skills: selectedSkills.join(', ') || undefined,
      };
      const job = await jobsApi.create(payload);
      toastSuccess('Job posted successfully!');
      navigate(`/jobs/${job.id}`);
    } catch (err) {
      toastError(extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-page py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black mb-2" style={{ color: 'hsl(var(--color-text))' }}>
          Post a Job
        </h1>
        <p className="text-sm" style={{ color: 'hsl(var(--color-text-muted))' }}>
          Find qualified Ivatan talent for your opening in Batanes.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="card p-6 space-y-6"
      >
        {/* Basic Info */}
        <div>
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'hsl(var(--color-text))' }}>
            <Briefcase className="w-4 h-4" style={{ color: 'hsl(var(--color-primary))' }} />
            Job Details
          </h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="job-title" className="label">Job Title *</label>
              <input
                id="job-title"
                type="text"
                className="input"
                placeholder="e.g. Tourism Guide, Office Clerk, Nurse"
                value={form.title}
                onChange={set('title')}
                required
                maxLength={200}
              />
            </div>
            <div>
              <label htmlFor="job-description" className="label">Job Description *</label>
              <textarea
                id="job-description"
                className="input resize-none"
                rows={6}
                placeholder="Describe the role, responsibilities, and what makes it a great opportunity…"
                value={form.description}
                onChange={set('description')}
                required
                minLength={50}
              />
              <p className="text-xs mt-1" style={{ color: 'hsl(var(--color-text-faint))' }}>
                {form.description.length} characters (minimum 50)
              </p>
            </div>
            <div>
              <label htmlFor="job-employment-type" className="label">Employment Type *</label>
              <select id="job-employment-type" className="input select" value={form.employment_type} onChange={set('employment_type')} required>
                {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        <hr className="divider" />

        {/* Location */}
        <div>
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'hsl(var(--color-text))' }}>
            <MapPin className="w-4 h-4" style={{ color: 'hsl(var(--color-primary))' }} />
            Location
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="job-municipality" className="label">Municipality *</label>
              <select id="job-municipality" className="input select" value={form.municipality} onChange={set('municipality')} required>
                <option value="">Select…</option>
                {MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="job-barangay" className="label">
                Barangay <span style={{ color: 'hsl(var(--color-text-faint))' }}>(optional)</span>
              </label>
              <input
                id="job-barangay"
                type="text"
                className="input"
                placeholder="Specific barangay"
                value={form.barangay || ''}
                onChange={set('barangay')}
              />
            </div>
          </div>
        </div>

        <hr className="divider" />

        {/* Salary & Skills */}
        <div>
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'hsl(var(--color-text))' }}>
            <Banknote className="w-4 h-4" style={{ color: 'hsl(var(--color-primary))' }} />
            Compensation & Skills
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="job-salary-min" className="label">
                Min Salary (₱/mo) <span style={{ color: 'hsl(var(--color-text-faint))' }}>(optional)</span>
              </label>
              <input
                id="job-salary-min"
                type="number"
                className="input"
                placeholder="e.g. 15000"
                value={form.salary_min || ''}
                onChange={set('salary_min')}
                min={0}
              />
            </div>
            <div>
              <label htmlFor="job-salary-max" className="label">
                Max Salary (₱/mo) <span style={{ color: 'hsl(var(--color-text-faint))' }}>(optional)</span>
              </label>
              <input
                id="job-salary-max"
                type="number"
                className="input"
                placeholder="e.g. 25000"
                value={form.salary_max || ''}
                onChange={set('salary_max')}
                min={0}
              />
            </div>
          </div>
          <SkillSelector
            id="job-skills"
            label="Required Skills"
            values={selectedSkills}
            onChange={setSelectedSkills}
            optional
          />
        </div>

        {/* Preview of skills chips */}

        <hr className="divider" />

        <button
          id="btn-post-job-submit"
          type="submit"
          disabled={submitting || !form.title || !form.description || !form.municipality}
          className="btn btn-primary w-full py-4 text-base font-bold"
        >
          {submitting
            ? <><Spinner size="sm" /> Posting…</>
            : <><FileText className="w-4 h-4" /> Post Job Listing</>
          }
        </button>
      </form>
    </div>
  );
}
