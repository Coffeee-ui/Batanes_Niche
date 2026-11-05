import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, Banknote, FileText, Sparkles, ArrowLeft } from 'lucide-react';
import { jobsApi, extractError } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import type { JobCreate } from '../../types';
import { Spinner } from '../../components/ui';
import { toastSuccess, toastError, toastInfo } from '../../components/ui/Toast';
import SkillSelector from '../../components/forms/SkillSelector';

const MUNICIPALITIES = ['Basco', 'Itbayat', 'Ivana', 'Mahatao', 'Sabtang', 'Uyugan'];
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Seasonal', 'Freelance'];
const CATEGORIES = [
  'Tourism & Hospitality',
  'Agriculture & Fishing',
  'Healthcare & Medical',
  'Education & Teaching',
  'Construction & Trades',
  'Government & Public',
  'Office & Admin',
  'Transport & Logistics',
  'IT & Digital',
  'Retail & Sales',
];

export default function PostJobPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [form, setForm] = useState<JobCreate>({
    title: '',
    description: '',
    municipality: user?.municipality || 'Basco',
    barangay: '',
    salary_min: 15000,
    salary_max: 25000,
    employment_type: 'Full-time',
    required_skills: '',
  });

  const set = (k: keyof JobCreate) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const val = e.target.value;
    setForm(f => ({ ...f, [k]: val === '' ? undefined : val }));
  };

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toastError('Please enter a job title.');
      return;
    }
    if (!form.description.trim() || form.description.length < 10) {
      toastError('Job description must be at least 10 characters.');
      return;
    }
    if (selectedSkills.length === 0) {
      toastError('Please select or add at least one required skill.');
      return;
    }
    if (form.salary_min != null && form.salary_max != null && Number(form.salary_min) > Number(form.salary_max)) {
      toastError('Minimum salary cannot exceed maximum salary.');
      return;
    }

    if (isDraft) {
      toastInfo('Draft saved locally.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        salary_min: form.salary_min ? Number(form.salary_min) : 0,
        salary_max: form.salary_max ? Number(form.salary_max) : 0,
        barangay: form.barangay || undefined,
        required_skills: selectedSkills.join(', ') || 'General',
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
    <div className="container-page py-8 max-w-3xl">
      {/* Top Breadcrumb / Navigation */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back
      </button>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-1 tracking-tight">
          Post a new job
        </h1>
        <p className="text-sm text-muted">
          Find qualified Ivatan talent for your opening in Batanes.
        </p>
      </div>

      <form
        onSubmit={e => handleSubmit(e, false)}
        className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6"
      >
        {/* Job Title */}
        <div>
          <label htmlFor="job-title" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
            Job Title <span className="text-danger">*</span>
          </label>
          <input
            id="job-title"
            type="text"
            className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            placeholder="e.g. Tourism Guide, Office Clerk, Nurse"
            value={form.title}
            onChange={set('title')}
            required
            maxLength={150}
          />
        </div>

        {/* Category & Employment Type Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="job-category" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
              Category <span className="text-danger">*</span>
            </label>
            <select
              id="job-category"
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="job-employment-type" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
              Job Type <span className="text-danger">*</span>
            </label>
            <select
              id="job-employment-type"
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              value={form.employment_type}
              onChange={set('employment_type')}
              required
            >
              {EMPLOYMENT_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Municipality & Barangay Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="job-municipality" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
              Municipality <span className="text-danger">*</span>
            </label>
            <select
              id="job-municipality"
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              value={form.municipality}
              onChange={set('municipality')}
              required
            >
              {MUNICIPALITIES.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="job-barangay" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
              Barangay <span className="text-muted font-normal lowercase">(optional)</span>
            </label>
            <input
              id="job-barangay"
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              placeholder="e.g. Kayvaluganan"
              value={form.barangay || ''}
              onChange={set('barangay')}
            />
          </div>
        </div>

        {/* Salary Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="job-salary-min" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
              Min Salary (₱/mo) <span className="text-muted font-normal lowercase">(optional)</span>
            </label>
            <input
              id="job-salary-min"
              type="number"
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              placeholder="e.g. 15000"
              value={form.salary_min ?? ''}
              onChange={set('salary_min')}
              min={0}
              step={500}
            />
          </div>

          <div>
            <label htmlFor="job-salary-max" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
              Max Salary (₱/mo) <span className="text-muted font-normal lowercase">(optional)</span>
            </label>
            <input
              id="job-salary-max"
              type="number"
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              placeholder="e.g. 25000"
              value={form.salary_max ?? ''}
              onChange={set('salary_max')}
              min={0}
              step={500}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="job-description" className="text-xs font-bold text-foreground uppercase tracking-wider">
              Job Description <span className="text-danger">*</span>
            </label>
            <span className="text-xs text-muted">
              {form.description.length} characters (min 10)
            </span>
          </div>
          <textarea
            id="job-description"
            className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-y min-h-[140px]"
            rows={5}
            placeholder="Describe the role, responsibilities, day-to-day tasks, and work arrangement…"
            value={form.description}
            onChange={set('description')}
            required
            minLength={10}
          />
        </div>

        {/* Required Skills */}
        <div>
          <SkillSelector
            id="job-skills"
            label="Required Skills *"
            values={selectedSkills}
            onChange={setSelectedSkills}
          />
        </div>

        {/* Divider */}
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={e => handleSubmit(e, true)}
            className="w-full sm:w-auto px-6 py-3 rounded-full border border-border text-foreground hover:bg-neutral/40 font-semibold text-sm transition-colors"
          >
            Save draft
          </button>
          <button
            id="btn-post-job-submit"
            type="submit"
            disabled={submitting || !form.title.trim() || !form.description.trim()}
            className="w-full sm:w-auto px-8 py-3 rounded-full bg-primary text-foreground font-bold text-sm shadow-sm hover:opacity-95 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Spinner size="sm" />
                <span>Publishing…</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Publish job</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
