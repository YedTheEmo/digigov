import { z } from 'zod';

export const TWGSchema = z.object({
  result: z.string().min(1),
  notes: z.string().max(1000).optional(),
});
















