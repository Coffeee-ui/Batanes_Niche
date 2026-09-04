import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Briefcase, Bell, Search, Menu, X, User, LogOut,
  ChevronDown, Sun, Moon, MapPin, Bookmark
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { notificationsApi } from '../../api/client';

// ============================================================
// Navbar
// ============================================================
export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.getAttribute('data-theme') === 'dark'
  );
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isAuthenticated) return;
    notificationsApi.unreadCount()
      .then(d => setUnreadCount(d.count))
      .catch(() => {});
  }, [isAuthenticated, location.pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    setIsDark(!isDark);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinks = isAuthenticated
    ? user?.role === 'employer'
      ? [
          { to: '/dashboard', label: 'Dashboard' },
          { to: '/jobs/post', label: 'Post Job' },
          { to: '/candidates', label: 'Candidates' },
          { to: '/jobs/my', label: 'My Jobs' },
        ]
      : [
          { to: '/dashboard', label: 'Dashboard' },
          { to: '/jobs', label: 'Browse Jobs' },
          { to: '/saved-jobs', label: 'Saved' },
          { to: '/applications', label: 'My Applications' },
        ]
    : [
        { to: '/jobs', label: 'Browse Jobs' },
        { to: '/about', label: 'About' },
      ];

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? 'hsl(var(--color-surface) / 0.95)'
          : 'hsl(var(--color-surface))',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: `1px solid hsl(var(--color-border-subtle))`,
        boxShadow: scrolled ? 'var(--shadow-sm)' : 'none',
      }}
    >
      <div className="container-page">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group" id="nav-logo">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
              style={{ background: 'linear-gradient(135deg, hsl(var(--color-primary)), hsl(var(--color-secondary)))' }}
            >
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-base tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Batanes<span className="gradient-text">Niche</span>
              </span>
              <span className="text-xs" style={{ color: 'hsl(var(--color-text-faint))' }}>
                Local Jobs
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                id={`nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  location.pathname === link.to
                    ? 'text-white'
                    : ''
                }`}
                style={
                  location.pathname === link.to
                    ? { background: 'linear-gradient(135deg, hsl(var(--color-primary)), hsl(var(--color-secondary)))' }
                    : { color: 'hsl(var(--color-text-muted))' }
                }
                onMouseEnter={e => {
                  if (location.pathname !== link.to)
                    (e.currentTarget as HTMLElement).style.color = 'hsl(var(--color-text))';
                }}
                onMouseLeave={e => {
                  if (location.pathname !== link.to)
                    (e.currentTarget as HTMLElement).style.color = 'hsl(var(--color-text-muted))';
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              id="btn-theme-toggle"
              onClick={toggleTheme}
              className="btn-ghost p-2 rounded-lg"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {isAuthenticated ? (
              <>
                {/* Notifications Bell */}
                <Link
                  to="/notifications"
                  id="nav-notifications"
                  className="btn-ghost p-2 rounded-lg relative"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center text-white rounded-full text-[10px] font-bold"
                      style={{ background: 'hsl(var(--color-danger))' }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* User Menu */}
                <div ref={userMenuRef} className="relative">
                  <button
                    id="btn-user-menu"
                    onClick={() => setUserMenuOpen(o => !o)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-150 hover:bg-opacity-80"
                    style={{ background: 'hsl(var(--color-bg-alt))' }}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: 'linear-gradient(135deg, hsl(var(--color-primary)), hsl(var(--color-secondary)))' }}
                    >
                      {user?.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium max-w-24 truncate" style={{ color: 'hsl(var(--color-text))' }}>
                      {user?.full_name?.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-3 h-3" style={{ color: 'hsl(var(--color-text-muted))' }} />
                  </button>

                  {userMenuOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 w-56 rounded-xl py-2 animate-scale-in"
                      style={{
                        background: 'hsl(var(--color-surface))',
                        border: '1px solid hsl(var(--color-border))',
                        boxShadow: 'var(--shadow-lg)',
                      }}
                    >
                      <div className="px-4 py-3 border-b" style={{ borderColor: 'hsl(var(--color-border-subtle))' }}>
                        <p className="text-sm font-semibold" style={{ color: 'hsl(var(--color-text))' }}>{user?.full_name}</p>
                        <p className="text-xs mt-0.5 capitalize" style={{ color: 'hsl(var(--color-text-muted))' }}>
                          {user?.role?.replace('_', ' ')} · {user?.municipality}
                        </p>
                      </div>
                      <Link to="/profile" id="menu-profile" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-opacity-50 transition-colors duration-100" style={{ color: 'hsl(var(--color-text))' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'hsl(var(--color-surface-hover))'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                      >
                        <User className="w-4 h-4" />
                        My Profile
                      </Link>
                      <button
                        id="btn-logout"
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm w-full text-left transition-colors duration-100"
                        style={{ color: 'hsl(var(--color-danger))' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'hsl(var(--color-danger) / 0.08)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" id="nav-login" className="btn btn-ghost text-sm">
                  Sign In
                </Link>
                <Link to="/register" id="nav-register" className="btn btn-primary text-sm">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            id="btn-mobile-menu"
            onClick={() => setMobileOpen(o => !o)}
            className="md:hidden btn-ghost p-2 rounded-lg"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          className="md:hidden border-t animate-fade-in"
          style={{
            borderColor: 'hsl(var(--color-border-subtle))',
            background: 'hsl(var(--color-surface))',
          }}
        >
          <div className="container-page py-4 flex flex-col gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="px-4 py-3 rounded-lg text-sm font-medium"
                style={{ color: 'hsl(var(--color-text))' }}
              >
                {link.label}
              </Link>
            ))}
            <hr className="divider my-2" />
            {isAuthenticated ? (
              <button onClick={handleLogout} className="btn btn-secondary text-sm">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <Link to="/login" className="btn btn-secondary text-sm">Sign In</Link>
                <Link to="/register" className="btn btn-primary text-sm">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
