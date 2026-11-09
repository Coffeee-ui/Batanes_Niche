import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Briefcase,
  Bookmark,
  Bell,
  User,
  PlusCircle,
  LogIn,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { notificationsApi } from '../../api/client';

interface TabItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export default function BottomNav() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    notificationsApi
      .unreadCount()
      .then(d => setUnreadCount(d.count))
      .catch(() => {});
  }, [isAuthenticated, location.pathname]);

  const isSeeker = user?.role === 'job_seeker';
  const isEmployer = user?.role === 'employer';

  let tabs: TabItem[] = [];

  if (!isAuthenticated || !user) {
    tabs = [
      { to: '/', label: 'Home', icon: Home },
      { to: '/jobs', label: 'Jobs', icon: Briefcase },
      { to: '/login', label: 'Sign in', icon: LogIn },
    ];
  } else if (isSeeker) {
    tabs = [
      { to: '/', label: 'Home', icon: Home },
      { to: '/jobs', label: 'Jobs', icon: Briefcase },
      { to: '/saved-jobs', label: 'Saved', icon: Bookmark },
      { to: '/notifications', label: 'Alerts', icon: Bell, badge: unreadCount },
      { to: '/profile', label: 'Profile', icon: User },
    ];
  } else if (isEmployer) {
    tabs = [
      { to: '/', label: 'Home', icon: Home },
      { to: '/jobs/my', label: 'My jobs', icon: Briefcase },
      { to: '/jobs/post', label: 'Post job', icon: PlusCircle },
      { to: '/notifications', label: 'Alerts', icon: Bell, badge: unreadCount },
      { to: '/profile', label: 'Profile', icon: User },
    ];
  } else {
    tabs = [
      { to: '/', label: 'Home', icon: Home },
      { to: '/jobs', label: 'Jobs', icon: Briefcase },
      { to: '/notifications', label: 'Alerts', icon: Bell, badge: unreadCount },
      { to: '/profile', label: 'Profile', icon: User },
    ];
  }

  return (
    <nav
      id="bottom-tab-bar"
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t transition-colors duration-200"
      style={{
        backgroundColor: 'hsl(var(--surface))',
        borderColor: 'hsl(var(--border))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-center justify-around h-16 px-1 relative">
        {tabs.map(tab => {
          const isActive =
            tab.to === '/'
              ? location.pathname === '/' || location.pathname === '/dashboard'
              : location.pathname.startsWith(tab.to);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.to}
              to={tab.to}
              id={`tab-${tab.label.toLowerCase().replace(/\s+/g, '-')}`}
              className="flex-1 flex flex-col items-center justify-center py-1 relative min-h-[44px] transition-colors"
            >
              {/* Active Tab Top Indicator Bar (~56px yellow bar on top edge) */}
              {isActive && (
                <span
                  className="absolute -top-px left-1/2 -translate-x-1/2 w-14 h-1 rounded-full bg-primary"
                  aria-hidden="true"
                />
              )}

              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-6 h-6 transition-transform ${
                    isActive
                      ? 'text-primary fill-primary stroke-primary stroke-[1.5]'
                      : 'text-muted-foreground stroke-[1.8]'
                  }`}
                  aria-hidden="true"
                />
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span
                    className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-black flex items-center justify-center leading-none"
                    style={{
                      backgroundColor: 'hsl(var(--primary))',
                      color: 'hsl(var(--primary-foreground))',
                    }}
                  >
                    {tab.badge! > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] mt-1 tracking-tight leading-tight ${
                  isActive ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
