import { z } from 'zod';

export const BidSchema = z.object({
  bidderName: z.string().min(1),
  amount: z.union([z.number(), z.string().transform((v) => Number(v)).pipe(z.number())]),
  isResponsive: z.boolean().optional(),
  openedAt: z.string().datetime().optional(),
});
















