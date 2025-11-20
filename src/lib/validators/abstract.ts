import { z } from 'zod';

export const AbstractSchema = z.object({
  notes: z.string().max(1000).optional(),
});
















