import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin, Phone, Mail, Save, X, Lock, FileText, Upload,
  CheckCircle2, Circle, Building2, Briefcase, Sparkles, User as UserIcon, Trash2,
  Calendar, Eye, EyeOff, Download, Camera
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usersApi, metaApi, extractError, resolveMediaUrl } from '../api/client';
import { Spinner, ProgressBar, ConfirmDialog } from '../components/ui';
import { toastSuccess, toastError, toastInfo } from '../components/ui/Toast';
import SkillSelector from '../components/forms/SkillSelector';

const MUNICIPALITIES = ['Basco', 'Itbayat', 'Ivana', 'Mahatao', 'Sabtang', 'Uyugan'];

const EMPLOYMENT_TYPES = [
  'Full-time',
  'Part-time',
  'Casual',
  'Contractual',
  'Seasonal'
];

const EDUCATION_LEVELS = [
  'Elementary',
  'Junior High School',
  'Senior High School',
  'Vocational / TESDA Certificate',
  'Associate Degree',
  "Bachelor's Degree",
  "Master's Degree / Post-Graduate",
];

const INDUSTRIES = [
  'Hospitality & Tourism',
  'Retail & Commerce',
  'Agriculture & Fisheries',
  'Construction & Real Estate',
  'Education & Training',
  'Healthcare & Wellness',
  'Transportation & Logistics',
  'Food & Beverage Services',
  'Information Technology & Creative',
  'Public Sector & Community',
];

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showDeleteResumeConfirm, setShowDeleteResumeConfirm] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [deletingResume, setDeletingResume] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoLoadError, setPhotoLoadError] = useState(false);

  useEffect(() => {
    setPhotoLoadError(false);
  }, [user?.profile_pic]);

  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    user?.skills?.split(',').map(s => s.trim()).filter(Boolean) || []
  );
  const [businessTypes, setBusinessTypes] = useState<string[]>([]);

  useEffect(() => {
    metaApi.options()
      .then(options => setBusinessTypes(options.business_types || []))
      .catch(() => setBusinessTypes([]));
  }, []);

  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone_number: user?.phone_number || user?.phone || '',
    municipality: user?.municipality || 'Basco',
    barangay: user?.barangay || '',
    bio: user?.bio || user?.job_seeker_profile?.bio || '',
    // Seeker fields
    date_of_birth: (user as any)?.date_of_birth ? (user as any).date_of_birth.slice(0, 10) : '',
    desired_employment_type: (user as any)?.desired_employment_type || (user as any)?.job_seeker_profile?.desired_employment_type || 'Full-time',
    education: user?.job_seeker_profile?.education || '',
    experience_years: user?.job_seeker_profile?.experience_years != null ? user.job_seeker_profile.experience_years.toString() : '',
    work_experience: (user as any)?.work_experience || (user as any)?.job_seeker_profile?.work_experience || '',
    is_discoverable: (user as any)?.is_discoverable ?? (user as any)?.job_seeker_profile?.is_discoverable ?? true,
    // Employer fields
    company_name: user?.employer_profile?.company_name || '',
    company_address: user?.employer_profile?.company_address || '',
    company_description: user?.employer_profile?.company_description || '',
    business_type: user?.employer_profile?.business_type || '',
    industry: (user as any)?.employer_profile?.industry || '',
  });

  // Re-sync form when user context updates
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        full_name: user.full_name || '',
        phone_number: user.phone_number || user.phone || '',
        municipality: user.municipality || 'Basco',
        barangay: user.barangay || '',
        bio: user.bio || user.job_seeker_profile?.bio || '',
        date_of_birth: (user as any).date_of_birth ? (user as any).date_of_birth.slice(0, 10) : prev.date_of_birth,
        desired_employment_type: (user as any).desired_employment_type || (user as any).job_seeker_profile?.desired_employment_type || prev.desired_employment_type,
        education: user.job_seeker_profile?.education || prev.education,
        experience_years: user.job_seeker_profile?.experience_years != null ? user.job_seeker_profile.experience_years.toString() : prev.experience_years,
        work_experience: (user as any).work_experience || (user as any).job_seeker_profile?.work_experience || prev.work_experience,
        is_discoverable: (user as any).is_discoverable ?? (user as any).job_seeker_profile?.is_discoverable ?? prev.is_discoverable,
        company_name: user.employer_profile?.company_name || prev.company_name,
        company_address: user.employer_profile?.company_address || prev.company_address,
        company_description: user.employer_profile?.company_description || prev.company_description,
        business_type: user.employer_profile?.business_type || prev.business_type,
        industry: (user as any).employer_profile?.industry || prev.industry,
      }));
      if (user.skills) {
        setSelectedSkills(user.skills.split(',').map(s => s.trim()).filter(Boolean));
      }
    }
  }, [user]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      toastError('Please enter your full name.');
      return;
    }
    setShowSaveConfirm(true);
  };

  const executeSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        full_name: form.full_name.trim(),
        phone_number: form.phone_number.trim() || undefined,
        municipality: form.municipality,
        barangay: form.barangay.trim() || undefined,
        bio: form.bio.trim() || undefined,
      };

      if (user?.role === 'job_seeker') {
        payload.skills = selectedSkills.join(', ') || undefined;
        payload.experience_years = form.experience_years ? Number.parseInt(form.experience_years, 10) : 0;
        payload.education = form.education.trim() || undefined;
        payload.date_of_birth = form.date_of_birth ? new Date(form.date_of_birth).toISOString() : undefined;
        payload.desired_employment_type = form.desired_employment_type;
        payload.work_experience = form.work_experience.trim() || undefined;
        payload.is_discoverable = Boolean(form.is_discoverable);
      } else if (user?.role === 'employer') {
        payload.company_name = form.company_name.trim();
        payload.company_address = form.company_address.trim() || form.municipality;
        payload.company_description = form.company_description.trim() || undefined;
        payload.business_type = form.business_type.trim() || undefined;
        payload.industry = form.industry.trim() || undefined;
      }

      await usersApi.updateProfile(payload);
      await refreshUser();
      setShowSaveConfirm(false);
      toastSuccess('Profile updated successfully!');
    } catch (err) {
      toastError(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  // Upload Profile Picture (JPEG/PNG only, max 5MB)
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toastError('Profile picture must be 5 MB or less.');
      if (photoInputRef.current) photoInputRef.current.value = '';
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'jpg' && ext !== 'jpeg' && ext !== 'png') {
      toastError('Only JPEG and PNG images are allowed for profile pictures.');
      if (photoInputRef.current) photoInputRef.current.value = '';
      return;
    }

    setUploadingPhoto(true);
    try {
      await usersApi.uploadProfilePicture(file);
      await refreshUser();
      toastSuccess('Profile picture updated!');
    } catch (err) {
      toastError(extractError(err));
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  // Upload CV (PDF/DOCX only, max 10MB)
  const handleResumeFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (10 MB max per spec)
    if (file.size > 10 * 1024 * 1024) {
      toastError('CV file must be 10 MB or less.');
      if (resumeInputRef.current) resumeInputRef.current.value = '';
      return;
    }

    // Validate extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'docx') {
      toastError('Only PDF and DOCX files are allowed.');
      if (resumeInputRef.current) resumeInputRef.current.value = '';
      return;
    }

    setUploadingResume(true);
    try {
      await usersApi.uploadResume(file);
      await refreshUser();
      toastSuccess('CV uploaded successfully!');
    } catch (err) {
      toastError(extractError(err));
    } finally {
      setUploadingResume(false);
      if (resumeInputRef.current) resumeInputRef.current.value = '';
    }
  };

  const executeDeleteResume = async () => {
    setDeletingResume(true);
    try {
      await usersApi.deleteResume();
      await refreshUser();
      setShowDeleteResumeConfirm(false);
      toastSuccess('CV removed successfully.');
    } catch (err) {
      toastError(extractError(err));
    } finally {
      setDeletingResume(false);
    }
  };

  const handleToggleDiscoverability = async (checked: boolean) => {
    setForm(f => ({ ...f, is_discoverable: checked }));
    try {
      await usersApi.setDiscoverability(checked);
      await refreshUser();
      toastSuccess(checked ? 'Candidate profile is now discoverable.' : 'Candidate profile is now private.');
    } catch (err) {
      toastError(extractError(err));
      // Revert on error
      setForm(f => ({ ...f, is_discoverable: !checked }));
    }
  };

  const isSeeker = user?.role === 'job_seeker';
  const isEmployer = user?.role === 'employer';

  const initials = (user?.full_name || 'U')
    .split(' ')
    .map(p => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Dynamic Checklist Items based on completeness
  const checklistItems = isSeeker
    ? [
        { label: 'Full name provided', done: Boolean(form.full_name) },
        { label: 'Date of birth recorded', done: Boolean(form.date_of_birth) },
        { label: 'Home municipality set', done: Boolean(form.municipality) },
        { label: 'Contact phone / Messenger', done: Boolean(form.phone_number) },
        { label: 'Desired employment type', done: Boolean(form.desired_employment_type) },
        { label: 'Key skills listed', done: selectedSkills.length > 0 },
        { label: 'Education background', done: Boolean(form.education) },
        { label: 'Work experience background', done: Boolean(form.work_experience || form.experience_years) },
        { label: 'Introduction bio added', done: Boolean(form.bio) },
        { label: 'CV / Resume attached', done: Boolean(user?.resume_url) },
      ]
    : [
        { label: 'Company / Organization name', done: Boolean(form.company_name) },
        { label: 'Contact representative name', done: Boolean(form.full_name) },
        { label: 'Contact phone / Messenger', done: Boolean(form.phone_number) },
        { label: 'Industry sector', done: Boolean(form.industry) },
        { label: 'Business enterprise type', done: Boolean(form.business_type) },
        { label: 'Office address & municipality', done: Boolean(form.company_address) },
        { label: 'Company overview / description', done: Boolean(form.company_description) },
      ];

  const completeness = Math.round(
    (checklistItems.filter(item => item.done).length / checklistItems.length) * 100
  );

  return (
    <div className="container-page py-8">
      {/* Top Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-1 tracking-tight">
          Account Profile
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your personal details and how you appear to others on Batanes Niche
        </p>
      </div>

      {/* Two-Column Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Identity & Checklist (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Identity Card with Picture Upload */}
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col items-center text-center relative">
            <div className="relative mb-4 group">
              {user?.profile_pic && !photoLoadError ? (
                <img
                  src={resolveMediaUrl(user.profile_pic) || user.profile_pic}
                  alt={user.full_name || 'Profile'}
                  onError={() => setPhotoLoadError(true)}
                  className="w-24 h-24 rounded-full object-cover border-2 border-border shadow-sm"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-header text-primary border-2 border-border flex items-center justify-center font-bold text-2xl shadow-sm">
                  {initials}
                </div>
              )}

              {/* Photo change overlay */}
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-semibold gap-1 cursor-pointer"
                aria-label="Change profile picture"
              >
                {uploadingPhoto ? (
                  <Spinner size="sm" />
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>Change</span>
                  </>
                )}
              </button>

              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={handlePhotoSelect}
              />
            </div>

            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="text-xs text-primary font-semibold hover:underline mb-2"
            >
              Upload profile photo (JPEG/PNG, max 5MB)
            </button>

            <h2 className="text-lg font-bold text-foreground">
              {form.full_name || user?.full_name || 'Your Name'}
            </h2>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{form.municipality || 'Basco'}, {user?.island || 'Batan Island'}</span>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-neutral-soft text-foreground border border-border">
                {isSeeker ? 'Job Seeker' : 'Employer'}
              </span>
            </div>

            <div className="w-full mt-6 pt-5 border-t border-border">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-foreground">Profile completeness</span>
                <span className="font-bold text-foreground">{completeness}%</span>
              </div>
              <ProgressBar value={completeness} />
            </div>
          </div>

          {/* Discoverability Card (Job Seekers only) */}
          {isSeeker && (
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  {form.is_discoverable ? (
                    <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span>Discoverability</span>
                </h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(form.is_discoverable)}
                    onChange={e => handleToggleDiscoverability(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-soft peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {form.is_discoverable
                  ? 'Your profile is visible to registered employers in the candidate directory. Employers can see your skills, municipality, and experience.'
                  : 'Your profile is private and hidden from the candidate discovery directory. Only employers whose vacancies you directly apply to can see your profile.'}
              </p>
              <div className="text-[11px] p-2.5 rounded-xl bg-neutral-soft/50 border border-border text-muted-foreground">
                <p className="font-semibold text-foreground mb-0.5">Note on CV privacy:</p>
                Your CV is never publicly downloadable through discovery. Only employers you apply to can download your CV.
              </div>
            </div>
          )}

          {/* Resume Card for Job Seekers (10MB max, PDF/DOCX) */}
          {isSeeker && (
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span>CV / Resume</span>
                </h3>
                {user?.resume_url && (
                  <span className="badge badge-success text-[11px]">Attached</span>
                )}
              </div>

              {user?.resume_url ? (
                <div className="space-y-3">
                  <div className="rounded-xl p-3 bg-neutral-soft/60 border border-border flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-5 h-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">
                          {user.resume_url.split('/').pop() || 'Curriculum Vitae'}
                        </p>
                        <p className="text-[11px] text-muted-foreground">PDF or DOCX (Protected)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={usersApi.downloadResumeUrl()}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                        title="Download CV"
                        onClick={async (e) => {
                          e.preventDefault();
                          try {
                            await usersApi.downloadResume();
                          } catch {
                            window.open(usersApi.downloadResumeUrl(), '_blank');
                          }
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => setShowDeleteResumeConfirm(true)}
                        className="p-1.5 rounded-lg text-danger hover:bg-danger/10 transition-colors"
                        aria-label="Delete CV"
                        title="Delete CV"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => resumeInputRef.current?.click()}
                    disabled={uploadingResume}
                    className="btn btn-secondary w-full text-xs py-2.5 rounded-xl font-semibold flex items-center justify-center gap-1.5 min-h-[44px]"
                  >
                    {uploadingResume ? <Spinner size="sm" /> : <><Upload className="w-3.5 h-3.5" /> Replace CV</>}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Upload your CV / Resume (PDF or DOCX, max 10 MB). It remains completely private until you submit an application.
                  </p>
                  <button
                    type="button"
                    onClick={() => resumeInputRef.current?.click()}
                    disabled={uploadingResume}
                    className="btn btn-primary w-full text-xs py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 min-h-[44px]"
                  >
                    {uploadingResume ? <Spinner size="sm" /> : <><Upload className="w-3.5 h-3.5" /> Upload CV / Resume</>}
                  </button>
                </div>
              )}

              {/* Hidden file input for resume */}
              <input
                ref={resumeInputRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={handleResumeFileSelect}
              />
            </div>
          )}

          {/* Checklist Card */}
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Profile Completeness
            </h3>
            <div className="space-y-3">
              {checklistItems.map(item => (
                <div key={item.label} className="flex items-center gap-2.5 text-xs">
                  {item.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <span className={item.done ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile Form (8 cols) */}
        <div className="lg:col-span-8">
          <form
            onSubmit={handleFormSubmit}
            className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6"
          >
            <div className="border-b border-border pb-4">
              <h2 className="text-base font-bold text-foreground">
                Edit Profile Details
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Update your contact information and Ivatan profile credentials.
              </p>
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="profile-full-name" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                {isEmployer ? 'Contact Representative Full Name' : 'Full Name'} <span className="text-danger">*</span>
              </label>
              <input
                id="profile-full-name"
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted-foreground text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all min-h-[44px]"
                placeholder="Your full name"
                value={form.full_name}
                onChange={set('full_name')}
                required
              />
            </div>

            {/* Email (Read-only) & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="profile-email" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="profile-email"
                    type="email"
                    disabled
                    className="w-full pl-4 pr-10 py-3 rounded-xl border border-border bg-neutral-soft text-muted-foreground text-base sm:text-sm cursor-not-allowed select-none min-h-[44px]"
                    value={user?.email || ''}
                  />
                  <Lock className="w-4 h-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label htmlFor="profile-phone" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                  Contact Number (Phone / Messenger)
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted-foreground text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all min-h-[44px]"
                  placeholder="e.g. 0912 345 6789"
                  value={form.phone_number}
                  onChange={set('phone_number')}
                />
              </div>
            </div>

            {/* Seeker Date of Birth (Guidance included) */}
            {isSeeker && (
              <div>
                <label htmlFor="profile-dob" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                  Date of Birth
                </label>
                <p className="text-[11px] text-muted-foreground mb-2">
                  Job seekers must be at least 15 years old for general employment under Philippine labor regulations.
                </p>
                <input
                  id="profile-dob"
                  type="date"
                  className="w-full sm:w-1/2 px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all min-h-[44px]"
                  value={form.date_of_birth}
                  onChange={set('date_of_birth')}
                  max={new Date().toISOString().slice(0, 10)}
                />
              </div>
            )}

            {/* Municipality & Barangay */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="profile-municipality" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                  Municipality <span className="text-danger">*</span>
                </label>
                <select
                  id="profile-municipality"
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
                <label htmlFor="profile-barangay" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                  Barangay <span className="text-muted-foreground font-normal lowercase">(optional)</span>
                </label>
                <input
                  id="profile-barangay"
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted-foreground text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all min-h-[44px]"
                  placeholder="e.g. Kayvaluganan, San Antonio"
                  value={form.barangay}
                  onChange={set('barangay')}
                />
              </div>
            </div>

            {/* Short Bio */}
            <div>
              <label htmlFor="profile-bio" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                Short Bio / Introduction
              </label>
              <textarea
                id="profile-bio"
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted-foreground text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-y min-h-[100px]"
                rows={3}
                placeholder="Tell employers about yourself, your background, and your dedication to working in Batanes…"
                value={form.bio}
                onChange={set('bio')}
                maxLength={500}
              />
            </div>

            {/* Seeker-specific section: Desired Employment Type, Skills, Education, Work Experience */}
            {isSeeker && (
              <div className="border-t border-border pt-6 space-y-6">
                <div>
                  <label htmlFor="profile-desired-type" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                    Desired Employment Type
                  </label>
                  <select
                    id="profile-desired-type"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all min-h-[44px]"
                    value={form.desired_employment_type}
                    onChange={set('desired_employment_type')}
                  >
                    {EMPLOYMENT_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <SkillSelector
                    id="profile-skills"
                    label="Skills & Expertise"
                    values={selectedSkills}
                    onChange={setSelectedSkills}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="profile-exp" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                      Years of Experience
                    </label>
                    <input
                      id="profile-exp"
                      type="number"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted-foreground text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all min-h-[44px]"
                      placeholder="e.g. 2"
                      value={form.experience_years}
                      onChange={set('experience_years')}
                      min={0}
                      max={50}
                    />
                  </div>

                  <div>
                    <label htmlFor="profile-education" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                      Highest Level of Education
                    </label>
                    <select
                      id="profile-education"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all min-h-[44px]"
                      value={form.education}
                      onChange={set('education')}
                    >
                      <option value="">Select Education Level</option>
                      {EDUCATION_LEVELS.map(lvl => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="profile-work-experience" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                    Work Experience & Employment History
                  </label>
                  <textarea
                    id="profile-work-experience"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted-foreground text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-y min-h-[100px]"
                    rows={4}
                    placeholder="Describe past employers, roles held, relevant tasks, seasonal jobs, or artisan livelihoods in Batanes…"
                    value={form.work_experience}
                    onChange={set('work_experience')}
                  />
                </div>
              </div>
            )}

            {/* Employer-specific section: Company, Industry, Business Type, Address */}
            {isEmployer && (
              <div className="border-t border-border pt-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="profile-company-name" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                      Company / Organization Name <span className="text-danger">*</span>
                    </label>
                    <input
                      id="profile-company-name"
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted-foreground text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all min-h-[44px]"
                      placeholder="e.g. Ivana Heritage Crafts"
                      value={form.company_name}
                      onChange={set('company_name')}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="profile-industry" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                      Industry Sector
                    </label>
                    <select
                      id="profile-industry"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all min-h-[44px]"
                      value={form.industry}
                      onChange={set('industry')}
                    >
                      <option value="">Select Industry</option>
                      {INDUSTRIES.map(ind => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="profile-business-type" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                      Business Entity Type
                    </label>
                    <input
                      id="profile-business-type"
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted-foreground text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all min-h-[44px]"
                      placeholder="e.g. Sole Proprietorship, Cooperative"
                      value={form.business_type}
                      onChange={set('business_type')}
                    />
                  </div>

                  <div>
                    <label htmlFor="profile-company-address" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                      Office / Facility Address
                    </label>
                    <input
                      id="profile-company-address"
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted-foreground text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all min-h-[44px]"
                      placeholder="e.g. National Road, Radiwan, Ivana"
                      value={form.company_address}
                      onChange={set('company_address')}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="profile-company-desc" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                    Company Overview & Mission
                  </label>
                  <textarea
                    id="profile-company-desc"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted-foreground text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-y min-h-[100px]"
                    rows={4}
                    placeholder="Tell job seekers about your organization's work, values, and community impact in Batanes…"
                    value={form.company_description}
                    onChange={set('company_description')}
                  />
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="submit"
                disabled={saving || !form.full_name.trim()}
                className="w-full sm:w-auto px-8 py-3 rounded-full bg-primary text-foreground font-bold text-sm shadow-sm hover:opacity-95 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
              >
                {saving ? (
                  <>
                    <Spinner size="sm" />
                    <span>Saving changes…</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save profile changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Save Profile Confirm Dialog */}
      <ConfirmDialog
        isOpen={showSaveConfirm}
        title="Save profile changes?"
        message="Your updated profile information will be saved immediately."
        confirmLabel="Yes, save changes"
        cancelLabel="No, keep editing"
        danger={false}
        loading={saving}
        onConfirm={executeSave}
        onCancel={() => setShowSaveConfirm(false)}
      />

      {/* Delete Resume Confirm Dialog */}
      <ConfirmDialog
        isOpen={showDeleteResumeConfirm}
        title="Remove CV / Resume?"
        message="Your attached CV file will be permanently deleted from Batanes Niche."
        confirmLabel="Yes, delete CV"
        cancelLabel="No, keep CV"
        danger
        loading={deletingResume}
        onConfirm={executeDeleteResume}
        onCancel={() => setShowDeleteResumeConfirm(false)}
      />
    </div>
  );
}
