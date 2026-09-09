import React, { useState, useEffect } from 'react';
import {
  MapPin, Phone, Mail, Edit3, Save, X,
  BookOpen, Star, Building2, CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usersApi, metaApi, extractError } from '../api/client';
import { Spinner, ProgressBar } from '../components/ui';
import { toastSuccess, toastError } from '../components/ui/Toast';
import SkillSelector from '../components/forms/SkillSelector';

const MUNICIPALITIES = ['Basco', 'Itbayat', 'Ivana', 'Mahatao', 'Sabtang', 'Uyugan'];

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(user?.skills?.split(',').map(skill => skill.trim()).filter(Boolean) || []);
  const [businessTypes, setBusinessTypes] = useState<string[]>([]);

  useEffect(() => {
    metaApi.options().then(options => setBusinessTypes(options.business_types || [])).catch(() => setBusinessTypes([]));
  }, []);

  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone_number: user?.phone_number || user?.phone || '',
    municipality: user?.municipality || '',
    barangay: user?.barangay || '',
    bio: user?.bio || user?.job_seeker_profile?.bio || '',
    // Seeker fields
    skills: user?.skills || '',
    experience_years: user?.job_seeker_profile?.experience_years != null ? user.job_seeker_profile.experience_years.toString() : '',
    education: user?.job_seeker_profile?.education || '',
    // Employer fields
    company_name: user?.employer_profile?.company_name || '',
    company_address: user?.employer_profile?.company_address || '',
    company_description: user?.employer_profile?.company_description || '',
    business_type: user?.employer_profile?.business_type || '',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        full_name: form.full_name,
        phone_number: form.phone_number || undefined,
        municipality: form.municipality,
        barangay: form.barangay || undefined,
        bio: form.bio || undefined,
      };
      if (user?.role === 'job_seeker') {
        payload.skills = selectedSkills.join(', ') || undefined;
        payload.experience_years = form.experience_years ? Number.parseInt(form.experience_years, 10) : 0;
        payload.education = form.education || undefined;
      } else if (user?.role === 'employer') {
        payload.company_name = form.company_name;
        payload.company_address = form.company_address || form.municipality;
        payload.company_description = form.company_description || undefined;
        payload.business_type = form.business_type || undefined;
      }
      await usersApi.updateProfile(payload);
      await refreshUser();
      setEditing(false);
      toastSuccess('Profile updated successfully!');
    } catch (err) {
      toastError(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  const isSeeker = user?.role === 'job_seeker';
  const isEmployer = user?.role === 'employer';
  let selectedBusinessType = '';
  if (businessTypes.includes(form.business_type)) {
    selectedBusinessType = form.business_type;
  } else if (form.business_type) {
    selectedBusinessType = 'Other';
  }

  return (
    <div className="container-page py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black" style={{ color: 'hsl(var(--color-text))' }}>
          My Profile
        </h1>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="btn btn-secondary text-sm">
                <X className="w-4 h-4" /> Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary text-sm">
                {saving ? <Spinner size="sm" /> : <><Save className="w-4 h-4" /> Save</>}
              </button>
            </>
          ) : (
            <button id="btn-edit-profile" onClick={() => setEditing(true)} className="btn btn-secondary text-sm">
              <Edit3 className="w-4 h-4" /> Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Profile Completeness Banner */}
      {(user?.profile_completeness ?? 0) < 100 && !editing && (
        <div
          className="rounded-xl p-4 mb-6 flex items-center gap-4 animate-fade-in"
          style={{
            background: 'hsl(var(--color-primary) / 0.06)',
            border: '1px solid hsl(var(--color-primary) / 0.2)',
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'hsl(var(--color-primary) / 0.12)', color: 'hsl(var(--color-primary))' }}
          >
            <Star className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold mb-1" style={{ color: 'hsl(var(--color-text))' }}>
              Profile is {user?.profile_completeness}% complete
            </p>
            <ProgressBar value={user?.profile_completeness ?? 0} />
          </div>
          <button onClick={() => setEditing(true)} className="btn btn-primary text-xs px-3 py-2">
            Complete
          </button>
        </div>
      )}

      {/* Avatar + Basic Info */}
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-5">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, hsl(var(--color-primary)), hsl(var(--color-secondary)))' }}
          >
            {user?.full_name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="label text-xs">Full Name</label>
                  <input id="profile-full-name" type="text" className="input text-sm" value={form.full_name} onChange={set('full_name')} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label text-xs">Phone</label>
                    <input id="profile-phone" type="tel" className="input text-sm" value={form.phone_number} onChange={set('phone_number')} placeholder="09xx-xxx-xxxx" />
                  </div>
                  <div>
                    <label className="label text-xs">Municipality</label>
                    <select id="profile-municipality" className="input select text-sm" value={form.municipality} onChange={set('municipality')}>
                      {MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label text-xs">Bio / Introduction</label>
                  <textarea
                    id="profile-bio"
                    className="input resize-none text-sm"
                    rows={3}
                    value={form.bio}
                    onChange={set('bio')}
                    placeholder="Tell employers or job seekers about yourself…"
                    maxLength={500}
                  />
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-black mb-1" style={{ color: 'hsl(var(--color-text))' }}>
                  {user?.full_name}
                </h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm" style={{ color: 'hsl(var(--color-text-muted))' }}>
                  <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{user?.email}</span>
                  {user?.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{user.phone}</span>}
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{user?.municipality}, {user?.island}</span>
                </div>
                {user?.bio && (
                  <p className="mt-3 text-sm leading-relaxed" style={{ color: 'hsl(var(--color-text-muted))' }}>
                    {user.bio}
                  </p>
                )}
                <div className="flex gap-2 mt-3">
                  <span className={`badge ${user?.is_verified ? 'badge-success' : 'badge-muted'}`}>
                    {user?.is_verified ? <><CheckCircle className="w-3 h-3" /> Verified</> : 'Unverified'}
                  </span>
                  <span className="badge badge-primary capitalize">{user?.role?.replace('_', ' ')}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Role-specific section */}
      {isSeeker && (
        <div className="card p-6 mb-6">
          <h3 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: 'hsl(var(--color-text))' }}>
            <BookOpen className="w-4 h-4" /> Job Seeker Profile
          </h3>
          {editing ? (
            <div className="space-y-4">
              <div>
                <SkillSelector
                  id="profile-skills"
                  label="Skills"
                  values={selectedSkills}
                  onChange={setSelectedSkills}
                  optional
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label text-xs">Years of Experience</label>
                  <input id="profile-exp" type="number" className="input text-sm" value={form.experience_years} onChange={set('experience_years')} min={0} max={50} />
                </div>
                <div>
                  <label className="label text-xs">Education</label>
                  <input id="profile-education" type="text" className="input text-sm" value={form.education} onChange={set('education')} placeholder="Highest level of education" />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {user?.skills ? (
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'hsl(var(--color-text-muted))' }}>Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {user.skills.split(',').map((s: string) => s.trim()).filter(Boolean).map((skill: string) => (
                      <span key={skill} className="badge badge-primary">{skill}</span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm" style={{ color: 'hsl(var(--color-text-faint))' }}>No skills listed. Add your skills to improve job matching.</p>
              )}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-xs" style={{ color: 'hsl(var(--color-text-muted))' }}>Experience</p>
                  <p className="text-sm font-semibold" style={{ color: 'hsl(var(--color-text))' }}>
                    {user?.job_seeker_profile?.experience_years != null ? `${user.job_seeker_profile.experience_years} year(s)` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'hsl(var(--color-text-muted))' }}>Education</p>
                  <p className="text-sm font-semibold" style={{ color: 'hsl(var(--color-text))' }}>
                    {user?.job_seeker_profile?.education || '—'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {isEmployer && (
        <div className="card p-6 mb-6">
          <h3 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: 'hsl(var(--color-text))' }}>
            <Building2 className="w-4 h-4" /> Company Information
          </h3>
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="label text-xs">Company Name</label>
                <input id="profile-company-name" type="text" className="input text-sm" value={form.company_name} onChange={set('company_name')} required />
              </div>
              <div>
                <label className="label text-xs">Company Description</label>
                <textarea id="profile-company-desc" className="input resize-none text-sm" rows={3} value={form.company_description} onChange={set('company_description')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label text-xs">Business / Enterprise Type</label>
                    <select
                      id="profile-business-type"
                      className="input select text-sm"
                      value={selectedBusinessType}
                      onChange={event => setForm(current => ({ ...current, business_type: event.target.value === 'Other' ? '' : event.target.value }))}
                    >
                      <option value="">Select a business type…</option>
                      {businessTypes.map(type => <option key={type} value={type}>{type}</option>)}
                      <option value="Other">Other</option>
                    </select>
                    {(!businessTypes.includes(form.business_type) || form.business_type === '') && (
                      <input
                        id="profile-business-type-custom"
                        type="text"
                        className="input text-sm mt-2"
                        value={form.business_type}
                        onChange={set('business_type')}
                        placeholder="Enter a business type"
                        maxLength={50}
                      />
                    )}
                </div>
                <div>
                  <label className="label text-xs">Company Address</label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--color-text-faint))' }} />
                    <input id="profile-address" type="text" className="input pl-10 text-sm" value={form.company_address} onChange={set('company_address')} placeholder="National Road, Basco…" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-xs" style={{ color: 'hsl(var(--color-text-muted))' }}>Company</p>
                <p className="text-base font-bold" style={{ color: 'hsl(var(--color-text))' }}>{user?.employer_profile?.company_name || '—'}</p>
              </div>
              {user?.employer_profile?.company_description && (
                <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--color-text-muted))' }}>
                  {user.employer_profile.company_description}
                </p>
              )}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <p className="text-xs" style={{ color: 'hsl(var(--color-text-muted))' }}>Business Type</p>
                  <p className="text-sm font-semibold" style={{ color: 'hsl(var(--color-text))' }}>{user?.employer_profile?.business_type || '—'}</p>
                </div>
                {user?.employer_profile?.company_address && (
                  <div>
                    <p className="text-xs" style={{ color: 'hsl(var(--color-text-muted))' }}>Address</p>
                    <p className="text-sm font-semibold" style={{ color: 'hsl(var(--color-text))' }}>{user.employer_profile.company_address}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
