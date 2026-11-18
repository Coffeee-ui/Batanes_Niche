import { z } from 'zod';

export const NotificationOutSchema = z.object({
  id: z.number().int(),
  user_id: z.number().int(),
  title: z.string(),
  message: z.string(),
  type: z.string(),
  category: z.string().default('account'),
  is_read: z.boolean(),
  link: z.string().nullable().optional(),
  created_at: z.string(),
});

export type NotificationOut = z.infer<typeof NotificationOutSchema>;

export const NotificationBulkDeleteSchema = z.object({
  ids: z.array(z.number().int()),
});

export type NotificationBulkDelete = z.infer<typeof NotificationBulkDeleteSchema>;

export const NotificationPreferencesSchema = z.object({
  application_updates: z.boolean().default(true),
  interview_invitations: z.boolean().default(true),
  account_updates: z.boolean().default(true),
  followed_employers_vacancies: z.boolean().default(true),
  new_applications: z.boolean().default(true),
  interview_responses: z.boolean().default(true),
  vacancy_updates: z.boolean().default(true),
});

export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;
