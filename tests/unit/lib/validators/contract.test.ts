import { describe, it, expect } from 'vitest';
import { ContractSchema } from '@/lib/validators/contract';

describe('ContractSchema', () => {
  it('validates valid contract data', () => {
    const valid = {
      contractNo: 'CONTRACT-001',
      signedAt: '2024-01-01T00:00:00.000Z',
    };
    expect(ContractSchema.safeParse(valid).success).toBe(true);
  });

  it('requires contractNo', () => {
    const invalid = { signedAt: '2024-01-01T00:00:00.000Z' };
    expect(ContractSchema.safeParse(invalid).success).toBe(false);
  });

  it('requires contractNo to be non-empty', () => {
    const invalid = { contractNo: '' };
    expect(ContractSchema.safeParse(invalid).success).toBe(false);
  });

  it('allows signedAt to be optional', () => {
    const valid = { contractNo: 'CONTRACT-001' };
    expect(ContractSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects invalid datetime format for signedAt', () => {
    const invalid = { contractNo: 'CONTRACT-001', signedAt: 'not-a-date' };
    expect(ContractSchema.safeParse(invalid).success).toBe(false);
  });
});

