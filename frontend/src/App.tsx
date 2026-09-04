import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ToastProvider from './components/ui/Toast';
import { PageSpinner } from './components/ui';

// Lazy-load all pages for code-splitting
const LandingPage        = lazy(() => import('./pages/LandingPage'));
const LoginPage          = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage       = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const DashboardPage      = lazy(() => import('./pages/DashboardPage'));
const ProfilePage        = lazy(() => import('./pages/ProfilePage'));
const JobsPage           = lazy(() => import('./pages/jobs/JobsPage'));
const JobDetailPage      = lazy(() => import('./pages/jobs/JobDetailPage'));
const PostJobPage        = lazy(() => import('./pages/jobs/PostJobPage'));
const MyJobsPage         = lazy(() => import('./pages/jobs/MyJobsPage'));
const ApplicationsPage   = lazy(() => import('./pages/ApplicationsPage'));
const SavedJobsPage      = lazy(() => import('./pages/SavedJobsPage'));
const CandidatesPage     = lazy(() => import('./pages/CandidatesPage'));
const NotificationsPage  = lazy(() => import('./pages/NotificationsPage'));

// Simple 404 page
function NotFoundPage() {
  return (
    <div className="container-page py-24 text-center">
      <h1
        className="text-8xl font-black mb-4"
        style={{ fontFamily: 'Outfit, sans-serif', color: 'hsl(var(--color-primary))' }}
      >
        404
      </h1>
      <p className="text-xl font-semibold mb-2" style={{ color: 'hsl(var(--color-text))' }}>
        Page not found
      </p>
      <p className="text-sm mb-8" style={{ color: 'hsl(var(--color-text-muted))' }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <a href="/" className="btn btn-primary">Go Home</a>
    </div>
  );
}

// Static info pages
function AboutPage() {
  return (
    <div className="container-page py-16 max-w-3xl">
      <h1 className="text-4xl font-black mb-6" style={{ color: 'hsl(var(--color-text))' }}>
        About <span className="gradient-text">Batanes Niche</span>
      </h1>
      <div className="prose text-sm leading-relaxed space-y-4" style={{ color: 'hsl(var(--color-text-muted))' }}>
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
      <h1 className="text-3xl font-black mb-6" style={{ color: 'hsl(var(--color-text))' }}>Privacy Policy</h1>
      <div className="space-y-4 text-sm leading-relaxed" style={{ color: 'hsl(var(--color-text-muted))' }}>
        <p>
          Batanes Niche collects personal information (name, email, location, skills) solely for the purpose of
          facilitating employment connections within Batanes, Philippines.
        </p>
        <p>
          <strong style={{ color: 'hsl(var(--color-text))' }}>Contact privacy:</strong> A job seeker's email and phone number are never displayed
          publicly. They are only revealed to an employer after the seeker has applied to one of that employer's active job listings.
        </p>
        <p>
          We do not sell personal data to third parties. Your information is stored securely and protected with
          industry-standard encryption and access controls.
        </p>
        <p>
          You may request deletion of your account and all associated data by contacting us at privacy@batanesniche.ph.
        </p>
      </div>
    </div>
  );
}

function TermsPage() {
  return (
    <div className="container-page py-16 max-w-3xl">
      <h1 className="text-3xl font-black mb-6" style={{ color: 'hsl(var(--color-text))' }}>Terms of Service</h1>
      <div className="space-y-4 text-sm leading-relaxed" style={{ color: 'hsl(var(--color-text-muted))' }}>
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
              <Route index element={<LandingPage />} />
              <Route path="/about"   element={<AboutPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms"   element={<TermsPage />} />

              {/* Public job browsing */}
              <Route path="/jobs"     element={<JobsPage />} />
              <Route path="/jobs/:id" element={<JobDetailPage />} />

              {/* Protected: any authenticated user */}
              <Route path="/dashboard" element={
                <ProtectedRoute><DashboardPage /></ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute><ProfilePage /></ProtectedRoute>
              } />
              <Route path="/notifications" element={
                <ProtectedRoute><NotificationsPage /></ProtectedRoute>
              } />

              {/* Protected: job seeker only */}
              <Route path="/applications" element={
                <ProtectedRoute role="job_seeker"><ApplicationsPage /></ProtectedRoute>
              } />
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
                <ProtectedRoute role="employer"><CandidatesPage /></ProtectedRoute>
              } />

              {/* 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
