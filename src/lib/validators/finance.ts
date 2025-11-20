import { z } from 'zod';

export const ORSSchema = z.object({
  orsNumber: z.string().min(1).optional(),
  preparedAt: z.string().datetime().optional(),
  approvedAt: z.string().datetime().optional(),
  approvedBy: z.string().min(1).optional(),
});

export const DVSchema = z.object({
  dvNumber: z.string().min(1).optional(),
  preparedAt: z.string().datetime().optional(),
  approvedAt: z.string().datetime().optional(),
  approvedBy: z.string().min(1).optional(),
});

export const CheckSchema = z.object({
  checkNumber: z.string().min(1).optional(),
  preparedAt: z.string().datetime().optional(),
  approvedAt: z.string().datetime().optional(),
  approvedBy: z.string().min(1).optional(),
});

export const CheckAdviceSchema = z.object({
  adviceNumber: z.string().min(1).optional(),
  approvedAt: z.string().datetime().optional(),
});


