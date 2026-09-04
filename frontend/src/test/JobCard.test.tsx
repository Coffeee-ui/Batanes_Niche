import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import JobCard from '../components/ui/JobCard';
import type { Job } from '../types';

// Mock AuthContext
const mockUseAuth = vi.fn();
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock savedJobsApi
vi.mock('../api/client', () => ({
  savedJobsApi: {
    save: vi.fn().mockResolvedValue({ message: 'Saved' }),
    remove: vi.fn().mockResolvedValue({ message: 'Removed' }),
  },
  extractError: (err: any) => err?.message || 'Error',
}));

const mockJob: Job = {
  id: 101,
  employer_id: 1,
  title: 'Senior Tour Guide',
  description: 'Provide historic and eco-cultural tours across Batan and Sabtang islands.',
  municipality: 'Basco',
  island: 'Batan',
  barangay: 'Kayvaluganan',
  salary_min: 25000,
  salary_max: 35000,
  employment_type: 'Full-time',
  required_skills: 'Tour Guiding, English, Customer Service',
  status: 'active',
  created_at: new Date().toISOString(),
  company_name: 'Batanes Eco Adventures',
  application_count: 5,
};

describe('JobCard Component', () => {
  it('renders job details properly (title, company, location, salary)', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    render(
      <BrowserRouter>
        <JobCard job={mockJob} />
      </BrowserRouter>
    );

    expect(screen.getByText('Senior Tour Guide')).toBeInTheDocument();
    expect(screen.getByText('Batanes Eco Adventures')).toBeInTheDocument();
    expect(screen.getByText('Kayvaluganan, Basco')).toBeInTheDocument();
    expect(screen.getByText('₱25k – ₱35k')).toBeInTheDocument();
    expect(screen.getByText('Full-time')).toBeInTheDocument();
    expect(screen.getByText('5 applicants')).toBeInTheDocument();
  });

  it('renders skills as badges when present', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    render(
      <BrowserRouter>
        <JobCard job={mockJob} />
      </BrowserRouter>
    );

    expect(screen.getByText('Tour Guiding')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Customer Service')).toBeInTheDocument();
  });

  it('shows bookmark save button for authenticated job seekers', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 2, role: 'job_seeker', full_name: 'Maria Elena' },
    });

    render(
      <BrowserRouter>
        <JobCard job={mockJob} />
      </BrowserRouter>
    );

    const saveButton = screen.getByRole('button', { name: /save job/i });
    expect(saveButton).toBeInTheDocument();
  });

  it('hides bookmark save button for employers', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, role: 'employer', full_name: 'Basco Tours' },
    });

    render(
      <BrowserRouter>
        <JobCard job={mockJob} />
      </BrowserRouter>
    );

    expect(screen.queryByRole('button', { name: /save job/i })).not.toBeInTheDocument();
  });
});
