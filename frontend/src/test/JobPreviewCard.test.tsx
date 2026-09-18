import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import JobPreviewCard from '../components/ui/JobPreviewCard';
import type { JobPreview } from '../types';

// Mock AuthContext
const mockUseAuth = vi.fn();
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockPreviewJob: JobPreview = {
  id: 101,
  title: 'Senior Tour Guide & Heritage Coordinator',
  salary_min: 25000,
  salary_max: 35000,
  required_skills: 'Tour Guiding, English, Customer Service',
};

describe('JobPreviewCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders strictly allowed public fields: Title, Skills, and Salary', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    render(
      <BrowserRouter>
        <JobPreviewCard job={mockPreviewJob} />
      </BrowserRouter>
    );

    // Job Title
    expect(screen.getByText('Senior Tour Guide & Heritage Coordinator')).toBeInTheDocument();

    // Salary
    expect(screen.getByText('₱25k – ₱35k')).toBeInTheDocument();

    // Required Skills
    expect(screen.getByText('Tour Guiding')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Customer Service')).toBeInTheDocument();

    // Preview badge
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('does NOT render restricted fields like company, location, employment type, or description', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    const { container } = render(
      <BrowserRouter>
        <JobPreviewCard job={mockPreviewJob} />
      </BrowserRouter>
    );

    // Ensure sensitive terms/fields are absent
    expect(screen.queryByText(/Full-time/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/applicant/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Basco/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Eco Tours/i)).not.toBeInTheDocument();
  });

  it('displays auth callout and redirects unauthenticated user to login with return path', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    render(
      <BrowserRouter>
        <JobPreviewCard job={mockPreviewJob} />
      </BrowserRouter>
    );

    expect(screen.getByText(/Sign up or log in to view full job details/i)).toBeInTheDocument();

    const viewButton = screen.getByRole('button', { name: /view full details/i });
    fireEvent.click(viewButton);

    expect(mockNavigate).toHaveBeenCalledWith('/login', {
      state: { from: '/jobs/101' },
    });
  });

  it('navigates authenticated user directly to /jobs/:id without auth callout', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 2, role: 'job_seeker' },
    });

    render(
      <BrowserRouter>
        <JobPreviewCard job={mockPreviewJob} />
      </BrowserRouter>
    );

    expect(screen.queryByText(/Sign up or log in to view full job details/i)).not.toBeInTheDocument();

    const viewButton = screen.getByRole('button', { name: /view full details/i });
    fireEvent.click(viewButton);

    expect(mockNavigate).toHaveBeenCalledWith('/jobs/101');
  });

  it('handles missing required skills and missing salary gracefully', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    const jobWithMissingData: JobPreview = {
      id: 102,
      title: 'General Helper',
      salary_min: 0,
      salary_max: 0,
      required_skills: '',
    };

    render(
      <BrowserRouter>
        <JobPreviewCard job={jobWithMissingData} />
      </BrowserRouter>
    );

    expect(screen.getByText('General Helper')).toBeInTheDocument();
    expect(screen.getByText('Salary negotiable')).toBeInTheDocument();
    expect(screen.getByText('No specific skills listed')).toBeInTheDocument();
  });
});
