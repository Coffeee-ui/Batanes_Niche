import { z } from 'zod';

export const NotificationOutSchema = z.object({
  id: z.number().int(),
  user_id: z.number().int(),
  title: z.string(),
  message: z.string(),
  type: z.string(),
  is_read: z.boolean(),
  link: z.string().nullable().optional(),
  created_at: z.string(),
});

export type NotificationOut = z.infer<typeof NotificationOutSchema>;
