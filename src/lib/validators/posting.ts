import { z } from 'zod';

export const PostingSchema = z.object({
  postingStartAt: z.string().datetime().optional(),
  postingEndAt: z.string().datetime().optional(),
});
















