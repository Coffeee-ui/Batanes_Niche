import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Key,
  Bell,
  Globe,
  Eye,
  UserX,
  Trash2,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usersApi, extractError } from '../../api/client';
import { Spinner } from '../../components/ui';

export default function AccountSettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'security' | 'notifications' | 'preferences' | 'danger'>('security');

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Discoverability
  const [isDiscoverable, setIsDiscoverable] = useState(user?.is_discoverable ?? true);
  const [discoverableLoading, setDiscoverableLoading] = useState(false);
  const [discoverableSuccess, setDiscoverableSuccess] = useState(false);

  // Notifications
  let parsedPrefs: any = {};
  try {
    parsedPrefs = user?.notification_preferences ? JSON.parse(user.notification_preferences) : {};
  } catch {}

  const [notifPrefs, setNotifPrefs] = useState({
    application_updates: parsedPrefs.application_updates ?? true,
    interview_invitations: parsedPrefs.interview_invitations ?? true,
    account_updates: parsedPrefs.account_updates ?? true,
    followed_employers_vacancies: parsedPrefs.followed_employers_vacancies ?? true,
    new_applications: parsedPrefs.new_applications ?? true,
    interview_responses: parsedPrefs.interview_responses ?? true,
    vacancy_updates: parsedPrefs.vacancy_updates ?? true,
  });
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState(false);

  // Language
  const [language, setLanguage] = useState(user?.language_preference || 'en');
  const [langLoading, setLangLoading] = useState(false);
  const [langSuccess, setLangSuccess] = useState(false);

  // Danger zone
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [dangerLoading, setDangerLoading] = useState(false);
  const [dangerError, setDangerError] = useState('');

  const isSeeker = user?.role === 'job_seeker';

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      await usersApi.changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err) {
      setPasswordError(extractError(err));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleToggleDiscoverability = async (val: boolean) => {
    setIsDiscoverable(val);
    setDiscoverableLoading(true);
    try {
      await usersApi.setDiscoverability(val);
      await refreshUser();
      setDiscoverableSuccess(true);
      setTimeout(() => setDiscoverableSuccess(false), 3000);
    } catch (err) {
      alert(extractError(err));
    } finally {
      setDiscoverableLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setNotifLoading(true);
    try {
      await usersApi.setNotificationPreferences(notifPrefs);
      await refreshUser();
      setNotifSuccess(true);
      setTimeout(() => setNotifSuccess(false), 3000);
    } catch (err) {
      alert(extractError(err));
    } finally {
      setNotifLoading(false);
    }
  };

  const handleSaveLanguage = async (newLang: string) => {
    setLanguage(newLang);
    setLangLoading(true);
    try {
      await usersApi.updateProfile({ language_preference: newLang });
      await refreshUser();
      setLangSuccess(true);
      setTimeout(() => setLangSuccess(false), 3000);
    } catch (err) {
      alert(extractError(err));
    } finally {
      setLangLoading(false);
    }
  };

  const handleDeactivate = async () => {
    setDangerLoading(true);
    setDangerError('');
    try {
      await usersApi.deactivateAccount();
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      setDangerError(extractError(err));
      setDangerLoading(false);
    }
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setDangerLoading(true);
    setDangerError('');
    try {
      await usersApi.requestDeletion(deletePassword);
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      setDangerError(extractError(err));
      setDangerLoading(false);
    }
  };

  return (
    <div className="container-page py-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <Link
          to="/profile"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Profile</span>
        </Link>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
          Account Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your credentials, notifications, privacy, and account security.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-colors whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Security & Password</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-colors whitespace-nowrap ${
            activeTab === 'notifications'
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notifications</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preferences')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-colors whitespace-nowrap ${
            activeTab === 'preferences'
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Preferences</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('danger')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-colors whitespace-nowrap ${
            activeTab === 'danger'
              ? 'bg-danger/10 text-danger border border-danger/20'
              : 'text-muted-foreground hover:text-danger'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Manage Account</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* SECURITY TAB */}
      {/* ========================================================= */}
      {activeTab === 'security' && (
        <div className="card p-6 sm:p-8 rounded-2xl border border-border bg-surface space-y-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Change Password</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ensure your account stays secure by using a strong, unique password.
            </p>
          </div>

          {passwordSuccess && (
            <div className="p-3 rounded-xl bg-success/10 border border-success/20 text-success text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Password updated successfully.</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-semibold">
              {passwordError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="label text-xs">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
                className="input text-base sm:text-sm"
              />
            </div>

            <div>
              <label className="label text-xs">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="input text-base sm:text-sm"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label className="label text-xs">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className="input text-base sm:text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="btn btn-primary text-xs font-bold py-2.5 px-6 rounded-xl"
            >
              {passwordLoading ? <Spinner size="sm" /> : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* NOTIFICATIONS TAB */}
      {/* ========================================================= */}
      {activeTab === 'notifications' && (
        <div className="card p-6 sm:p-8 rounded-2xl border border-border bg-surface space-y-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Notification Preferences</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choose which in-app updates and alert categories you want to receive.
            </p>
          </div>

          {notifSuccess && (
            <div className="p-3 rounded-xl bg-success/10 border border-success/20 text-success text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Notification preferences saved.</span>
            </div>
          )}

          <div className="space-y-4 max-w-lg divide-y divide-border/60">
            {isSeeker ? (
              <>
                <label className="flex items-center justify-between pt-3 cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Application Status Updates</p>
                    <p className="text-xs text-muted-foreground">Receive alerts when an employer reviews, shortlists, or updates your application</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPrefs.application_updates}
                    onChange={e => setNotifPrefs({ ...notifPrefs, application_updates: e.target.checked })}
                    className="w-5 h-5 rounded border-border text-primary focus:ring-primary ml-4"
                  />
                </label>

                <label className="flex items-center justify-between pt-3 cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Interview Invitations</p>
                    <p className="text-xs text-muted-foreground">Immediate alerts for interview dates, times, and schedules</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPrefs.interview_invitations}
                    onChange={e => setNotifPrefs({ ...notifPrefs, interview_invitations: e.target.checked })}
                    className="w-5 h-5 rounded border-border text-primary focus:ring-primary ml-4"
                  />
                </label>

                <label className="flex items-center justify-between pt-3 cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Followed Employers' Vacancies</p>
                    <p className="text-xs text-muted-foreground">Get notified when employers you follow post new vacancies</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPrefs.followed_employers_vacancies}
                    onChange={e => setNotifPrefs({ ...notifPrefs, followed_employers_vacancies: e.target.checked })}
                    className="w-5 h-5 rounded border-border text-primary focus:ring-primary ml-4"
                  />
                </label>

                <label className="flex items-center justify-between pt-3 cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Account & Security Alerts</p>
                    <p className="text-xs text-muted-foreground">Password changes, security notices, and system announcements</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPrefs.account_updates}
                    onChange={e => setNotifPrefs({ ...notifPrefs, account_updates: e.target.checked })}
                    className="w-5 h-5 rounded border-border text-primary focus:ring-primary ml-4"
                  />
                </label>
              </>
            ) : (
              <>
                <label className="flex items-center justify-between pt-3 cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold text-foreground">New Applications</p>
                    <p className="text-xs text-muted-foreground">Alerts whenever a candidate applies to one of your active vacancies</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPrefs.new_applications}
                    onChange={e => setNotifPrefs({ ...notifPrefs, new_applications: e.target.checked })}
                    className="w-5 h-5 rounded border-border text-primary focus:ring-primary ml-4"
                  />
                </label>

                <label className="flex items-center justify-between pt-3 cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Interview Responses</p>
                    <p className="text-xs text-muted-foreground">Notifications when applicants accept or decline an interview invitation</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPrefs.interview_responses}
                    onChange={e => setNotifPrefs({ ...notifPrefs, interview_responses: e.target.checked })}
                    className="w-5 h-5 rounded border-border text-primary focus:ring-primary ml-4"
                  />
                </label>

                <label className="flex items-center justify-between pt-3 cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Vacancy Status Alerts</p>
                    <p className="text-xs text-muted-foreground">Reminders about expiring vacancies, draft reminders, and close notices</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPrefs.vacancy_updates}
                    onChange={e => setNotifPrefs({ ...notifPrefs, vacancy_updates: e.target.checked })}
                    className="w-5 h-5 rounded border-border text-primary focus:ring-primary ml-4"
                  />
                </label>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={handleSaveNotifications}
            disabled={notifLoading}
            className="btn btn-primary text-xs font-bold py-2.5 px-6 rounded-xl"
          >
            {notifLoading ? <Spinner size="sm" /> : 'Save Preferences'}
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* PREFERENCES TAB */}
      {/* ========================================================= */}
      {activeTab === 'preferences' && (
        <div className="card p-6 sm:p-8 rounded-2xl border border-border bg-surface space-y-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">General Preferences</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Customize language and discoverability settings.
            </p>
          </div>

          {/* Language preference */}
          <div className="space-y-3 max-w-md">
            <label className="label text-xs">Language / Wika</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSaveLanguage('en')}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  language === 'en'
                    ? 'border-primary bg-primary/10 ring-1 ring-primary'
                    : 'border-border bg-surface hover:border-primary/50'
                }`}
              >
                <p className="text-xs font-bold text-foreground">English</p>
                <p className="text-[11px] text-muted-foreground">Default system language</p>
              </button>

              <button
                type="button"
                onClick={() => handleSaveLanguage('fil')}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  language === 'fil'
                    ? 'border-primary bg-primary/10 ring-1 ring-primary'
                    : 'border-border bg-surface hover:border-primary/50'
                }`}
              >
                <p className="text-xs font-bold text-foreground">Filipino</p>
                <p className="text-[11px] text-muted-foreground">Wikang Pambansa</p>
              </button>
            </div>
            {langSuccess && (
              <p className="text-xs text-success font-semibold">Language preference saved.</p>
            )}
          </div>

          {/* Job seeker discoverability */}
          {isSeeker && (
            <div className="pt-6 border-t border-border/60 space-y-3 max-w-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Candidate Discoverability</h3>
                  <p className="text-xs text-muted-foreground">
                    Allow registered Batanes employers to find your profile during candidate searches.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isDiscoverable}
                  onChange={e => handleToggleDiscoverability(e.target.checked)}
                  disabled={discoverableLoading}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary ml-4"
                />
              </div>
              {discoverableSuccess && (
                <p className="text-xs text-success font-semibold">Discoverability updated.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* DANGER ZONE TAB */}
      {/* ========================================================= */}
      {activeTab === 'danger' && (
        <div className="card p-6 sm:p-8 rounded-2xl border border-danger/30 bg-surface space-y-6">
          <div>
            <h2 className="text-xl font-bold text-danger">Manage Account Status</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Temporarily deactivate your account or permanently delete all your data.
            </p>
          </div>

          {dangerError && (
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-semibold">
              {dangerError}
            </div>
          )}

          <div className="space-y-4 max-w-xl">
            {/* Deactivation Card */}
            <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-2">
              <h3 className="text-sm font-bold text-foreground">Temporary Deactivation</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Deactivating your account will hide your profile and active vacancies from public searches. You can reactivate anytime simply by signing back in with your credentials.
              </p>
              <button
                type="button"
                onClick={() => setShowDeactivateModal(true)}
                className="btn btn-secondary text-xs font-semibold py-2 px-4 rounded-xl text-foreground hover:bg-muted"
              >
                Deactivate Account
              </button>
            </div>

            {/* Permanent Deletion Card */}
            <div className="p-4 rounded-xl border border-danger/20 bg-danger/5 space-y-2">
              <h3 className="text-sm font-bold text-danger">Permanent Deletion</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Submitting a deletion request begins the permanent removal of your account, applications, and uploaded files after the mandatory retention period ([RETENTION PERIOD] days). This action cannot be reversed once processed.
              </p>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="btn btn-danger text-xs font-bold py-2 px-4 rounded-xl"
              >
                Request Account Deletion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivation Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in">
          <div className="card p-6 rounded-2xl border border-border bg-surface max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Deactivate Account?</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your profile, applications, and vacancy postings will be temporarily hidden. You can log back in at any time to reactivate your account.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeactivateModal(false)}
                className="btn btn-secondary text-xs px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeactivate}
                disabled={dangerLoading}
                className="btn btn-secondary text-xs px-4 py-2 font-bold text-danger hover:bg-danger/10"
              >
                {dangerLoading ? <Spinner size="sm" /> : 'Yes, Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Deletion Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in">
          <div className="card p-6 rounded-2xl border border-border bg-surface max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-danger">Permanent Deletion Request</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Please enter your password to confirm your permanent deletion request. All your data will be permanently purged after [RETENTION PERIOD] days.
            </p>
            <form onSubmit={handleDelete} className="space-y-3">
              <input
                type="password"
                placeholder="Enter your account password"
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                required
                className="input text-sm"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="btn btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dangerLoading}
                  className="btn btn-danger text-xs px-4 py-2 font-bold"
                >
                  {dangerLoading ? <Spinner size="sm" /> : 'Confirm Deletion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
