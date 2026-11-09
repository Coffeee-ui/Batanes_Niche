import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ToastProvider from './components/ui/Toast';
import { PageSpinner } from './components/ui';

// Lazy-load all pages for code-splitting
const HomePage           = lazy(() => import('./pages/HomePage'));
const LoginPage          = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage       = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));

const ProfilePage        = lazy(() => import('./pages/ProfilePage'));
const JobsPage           = lazy(() => import('./pages/jobs/JobsPage'));
const JobDetailPage      = lazy(() => import('./pages/jobs/JobDetailPage'));
const PostJobPage        = lazy(() => import('./pages/jobs/PostJobPage'));
const MyJobsPage         = lazy(() => import('./pages/jobs/MyJobsPage'));
const ApplicationsPage   = lazy(() => import('./pages/ApplicationsPage'));
const SavedJobsPage      = lazy(() => import('./pages/SavedJobsPage'));

const NotificationsPage  = lazy(() => import('./pages/NotificationsPage'));

// Guard: /jobs is for job seekers and guests only; employers go to their dashboard
function JobsPageGuard() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><PageSpinner /></div>;
  if (user?.role === 'employer') return <Navigate to="/" replace />;
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
      <h1 className="text-3xl font-black mb-6" style={{ color: 'hsl(var(--foreground))' }}>Privacy Policy</h1>
      <div className="space-y-4 text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
        <p>
          Batanes Niche collects personal information (name, email, location, skills) solely for the purpose of
          facilitating employment connections within Batanes, Philippines.
        </p>
        <p>
          <strong style={{ color: 'hsl(var(--foreground))' }}>Contact privacy:</strong> A job seeker's email and phone number are never displayed
          publicly. They are only revealed to an employer after the seeker has applied to one of that employer's active job listings.
        </p>
        <p>
          We do not sell personal data to third parties. Your information is stored securely and protected with
          industry-standard encryption and access controls.
        </p>
        <p>
          You may request deletion of your account and all associated data by contacting us at privacy@batanesjobs.ph.
        </p>
      </div>
    </div>
  );
}

function TermsPage() {
  return (
    <div className="container-page py-16 max-w-3xl">
      <h1 className="text-3xl font-black mb-6" style={{ color: 'hsl(var(--foreground))' }}>Terms of Service</h1>
      <div className="space-y-4 text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
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
              {/* Public routes — no layout wrapper needed for auth pages */}
              <Route path="/login"          element={<LoginPage />} />
              <Route path="/register"       element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* All other routes use the Navbar+Footer layout */}
              <Route element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="/about"   element={<AboutPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms"   element={<TermsPage />} />

                {/* Public job browsing — job seekers and guests only; employers are redirected */}
                <Route path="/jobs" element={<JobsPageGuard />} />

                {/* NAV-03: Job detail is publicly viewable by guests and authenticated users */}
                <Route path="/jobs/:id" element={<JobDetailPage />} />
                {/* Legacy notification link redirect */}
                <Route path="/employer" element={<Navigate to="/jobs/my" replace />} />
                <Route path="/dashboard" element={
                  <Navigate to="/" replace />
                } />
                <Route path="/profile" element={
                  <ProtectedRoute><ProfilePage /></ProtectedRoute>
                } />
                <Route path="/notifications" element={
                  <ProtectedRoute><NotificationsPage /></ProtectedRoute>
                } />

                {/* Protected: any authenticated user — backend returns role-appropriate data */}
                <Route path="/applications" element={
                  <ProtectedRoute><ApplicationsPage /></ProtectedRoute>
                } />

                {/* Protected: job seeker only */}
                <Route path="/saved-jobs" element={
                  <ProtectedRoute role="job_seeker"><SavedJobsPage /></ProtectedRoute>
                } />

                {/* Protected: employer only */}
                <Route path="/jobs/post" element={
                  <ProtectedRoute role="employer"><PostJobPage /></ProtectedRoute>
                } />
                <Route path="/jobs/my" element={
                  <ProtectedRoute role="employer"><MyJobsPage /></ProtectedRoute>
                } />
                <Route path="/candidates" element={
                  <Navigate to="/" replace />
                } />

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
