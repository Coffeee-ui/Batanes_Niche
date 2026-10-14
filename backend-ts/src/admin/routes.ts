import path from 'path';
import { Router, Request, Response, NextFunction } from 'express';
import nunjucks from 'nunjucks';
import {
  ADMIN_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  createAdminSessionCookie,
  getAdminUserFromRequest,
  verifyCsrfToken,
} from './auth';
import { UserRepository } from '../repositories/userRepository';
import { JobRepository } from '../repositories/jobRepository';
import { ApplicationRepository } from '../repositories/applicationRepository';
import { AuditLogRepository } from '../repositories/auditLogRepository';
import { ErrorReportRepository } from '../repositories/errorReportRepository';
import { TokenRepository } from '../repositories/tokenRepository';
import { AuditService } from '../services/auditService';
import { verifyPassword } from '../core/security';
import { HttpError } from '../core/errors';

import fs from 'fs';

export const adminRouter = Router();

// Configure Nunjucks
const candidateTemplatesDir = path.resolve(__dirname, '../templates');
const templatesDir = fs.existsSync(candidateTemplatesDir)
  ? candidateTemplatesDir
  : path.resolve(__dirname, '../../src/templates');

const njkEnv = nunjucks.configure(templatesDir, {
  autoescape: true,
  noCache: process.env.NODE_ENV !== 'production',
});

// Custom Nunjucks filters matching Jinja2 filters
njkEnv.addFilter('strftime', (val: Date | string | null | undefined) => {
  if (!val) return '';
  const d = val instanceof Date ? val : new Date(val);
  if (isNaN(d.getTime())) return String(val);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
});

njkEnv.addFilter('currency', (val: unknown) => {
  const num = Number(val) || 0;
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
});

async function requireAdminSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  const adminUser = await getAdminUserFromRequest(req);
  if (!adminUser) {
    res.redirect(303, '/admin/login');
    return;
  }
  (req as any).adminUser = adminUser;
  next();
}

function renderTemplate(res: Response, viewName: string, context: Record<string, unknown>, statusCode: number = 200): void {
  njkEnv.render(viewName, context, (err, html) => {
    if (err) {
      console.error('Nunjucks render error:', err);
      res.status(500).send('Internal Server Error');
      return;
    }
    res.status(statusCode).type('html').send(html);
  });
}

// GET /admin/login
adminRouter.get('/login', async (req: Request, res: Response): Promise<void> => {
  const adminUser = await getAdminUserFromRequest(req);
  if (adminUser) {
    res.redirect(303, '/admin/dashboard');
    return;
  }
  renderTemplate(res, 'login.njk', { admin_user: null });
});

// POST /admin/login
adminRouter.post('/login', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password } = req.body;
    const user = await UserRepository.getByUsernameOrEmail(username || '');
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || null;

    if (!user || user.role !== 'admin' || !verifyPassword(password || '', user.password_hash)) {
      await AuditService.logEvent(
        'ADMIN_LOGIN_FAILURE',
        'unknown',
        null,
        clientIp,
        null,
        null,
        { attempted_identifier: username }
      );
      renderTemplate(
        res,
        'login.njk',
        { admin_user: null, error: 'Invalid administrator credentials.' },
        401
      );
      return;
    }

    if (user.account_status !== 'active') {
      await AuditService.logEvent(
        'ADMIN_LOGIN_FAILURE_SUSPENDED',
        'admin',
        user.id,
        clientIp,
        null,
        null,
        { account_status: user.account_status }
      );
      renderTemplate(
        res,
        'login.njk',
        { admin_user: null, error: 'Administrator account is suspended or inactive.' },
        403
      );
      return;
    }

    const { sessionToken, csrfToken } = createAdminSessionCookie(user);

    await AuditService.logEvent('ADMIN_LOGIN_SUCCESS', 'admin', user.id, clientIp);

    res.cookie(ADMIN_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 43200 * 1000,
    });
    res.cookie(CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 43200 * 1000,
    });

    res.redirect(303, '/admin/dashboard');
  } catch (err) {
    next(err);
  }
});

// POST /admin/logout
adminRouter.post('/logout', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminUser = await getAdminUserFromRequest(req);
    if (adminUser) {
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || null;
      await AuditService.logEvent('ADMIN_LOGOUT', 'admin', adminUser.id, clientIp);
    }
    res.clearCookie(ADMIN_COOKIE_NAME);
    res.clearCookie(CSRF_COOKIE_NAME);
    res.redirect(303, '/admin/login');
  } catch (err) {
    next(err);
  }
});

// GET /admin/dashboard
adminRouter.get('/dashboard', requireAdminSession, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminUser = (req as any).adminUser;
    const activeUsers = await UserRepository.countUsers(null, 'active');
    const activeJobs = await JobRepository.countActiveJobs();
    const appsCount = await ApplicationRepository.countApplications();
    const errorReports = await ErrorReportRepository.listReports(100);
    const recentLogs = await AuditLogRepository.listLogs(5);
    const csrfToken = req.cookies?.[CSRF_COOKIE_NAME] || '';

    renderTemplate(res, 'dashboard.njk', {
      admin_user: adminUser,
      active_tab: 'dashboard',
      active_users_count: activeUsers,
      active_jobs_count: activeJobs,
      applications_count: appsCount,
      error_reports_count: errorReports.length,
      recent_logs: recentLogs,
      csrf_token: csrfToken,
    });
  } catch (err) {
    next(err);
  }
});

// GET /admin/users
adminRouter.get('/users', requireAdminSession, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminUser = (req as any).adminUser;
    const q = (req.query.q as string) || null;
    const role = (req.query.role as string) || null;
    const status = (req.query.status as string) || null;

    const users = await UserRepository.listUsersForAdmin(q, role, status, 100);
    const csrfToken = req.cookies?.[CSRF_COOKIE_NAME] || '';

    renderTemplate(res, 'users.njk', {
      admin_user: adminUser,
      active_tab: 'users',
      users,
      q,
      role,
      status,
      csrf_token: csrfToken,
    });
  } catch (err) {
    next(err);
  }
});

// POST /admin/users/:userId/suspend
adminRouter.post('/users/:userId/suspend', requireAdminSession, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminUser = (req as any).adminUser;
    const csrfToken = req.body.csrf_token;
    if (!verifyCsrfToken(req, csrfToken)) {
      throw new HttpError(403, 'CSRF verification failed.');
    }

    const userId = parseInt(req.params.userId, 10);
    const targetUser = await UserRepository.getById(userId);
    if (!targetUser) {
      throw new HttpError(404, 'User not found.');
    }

    if (targetUser.id === adminUser.id) {
      throw new HttpError(400, 'You cannot suspend yourself.');
    }

    await UserRepository.update(userId, { account_status: 'suspended' });
    await TokenRepository.revokeAllUserRefreshTokens(userId);

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || null;
    await AuditService.logEvent(
      'USER_SUSPEND',
      'admin',
      adminUser.id,
      clientIp,
      'user',
      targetUser.id,
      { username: targetUser.username, email: targetUser.email }
    );

    res.redirect(303, '/admin/users');
  } catch (err) {
    next(err);
  }
});

// POST /admin/users/:userId/restore
adminRouter.post('/users/:userId/restore', requireAdminSession, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminUser = (req as any).adminUser;
    const csrfToken = req.body.csrf_token;
    if (!verifyCsrfToken(req, csrfToken)) {
      throw new HttpError(403, 'CSRF verification failed.');
    }

    const userId = parseInt(req.params.userId, 10);
    const targetUser = await UserRepository.getById(userId);
    if (!targetUser) {
      throw new HttpError(404, 'User not found.');
    }

    await UserRepository.update(userId, { account_status: 'active' });

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || null;
    await AuditService.logEvent(
      'USER_RESTORE',
      'admin',
      adminUser.id,
      clientIp,
      'user',
      targetUser.id,
      { username: targetUser.username }
    );

    res.redirect(303, '/admin/users');
  } catch (err) {
    next(err);
  }
});

// GET /admin/jobs
adminRouter.get('/jobs', requireAdminSession, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminUser = (req as any).adminUser;
    const status = (req.query.status as string) || null;
    const jobs = await JobRepository.listAllForAdmin(status, 100);
    const csrfToken = req.cookies?.[CSRF_COOKIE_NAME] || '';

    renderTemplate(res, 'jobs.njk', {
      admin_user: adminUser,
      active_tab: 'jobs',
      jobs,
      status,
      csrf_token: csrfToken,
    });
  } catch (err) {
    next(err);
  }
});

// POST /admin/jobs/:jobId/disable
adminRouter.post('/jobs/:jobId/disable', requireAdminSession, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminUser = (req as any).adminUser;
    const csrfToken = req.body.csrf_token;
    if (!verifyCsrfToken(req, csrfToken)) {
      throw new HttpError(403, 'CSRF verification failed.');
    }

    const jobId = parseInt(req.params.jobId, 10);
    const job = await JobRepository.getById(jobId, true);
    if (!job) {
      throw new HttpError(404, 'Job not found.');
    }

    await JobRepository.update(jobId, {
      status: 'closed',
      deleted_at: new Date(),
    });

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || null;
    await AuditService.logEvent(
      'JOB_DISABLE',
      'admin',
      adminUser.id,
      clientIp,
      'job',
      job.id,
      { title: job.title, employer_id: job.employer_id }
    );

    res.redirect(303, '/admin/jobs');
  } catch (err) {
    next(err);
  }
});

// POST /admin/jobs/:jobId/restore
adminRouter.post('/jobs/:jobId/restore', requireAdminSession, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminUser = (req as any).adminUser;
    const csrfToken = req.body.csrf_token;
    if (!verifyCsrfToken(req, csrfToken)) {
      throw new HttpError(403, 'CSRF verification failed.');
    }

    const jobId = parseInt(req.params.jobId, 10);
    const job = await JobRepository.getById(jobId, true);
    if (!job) {
      throw new HttpError(404, 'Job not found.');
    }

    await JobRepository.update(jobId, {
      status: 'active',
      deleted_at: null,
    });

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || null;
    await AuditService.logEvent(
      'JOB_RESTORE',
      'admin',
      adminUser.id,
      clientIp,
      'job',
      job.id,
      { title: job.title }
    );

    res.redirect(303, '/admin/jobs');
  } catch (err) {
    next(err);
  }
});

// GET /admin/error-reports
adminRouter.get('/error-reports', requireAdminSession, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminUser = (req as any).adminUser;
    const reports = await ErrorReportRepository.listReports(100);
    const csrfToken = req.cookies?.[CSRF_COOKIE_NAME] || '';

    renderTemplate(res, 'error_reports.njk', {
      admin_user: adminUser,
      active_tab: 'errors',
      reports,
      csrf_token: csrfToken,
    });
  } catch (err) {
    next(err);
  }
});

// GET /admin/audit-logs
adminRouter.get('/audit-logs', requireAdminSession, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminUser = (req as any).adminUser;
    const logs = await AuditLogRepository.listLogs(100);
    const csrfToken = req.cookies?.[CSRF_COOKIE_NAME] || '';

    renderTemplate(res, 'audit_logs.njk', {
      admin_user: adminUser,
      active_tab: 'audit',
      logs,
      csrf_token: csrfToken,
    });
  } catch (err) {
    next(err);
  }
});
