import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Heart, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Footer() {
  const { user } = useAuth();
  const seekerLinks = [
    { to: '/jobs', label: 'Browse Jobs' },
    ...(!user ? [{ to: '/register', label: 'Create Account' }] : []),
    ...(user?.role === 'job_seeker' ? [
      { to: '/applications', label: 'My Applications' },
      { to: '/saved-jobs', label: 'Saved Jobs' },
    ] : []),
  ];
  const employerLinks = [
    ...(user?.role === 'employer' ? [
      { to: '/jobs/post', label: 'Post a Job' },
      { to: '/candidates', label: 'Find Candidates' },
      { to: '/jobs/my', label: 'Manage Jobs' },
    ] : []),
    ...(!user ? [{ to: '/register', label: 'Sign Up Free' }] : []),
  ];

  return (
    <footer
      className="mt-auto border-t"
      style={{
        borderColor: 'hsl(var(--color-border-subtle))',
        background: 'hsl(var(--color-bg-alt))',
      }}
    >
      <div className="container-page py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, hsl(var(--color-primary)), hsl(var(--color-secondary)))' }}
              >
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-lg" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Batanes<span className="gradient-text">Niche</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'hsl(var(--color-text-muted))' }}>
              The hyper-localized employment platform connecting Ivatan job seekers 
              with employers across the Batanes province, Philippines.
            </p>
            <div className="flex items-center gap-1.5 mt-4 text-xs" style={{ color: 'hsl(var(--color-text-faint))' }}>
              <span>Made with</span>
              <Heart className="w-3 h-3 text-red-400 fill-red-400" />
              <span>for Batanes</span>
            </div>
          </div>

          {/* For Job Seekers */}
          <div>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'hsl(var(--color-text))' }}>
              For Job Seekers
            </h3>
            <ul className="flex flex-col gap-2.5">
              {seekerLinks.map(link => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm transition-colors duration-150"
                    style={{ color: 'hsl(var(--color-text-muted))' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'hsl(var(--color-primary))'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'hsl(var(--color-text-muted))'}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Employers */}
          <div>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'hsl(var(--color-text))' }}>
              For Employers
            </h3>
            <ul className="flex flex-col gap-2.5">
              {employerLinks.map(link => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm transition-colors duration-150"
                    style={{ color: 'hsl(var(--color-text-muted))' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'hsl(var(--color-primary))'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'hsl(var(--color-text-muted))'}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <hr className="divider" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs" style={{ color: 'hsl(var(--color-text-faint))' }}>
          <span>© {new Date().getFullYear()} Batanes Niche Job Portal. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:underline">Privacy</Link>
            <Link to="/terms" className="hover:underline">Terms</Link>
            <a href="mailto:hello@batanesniche.ph" className="flex items-center gap-1.5 hover:underline">
              <Mail className="w-3 h-3" /> Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
