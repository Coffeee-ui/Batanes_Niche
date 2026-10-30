import { z } from 'zod';

const passwordValidation = z
  .string()
  .min(8, 'Password must be at least 8 characters long.')
  .max(128)
  .refine(v => /[A-Z]/.test(v), {
    message: 'Password must contain at least one uppercase letter.',
  })
  .refine(v => /[a-z]/.test(v), {
    message: 'Password must contain at least one lowercase letter.',
  })
  .refine(v => /[0-9\W_]/.test(v), {
    message: 'Password must contain at least one number or special character.',
  });

export const UserRegisterSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: passwordValidation,
  full_name: z.string().min(2).max(100),
  phone_number: z.string().max(20).optional().nullable(),
  municipality: z.string().min(2).max(50),
  barangay: z.string().max(100).optional().nullable(),
  role: z
    .string()
    .transform(v => v.trim().toLowerCase())
    .refine(v => v === 'job_seeker' || v === 'employer', {
      message: "Public registration strictly allows only 'job_seeker' or 'employer' roles.",
    }),

  // Job Seeker specific optional initial profile data
  skills: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  education: z.string().optional().nullable(),
  experience_years: z.number().int().optional().default(0),

  // Employer specific optional initial profile data
  company_name: z.string().optional().nullable(),
  company_address: z.string().optional().nullable(),
  company_description: z.string().optional().nullable(),
  business_type: z.string().optional().nullable(),
});

export type UserRegister = z.infer<typeof UserRegisterSchema>;

export const UserLoginSchema = z.object({
  username_or_email: z.string(),
  password: z.string(),
});

export type UserLogin = z.infer<typeof UserLoginSchema>;

export const TokenSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string().default('bearer'),
  role: z.string(),
  username: z.string(),
});

export type Token = z.infer<typeof TokenSchema>;

export const RefreshTokenRequestSchema = z.object({
  refresh_token: z.string(),
});

export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;

export const ForgotPasswordRequestSchema = z.object({
  email: z.string().email(),
});

export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;

export const ResetPasswordRequestSchema = z.object({
  email: z.string().email(),
  otp_code: z.string().length(6, 'Reset code must be 6 digits.'),
  new_password: passwordValidation,
});

export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;

export const DemoLoginRequestSchema = z.object({
  role: z
    .string()
    .transform(v => v.trim().toLowerCase())
    .refine(v => ['job_seeker', 'employer'].includes(v), {
      message: "Invalid demo role requested. Allowed roles: 'job_seeker', 'employer'.",
    }),
});

export type DemoLoginRequest = z.infer<typeof DemoLoginRequestSchema>;

export const DemoRoleInfoSchema = z.object({
  role: z.string(),
  label: z.string(),
  description: z.string(),
});

export type DemoRoleInfo = z.infer<typeof DemoRoleInfoSchema>;

export const DemoStatusOutSchema = z.object({
  enabled: z.boolean(),
  roles: z.array(DemoRoleInfoSchema).default([]),
});

export type DemoStatusOut = z.infer<typeof DemoStatusOutSchema>;
