import { z } from 'zod';

export const RFQSchema = z.object({
  issuedAt: z.string().datetime().optional(),
});














