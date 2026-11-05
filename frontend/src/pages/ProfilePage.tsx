import React, { useState, useEffect } from 'react';
import {
  MapPin, Phone, Mail, Save, X, Lock,
  CheckCircle2, Circle, Building2, Briefcase, Sparkles, User as UserIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usersApi, metaApi, extractError } from '../api/client';
import { Spinner, ProgressBar } from '../components/ui';
import { toastSuccess, toastError } from '../components/ui/Toast';
import SkillSelector from '../components/forms/SkillSelector';

const MUNICIPALITIES = ['Basco', 'Itbayat', 'Ivana', 'Mahatao', 'Sabtang', 'Uyugan'];

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);
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
    experience_years: user?.job_seeker_profile?.experience_years != null ? user.job_seeker_profile.experience_years.toString() : '',
    education: user?.job_seeker_profile?.education || '',
    // Employer fields
    company_name: user?.employer_profile?.company_name || '',
    company_address: user?.employer_profile?.company_address || '',
    company_description: user?.employer_profile?.company_description || '',
    business_type: user?.employer_profile?.business_type || '',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
  };

  const handleReset = () => {
    setForm({
      full_name: user?.full_name || '',
      phone_number: user?.phone_number || user?.phone || '',
      municipality: user?.municipality || 'Basco',
      barangay: user?.barangay || '',
      bio: user?.bio || user?.job_seeker_profile?.bio || '',
      experience_years: user?.job_seeker_profile?.experience_years != null ? user.job_seeker_profile.experience_years.toString() : '',
      education: user?.job_seeker_profile?.education || '',
      company_name: user?.employer_profile?.company_name || '',
      company_address: user?.employer_profile?.company_address || '',
      company_description: user?.employer_profile?.company_description || '',
      business_type: user?.employer_profile?.business_type || '',
    });
    setSelectedSkills(user?.skills?.split(',').map(s => s.trim()).filter(Boolean) || []);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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
      } else if (user?.role === 'employer') {
        payload.company_name = form.company_name.trim();
        payload.company_address = form.company_address.trim() || form.municipality;
        payload.company_description = form.company_description.trim() || undefined;
        payload.business_type = form.business_type.trim() || undefined;
      }

      await usersApi.updateProfile(payload);
      await refreshUser();
      toastSuccess('Profile updated successfully!');
    } catch (err) {
      toastError(extractError(err));
    } finally {
      setSaving(false);
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
        { label: 'Home municipality set', done: Boolean(form.municipality) },
        { label: 'Contact phone / Messenger', done: Boolean(form.phone_number) },
        { label: 'Introduction bio added', done: Boolean(form.bio) },
        { label: 'Key skills listed', done: selectedSkills.length > 0 },
        { label: 'Experience background', done: Boolean(form.experience_years) },
        { label: 'Education background', done: Boolean(form.education) },
      ]
    : [
        { label: 'Company / Organization name', done: Boolean(form.company_name) },
        { label: 'Contact representative name', done: Boolean(form.full_name) },
        { label: 'Contact phone / Messenger', done: Boolean(form.phone_number) },
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
        <p className="text-sm text-muted">
          Manage your personal details and how you appear to others on Batanes Jobs
        </p>
      </div>

      {/* Two-Column Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Identity & Checklist (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Identity Card */}
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-header text-primary border-2 border-border flex items-center justify-center font-bold text-2xl mb-4 shadow-sm">
              {initials}
            </div>

            <h2 className="text-lg font-bold text-foreground">
              {form.full_name || user?.full_name || 'Your Name'}
            </h2>

            <div className="flex items-center gap-1.5 text-xs text-muted mt-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{form.municipality || 'Basco'}, {user?.island || 'Batan Island'}</span>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-neutral text-foreground border border-border">
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
                    <Circle className="w-4 h-4 text-muted shrink-0" />
                  )}
                  <span className={item.done ? 'text-foreground font-medium' : 'text-muted'}>
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
            onSubmit={handleSave}
            className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6"
          >
            <div className="border-b border-border pb-4">
              <h2 className="text-base font-bold text-foreground">
                Edit Profile Details
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Update your contact information and public Ivatan profile.
              </p>
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="profile-full-name" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                Full Name <span className="text-danger">*</span>
              </label>
              <input
                id="profile-full-name"
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
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
                    className="w-full pl-4 pr-10 py-3 rounded-xl border border-border bg-neutral/60 text-muted text-sm cursor-not-allowed select-none"
                    value={user?.email || ''}
                  />
                  <Lock className="w-4 h-4 text-muted absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label htmlFor="profile-phone" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                  Phone / Messenger
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  placeholder="09xx-xxx-xxxx"
                  value={form.phone_number}
                  onChange={set('phone_number')}
                />
              </div>
            </div>

            {/* Municipality & Barangay */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="profile-municipality" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                  Municipality <span className="text-danger">*</span>
                </label>
                <select
                  id="profile-municipality"
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
                <label htmlFor="profile-barangay" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                  Barangay <span className="text-muted font-normal lowercase">(optional)</span>
                </label>
                <input
                  id="profile-barangay"
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  placeholder="e.g. San Antonio"
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
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-y min-h-[100px]"
                rows={3}
                placeholder="Share a brief introduction about your skills, background, or organization…"
                value={form.bio}
                onChange={set('bio')}
                maxLength={500}
              />
            </div>

            {/* Seeker-specific section: Skills, Experience, Education */}
            {isSeeker && (
              <div className="border-t border-border pt-6 space-y-6">
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
                      className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
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
                    <input
                      id="profile-education"
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                      placeholder="e.g. College Graduate, High School, Vocational"
                      value={form.education}
                      onChange={set('education')}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Employer-specific section: Company, Business Type, Address */}
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
                      className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                      value={form.company_name}
                      onChange={set('company_name')}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="profile-business-type" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                      Enterprise / Business Type
                    </label>
                    <input
                      id="profile-business-type"
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                      placeholder="e.g. Hospitality, Retail, Construction"
                      value={form.business_type}
                      onChange={set('business_type')}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="profile-address" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                    Company Physical Address
                  </label>
                  <input
                    id="profile-address"
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    placeholder="e.g. National Road, Kayvaluganan, Basco"
                    value={form.company_address}
                    onChange={set('company_address')}
                  />
                </div>

                <div>
                  <label htmlFor="profile-company-desc" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                    Company Description / Overview
                  </label>
                  <textarea
                    id="profile-company-desc"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-y min-h-[90px]"
                    rows={3}
                    placeholder="Describe what your enterprise does and your mission in Batanes…"
                    value={form.company_description}
                    onChange={set('company_description')}
                  />
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-border text-foreground hover:bg-neutral font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                id="btn-save-profile"
                type="submit"
                disabled={saving || !form.full_name.trim()}
                className="w-full sm:w-auto px-8 py-2.5 rounded-full bg-primary text-foreground font-bold text-xs shadow-xs hover:opacity-95 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Spinner size="sm" />
                    <span>Saving changes…</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
