import { z } from 'zod';

export const AwardSchema = z.object({
  awardedTo: z.string().min(1, 'awardedTo required'),
  noticeDate: z.string().datetime().optional(),
});

export type AwardInput = z.infer<typeof AwardSchema>;



