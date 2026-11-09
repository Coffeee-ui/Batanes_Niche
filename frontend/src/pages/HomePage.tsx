import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import HomeGuest from './home/HomeGuest';
import HomeSeeker from './home/HomeSeeker';
import HomeEmployer from './home/HomeEmployer';
import { PageSpinner } from '../components/ui';

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="container-page py-16 flex items-center justify-center">
        <PageSpinner />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <HomeGuest />;
  }

  if (user.role === 'employer') {
    return <HomeEmployer />;
  }

  return <HomeSeeker />;
}

