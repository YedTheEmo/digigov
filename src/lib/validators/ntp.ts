import { z } from 'zod';

export const NTPSchema = z.object({
  issuedAt: z.string().datetime().optional(),
  daysToComply: z.number().int().positive().optional(),
});

export type NTPInput = z.infer<typeof NTPSchema>;



