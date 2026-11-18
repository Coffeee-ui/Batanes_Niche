import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Briefcase,
  Upload,
  CheckCircle,
  Eye,
  Calendar,
  MapPin,
  Phone,
  FileText,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usersApi, extractError } from '../../api/client';
import { Spinner } from '../../components/ui';

const MUNICIPALITIES = ['Basco', 'Itbayat', 'Ivana', 'Mahatao', 'Sabtang', 'Uyugan'];
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Seasonal', 'Freelance'];
const POPULAR_SKILLS = [
  'Hospitality', 'Customer Service', 'Culinary & Cooking', 'Tour Guiding',
  'Carpentry', 'Plumbing', 'Electrical', 'Masonry', 'Agriculture & Farming',
  'Fishing & Marine', 'Driving & Logistics', 'Administration', 'Bookkeeping',
  'Retail & Sales', 'IT & Computer Literacy', 'Teaching & Tutoring', 'Healthcare & Nursing'
];

export default function OnboardingPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Common state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Job Seeker state
  const [municipality, setMunicipality] = useState(user?.municipality || 'Basco');
  const [barangay, setBarangay] = useState(user?.barangay || '');
  const [dob, setDob] = useState(user?.date_of_birth || '');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    user?.skills ? user.skills.split(',').map(s => s.trim()).filter(Boolean) : []
  );
  const [customSkill, setCustomSkill] = useState('');
  const [desiredEmploymentType, setDesiredEmploymentType] = useState(
    user?.desired_employment_type || 'Full-time'
  );
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isDiscoverable, setIsDiscoverable] = useState<boolean>(
    user?.is_discoverable !== undefined ? Boolean(user.is_discoverable) : true
  );

  // Employer state
  const [companyName, setCompanyName] = useState(
    user?.employer_profile?.company_name || user?.full_name || ''
  );
  const [companyAddress, setCompanyAddress] = useState(
    user?.employer_profile?.company_address || ''
  );
  const [businessType, setBusinessType] = useState(
    user?.employer_profile?.business_type || 'Tourism & Hospitality'
  );
  const [industry, setIndustry] = useState(
    user?.employer_profile?.industry || 'Services'
  );
  const [companyDescription, setCompanyDescription] = useState(
    user?.employer_profile?.company_description || ''
  );

  const isSeeker = user?.role === 'job_seeker';
  const totalSteps = isSeeker ? 4 : 2;

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const handleAddCustomSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    if (!customSkill.trim()) return;
    if (!selectedSkills.includes(customSkill.trim())) {
      setSelectedSkills(prev => [...prev, customSkill.trim()]);
    }
    setCustomSkill('');
  };

  const saveSeekerStep1 = async () => {
    setError('');
    setLoading(true);
    try {
      await usersApi.updateProfile({
        municipality,
        barangay: barangay || undefined,
        phone_number: phone || undefined,
        date_of_birth: dob || undefined,
      });
      await refreshUser();
      setStep(2);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  const saveSeekerStep2 = async () => {
    setError('');
    setLoading(true);
    try {
      await usersApi.updateProfile({
        skills: selectedSkills.join(', '),
        desired_employment_type: desiredEmploymentType,
      });
      await refreshUser();
      setStep(3);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  const saveSeekerStep3 = async () => {
    setError('');
    setLoading(true);
    try {
      if (cvFile) {
        await usersApi.uploadResume(cvFile);
      }
      await refreshUser();
      setStep(4);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  const saveSeekerFinal = async () => {
    setError('');
    setLoading(true);
    try {
      await usersApi.setDiscoverability(isDiscoverable);
      await usersApi.updateProfile({
        onboarding_completed: true,
        walkthrough_dismissed: true,
      });
      await refreshUser();
      navigate('/jobs', { replace: true });
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  const saveEmployerStep1 = async () => {
    setError('');
    setLoading(true);
    try {
      await usersApi.updateProfile({
        company_name: companyName,
        company_address: companyAddress || `${municipality}, Batanes`,
        municipality,
        barangay: barangay || undefined,
        business_type: businessType,
        industry,
      });
      await refreshUser();
      setStep(2);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  const saveEmployerFinal = async () => {
    setError('');
    setLoading(true);
    try {
      await usersApi.updateProfile({
        company_description: companyDescription,
        onboarding_completed: true,
        walkthrough_dismissed: true,
      });
      await refreshUser();
      navigate('/my-jobs', { replace: true });
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSkipToApp = async () => {
    try {
      await usersApi.updateProfile({
        onboarding_completed: true,
        walkthrough_dismissed: true,
      });
      await refreshUser();
    } catch {}
    navigate(isSeeker ? '/jobs' : '/my-jobs', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-foreground tracking-tight">
              Batanes <span className="text-primary">Niche</span>
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              Setup
            </span>
          </div>
          <button
            type="button"
            onClick={handleSkipToApp}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Skip for now
          </button>
        </div>

        {/* Card */}
        <div className="card p-6 sm:p-8 shadow-md border border-border bg-surface rounded-2xl">
          {/* Progress Indicators */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-muted-foreground">
                Step {step} of {totalSteps}
              </span>
              <span className="text-xs text-muted-foreground">
                {isSeeker
                  ? step === 1
                    ? 'Profile & Location'
                    : step === 2
                    ? 'Skills & Work'
                    : step === 3
                    ? 'Resume (Optional)'
                    : 'Discoverability'
                  : step === 1
                  ? 'Company Details'
                  : 'Overview & Bio'}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-xl text-xs font-medium bg-danger/10 border border-danger/30 text-danger">
              {error}
            </div>
          )}

          {/* ==================================================== */}
          {/* JOB SEEKER ONBOARDING */}
          {/* ==================================================== */}
          {isSeeker && step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">
                  Tell us where you are based
                </h2>
                <p className="text-xs text-muted-foreground">
                  Employers in Batanes often prefer local talent within their island or municipality.
                </p>
              </div>

              <div>
                <label className="label text-xs">Municipality</label>
                <select
                  value={municipality}
                  onChange={e => setMunicipality(e.target.value)}
                  className="input select text-base sm:text-sm"
                  required
                >
                  {MUNICIPALITIES.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label text-xs">Barangay (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. San Antonio, Kayvaluganan"
                  value={barangay}
                  onChange={e => setBarangay(e.target.value)}
                  className="input text-base sm:text-sm"
                />
              </div>

              <div>
                <label className="label text-xs">Date of Birth (Optional)</label>
                <input
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  className="input text-base sm:text-sm"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Used for minimum age validation. Gender is never collected or displayed.
                </p>
              </div>

              <div>
                <label className="label text-xs">Contact Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 0917 123 4567"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="input text-base sm:text-sm"
                />
              </div>

              <button
                type="button"
                onClick={saveSeekerStep1}
                disabled={loading}
                className="btn btn-primary w-full py-3 text-sm font-bold rounded-xl mt-4 flex items-center justify-center gap-2"
              >
                {loading ? <Spinner size="sm" /> : <>Next <ChevronRight className="w-4 h-4" /></>}
              </button>
            </div>
          )}

          {isSeeker && step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">
                  Your skills & preferences
                </h2>
                <p className="text-xs text-muted-foreground">
                  Select the skills you have to get matched with the best opportunities in Batanes.
                </p>
              </div>

              <div>
                <label className="label text-xs">Popular Skills</label>
                <div className="flex flex-wrap gap-2 pt-1 max-h-48 overflow-y-auto">
                  {POPULAR_SKILLS.map(skill => {
                    const active = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          active
                            ? 'bg-primary text-primary-foreground border-primary font-semibold'
                            : 'bg-muted/30 text-foreground border-border hover:border-primary/50'
                        }`}
                      >
                        {skill} {active ? '✓' : '+'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="label text-xs">Add Other Skills</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Graphic Design, Baking"
                    value={customSkill}
                    onChange={e => setCustomSkill(e.target.value)}
                    onKeyDown={handleAddCustomSkill}
                    className="input text-base sm:text-sm flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSkill}
                    className="btn btn-secondary px-4 text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div>
                <label className="label text-xs">Desired Employment Type</label>
                <select
                  value={desiredEmploymentType}
                  onChange={e => setDesiredEmploymentType(e.target.value)}
                  className="input select text-base sm:text-sm"
                >
                  {EMPLOYMENT_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn-secondary flex-1 py-3 text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={saveSeekerStep2}
                  disabled={loading}
                  className="btn btn-primary flex-2 py-3 text-sm font-bold flex items-center justify-center gap-2"
                >
                  {loading ? <Spinner size="sm" /> : <>Next <ChevronRight className="w-4 h-4" /></>}
                </button>
              </div>
            </div>
          )}

          {isSeeker && step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">
                  Upload your CV / Resume
                </h2>
                <p className="text-xs text-muted-foreground">
                  Optional. Your resume is strictly private and only shared with employers when you apply.
                </p>
              </div>

              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-muted/10 hover:border-primary/50 transition-colors">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs font-semibold text-foreground mb-1">
                  {cvFile ? cvFile.name : 'Upload PDF or DOCX file'}
                </p>
                <p className="text-[11px] text-muted-foreground mb-4">
                  Max 10 MB file size
                </p>
                <input
                  type="file"
                  id="cv-upload-input"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={e => {
                    if (e.target.files?.[0]) setCvFile(e.target.files[0]);
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="cv-upload-input"
                  className="btn btn-secondary text-xs px-4 py-2 cursor-pointer inline-block"
                >
                  {cvFile ? 'Change File' : 'Select File'}
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn btn-secondary flex-1 py-3 text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={saveSeekerStep3}
                  disabled={loading}
                  className="btn btn-primary flex-2 py-3 text-sm font-bold flex items-center justify-center gap-2"
                >
                  {loading ? <Spinner size="sm" /> : cvFile ? 'Upload & Continue' : 'Skip for Now'}
                </button>
              </div>
            </div>
          )}

          {isSeeker && step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">
                  Candidate Discoverability
                </h2>
                <p className="text-xs text-muted-foreground">
                  Choose if verified local employers can find your profile when searching for candidates.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-primary" />
                    <span className="text-sm font-bold text-foreground">
                      Allow employers to discover profile
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isDiscoverable}
                    onChange={e => setIsDiscoverable(e.target.checked)}
                    className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                  />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  When enabled, employers can see your name, municipality, skills, and work experience in candidate searches. Your CV is never public and is only accessible after you apply.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="btn btn-secondary flex-1 py-3 text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={saveSeekerFinal}
                  disabled={loading}
                  className="btn btn-primary flex-2 py-3 text-sm font-bold flex items-center justify-center gap-2"
                >
                  {loading ? <Spinner size="sm" /> : <>Finish & Find Jobs <CheckCircle className="w-4 h-4" /></>}
                </button>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* EMPLOYER ONBOARDING */}
          {/* ==================================================== */}
          {!isSeeker && step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">
                  Company information
                </h2>
                <p className="text-xs text-muted-foreground">
                  Provide verified details about your business or enterprise in Batanes.
                </p>
              </div>

              <div>
                <label className="label text-xs">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. Basco Seaside Inn & Tours"
                  className="input text-base sm:text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">Municipality</label>
                  <select
                    value={municipality}
                    onChange={e => setMunicipality(e.target.value)}
                    className="input select text-base sm:text-sm"
                  >
                    {MUNICIPALITIES.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label text-xs">Business Type</label>
                  <select
                    value={businessType}
                    onChange={e => setBusinessType(e.target.value)}
                    className="input select text-base sm:text-sm"
                  >
                    <option value="Tourism & Hospitality">Tourism & Hospitality</option>
                    <option value="Retail & Trade">Retail & Trade</option>
                    <option value="Construction & Services">Construction & Services</option>
                    <option value="Agriculture & Fishery">Agriculture & Fishery</option>
                    <option value="Government & Public">Government & Public</option>
                    <option value="General Enterprise">General Enterprise</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label text-xs">Business Address</label>
                <input
                  type="text"
                  value={companyAddress}
                  onChange={e => setCompanyAddress(e.target.value)}
                  placeholder="e.g. National Road, Kayvaluganan, Basco"
                  className="input text-base sm:text-sm"
                />
              </div>

              <button
                type="button"
                onClick={saveEmployerStep1}
                disabled={loading}
                className="btn btn-primary w-full py-3 text-sm font-bold rounded-xl mt-4 flex items-center justify-center gap-2"
              >
                {loading ? <Spinner size="sm" /> : <>Next <ChevronRight className="w-4 h-4" /></>}
              </button>
            </div>
          )}

          {!isSeeker && step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">
                  About your organization
                </h2>
                <p className="text-xs text-muted-foreground">
                  Give job seekers a clear idea of your mission, workplace culture, and what it's like to work with you.
                </p>
              </div>

              <div>
                <label className="label text-xs">Company Description (Optional)</label>
                <textarea
                  rows={4}
                  value={companyDescription}
                  onChange={e => setCompanyDescription(e.target.value)}
                  placeholder="Brief summary of your business, services, and team..."
                  className="input text-base sm:text-sm py-2"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn-secondary flex-1 py-3 text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={saveEmployerFinal}
                  disabled={loading}
                  className="btn btn-primary flex-2 py-3 text-sm font-bold flex items-center justify-center gap-2"
                >
                  {loading ? <Spinner size="sm" /> : <>Finish & Post Vacancies <CheckCircle className="w-4 h-4" /></>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
