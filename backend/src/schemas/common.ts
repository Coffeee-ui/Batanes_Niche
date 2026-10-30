import { z } from 'zod';

export const MessageOutSchema = z.object({
  message: z.string(),
});

export type MessageOut = z.infer<typeof MessageOutSchema>;
