import { describe, it, expect } from 'vitest';
import { BACResolutionSchema } from '@/lib/validators/bac-resolution';

describe('BACResolutionSchema', () => {
  it('validates valid BAC Resolution data', () => {
    const valid = { notes: 'Some notes' };
    expect(BACResolutionSchema.safeParse(valid).success).toBe(true);
  });

  it('allows empty object', () => {
    expect(BACResolutionSchema.safeParse({}).success).toBe(true);
  });

  it('allows notes to be optional', () => {
    expect(BACResolutionSchema.safeParse({ notes: undefined }).success).toBe(true);
  });

  it('rejects notes longer than 1000 characters', () => {
    const invalid = { notes: 'a'.repeat(1001) };
    expect(BACResolutionSchema.safeParse(invalid).success).toBe(false);
  });

  it('accepts notes up to 1000 characters', () => {
    const valid = { notes: 'a'.repeat(1000) };
    expect(BACResolutionSchema.safeParse(valid).success).toBe(true);
  });
});

