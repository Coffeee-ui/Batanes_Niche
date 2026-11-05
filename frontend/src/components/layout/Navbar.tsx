import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Bell, Menu, X, User, LogOut, Sun, Moon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { notificationsApi } from '../../api/client';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const userMenuRef = useRef<HTMLDivElement>(null);

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

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinks = isAuthenticated
    ? user?.role === 'employer'
      ? [
          { to: '/dashboard', label: 'Dashboard' },
          { to: '/jobs/my', label: 'My Jobs' },
          { to: '/candidates', label: 'Candidates' },
          { to: '/jobs/post', label: 'Post a Job' },
          { to: '/profile', label: 'Profile' },
        ]
      : [
          { to: '/dashboard', label: 'Dashboard' },
          { to: '/jobs', label: 'Browse Jobs' },
          { to: '/applications', label: 'Applications' },
          { to: '/saved-jobs', label: 'Saved Jobs' },
          { to: '/profile', label: 'Profile' },
        ]
    : [
        { to: '/jobs', label: 'Browse Jobs' },
        { to: '/about', label: 'About' },
      ];

  const initial = (user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'M').toUpperCase();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-colors duration-200"
      style={{
        backgroundColor: 'hsl(var(--header))',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <div className="container-page">
        <div className="flex items-center justify-between h-16">
          {/* Logo with Solid Yellow Sun Circle */}
          <Link to="/" className="flex items-center gap-2.5 group" id="nav-logo">
            <div className="w-5 h-5 rounded-full bg-primary shrink-0 transition-transform group-hover:scale-110" />
            <span
              className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              <span>Batanes</span>
              <span>Jobs</span>
            </span>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map(link => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  id={`nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`text-sm py-5 transition-colors relative font-medium ${
                    active
                      ? 'text-primary font-semibold'
                      : 'text-header-foreground hover:text-white'
                  }`}
                >
                  {link.label}
                  {active && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              id="btn-theme-toggle"
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-header-foreground hover:text-white transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {isAuthenticated ? (
              <>
                {/* Notification Bell */}
                <Link
                  to="/notifications"
                  id="nav-notifications"
                  className="p-2 rounded-xl text-header-foreground hover:text-white relative transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span
                      className="absolute top-1 right-1 w-2 h-2 rounded-full"
                      style={{ background: 'hsl(var(--primary))' }}
                    />
                  )}
                </Link>

                {/* User Menu with Yellow Initial Circle */}
                <div ref={userMenuRef} className="relative">
                  <button
                    id="btn-user-menu"
                    type="button"
                    onClick={() => setUserMenuOpen(o => !o)}
                    className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-xs transition-transform hover:scale-105"
                    style={{ color: 'hsl(var(--primary-foreground))' }}
                    aria-label="User menu"
                  >
                    {initial}
                  </button>

                  {userMenuOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 w-56 rounded-2xl py-2 animate-scale-in"
                      style={{
                        backgroundColor: 'hsl(var(--surface))',
                        border: '1px solid hsl(var(--border))',
                        boxShadow: 'var(--shadow-lg)',
                      }}
                    >
                      <div className="px-4 py-3 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
                        <p className="text-sm font-bold truncate" style={{ color: 'hsl(var(--foreground))' }}>
                          {user?.full_name || user?.username}
                        </p>
                        <p className="text-xs mt-0.5 capitalize truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {user?.role?.replace('_', ' ')} · {user?.municipality || 'Batanes'}
                        </p>
                      </div>

                      <Link
                        to="/profile"
                        id="menu-profile"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-neutral-soft"
                        style={{ color: 'hsl(var(--foreground))' }}
                      >
                        <User className="w-4 h-4 text-muted-foreground" />
                        My Profile
                      </Link>

                      <button
                        id="btn-logout"
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm w-full text-left transition-colors text-danger hover:bg-danger/10"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  id="nav-login"
                  className="text-sm font-medium text-header-foreground hover:text-white px-2 py-1.5 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  id="nav-register"
                  className="btn btn-primary py-2 px-4 text-xs font-bold rounded-xl"
                  style={{ minHeight: '36px' }}
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            id="btn-mobile-menu"
            type="button"
            onClick={() => setMobileOpen(o => !o)}
            className="md:hidden p-2 rounded-xl text-header-foreground hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          className="md:hidden border-t animate-fade-in"
          style={{
            borderColor: 'rgba(255, 255, 255, 0.1)',
            backgroundColor: 'hsl(var(--header))',
          }}
        >
          <div className="container-page py-4 flex flex-col gap-2">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium ${
                  location.pathname === link.to ? 'text-primary bg-white/5 font-semibold' : 'text-header-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="flex items-center justify-between pt-3 mt-1 border-t border-white/10">
              <span className="text-xs text-header-foreground">Theme</span>
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-lg text-header-foreground hover:text-white"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>

            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-secondary text-sm mt-2 w-full text-danger border-white/10"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            ) : (
              <div className="flex flex-col gap-2 mt-2">
                <Link to="/login" className="btn btn-secondary text-sm w-full">Sign in</Link>
                <Link to="/register" className="btn btn-primary text-sm w-full">Sign up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
