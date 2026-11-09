import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  Menu,
  X,
  User,
  LogOut,
  Sun,
  Moon,
  Search,
  ArrowRight,
  MapPin,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { notificationsApi } from '../../api/client';

const MUNICIPALITIES = [
  { label: 'All of Batanes', value: '' },
  { label: 'Basco', value: 'Basco' },
  { label: 'Mahatao', value: 'Mahatao' },
  { label: 'Ivana', value: 'Ivana' },
  { label: 'Uyugan', value: 'Uyugan' },
  { label: 'Sabtang', value: 'Sabtang' },
  { label: 'Itbayat', value: 'Itbayat' },
];

const POPULAR_JOB_SEARCHES = ['Tour Guide', 'Front Desk', 'Driver', 'Cook', 'Carpenter'];
const POPULAR_SKILL_SEARCHES = ['Customer Service', 'Driving', 'Carpentry', 'Cooking', 'Bookkeeping'];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Scroll state & sticky header border
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollSearch, setShowScrollSearch] = useState(false);
  const [searchPanelOpen, setSearchPanelOpen] = useState(false);

  // Search input & filter state shared in header panel
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMunicipality, setSearchMunicipality] = useState('');

  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileSearchTriggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchPanelRef = useRef<HTMLDivElement>(null);

  const isEmployer = user?.role === 'employer';

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setSearchPanelOpen(false);
  }, [location.pathname]);

  // Notifications count
  useEffect(() => {
    if (!isAuthenticated) return;
    notificationsApi
      .unreadCount()
      .then(d => setUnreadCount(d.count))
      .catch(() => {});
  }, [isAuthenticated, location.pathname]);

  // IntersectionObserver on main on-page search bar + scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 16);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // Check if on-page main search exists
    const mainSearchBar = document.getElementById('main-search-bar') || document.getElementById('hero-search-form');

    let observer: IntersectionObserver | null = null;
    if (mainSearchBar) {
      observer = new IntersectionObserver(
        entries => {
          const entry = entries[0];
          // When main search bar is NOT visible, show the header search icon
          setShowScrollSearch(!entry.isIntersecting);
        },
        { threshold: 0.1 }
      );
      observer.observe(mainSearchBar);
    } else {
      // If page has no main search bar, show when scrolled past 100px
      const fallbackCheck = () => {
        setShowScrollSearch(window.scrollY > 120);
      };
      window.addEventListener('scroll', fallbackCheck, { passive: true });
      fallbackCheck();
      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('scroll', fallbackCheck);
      };
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (observer) observer.disconnect();
    };
  }, [location.pathname]);

  // Lock body scroll when mobile drawer or search panel is open
  useEffect(() => {
    if (mobileOpen || searchPanelOpen) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [mobileOpen, searchPanelOpen]);

  // Focus management on search panel toggle
  useEffect(() => {
    if (searchPanelOpen) {
      const t = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [searchPanelOpen]);

  // Outside click and Escape key handler
  useEffect(() => {
    const clickHandler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (
        searchPanelRef.current &&
        !searchPanelRef.current.contains(e.target as Node) &&
        !searchTriggerRef.current?.contains(e.target as Node) &&
        !mobileSearchTriggerRef.current?.contains(e.target as Node)
      ) {
        setSearchPanelOpen(false);
      }
    };

    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false);
        setMobileOpen(false);
        if (searchPanelOpen) {
          setSearchPanelOpen(false);
          // Return focus to trigger
          (searchTriggerRef.current || mobileSearchTriggerRef.current)?.focus();
        }
      }
    };

    document.addEventListener('mousedown', clickHandler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', clickHandler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [searchPanelOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchPanelOpen(false);

    if (isEmployer) {
      const p = new URLSearchParams();
      if (searchQuery.trim()) p.set('skill', searchQuery.trim());
      if (searchMunicipality) p.set('municipality', searchMunicipality);
      navigate(`/?${p.toString()}`);
    } else {
      const p = new URLSearchParams();
      if (searchQuery.trim()) p.set('q', searchQuery.trim());
      if (searchMunicipality) p.set('municipality', searchMunicipality);
      navigate(`/jobs?${p.toString()}`);
    }
  };

  const handlePopularChipClick = (term: string) => {
    setSearchQuery(term);
    setSearchPanelOpen(false);
    if (isEmployer) {
      const p = new URLSearchParams();
      p.set('skill', term);
      if (searchMunicipality) p.set('municipality', searchMunicipality);
      navigate(`/?${p.toString()}`);
    } else {
      const p = new URLSearchParams();
      p.set('q', term);
      if (searchMunicipality) p.set('municipality', searchMunicipality);
      navigate(`/jobs?${p.toString()}`);
    }
  };

  // Nav links per role
  const navLinks = isAuthenticated
    ? isEmployer
      ? [
          { to: '/', label: 'Home' },
          { to: '/jobs/my', label: 'My Jobs' },
          { to: '/jobs/post', label: 'Post a Job' },
          { to: '/profile', label: 'Profile' },
        ]
      : [
          { to: '/', label: 'Home' },
          { to: '/jobs', label: 'Browse Jobs' },
          { to: '/applications', label: 'Applications' },
          { to: '/saved-jobs', label: 'Saved Jobs' },
          { to: '/profile', label: 'Profile' },
        ]
    : [
        { to: '/', label: 'Home' },
        { to: '/jobs', label: 'Browse Jobs' },
        { to: '/about', label: 'About' },
      ];

  const initial = (user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'M').toUpperCase();

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled ? 'shadow-sm' : ''
      }`}
    >
      {/* 
        Responsive Header Bar:
        Mobile (< md): Light header matching warm canvas with thin border.
        Desktop (>= md): Dark charcoal header.
      */}
      <div
        className="w-full transition-colors duration-200 border-b md:border-b-0"
        style={{
          backgroundColor: 'hsl(var(--header))',
          borderColor: 'rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="container-page">
          <div className="flex items-center justify-between h-16">
            {/* Logo with Solid Yellow Sun Circle */}
            <Link to="/" className="flex items-center gap-2.5 group shrink-0" id="nav-logo">
              <div className="w-5 h-5 rounded-full bg-primary shrink-0 transition-transform group-hover:scale-110 shadow-xs" />
              <span
                className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                <span>Batanes</span>
                <span>Niche</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map(link => {
                const active =
                  link.to === '/'
                    ? location.pathname === '/' || location.pathname === '/dashboard'
                    : location.pathname.startsWith(link.to);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    id={`nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                    className={`text-sm py-5 transition-colors relative font-medium ${
                      active
                        ? 'text-primary font-bold'
                        : 'text-header-foreground hover:text-white'
                    }`}
                  >
                    {link.label}
                    {active && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Right Actions */}
            <div className="hidden md:flex items-center gap-2.5">
              {/* Theme Toggle Button */}
              <button
                id="btn-theme-toggle"
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-xl text-header-foreground hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Scroll-triggered Search Icon for Guests: placed BEFORE Sign in */}
              {!isAuthenticated && (
                <div
                  className={`transition-all duration-200 ${
                    showScrollSearch
                      ? 'opacity-100 scale-100 pointer-events-auto'
                      : 'opacity-0 scale-90 pointer-events-none w-0 overflow-hidden'
                  }`}
                >
                  <button
                    ref={searchTriggerRef}
                    id="btn-header-search"
                    type="button"
                    onClick={() => setSearchPanelOpen(o => !o)}
                    aria-label="Search jobs"
                    aria-expanded={searchPanelOpen}
                    className={`w-10 h-10 rounded-full border border-white/15 flex items-center justify-center transition-all ${
                      searchPanelOpen
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary border-primary'
                        : 'text-header-foreground hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              )}

              {isAuthenticated ? (
                <>
                  {/* Notification Bell */}
                  <Link
                    to="/notifications"
                    id="nav-notifications"
                    className="p-2 rounded-xl text-header-foreground hover:text-white relative transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span
                        className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full"
                        style={{ background: 'hsl(var(--primary))' }}
                      />
                    )}
                  </Link>

                  {/* Scroll-triggered Search Icon: placed AFTER Bell */}
                  <div
                    className={`transition-all duration-200 ${
                      showScrollSearch
                        ? 'opacity-100 scale-100 pointer-events-auto'
                        : 'opacity-0 scale-90 pointer-events-none w-0 overflow-hidden'
                    }`}
                  >
                    <button
                      ref={searchTriggerRef}
                      id="btn-header-search"
                      type="button"
                      onClick={() => setSearchPanelOpen(o => !o)}
                      aria-label={isEmployer ? 'Search candidates' : 'Search jobs'}
                      aria-expanded={searchPanelOpen}
                      className={`w-10 h-10 rounded-full border border-white/15 flex items-center justify-center transition-all ${
                        searchPanelOpen
                          ? 'bg-primary text-primary-foreground ring-2 ring-primary border-primary'
                          : 'text-header-foreground hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </div>

                  {/* User Menu with Initial Circle */}
                  <div ref={userMenuRef} className="relative ml-1">
                    <button
                      id="btn-user-menu"
                      type="button"
                      onClick={() => setUserMenuOpen(o => !o)}
                      className="w-9 h-9 rounded-full bg-primary flex items-center justify-center font-bold text-xs transition-transform hover:scale-105"
                      style={{ color: 'hsl(var(--primary-foreground))' }}
                      aria-label="User menu"
                    >
                      {initial}
                    </button>

                    {userMenuOpen && (
                      <div
                        className="absolute right-0 top-full mt-2 w-56 rounded-2xl py-2 animate-scale-in z-50"
                        style={{
                          backgroundColor: 'hsl(var(--surface))',
                          border: '1px solid hsl(var(--border))',
                          boxShadow: 'var(--shadow-lg)',
                        }}
                      >
                        <div className="px-4 py-3 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
                          <p className="text-sm font-bold truncate text-foreground">
                            {user?.full_name || user?.username}
                          </p>
                          <p className="text-xs mt-0.5 capitalize truncate text-muted-foreground">
                            {user?.role?.replace('_', ' ')} · {user?.municipality || 'Batanes'}
                          </p>
                        </div>

                        <Link
                          to="/profile"
                          id="menu-profile"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-neutral-soft text-foreground"
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
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    id="nav-login"
                    className="text-sm font-medium text-header-foreground hover:text-white px-3 py-2 transition-colors min-h-[44px] flex items-center"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    id="nav-register"
                    className="btn btn-primary py-2 px-4 text-xs font-bold rounded-xl min-h-[44px]"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Controls (< md): 44px round icon buttons with thin border */}
            <div className="flex md:hidden items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Notification Bell (if authenticated) */}
              {isAuthenticated && (
                <Link
                  to="/notifications"
                  id="mobile-nav-notifications"
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-white/15 text-header-foreground hover:text-white relative flex items-center justify-center transition-colors shrink-0"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span
                      className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full"
                      style={{ background: 'hsl(var(--primary))' }}
                    />
                  )}
                </Link>
              )}

              {/* Scroll-triggered Search Button on Mobile */}
              <div
                className={`transition-all duration-200 ${
                  showScrollSearch
                    ? 'opacity-100 scale-100 pointer-events-auto'
                    : 'opacity-0 scale-90 pointer-events-none w-0 overflow-hidden'
                }`}
              >
                <button
                  ref={mobileSearchTriggerRef}
                  id="btn-mobile-header-search"
                  type="button"
                  onClick={() => setSearchPanelOpen(o => !o)}
                  aria-label={isEmployer ? 'Search candidates' : 'Search jobs'}
                  aria-expanded={searchPanelOpen}
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-white/15 flex items-center justify-center transition-all shrink-0 ${
                    searchPanelOpen
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary border-primary'
                      : 'text-header-foreground hover:text-white'
                  }`}
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile Theme Toggle Button */}
              <button
                id="btn-mobile-theme-toggle"
                type="button"
                onClick={toggleTheme}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-white/15 text-header-foreground hover:text-white flex items-center justify-center transition-colors shrink-0"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Guest Sign In button on mobile when unauthenticated */}
              {!isAuthenticated && (
                <Link
                  to="/login"
                  id="mobile-nav-login"
                  className="text-xs font-bold text-header-foreground hover:text-white px-2.5 sm:px-3 py-2 rounded-xl border border-white/15 min-h-[40px] sm:min-h-[44px] flex items-center justify-center shrink-0 whitespace-nowrap"
                >
                  Sign in
                </Link>
              )}

              {/* Mobile Menu Hamburger */}
              <button
                id="btn-mobile-menu"
                type="button"
                onClick={() => setMobileOpen(o => !o)}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-white/15 text-header-foreground hover:text-white flex items-center justify-center transition-colors shrink-0"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 
        ============================================================
        Scroll-Triggered Dropdown Search Panel (A3)
        ============================================================
      */}
      {searchPanelOpen && (
        <div className="fixed inset-0 top-16 z-40 flex flex-col items-center">
          {/* Dimmed Page Backdrop */}
          <div
            className="fixed inset-0 top-16 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSearchPanelOpen(false)}
            aria-hidden="true"
          />

          {/* Panel Container */}
          <div
            ref={searchPanelRef}
            className="relative w-full max-w-4xl bg-surface border-b border-border shadow-2xl animate-fade-in z-50 px-4 py-4 sm:px-8 sm:py-6"
            style={{ backgroundColor: 'hsl(var(--surface))' }}
          >
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              {/* Desktop Layout (>= sm) */}
              <div className="hidden sm:flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    aria-label={isEmployer ? 'Skill to search' : 'Job title or keyword'}
                    placeholder={
                      isEmployer
                        ? 'Search candidate by skill (e.g. Carpentry, Driver)'
                        : 'Front Desk, Driver, Tour Guide'
                    }
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                  />
                </div>

                <div className="w-52">
                  <select
                    aria-label="Filter by municipality"
                    value={searchMunicipality}
                    onChange={e => setSearchMunicipality(e.target.value)}
                    className="select w-full text-xs py-2.5 px-4 rounded-xl border border-border bg-surface text-foreground font-medium min-h-[44px]"
                  >
                    {MUNICIPALITIES.map(m => (
                      <option key={m.label} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary px-6 text-xs font-bold rounded-xl min-h-[44px] shrink-0"
                >
                  Search
                </button>

                <button
                  type="button"
                  onClick={() => setSearchPanelOpen(false)}
                  className="btn btn-secondary px-4 text-xs font-semibold rounded-xl min-h-[44px] shrink-0"
                >
                  Cancel
                </button>
              </div>

              {/* Mobile Layout (< sm): Combined box with rows + location row */}
              <div className="sm:hidden space-y-3">
                <div className="rounded-2xl border border-border overflow-hidden bg-surface shadow-xs">
                  {/* Row 1: Search input + round yellow submit button */}
                  <div className="flex items-center gap-2 p-2 pl-3">
                    <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      aria-label={isEmployer ? 'Skill to search' : 'Job title or keyword'}
                      placeholder={
                        isEmployer
                          ? 'Skill (e.g. Carpentry, Driver)'
                          : 'Front Desk, Driver, Tour Guide'
                      }
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="flex-1 bg-transparent border-none outline-none text-base text-foreground placeholder:text-muted-foreground"
                    />
                    <button
                      type="submit"
                      aria-label="Submit search"
                      className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-xs"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border/60" />

                  {/* Row 2: Location selector row with pin and chevron */}
                  <div className="flex items-center justify-between px-3 py-2 bg-neutral-soft/40">
                    <div className="flex items-center gap-2 flex-1">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <select
                        aria-label="Select municipality"
                        value={searchMunicipality}
                        onChange={e => setSearchMunicipality(e.target.value)}
                        className="bg-transparent border-none outline-none text-xs text-foreground font-semibold cursor-pointer w-full"
                      >
                        {MUNICIPALITIES.map(m => (
                          <option key={m.label} value={m.value} className="bg-surface text-foreground">
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 pointer-events-none" />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSearchPanelOpen(false)}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground py-1 px-3 min-h-[44px] flex items-center"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* Popular Searches / Skills Chips */}
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  {isEmployer ? 'Popular candidate skills:' : 'Popular searches:'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(isEmployer ? POPULAR_SKILL_SEARCHES : POPULAR_JOB_SEARCHES).map(term => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => handlePopularChipClick(term)}
                      className="chip text-xs hover:border-primary"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 
        ============================================================
        Mobile Drawer (AUD-002-UX-03)
        Max height constrained with overflow-y-auto and safe area padding
        ============================================================
      */}
      {mobileOpen && (
        <div
          className="md:hidden border-t animate-fade-in max-h-[calc(100dvh-4rem)] overflow-y-auto"
          style={{
            borderColor: 'rgba(255, 255, 255, 0.1)',
            backgroundColor: 'hsl(var(--header))',
            paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <div className="container-page py-4 flex flex-col gap-2">
            {isAuthenticated && (
              <div className="px-3 py-2.5 mb-1 rounded-xl bg-white/5 border border-white/10">
                <p className="text-sm font-bold text-white truncate">
                  {user?.full_name || user?.username}
                </p>
                <p className="text-xs text-header-foreground capitalize truncate mt-0.5">
                  {user?.role?.replace('_', ' ')} · {user?.municipality || 'Batanes'}
                </p>
              </div>
            )}

            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium min-h-[44px] flex items-center ${
                  location.pathname === link.to
                    ? 'text-primary bg-white/5 font-bold'
                    : 'text-header-foreground hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {isAuthenticated && (
              <Link
                to="/notifications"
                className={`px-3 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between min-h-[44px] ${
                  location.pathname === '/notifications'
                    ? 'text-primary bg-white/5 font-bold'
                    : 'text-header-foreground hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary text-primary-foreground">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}

            <div className="flex items-center justify-between pt-3 mt-1 border-t border-white/10">
              <span className="text-xs text-header-foreground font-medium">Theme</span>
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-xl text-header-foreground hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>

            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-secondary text-sm mt-2 w-full text-danger border-white/10 min-h-[44px]"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            ) : (
              <div className="flex flex-col gap-2 mt-2">
                <Link to="/login" className="btn btn-secondary text-sm w-full min-h-[44px]">
                  Sign in
                </Link>
                <Link to="/register" className="btn btn-primary text-sm w-full min-h-[44px]">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
