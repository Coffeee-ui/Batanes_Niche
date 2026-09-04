import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  User, Job, Application, Notification, SavedJob,
  PaginatedResponse, Token, RegisterPayload,
  LoginPayload, JobCreate, JobFilters, Candidate,
  CandidateRankingResponse, JobRankingResponse,
  MetadataOptions, GeoMeta, ApiError
} from '../types';

// ============================================================
// Axios Client Configuration
// ============================================================

const api: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

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
        const { data } = await axios.post<Token>('/api/v1/auth/refresh', {
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
// Auth API (Section 14 & 26)
// ============================================================
export const authApi = {
  register: (payload: RegisterPayload) => {
    // Generate username from full name or email if not provided
    const username = payload.username || payload.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') + '_' + Math.floor(Math.random() * 1000);
    const body = {
      username,
      email: payload.email,
      password: payload.password,
      full_name: payload.full_name,
      role: payload.role,
      municipality: payload.municipality,
      barangay: payload.barangay || undefined,
      phone_number: payload.phone_number || payload.phone || undefined,
      skills: payload.skills || undefined,
      bio: payload.bio || undefined,
      company_name: payload.company_name || undefined,
      company_address: payload.company_address || undefined,
      company_description: payload.company_description || undefined,
      business_type: payload.business_type || undefined,
    };
    return api.post<Token>('/auth/register', body).then(r => r.data);
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

  confirmPasswordReset: (email: string, otp: string, new_password: string) =>
    api.post('/auth/reset-password', {
      email,
      otp_code: otp,
      new_password,
    }).then(r => r.data),
};

// ============================================================
// Jobs API (Section 14)
// ============================================================
export const jobsApi = {
  list: async (filters: JobFilters = {}): Promise<PaginatedResponse<Job>> => {
    const params: Record<string, any> = {};
    if (filters.q || filters.keyword) params.keyword = filters.q || filters.keyword;
    if (filters.municipality) params.municipality = filters.municipality;
    if (filters.island) params.island = filters.island;
    if (filters.employment_type) params.employment_type = filters.employment_type;
    const limit = filters.page_size || 50;
    const offset = ((filters.page || 1) - 1) * limit;
    params.limit = limit;
    params.offset = offset;

    const items = await api.get<Job[]>('/jobs', { params }).then(r => r.data);
    return {
      items,
      total: items.length,
      page: filters.page || 1,
      page_size: limit,
      total_pages: Math.max(1, Math.ceil(items.length / limit)),
    };
  },

  get: (id: number) =>
    api.get<Job>(`/jobs/${id}`).then(r => r.data),

  create: (payload: JobCreate) =>
    api.post<Job>('/jobs', payload).then(r => r.data),

  update: (id: number, payload: Partial<JobCreate>) =>
    api.put<Job>(`/jobs/${id}`, payload).then(r => r.data),

  close: (id: number) =>
    api.delete(`/jobs/${id}`).then(r => r.data),

  myJobs: async (params: { page?: number; page_size?: number } = {}): Promise<PaginatedResponse<Job>> => {
    const limit = params.page_size || 50;
    const offset = ((params.page || 1) - 1) * limit;
    const items = await api.get<Job[]>('/jobs/my', { params: { limit, offset } }).then(r => r.data);
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
// Applications API (Section 14)
// ============================================================
export const applicationsApi = {
  apply: (jobId: number, coverLetter?: string) =>
    api.post<Application>('/applications', {
      job_id: jobId,
      cover_letter: coverLetter || null,
    }).then(r => r.data),

  myApplications: async (_params: { page?: number; page_size?: number } = {}): Promise<PaginatedResponse<Application>> => {
    const items = await api.get<Application[]>('/applications').then(r => r.data);
    const normalized = items.map(a => ({
      ...a,
      job_title: a.job?.title || a.job_title || 'Position',
      company_name: a.job?.company_name || a.company_name || 'Batanes Employer',
      seeker_name: a.applicant?.full_name || a.seeker_name || 'Applicant',
    }));
    return {
      items: normalized,
      total: normalized.length,
      page: 1,
      page_size: 50,
      total_pages: 1,
    };
  },

  forJob: async (jobId: number): Promise<Application[]> => {
    const items = await api.get<Application[]>('/applications').then(r => r.data);
    return items.filter(a => a.job_id === jobId);
  },

  updateStatus: (applicationId: number, status: string) =>
    api.put<Application>(`/applications/${applicationId}`, { status }).then(r => r.data),

  withdraw: async (_applicationId: number) => {
    // In v2 applications are archived or transitioned by employer;
    return { message: 'Application updated' };
  },
};

// ============================================================
// Users / Profile API (Section 14 & 15)
// ============================================================
export const usersApi = {
  getProfile: () =>
    api.get<User>('/users/profile').then(r => r.data),

  updateProfile: (payload: Record<string, any>) => {
    const body: Record<string, any> = {
      full_name: payload.full_name,
      phone_number: payload.phone_number || payload.phone,
      municipality: payload.municipality,
      barangay: payload.barangay,
      skills: payload.skills,
      profile_pic: payload.profile_pic,
      resume_url: payload.resume_url,
      bio: payload.bio,
      education: payload.education,
      experience_years: payload.experience_years != null ? Number(payload.experience_years) : undefined,
      company_name: payload.company_name,
      company_address: payload.company_address || payload.municipality,
      company_description: payload.company_description,
      business_type: payload.business_type || payload.industry,
    };
    // Strip undefined keys
    Object.keys(body).forEach(k => body[k] === undefined && delete body[k]);
    return api.put<User>('/users/profile', body).then(r => r.data);
  },

  candidates: async (params: { q?: string; municipality?: string; island?: string; skill?: string; page?: number; page_size?: number } = {}): Promise<PaginatedResponse<Candidate>> => {
    const queryParams: Record<string, any> = {};
    if (params.municipality) queryParams.municipality = params.municipality;
    if (params.island) queryParams.island = params.island;
    if (params.skill || params.q) queryParams.skill = params.skill || params.q;
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

  recommendations: async (): Promise<Candidate[]> => {
    const res = await api.get<CandidateRankingResponse>('/recommendations/candidates').then(r => r.data);
    const tier1 = (res.tier_1 || []).map(t => t.candidate);
    const tier2 = (res.tier_2 || []).map(t => t.candidate);
    return [...tier1, ...tier2];
  },
};

// ============================================================
// Saved Jobs API (Section 14 & 7.6)
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
// Notifications API (Section 14 & 7.4)
// ============================================================
export const notificationsApi = {
  list: () =>
    api.get<Notification[]>('/notifications').then(r => r.data),

  markAllRead: () =>
    api.put('/notifications/read').then(r => r.data),

  unreadCount: async (): Promise<{ count: number }> => {
    const notifs = await api.get<Notification[]>('/notifications').then(r => r.data);
    const count = notifs.filter(n => !n.is_read).length;
    return { count };
  },
};

// ============================================================
// Meta (Options & Geography) API (Section 14)
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
