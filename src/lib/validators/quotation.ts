import { z } from 'zod';

export const QuotationSchema = z.object({
  supplierName: z.string().min(1),
  amount: z.union([z.number(), z.string().transform((v) => Number(v)).pipe(z.number())]),
  isResponsive: z.boolean().optional(),
});















