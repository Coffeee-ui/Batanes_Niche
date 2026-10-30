import { z } from 'zod';

export const MetadataOptionsOutSchema = z.object({
  hierarchy: z.record(z.record(z.array(z.string()))),
  municipalities: z.array(z.string()),
  skills: z.array(z.string()),
  education_levels: z.array(z.string()),
  employment_types: z.array(z.string()),
  business_types: z.array(z.string()),
});

export type MetadataOptionsOut = z.infer<typeof MetadataOptionsOutSchema>;
