import { z } from 'zod';

export const ContractSchema = z.object({
  contractNo: z.string().min(1, 'contractNo required'),
  signedAt: z.string().datetime().optional(),
});

export type ContractInput = z.infer<typeof ContractSchema>;



