import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, ArrowLeft, RotateCcw } from 'lucide-react';
import { jobsApi, extractError } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import type { JobCreate } from '../../types';
import { Spinner, ConfirmDialog, CategoryIcon } from '../../components/ui';
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

const DRAFT_KEY = 'batanes_draft_job';

export default function PostJobPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('editId');
  const isEditing = Boolean(editId);

  const [loadingJob, setLoadingJob] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [hasDraftPrompt, setHasDraftPrompt] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);

  const [form, setForm] = useState<JobCreate>({
    title: '',
    description: '',
    municipality: user?.municipality || 'Basco',
    barangay: '',
    salary_min: 15000,
    salary_max: 25000,
    employment_type: 'Full-time',
    required_skills: '',
    category: CATEGORIES[0],
  });

  // Check for editId or saved draft on mount
  useEffect(() => {
    if (editId) {
      setLoadingJob(true);
      jobsApi.get(Number(editId))
        .then(job => {
          setForm({
            title: job.title || '',
            description: job.description || '',
            municipality: job.municipality || 'Basco',
            barangay: job.barangay || '',
            salary_min: job.salary_min || 0,
            salary_max: job.salary_max || 0,
            employment_type: job.employment_type || 'Full-time',
            required_skills: job.required_skills || '',
            category: (job as any).category || CATEGORIES[0],
          });
          if ((job as any).category && CATEGORIES.includes((job as any).category)) {
            setSelectedCategory((job as any).category);
          }
          if (job.required_skills) {
            setSelectedSkills(job.required_skills.split(',').map(s => s.trim()).filter(Boolean));
          }
        })
        .catch(err => {
          toastError(extractError(err));
          navigate('/jobs/my');
        })
        .finally(() => setLoadingJob(false));
    } else {
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && (parsed.form?.title || parsed.form?.description)) {
            setHasDraftPrompt(true);
          }
        }
      } catch {
        // Storage unavailable or invalid JSON
      }
    }
  }, [editId, navigate]);

  const handleResumeDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.form) setForm(parsed.form);
        if (parsed.selectedCategory) setSelectedCategory(parsed.selectedCategory);
        if (parsed.selectedSkills) setSelectedSkills(parsed.selectedSkills);
        toastSuccess('Draft restored.');
      }
    } catch {
      toastError('Could not restore draft.');
    }
    setHasDraftPrompt(false);
  };

  const handleDiscardDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
    setHasDraftPrompt(false);
    setShowDiscardConfirm(false);
    toastInfo('Draft discarded.');
  };

  const handleSaveDraft = () => {
    try {
      const draftData = {
        form,
        selectedCategory,
        selectedSkills,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
      toastSuccess("Draft saved. We'll restore it next time.");
    } catch {
      toastError('Could not save draft to local storage.');
    }
  };

  const set = (k: keyof JobCreate) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const val = e.target.value;
    setForm(f => ({ ...f, [k]: val === '' ? undefined : val }));
  };

  const validate = (): boolean => {
    if (!form.title.trim()) {
      toastError('Please enter a job title.');
      return false;
    }
    if (!form.description.trim() || form.description.length < 10) {
      toastError('Job description must be at least 10 characters.');
      return false;
    }
    if (selectedSkills.length === 0) {
      toastError('Please select or add at least one required skill.');
      return false;
    }
    if (form.salary_min != null && form.salary_max != null && Number(form.salary_min) > Number(form.salary_max)) {
      toastError('Minimum salary cannot exceed maximum salary.');
      return false;
    }
    return true;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (isEditing) {
      setShowUpdateConfirm(true);
    } else {
      executeSubmit();
    }
  };

  const executeSubmit = async () => {
    setSubmitting(true);
    try {
      const payload: JobCreate = {
        ...form,
        title: form.title.trim(),
        salary_min: form.salary_min ? Number(form.salary_min) : 0,
        salary_max: form.salary_max ? Number(form.salary_max) : 0,
        barangay: form.barangay || undefined,
        category: selectedCategory,
        required_skills: selectedSkills.join(', ') || 'General',
      };

      if (isEditing && editId) {
        await jobsApi.update(Number(editId), payload);
        toastSuccess('Job listing updated successfully!');
        setShowUpdateConfirm(false);
        navigate(`/jobs/${editId}`);
      } else {
        const job = await jobsApi.create(payload);
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {}
        toastSuccess('Job posted successfully!');
        navigate(`/jobs/${job.id}`);
      }
    } catch (err) {
      toastError(extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingJob) {
    return (
      <div className="container-page py-16 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container-page py-8 max-w-3xl">
      {/* Top Breadcrumb / Navigation */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-4 transition-colors min-h-[44px]"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back
      </button>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-1 tracking-tight">
          {isEditing ? 'Edit job listing' : 'Post a new job'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isEditing
            ? 'Update your job opening details in Batanes.'
            : 'Find qualified Ivatan talent for your opening in Batanes.'}
        </p>
      </div>

      {/* Resume Draft Banner (FORM-02) */}
      {hasDraftPrompt && !isEditing && (
        <div
          className="rounded-2xl p-4 mb-6 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in"
          style={{
            backgroundColor: 'hsl(var(--highlight))',
            borderColor: 'hsl(var(--primary) / 0.5)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <RotateCcw className="w-4 h-4 text-foreground shrink-0" />
            <p className="text-xs font-semibold text-foreground">
              You have an unsaved draft from a previous session.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResumeDraft}
              className="btn btn-primary text-xs py-1.5 px-3 min-h-[36px]"
            >
              Resume draft
            </button>
            <button
              type="button"
              onClick={() => setShowDiscardConfirm(true)}
              className="btn btn-secondary text-xs py-1.5 px-3 min-h-[36px] text-danger"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={handleFormSubmit}
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
            className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted-foreground text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all min-h-[44px]"
            placeholder="e.g. Front Desk Staff"
            value={form.title}
            onChange={set('title')}
            required
            maxLength={150}
          />
        </div>

        {/* Category: Single swipeable row of icon chips above employment type (A4) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
              Category <span className="text-danger">*</span>
            </label>
            <span className="text-xs text-muted-foreground font-medium">
              {selectedCategory}
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1">
            {CATEGORIES.map(c => {
              const isSelected = selectedCategory === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCategory(c)}
                  className={`shrink-0 flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs transition-all min-h-[44px] ${
                    isSelected
                      ? 'bg-primary text-foreground border-primary shadow-sm font-bold'
                      : 'bg-surface border-border text-foreground hover:bg-neutral-soft font-semibold'
                  }`}
                >
                  <CategoryIcon category={c} className="w-4 h-4 shrink-0" />
                  <span>{c}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Employment Type & Municipality Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="job-employment-type" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
              Employment Type <span className="text-danger">*</span>
            </label>
            <select
              id="job-employment-type"
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all min-h-[44px]"
              value={form.employment_type}
              onChange={set('employment_type')}
              required
            >
              {EMPLOYMENT_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="job-municipality" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
              Municipality <span className="text-danger">*</span>
            </label>
            <select
              id="job-municipality"
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all min-h-[44px]"
              value={form.municipality}
              onChange={set('municipality')}
              required
            >
              {MUNICIPALITIES.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Barangay & Salary Range */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="job-barangay" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
              Barangay <span className="text-muted-foreground font-normal lowercase">(optional)</span>
            </label>
            <input
              id="job-barangay"
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted-foreground text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all min-h-[44px]"
              placeholder="e.g. Kayvaluganan"
              value={form.barangay || ''}
              onChange={set('barangay')}
            />
          </div>

          <div>
            <label htmlFor="job-salary-min" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
              Min Salary (₱/mo) <span className="text-muted-foreground font-normal lowercase">(optional)</span>
            </label>
            <input
              id="job-salary-min"
              type="number"
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted-foreground text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all min-h-[44px]"
              placeholder="e.g. 15000"
              value={form.salary_min ?? ''}
              onChange={set('salary_min')}
              min={0}
              step={500}
            />
          </div>

          <div>
            <label htmlFor="job-salary-max" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
              Max Salary (₱/mo) <span className="text-muted-foreground font-normal lowercase">(optional)</span>
            </label>
            <input
              id="job-salary-max"
              type="number"
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted-foreground text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all min-h-[44px]"
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
            <span className="text-xs text-muted-foreground">
              {form.description.length} characters (min 10)
            </span>
          </div>
          <textarea
            id="job-description"
            className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted-foreground text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-y min-h-[140px]"
            rows={5}
            placeholder="Describe the job, duties and requirements"
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
          {!isEditing && (
            <button
              type="button"
              onClick={handleSaveDraft}
              className="w-full sm:w-auto px-6 py-3 rounded-full border border-border text-foreground hover:bg-neutral-soft font-semibold text-sm transition-colors min-h-[44px]"
            >
              Save draft
            </button>
          )}

          <button
            id="btn-post-job-submit"
            type="submit"
            disabled={submitting || !form.title.trim() || !form.description.trim()}
            className="w-full sm:w-auto px-8 py-3 rounded-full bg-primary text-foreground font-bold text-sm shadow-sm hover:opacity-95 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
          >
            {submitting ? (
              <>
                <Spinner size="sm" />
                <span>{isEditing ? 'Updating…' : 'Publishing…'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{isEditing ? 'Save changes' : 'Publish job'}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Discard Draft Confirm Dialog */}
      <ConfirmDialog
        isOpen={showDiscardConfirm}
        title="Discard saved draft?"
        message="Your saved draft will be cleared and cannot be recovered."
        confirmLabel="Yes, discard draft"
        cancelLabel="No, keep draft"
        danger
        onConfirm={handleDiscardDraft}
        onCancel={() => setShowDiscardConfirm(false)}
      />

      {/* Update Job Confirm Dialog */}
      <ConfirmDialog
        isOpen={showUpdateConfirm}
        title="Update this job?"
        message="Your changes to this job listing will go live immediately."
        summaryCard={{ jobTitle: form.title, employer: user?.employer_profile?.company_name || user?.full_name }}
        confirmLabel="Yes, update it"
        cancelLabel="No, go back"
        danger={false}
        loading={submitting}
        onConfirm={executeSubmit}
        onCancel={() => setShowUpdateConfirm(false)}
      />
    </div>
  );
}
