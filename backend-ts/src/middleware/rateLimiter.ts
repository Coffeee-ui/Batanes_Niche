import rateLimit from 'express-rate-limit';

const standardRateLimitHandler = (_req: any, res: any) => {
  res.status(429).json({
    detail: 'Rate limit exceeded. Please try again shortly.',
  });
};

export const registerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: standardRateLimitHandler,
});

export const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: standardRateLimitHandler,
});

export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: standardRateLimitHandler,
});

export const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: standardRateLimitHandler,
});

export const demoLoginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: standardRateLimitHandler,
});
