import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

// Mock AuthContext
const mockUseAuth = vi.fn();
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock notificationsApi
vi.mock('../api/client', () => ({
  notificationsApi: {
    unreadCount: vi.fn().mockResolvedValue({ count: 0 }),
  },
}));

describe('Navbar Component', () => {
  it('renders public guest navigation links when unauthenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      logout: vi.fn(),
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText('Batanes')).toBeInTheDocument();
    expect(screen.getByText('Browse Jobs')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getAllByText(/Sign [Ii]n/i)[0]).toBeInTheDocument();
    expect(screen.queryByText(/Post.*Job/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Applications/i)).not.toBeInTheDocument();
  });

  it('renders job seeker links when logged in as job seeker', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        id: 10,
        full_name: 'Juan Dela Cruz',
        role: 'job_seeker',
        municipality: 'Basco',
      },
      logout: vi.fn(),
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Browse Jobs')).toBeInTheDocument();
    expect(screen.getByText(/Saved/i)).toBeInTheDocument();
    expect(screen.getByText(/Applications/i)).toBeInTheDocument();
    expect(screen.queryByText(/Post.*Job/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('renders employer links when logged in as employer', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        id: 20,
        full_name: 'Ivana Heritage Crafts',
        role: 'employer',
        municipality: 'Ivana',
      },
      logout: vi.fn(),
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText(/Post.*Job/i)).toBeInTheDocument();
    expect(screen.getByText('My Jobs')).toBeInTheDocument();
    expect(screen.queryByText('Candidates')).not.toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText(/Applications/i)).not.toBeInTheDocument();
  });
});
