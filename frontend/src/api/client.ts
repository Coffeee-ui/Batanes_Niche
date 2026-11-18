import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  User, Job, JobPreview, Application, Notification, SavedJob,
  PaginatedResponse, Token, RegisterPayload,
  LoginPayload, JobCreate, JobUpdate, JobFilters, Candidate,
  CandidateRankingResponse, JobRankingResponse,
  MetadataOptions, GeoMeta, ApiError, DemoStatusResponse,
  Employer, FollowedEmployer, SavedCandidate, NotificationPreferences, JobStats
} from '../types';

// ============================================================
// Axios Client Configuration
// ============================================================

const rawBase = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
const API_BASE_URL = rawBase ? `${rawBase}/api/v1` : '/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export function resolveMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
  ) {
    return url;
  }
  const base = rawBase || '';
  if (url.startsWith('/')) {
    return `${base}${url}`;
  }
  return `${base}/${url}`;
}

// In-memory access token storage (security best practice)
let accessToken: string | null = null;
const REFRESH_TOKEN_KEY = 'batanes_refresh_token';

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setRefreshToken(token: string | null) {
  if (token) {
    try { localStorage.setItem(REFRESH_TOKEN_KEY, token); } catch {}
  } else {
    try { localStorage.removeItem(REFRESH_TOKEN_KEY); } catch {}
  }
}

export function getRefreshToken(): string | null {
  try { return localStorage.getItem(REFRESH_TOKEN_KEY); } catch { return null; }
}

export function clearTokens() {
  accessToken = null;
  try { localStorage.removeItem(REFRESH_TOKEN_KEY); } catch {}
}

// ---- Request Interceptor: attach Bearer token ----
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken && config.headers) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return config;
});

// ---- Response Interceptor: silent token refresh on 401 ----
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}
function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

api.interceptors.response.use(
  res => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (originalRequest && error.response?.status === 401 && !originalRequest._retry) {
      const storedRefreshToken = getRefreshToken();
      if (!storedRefreshToken) {
        clearTokens();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise(resolve => {
          subscribeTokenRefresh(token => {
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
            }
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post<Token>(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: storedRefreshToken,
        });
        setAccessToken(data.access_token);
        setRefreshToken(data.refresh_token);
        onTokenRefreshed(data.access_token);
        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${data.access_token}`;
        }
        return api(originalRequest);
      } catch {
        clearTokens();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ============================================================
// Helper to extract user-friendly error message
// ============================================================
export function extractError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined;
    if (data?.detail) {
      if (typeof data.detail === 'string') return data.detail;
      if (Array.isArray(data.detail)) {
        return data.detail.map(d => d.msg).join(', ');
      }
    }
    const message = (error.response?.data as any)?.message;
    if (message) return message;
    if (error.response?.status === 429) return 'Too many requests. Please slow down.';
    if (error.response?.status === 403) return 'You do not have permission to perform this action.';
    if (error.response?.status === 404) return 'The requested resource was not found.';
    if (error.response?.status === 500) return 'Server error. Please try again later.';
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred.';
}

// ============================================================
// Auth API
// ============================================================
export const authApi = {
  register: (payload: RegisterPayload) => {
    return api.post<Token>('/auth/register', payload).then(r => r.data);
  },

  login: (payload: LoginPayload) => {
    const username_or_email = payload.username_or_email || payload.email || '';
    return api.post<Token>('/auth/login', {
      username_or_email,
      password: payload.password,
    }).then(r => r.data);
  },

  logout: () =>
    api.post('/auth/logout').then(r => {
      clearTokens();
      return r.data;
    }),

  refresh: () => {
    const token = getRefreshToken();
    if (!token) return Promise.reject(new Error('No refresh token available.'));
    return api.post<Token>('/auth/refresh', { refresh_token: token }).then(r => r.data);
  },

  me: () =>
    api.get<User>('/auth/me').then(r => r.data),

  requestPasswordReset: (email: string) =>
    api.post('/auth/forgot-password', { email }).then(r => r.data),

  verifyResetCode: (email: string, otp_code: string) =>
    api.post<{ valid: boolean; message: string }>('/auth/verify-reset-code', { email, otp_code }).then(r => r.data),

  confirmPasswordReset: (email: string, otp: string, new_password: string) =>
    api.post('/auth/reset-password', {
      email,
      otp_code: otp,
      new_password,
    }).then(r => r.data),

  getDemoStatus: () =>
    api.get<DemoStatusResponse>('/auth/demo-status').then(r => r.data),

  demoLogin: (role: string) =>
    api.post<Token>('/auth/demo-login', { role }).then(r => r.data),
};

// ============================================================
// Jobs API
// ============================================================
export const jobsApi = {
  list: async (filters: JobFilters = {}): Promise<PaginatedResponse<Job>> => {
    const params: Record<string, any> = {};
    if (filters.q || filters.keyword) params.keyword = filters.q || filters.keyword;
    if (filters.category) params.category = filters.category;
    if (filters.municipality) params.municipality = filters.municipality;
    if (filters.island) params.island = filters.island;
    if (filters.employment_type) params.employment_type = filters.employment_type;
    if (filters.sort) params.sort = filters.sort;
    const limit = filters.page_size || 50;
    const offset = ((filters.page || 1) - 1) * limit;
    params.limit = limit;
    params.offset = offset;

    const res = await api.get<Job[] | { items: Job[]; total: number }>('/jobs', { params });
    const items = Array.isArray(res.data) ? res.data : (res.data.items || []);
    const headerTotal = parseInt(res.headers?.['x-total-count'] as string, 10);
    const total = !Array.isArray(res.data) && (res.data as any).total !== undefined
      ? (res.data as any).total
      : (!isNaN(headerTotal) ? headerTotal : items.length);

    return {
      items,
      total,
      page: filters.page || 1,
      page_size: limit,
      total_pages: Math.max(1, Math.ceil(total / limit)),
    };
  },

  preview: async (params: { page?: number; page_size?: number } = {}): Promise<JobPreview[]> => {
    const limit = params.page_size || 50;
    const offset = ((params.page || 1) - 1) * limit;
    return api.get<JobPreview[]>('/jobs/preview', { params: { limit, offset } }).then(r => r.data);
  },

  featured: () =>
    api.get<Job[]>('/jobs/featured').then(r => r.data),

  recommendedJobs: (limit: number = 10) =>
    api.get<Job[]>('/jobs/recommended', { params: { limit } }).then(r => r.data),

  get: (id: number) =>
    api.get<Job>(`/jobs/${id}`).then(r => r.data),

  create: (payload: JobCreate) =>
    api.post<Job>('/jobs', payload).then(r => r.data),

  update: (id: number, payload: JobUpdate) =>
    api.put<Job>(`/jobs/${id}`, payload).then(r => r.data),

  updateStatus: (id: number, status: string) =>
    api.put<Job>(`/jobs/${id}/status`, { status }).then(r => r.data),

  closeJob: (id: number, close_option: 'reviewing' | 'ended' = 'reviewing') =>
    api.post<Job>(`/jobs/${id}/close`, { close_option }).then(r => r.data),

  close: (id: number) =>
    api.delete(`/jobs/${id}`).then(r => r.data),

  getStats: (id: number) =>
    api.get<JobStats>(`/jobs/${id}/stats`).then(r => r.data),

  myJobs: async (params: { page?: number; page_size?: number; include_closed?: boolean } = {}): Promise<PaginatedResponse<Job>> => {
    const limit = params.page_size || 50;
    const offset = ((params.page || 1) - 1) * limit;
    const includeClosed = params.include_closed !== false;
    const items = await api.get<Job[]>('/jobs/my', { params: { limit, offset, include_closed: includeClosed } }).then(r => r.data);
    return {
      items,
      total: items.length,
      page: params.page || 1,
      page_size: limit,
      total_pages: Math.max(1, Math.ceil(items.length / limit)),
    };
  },

  recommendations: async (): Promise<Job[]> => {
    const res = await api.get<JobRankingResponse>('/recommendations/jobs-ranked').then(r => r.data);
    const tier1 = (res.tier_1 || []).map(t => t.job);
    const tier2 = (res.tier_2 || []).map(t => t.job);
    return [...tier1, ...tier2];
  },
};

// ============================================================
// Applications API
// ============================================================
export const applicationsApi = {
  apply: (jobId: number, coverLetter?: string, attachResume = false, answers?: string) =>
    api.post<Application>('/applications', {
      job_id: jobId,
      cover_letter: coverLetter || null,
      attach_resume: Boolean(attachResume),
      answers: answers || null,
    }).then(r => r.data),

  myApplications: async (params: { job_id?: number; page?: number; page_size?: number } = {}): Promise<PaginatedResponse<Application>> => {
    const queryParams: Record<string, any> = {};
    if (params.job_id) queryParams.job_id = params.job_id;
    if (params.page_size) queryParams.limit = params.page_size;
    if (params.page && params.page_size) queryParams.offset = (params.page - 1) * params.page_size;

    const items = await api.get<Application[]>('/applications', { params: queryParams }).then(r => r.data);
    const normalized = items.map(a => ({
      ...a,
      job_title: a.job?.title || a.job_title || 'Position',
      company_name: a.job?.company_name || a.company_name || 'Batanes Employer',
      seeker_name: a.applicant?.full_name || a.seeker_name || 'Applicant',
    }));
    return {
      items: normalized,
      total: normalized.length,
      page: params.page || 1,
      page_size: params.page_size || 50,
      total_pages: 1,
    };
  },

  forJob: async (jobId: number): Promise<Application[]> => {
    const items = await api.get<Application[]>('/applications', { params: { job_id: jobId } }).then(r => r.data);
    return items.map(a => ({
      ...a,
      job_title: a.job?.title || a.job_title || 'Position',
      company_name: a.job?.company_name || a.company_name || 'Batanes Employer',
      seeker_name: a.applicant?.full_name || a.seeker_name || 'Applicant',
    }));
  },

  updateStatus: (applicationId: number, status: string) =>
    api.put<Application>(`/applications/${applicationId}`, { status }).then(r => r.data),

  updateStage: (applicationId: number, status: string) =>
    api.post<Application>(`/applications/${applicationId}/stage`, { status }).then(r => r.data),

  inviteToInterview: (
    applicationId: number,
    payload: {
      interview_date: string;
      interview_type: string;
      interview_location?: string;
      interview_message?: string;
    }
  ) =>
    api.post<Application>(`/applications/${applicationId}/invite`, payload).then(r => r.data),

  respondToInterview: (applicationId: number, response: 'accepted' | 'declined') =>
    api.put<Application>(`/applications/${applicationId}/interview-response`, { response }).then(r => r.data),

  rejectApplication: (
    applicationId: number,
    payload: { rejection_template?: string; rejection_message?: string }
  ) =>
    api.post<Application>(`/applications/${applicationId}/reject`, payload).then(r => r.data),

  withdraw: (applicationId: number) =>
    api.post<Application>(`/applications/${applicationId}/withdraw`).then(r => r.data),
};

// ============================================================
// Users / Profile API
// ============================================================
export const usersApi = {
  getProfile: () =>
    api.get<User>('/users/profile').then(r => r.data),

  updateProfile: (payload: Record<string, any>) => {
    return api.put<User>('/users/profile', payload).then(r => r.data);
  },

  employers: (params: { company?: string; industry?: string; municipality?: string; has_vacancies?: boolean; page?: number; page_size?: number } = {}) => {
    return api.get<Employer[]>('/users/employers', { params }).then(r => r.data);
  },

  employerProfile: (id: number) =>
    api.get<Employer>(`/users/employers/${id}`).then(r => r.data),

  followEmployer: (id: number) =>
    api.post(`/users/follow/${id}`).then(r => r.data),

  unfollowEmployer: (id: number) =>
    api.delete(`/users/follow/${id}`).then(r => r.data),

  listFollowedEmployers: () =>
    api.get<FollowedEmployer[]>('/users/followed-employers').then(r => r.data),

  isFollowingEmployer: (id: number) =>
    api.get<{ is_following: boolean }>(`/users/is-following/${id}`).then(r => r.data),

  candidates: async (params: { q?: string; municipality?: string; island?: string; skill?: string; education?: string; experience_years?: number; desired_employment_type?: string; page?: number; page_size?: number } = {}): Promise<PaginatedResponse<Candidate>> => {
    const queryParams: Record<string, any> = {};
    if (params.municipality) queryParams.municipality = params.municipality;
    if (params.island) queryParams.island = params.island;
    if (params.skill || params.q) queryParams.skill = params.skill || params.q;
    if (params.education) queryParams.education = params.education;
    if (params.experience_years !== undefined) queryParams.experience_years = params.experience_years;
    if (params.desired_employment_type) queryParams.desired_employment_type = params.desired_employment_type;
    const limit = params.page_size || 50;
    queryParams.limit = limit;
    queryParams.offset = ((params.page || 1) - 1) * limit;

    const items = await api.get<Candidate[]>('/users/job-seekers', { params: queryParams }).then(r => r.data);
    return {
      items,
      total: items.length,
      page: params.page || 1,
      page_size: limit,
      total_pages: Math.max(1, Math.ceil(items.length / limit)),
    };
  },

  saveCandidate: (candidateId: number) =>
    api.post(`/users/candidates/save/${candidateId}`).then(r => r.data),

  removeSavedCandidate: (candidateId: number) =>
    api.delete(`/users/candidates/save/${candidateId}`).then(r => r.data),

  listSavedCandidates: () =>
    api.get<SavedCandidate[]>('/users/candidates/saved').then(r => r.data),

  recommendations: async (): Promise<Candidate[]> => {
    const res = await api.get<CandidateRankingResponse>('/recommendations/candidates').then(r => r.data);
    const tier1 = (res.tier_1 || []).map(t => t.candidate);
    const tier2 = (res.tier_2 || []).map(t => t.candidate);
    return [...tier1, ...tier2];
  },

  changePassword: (current_password: string, new_password: string) =>
    api.post('/users/change-password', { current_password, new_password }).then(r => r.data),

  deactivateAccount: () =>
    api.post('/users/deactivate').then(r => r.data),

  reactivateAccount: (email_or_username: string, password: string) =>
    api.post('/users/reactivate', { email_or_username, password }).then(r => r.data),

  requestDeletion: (password: string) =>
    api.post('/users/request-deletion', { password }).then(r => r.data),

  setDiscoverability: (is_discoverable: boolean) =>
    api.patch<{ is_discoverable: boolean }>('/users/discoverability', { is_discoverable }).then(r => r.data),

  setNotificationPreferences: (prefs: Partial<NotificationPreferences>) =>
    api.patch('/users/notification-preferences', { notification_preferences: prefs }).then(r => r.data),

  submitReport: (target_type: string, target_id: number, reason: string, details?: string) =>
    api.post('/users/report', { target_type, target_id, reason, details }).then(r => r.data),

  uploadResume: (file: File) => {
    const fd = new FormData();
    fd.append('resume', file);
    return api.post<{ resume_url: string; filename: string }>('/users/resume', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  deleteResume: () =>
    api.delete('/users/resume').then(r => r.data),

  downloadResumeUrl: (seekerId?: number) => {
    const base = API_BASE_URL;
    const path = seekerId ? `${base}/users/resume/${seekerId}` : `${base}/users/resume`;
    const token = getAccessToken();
    return token ? `${path}?token=${encodeURIComponent(token)}` : path;
  },

  downloadResume: async (seekerId?: number, defaultName = 'resume.pdf') => {
    const path = seekerId ? `/users/resume/${seekerId}` : '/users/resume';
    const response = await api.get(path, { responseType: 'blob' });
    let filename = defaultName;
    const disposition = String(response.headers['content-disposition'] || '');
    const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
    if (match && match[1]) {
      try {
        filename = decodeURIComponent(match[1].trim());
      } catch {
        filename = match[1].trim();
      }
    }
    const contentType = String(response.headers['content-type'] || 'application/octet-stream');
    const blob = new Blob([response.data], {
      type: contentType,
    });
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  },

  uploadProfilePicture: (file: File) => {
    const fd = new FormData();
    fd.append('picture', file);
    return api.post<{ profile_pic: string }>('/users/profile-picture', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
};

// ============================================================
// Saved Jobs API
// ============================================================
export const savedJobsApi = {
  list: () =>
    api.get<SavedJob[]>('/saved-jobs').then(r => r.data),

  save: (jobId: number) =>
    api.post(`/saved-jobs/${jobId}`).then(r => r.data),

  remove: (jobId: number) =>
    api.delete(`/saved-jobs/${jobId}`).then(r => r.data),
};

// ============================================================
// Notifications API
// ============================================================
export const notificationsApi = {
  list: (category?: string) =>
    api.get<Notification[]>('/notifications', { params: category ? { category } : {} }).then(r => r.data),

  markAllRead: () =>
    api.put('/notifications/read').then(r => r.data),

  markRead: (id: number) =>
    api.put(`/notifications/${id}/read`).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/notifications/${id}`).then(r => r.data),

  bulkDelete: (ids: number[]) =>
    api.delete('/notifications/bulk', { data: { ids } }).then(r => r.data),

  unreadCount: async (): Promise<{ count: number }> => {
    const res = await api.get<{ unread_count: number }>('/notifications/unread-count').catch(() => ({ data: { unread_count: 0 } }));
    return { count: res.data.unread_count };
  },
};

// ============================================================
// Meta (Options & Geography) API
// ============================================================
export const metaApi = {
  options: () =>
    api.get<MetadataOptions>('/meta/options').then(r => r.data),

  geography: async (): Promise<GeoMeta> => {
    const opts = await api.get<MetadataOptions>('/meta/options').then(r => r.data);
    const barangays: Record<string, string[]> = {};
    const islands: string[] = Object.keys(opts.hierarchy || {});
    for (const isl of islands) {
      for (const [mun, bgys] of Object.entries(opts.hierarchy[isl] || {})) {
        barangays[mun] = bgys;
      }
    }
    return {
      municipalities: opts.municipalities || [],
      barangays,
      islands,
      employment_types: opts.employment_types || [],
    };
  },
};

export default api;
