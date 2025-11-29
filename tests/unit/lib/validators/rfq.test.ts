import { describe, it, expect } from 'vitest';
import { RFQSchema } from '@/lib/validators/rfq';

describe('RFQSchema', () => {
  it('validates valid RFQ data', () => {
    const valid = {
      issuedAt: '2024-01-01T00:00:00.000Z',
      rfqNumber: 'RFQ-001',
    };
    expect(RFQSchema.safeParse(valid).success).toBe(true);
  });

  it('allows empty object', () => {
    expect(RFQSchema.safeParse({}).success).toBe(true);
  });

  it('allows optional fields to be undefined', () => {
    expect(RFQSchema.safeParse({ issuedAt: undefined }).success).toBe(true);
  });

  it('rejects invalid datetime format', () => {
    const invalid = { issuedAt: 'not-a-date' };
    expect(RFQSchema.safeParse(invalid).success).toBe(false);
  });

  it('accepts valid datetime string', () => {
    const valid = { issuedAt: '2024-01-01T00:00:00.000Z' };
    expect(RFQSchema.safeParse(valid).success).toBe(true);
  });
});

