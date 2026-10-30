import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../../services/authService';
import { UserService } from '../../services/userService';
import { settings } from '../../core/config';
import {
  AuthenticatedRequest,
  extractBearerToken,
  requireAuthenticated,
} from '../deps';
import {
  demoLoginLimiter,
  forgotPasswordLimiter,
  loginLimiter,
  registerLimiter,
  resetPasswordLimiter,
} from '../../middleware/rateLimiter';
import {
  DemoLoginRequestSchema,
  ForgotPasswordRequestSchema,
  RefreshTokenRequestSchema,
  ResetPasswordRequestSchema,
  UserLoginSchema,
  UserRegisterSchema,
} from '../../schemas/auth';
import { decodeAccessToken } from '../../core/security';

export const authRouter = Router();

// POST /register
authRouter.post(
  '/register',
  registerLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const regData = UserRegisterSchema.parse(req.body);
      const { token } = await AuthService.registerUser(regData);
      res.status(201).json(token);
    } catch (err) {
      next(err);
    }
  }
);

// POST /login
authRouter.post(
  '/login',
  loginLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const loginData = UserLoginSchema.parse(req.body);
      const { token } = await AuthService.authenticateUser(loginData);
      res.status(200).json(token);
    } catch (err) {
      next(err);
    }
  }
);

// POST /refresh
authRouter.post(
  '/refresh',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refresh_token } = RefreshTokenRequestSchema.parse(req.body);
      const token = await AuthService.rotateRefreshToken(refresh_token);
      res.status(200).json(token);
    } catch (err) {
      next(err);
    }
  }
);

// POST /logout
authRouter.post(
  '/logout',
  requireAuthenticated,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      let jti = req.tokenJti;
      if (!jti) {
        const rawToken = extractBearerToken(req);
        if (rawToken) {
          const payload = decodeAccessToken(rawToken);
          jti = payload?.jti;
        }
      }
      await AuthService.logout(req.user!, jti);
      res.status(200).json({ message: 'Successfully logged out.' });
    } catch (err) {
      next(err);
    }
  }
);

// POST /forgot-password
authRouter.post(
  '/forgot-password',
  forgotPasswordLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = ForgotPasswordRequestSchema.parse(req.body);
      await AuthService.requestPasswordReset(email);
      res.status(200).json({
        message: 'If the account exists, a password reset code has been sent.',
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /reset-password
authRouter.post(
  '/reset-password',
  resetPasswordLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, otp_code, new_password } = ResetPasswordRequestSchema.parse(req.body);
      await AuthService.resetPassword(email, otp_code, new_password);
      res.status(200).json({
        message: 'Password has been successfully reset. Please log in with your new password.',
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /me
authRouter.get(
  '/me',
  requireAuthenticated,
  (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const profile = UserService.getPrivateProfile(req.user!);
      res.status(200).json(profile);
    } catch (err) {
      next(err);
    }
  }
);

// GET /demo-status
authRouter.get('/demo-status', (_req: Request, res: Response): void => {
  if (!settings.is_demo_mode_active) {
    res.status(200).json({ enabled: false, roles: [] });
    return;
  }

  res.status(200).json({
    enabled: true,
    roles: [
      {
        role: 'job_seeker',
        label: 'Job Seeker',
        description: 'Demo Seeker: Juan Abad (Browse previews, view full jobs, apply)',
      },
      {
        role: 'employer',
        label: 'Employer',
        description: 'Demo Employer: Batanes Seaside Inn & Tours (Manage postings & applicants)',
      },
    ],
  });
});

// POST /demo-login
authRouter.post(
  '/demo-login',
  demoLoginLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { role } = DemoLoginRequestSchema.parse(req.body);
      const token = await AuthService.demoAuthenticate(role);
      res.status(200).json(token);
    } catch (err) {
      next(err);
    }
  }
);
