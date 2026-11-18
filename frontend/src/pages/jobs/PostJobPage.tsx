import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, ArrowLeft, RotateCcw, Plus, Trash2, HelpCircle } from 'lucide-react';
import { jobsApi, extractError } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import type { JobCreate } from '../../types';
import { Spinner, ConfirmDialog, CategoryIcon } from '../../components/ui';
import { toastSuccess, toastError, toastInfo } from '../../components/ui/Toast';
import SkillSelector from '../../components/forms/SkillSelector';

const MUNICIPALITIES = ['Basco', 'Itbayat', 'Ivana', 'Mahatao', 'Sabtang', 'Uyugan'];
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Casual', 'Contractual', 'Seasonal'];
const WORK_ARRANGEMENTS = [
  { value: 'on_site', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
];
const EXPERIENCE_LEVELS = [
  { value: 'no_experience_required', label: 'No experience required' },
  { value: 'entry_level', label: 'Entry level' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'senior', label: 'Senior' },
];
const SALARY_TYPES = [
  { value: 'range', label: 'Salary Range' },
  { value: 'fixed', label: 'Fixed Amount' },
  { value: 'negotiable', label: 'Negotiable' },
];
const SALARY_PERIODS = [
  { value: 'monthly', label: 'per month' },
  { value: 'daily', label: 'per day' },
  { value: 'hourly', label: 'per hour' },
  { value: 'piece_rate', label: 'piece rate' },
];
const COMMON_BENEFITS = [
  'SSS',
  'PhilHealth',
  'Pag-IBIG',
  'Free meals',
  'Housing / Lodging',
  'Overtime pay',
  'Transportation allowance',
  'Uniform provided',
];
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
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([]);
  const [customBenefit, setCustomBenefit] = useState('');
  const [screeningQuestions, setScreeningQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [hasDraftPrompt, setHasDraftPrompt] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);

  const [form, setForm] = useState<JobCreate>({
    title: '',
    description: '',
    municipality: user?.municipality || 'Basco',
    barangay: '',
    street_or_landmark: '',
    multiple_locations: false,
    work_arrangement: 'on_site',
    employment_type: 'Full-time',
    experience_level: 'entry_level',
    salary_type: 'range',
    salary_period: 'monthly',
    salary_min: 15000,
    salary_max: 25000,
    required_skills: '',
    category: CATEGORIES[0],
    application_deadline: '',
    is_featured: false,
    status: 'published',
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
            street_or_landmark: job.street_or_landmark || '',
            multiple_locations: Boolean(job.multiple_locations),
            work_arrangement: job.work_arrangement || 'on_site',
            employment_type: job.employment_type || 'Full-time',
            experience_level: job.experience_level || 'entry_level',
            salary_type: job.salary_type || 'range',
            salary_period: job.salary_period || 'monthly',
            salary_min: job.salary_min || 0,
            salary_max: job.salary_max || 0,
            required_skills: job.required_skills || '',
            category: (job as any).category || CATEGORIES[0],
            application_deadline: job.application_deadline ? job.application_deadline.slice(0, 10) : '',
            is_featured: Boolean(job.is_featured),
            status: job.status || 'published',
          });
          if ((job as any).category && CATEGORIES.includes((job as any).category)) {
            setSelectedCategory((job as any).category);
          }
          if (job.required_skills) {
            setSelectedSkills(job.required_skills.split(',').map(s => s.trim()).filter(Boolean));
          }
          if (job.benefits) {
            setSelectedBenefits(job.benefits.split(',').map(s => s.trim()).filter(Boolean));
          }
          if (job.application_questions && Array.isArray(job.application_questions)) {
            setScreeningQuestions(job.application_questions);
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
        if (parsed.selectedBenefits) setSelectedBenefits(parsed.selectedBenefits);
        if (parsed.screeningQuestions) setScreeningQuestions(parsed.screeningQuestions);
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
        selectedBenefits,
        screeningQuestions,
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

  const toggleBenefit = (b: string) => {
    setSelectedBenefits(prev =>
      prev.includes(b) ? prev.filter(item => item !== b) : [...prev, b]
    );
  };

  const handleAddCustomBenefit = () => {
    if (!customBenefit.trim()) return;
    if (!selectedBenefits.includes(customBenefit.trim())) {
      setSelectedBenefits(prev => [...prev, customBenefit.trim()]);
    }
    setCustomBenefit('');
  };

  const handleAddQuestion = () => {
    if (!newQuestion.trim()) return;
    setScreeningQuestions(prev => [...prev, newQuestion.trim()]);
    setNewQuestion('');
  };

  const handleRemoveQuestion = (idx: number) => {
    setScreeningQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const validate = (): boolean => {
    if (!form.title.trim()) {
      toastError('Please enter a vacancy title.');
      return false;
    }
    if (!form.description.trim() || form.description.length < 10) {
      toastError('Vacancy description must be at least 10 characters.');
      return false;
    }
    if (selectedSkills.length === 0) {
      toastError('Please select or add at least one required skill.');
      return false;
    }
    if (form.salary_type === 'range' && form.salary_min != null && form.salary_max != null && Number(form.salary_min) > Number(form.salary_max)) {
      toastError('Minimum salary cannot exceed maximum salary.');
      return false;
    }
    return true;
  };

  const handleFormSubmit = (e: React.FormEvent, targetStatus: 'published' | 'draft' = 'published') => {
    e.preventDefault();
    if (!validate()) return;

    if (isEditing) {
      setShowUpdateConfirm(true);
    } else {
      executeSubmit(targetStatus);
    }
  };

  const executeSubmit = async (targetStatus: 'published' | 'draft' = 'published') => {
    setSubmitting(true);
    try {
      const payload: JobCreate = {
        ...form,
        title: form.title.trim(),
        salary_type: form.salary_type,
        salary_period: form.salary_period,
        salary_min: form.salary_type === 'negotiable' ? 0 : (form.salary_min ? Number(form.salary_min) : 0),
        salary_max: form.salary_type === 'negotiable' ? 0 : (form.salary_type === 'fixed' ? Number(form.salary_min) : (form.salary_max ? Number(form.salary_max) : 0)),
        barangay: form.barangay || undefined,
        street_or_landmark: form.street_or_landmark || undefined,
        multiple_locations: Boolean(form.multiple_locations),
        work_arrangement: form.work_arrangement || 'on_site',
        experience_level: form.experience_level || 'entry_level',
        benefits: selectedBenefits.join(', ') || undefined,
        application_deadline: form.application_deadline ? new Date(form.application_deadline).toISOString() : undefined,
        application_questions: screeningQuestions.length > 0 ? screeningQuestions : undefined,
        category: selectedCategory,
        required_skills: selectedSkills.join(', ') || 'General',
        is_featured: Boolean(form.is_featured),
        status: isEditing ? (form.status || 'published') : targetStatus,
      };

      if (isEditing && editId) {
        await jobsApi.update(Number(editId), payload);
        toastSuccess('Vacancy listing updated successfully!');
        setShowUpdateConfirm(false);
        navigate(`/jobs/${editId}`);
      } else {
        const job = await jobsApi.create(payload);
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {}
        toastSuccess(targetStatus === 'draft' ? 'Vacancy saved as draft.' : 'Vacancy published successfully!');
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
          {isEditing ? 'Edit Vacancy Listing' : 'Post a Vacancy'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isEditing
            ? 'Update your vacancy opening details in Batanes.'
            : 'Find qualified Ivatan talent for your opening across Batanes.'}
        </p>
      </div>

      {/* Resume Draft Banner */}
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
        onSubmit={e => handleFormSubmit(e, 'published')}
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
            placeholder="e.g. Front Desk Staff, Tourist Van Driver, Tour Guide"
            value={form.title}
            onChange={set('title')}
            required
            maxLength={150}
          />
        </div>

        {/* Category: Single swipeable row of icon chips */}
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

        {/* Work Arrangement & Employment Type Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="job-work-arrangement" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
              Work Arrangement <span className="text-danger">*</span>
            </label>
            <select
              id="job-work-arrangement"
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all min-h-[44px]"
              value={form.work_arrangement}
              onChange={set('work_arrangement')}
              required
            >
              {WORK_ARRANGEMENTS.map(w => (
                <option key={w.value} value={w.value}>{w.label}</option>
              ))}
            </select>
          </div>

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
        </div>

        {/* Experience Level */}
        <div>
          <label htmlFor="job-experience-level" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
            Experience Level
          </label>
          <select
            id="job-experience-level"
            className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all min-h-[44px]"
            value={form.experience_level}
            onChange={set('experience_level')}
          >
            {EXPERIENCE_LEVELS.map(lvl => (
              <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
            ))}
          </select>
        </div>

        {/* Location Section */}
        <div className="space-y-4 border-t border-border pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div>
              <label htmlFor="job-barangay" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                Barangay <span className="text-muted-foreground font-normal lowercase">(optional)</span>
              </label>
              <input
                id="job-barangay"
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted-foreground text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all min-h-[44px]"
                placeholder="e.g. Kayvaluganan, San Antonio"
                value={form.barangay || ''}
                onChange={set('barangay')}
              />
            </div>
          </div>

          <div>
            <label htmlFor="job-street" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
              Street / Landmark <span className="text-muted-foreground font-normal lowercase">(optional)</span>
            </label>
            <input
              id="job-street"
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted-foreground text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all min-h-[44px]"
              placeholder="e.g. Near Basco Lighthouse or National Road"
              value={form.street_or_landmark || ''}
              onChange={set('street_or_landmark')}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={Boolean(form.multiple_locations)}
              onChange={e => setForm(f => ({ ...f, multiple_locations: e.target.checked }))}
              className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
            />
            <span className="text-xs text-foreground font-medium">
              This role involves travel or work across multiple municipalities in Batanes
            </span>
          </label>
        </div>

        {/* Compensation & Salary Section */}
        <div className="space-y-4 border-t border-border pt-4">
          <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
            Compensation Details
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="job-salary-type" className="block text-xs font-semibold text-muted-foreground mb-1">
                Salary Structure
              </label>
              <select
                id="job-salary-type"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all min-h-[44px]"
                value={form.salary_type}
                onChange={set('salary_type')}
              >
                {SALARY_TYPES.map(st => (
                  <option key={st.value} value={st.value}>{st.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="job-salary-period" className="block text-xs font-semibold text-muted-foreground mb-1">
                Payment Period
              </label>
              <select
                id="job-salary-period"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all min-h-[44px]"
                value={form.salary_period}
                onChange={set('salary_period')}
              >
                {SALARY_PERIODS.map(sp => (
                  <option key={sp.value} value={sp.value}>{sp.label}</option>
                ))}
              </select>
            </div>
          </div>

          {form.salary_type !== 'negotiable' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="job-salary-min" className="block text-xs font-semibold text-muted-foreground mb-1">
                  {form.salary_type === 'fixed' ? 'Amount (₱)' : 'Minimum (₱)'}
                </label>
                <input
                  id="job-salary-min"
                  type="number"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all min-h-[44px]"
                  placeholder="e.g. 15000"
                  value={form.salary_min ?? ''}
                  onChange={set('salary_min')}
                  min={0}
                  step={500}
                />
              </div>

              {form.salary_type === 'range' && (
                <div>
                  <label htmlFor="job-salary-max" className="block text-xs font-semibold text-muted-foreground mb-1">
                    Maximum (₱)
                  </label>
                  <input
                    id="job-salary-max"
                    type="number"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all min-h-[44px]"
                    placeholder="e.g. 25000"
                    value={form.salary_max ?? ''}
                    onChange={set('salary_max')}
                    min={0}
                    step={500}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Benefits Section */}
        <div className="space-y-3 border-t border-border pt-4">
          <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
            Benefits & Perks <span className="text-muted-foreground font-normal lowercase">(optional)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {COMMON_BENEFITS.map(b => {
              const active = selectedBenefits.includes(b);
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => toggleBenefit(b)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    active
                      ? 'bg-primary text-foreground border-primary'
                      : 'bg-surface border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {active ? `✓ ${b}` : `+ ${b}`}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 pt-1">
            <input
              type="text"
              placeholder="Add other benefit (e.g. Health Insurance)..."
              value={customBenefit}
              onChange={e => setCustomBenefit(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomBenefit(); } }}
              className="flex-1 px-3 py-2 rounded-xl border border-border bg-surface text-foreground text-xs placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={handleAddCustomBenefit}
              className="px-4 py-2 rounded-xl bg-neutral-soft text-foreground text-xs font-semibold hover:bg-neutral-soft/80"
            >
              Add
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="job-description" className="text-xs font-bold text-foreground uppercase tracking-wider">
              Job Description & Responsibilities <span className="text-danger">*</span>
            </label>
            <span className="text-xs text-muted-foreground">
              {form.description.length} characters (min 10)
            </span>
          </div>
          <textarea
            id="job-description"
            className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted-foreground text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-y min-h-[140px]"
            rows={5}
            placeholder="Describe the job duties, daily expectations, working hours, and what makes working with your team special in Batanes…"
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

        {/* Application Deadline & Screening Questions */}
        <div className="space-y-4 border-t border-border pt-4">
          <div>
            <label htmlFor="job-deadline" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
              Application Deadline <span className="text-muted-foreground font-normal lowercase">(optional)</span>
            </label>
            <input
              id="job-deadline"
              type="date"
              className="px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all min-h-[44px]"
              value={form.application_deadline ? form.application_deadline.slice(0, 10) : ''}
              onChange={set('application_deadline')}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
                Screening Questions <span className="text-muted-foreground font-normal lowercase">(optional)</span>
              </label>
              <span className="text-xs text-muted-foreground">
                Applicants answer these upon applying
              </span>
            </div>

            {screeningQuestions.length > 0 && (
              <div className="space-y-2 mb-3">
                {screeningQuestions.map((q, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-neutral-soft/50 border border-border gap-2">
                    <span className="text-xs font-medium text-foreground">{idx + 1}. {q}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(idx)}
                      className="p-1 text-danger hover:bg-danger/10 rounded-lg transition-colors"
                      title="Remove question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Do you have a valid driver's license? or Are you based in Batanes?"
                value={newQuestion}
                onChange={e => setNewQuestion(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddQuestion(); } }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground text-sm placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-4 py-2.5 rounded-xl bg-neutral-soft text-foreground text-xs font-semibold hover:bg-neutral-soft/80 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Question
              </button>
            </div>
          </div>
        </div>

        {/* Feature This Vacancy Option (Max 3 per employer limit) */}
        <div className="rounded-xl p-4 bg-neutral-soft/40 border border-border space-y-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(form.is_featured)}
              onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))}
              className="w-4 h-4 mt-0.5 rounded text-primary focus:ring-primary border-border"
            />
            <div>
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Feature this vacancy on the homepage
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Featured vacancies appear at the top of the homepage. Employers can have up to 3 active featured vacancies simultaneously.
              </p>
            </div>
          </label>
        </div>

        {/* Actions & Submit Buttons */}
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-end gap-3">
          {!isEditing && (
            <button
              type="button"
              onClick={handleSaveDraft}
              className="w-full sm:w-auto px-6 py-3 rounded-full border border-border text-foreground hover:bg-neutral-soft font-semibold text-sm transition-colors min-h-[44px]"
            >
              Save local draft
            </button>
          )}

          {!isEditing && (
            <button
              type="button"
              disabled={submitting}
              onClick={e => handleFormSubmit(e, 'draft')}
              className="w-full sm:w-auto px-6 py-3 rounded-full border border-border bg-neutral-soft text-foreground hover:bg-neutral-soft/80 font-semibold text-sm transition-colors min-h-[44px]"
            >
              Save as Vacancy Draft
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
                <span>{isEditing ? 'Save changes' : 'Publish Vacancy'}</span>
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
        title="Update this vacancy?"
        message="Your changes to this vacancy listing will go live immediately."
        summaryCard={{ jobTitle: form.title, employer: user?.employer_profile?.company_name || user?.full_name }}
        confirmLabel="Yes, update it"
        cancelLabel="No, go back"
        danger={false}
        loading={submitting}
        onConfirm={() => executeSubmit(form.status === 'draft' ? 'draft' : 'published')}
        onCancel={() => setShowUpdateConfirm(false)}
      />
    </div>
  );
}
