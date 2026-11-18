import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ToastProvider from './components/ui/Toast';
import { PageSpinner } from './components/ui';

// Lazy-load all pages for code-splitting
const HomePage              = lazy(() => import('./pages/HomePage'));
const LoginPage             = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage          = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage    = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const OnboardingPage        = lazy(() => import('./pages/onboarding/OnboardingPage'));

const ProfilePage           = lazy(() => import('./pages/ProfilePage'));
const AccountSettingsPage   = lazy(() => import('./pages/account/AccountSettingsPage'));
const JobsPage              = lazy(() => import('./pages/jobs/JobsPage'));
const JobDetailPage         = lazy(() => import('./pages/jobs/JobDetailPage'));
const PostJobPage           = lazy(() => import('./pages/jobs/PostJobPage'));
const MyJobsPage            = lazy(() => import('./pages/jobs/MyJobsPage'));
const ApplicationsPage      = lazy(() => import('./pages/ApplicationsPage'));
const SavedJobsPage         = lazy(() => import('./pages/SavedJobsPage'));

const EmployerDirectoryPage = lazy(() => import('./pages/employers/EmployerDirectoryPage'));
const EmployerProfilePage   = lazy(() => import('./pages/employers/EmployerProfilePage'));
const FollowedEmployersPage = lazy(() => import('./pages/employers/FollowedEmployersPage'));

const FindCandidatesPage    = lazy(() => import('./pages/candidates/FindCandidatesPage'));
const SavedCandidatesPage   = lazy(() => import('./pages/candidates/SavedCandidatesPage'));

const NotificationsPage     = lazy(() => import('./pages/NotificationsPage'));
const HelpPage              = lazy(() => import('./pages/HelpPage'));

// Guard: /jobs is for job seekers and guests only; employers go to their vacancies
function JobsPageGuard() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><PageSpinner /></div>;
  if (user?.role === 'employer') return <Navigate to="/jobs/my" replace />;
  return <JobsPage />;
}

// Simple 404 page
function NotFoundPage() {
  return (
    <div className="container-page py-24 text-center">
      <h1
        className="text-8xl font-black mb-4"
        style={{ fontFamily: 'Outfit, sans-serif', color: 'hsl(var(--primary))' }}
      >
        404
      </h1>
      <p className="text-xl font-semibold mb-2" style={{ color: 'hsl(var(--foreground))' }}>
        Page not found
      </p>
      <p className="text-sm mb-8" style={{ color: 'hsl(var(--muted-foreground))' }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn btn-primary">Go Home</Link>
    </div>
  );
}

// Static info pages
function AboutPage() {
  return (
    <div className="container-page py-16 max-w-3xl">
      <h1 className="text-4xl font-black mb-6" style={{ color: 'hsl(var(--foreground))' }}>
        About Batanes Niche
      </h1>
      <div className="prose text-sm leading-relaxed space-y-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
        <p>
          Batanes Niche is a hyper-localized employment platform built exclusively for the
          Batanes province of the Philippines — the northernmost tip of the archipelago.
        </p>
        <p>
          Unlike national job boards, every listing on Batanes Niche is located within the
          six municipalities of Batanes: Basco, Itbayat, Ivana, Mahatao, Sabtang, and Uyugan.
          Our platform exists so that Ivatans can find meaningful work at home, without having
          to leave their province.
        </p>
        <p>
          We use geographic and skill-based scoring to surface the most relevant jobs and
          candidates, supporting both the Batanes economy and the well-being of its people.
        </p>
      </div>
    </div>
  );
}

function PrivacyPage() {
  return (
    <div className="container-page py-16 max-w-3xl">
      <h1 className="text-3xl font-black mb-6 text-foreground">Privacy Notice</h1>
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          Batanes Niche collects personal information (name, email, municipality, skills, work experience) solely for the purpose of
          facilitating legitimate employment connections within Batanes, Philippines.
        </p>
        <p>
          <strong className="text-foreground">Candidate privacy:</strong> A job seeker's CV and contact number are never displayed
          publicly. They are only revealed to an employer after the seeker has actively applied to one of that employer's vacancies.
        </p>
        <p>
          <strong className="text-foreground">Equal Opportunity:</strong> In compliance with fair employment and non-discrimination standards, personal demographic criteria are never requested, stored, or processed anywhere within Batanes Niche.
        </p>
        <p>
          <strong className="text-foreground">Data retention & deletion:</strong> When you request permanent account deletion, your account enters a [RETENTION PERIOD]-day grace period before being completely and irrecoverably purged from our systems.
        </p>
        <p>
          For privacy inquiries or data rights requests, contact our privacy officer at [EMAIL].
        </p>
      </div>
    </div>
  );
}

function TermsPage() {
  return (
    <div className="container-page py-16 max-w-3xl">
      <h1 className="text-3xl font-black mb-6 text-foreground">Terms of Service</h1>
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          By using Batanes Niche, you agree to use the platform lawfully and only for its intended purpose of
          facilitating employment within the Batanes province.
        </p>
        <p>
          Employers agree not to post fraudulent, misleading, or discriminatory job listings.
          Job seekers agree not to submit false information in their profiles or applications.
        </p>
        <p>
          Batanes Niche reserves the right to suspend accounts that violate these terms, at its sole discretion.
        </p>
        <p>
          These terms are governed by the laws of the Republic of the Philippines.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// App Component with Routes
// ============================================================
export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider />
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><PageSpinner /></div>}>
            <Routes>
              {/* Public routes — standalone auth & onboarding */}
              <Route path="/login"           element={<LoginPage />} />
              <Route path="/register"        element={<RegisterPage />} />
              <Route path="/forgot-password"  element={<ForgotPasswordPage />} />
              <Route path="/onboarding"       element={
                <ProtectedRoute><OnboardingPage /></ProtectedRoute>
              } />

              {/* Layout wrapper routes */}
              <Route element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="/about"   element={<AboutPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms"   element={<TermsPage />} />
                <Route path="/help"    element={<HelpPage />} />

                {/* Public job browsing */}
                <Route path="/jobs" element={<JobsPageGuard />} />
                <Route path="/jobs/:id" element={<JobDetailPage />} />

                {/* Public Employer Directory & Profile */}
                <Route path="/employers" element={<EmployerDirectoryPage />} />
                <Route path="/employers/:id" element={<EmployerProfilePage />} />

                {/* User Profile & Account Settings */}
                <Route path="/profile" element={
                  <ProtectedRoute><ProfilePage /></ProtectedRoute>
                } />
                <Route path="/account" element={
                  <ProtectedRoute><AccountSettingsPage /></ProtectedRoute>
                } />
                <Route path="/notifications" element={
                  <ProtectedRoute><NotificationsPage /></ProtectedRoute>
                } />

                {/* Applications (role-appropriate data) */}
                <Route path="/applications" element={
                  <ProtectedRoute><ApplicationsPage /></ProtectedRoute>
                } />

                {/* Job Seeker Only */}
                <Route path="/saved-jobs" element={
                  <ProtectedRoute role="job_seeker"><SavedJobsPage /></ProtectedRoute>
                } />
                <Route path="/followed-employers" element={
                  <ProtectedRoute role="job_seeker"><FollowedEmployersPage /></ProtectedRoute>
                } />

                {/* Employer Only */}
                <Route path="/jobs/post" element={
                  <ProtectedRoute role="employer"><PostJobPage /></ProtectedRoute>
                } />
                <Route path="/jobs/my" element={
                  <ProtectedRoute role="employer"><MyJobsPage /></ProtectedRoute>
                } />
                <Route path="/my-jobs" element={
                  <ProtectedRoute role="employer"><MyJobsPage /></ProtectedRoute>
                } />
                <Route path="/candidates" element={
                  <ProtectedRoute role="employer"><FindCandidatesPage /></ProtectedRoute>
                } />
                <Route path="/candidates/saved" element={
                  <ProtectedRoute role="employer"><SavedCandidatesPage /></ProtectedRoute>
                } />

                {/* Legacy redirects */}
                <Route path="/employer" element={<Navigate to="/jobs/my" replace />} />
                <Route path="/dashboard" element={<Navigate to="/" replace />} />

                {/* 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
