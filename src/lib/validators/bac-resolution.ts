import { z } from 'zod';

export const BACResolutionSchema = z.object({
  notes: z.string().max(1000).optional(),
});
















