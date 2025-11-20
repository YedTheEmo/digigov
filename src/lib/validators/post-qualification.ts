import { z } from 'zod';

export const PostQualificationSchema = z.object({
  lowestResponsiveBidder: z.string().min(1).optional(),
  passed: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
  completedAt: z.string().datetime().optional(),
});
















