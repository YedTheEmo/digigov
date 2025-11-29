import { describe, it, expect } from 'vitest';
import { TWGSchema } from '@/lib/validators/twg';

describe('TWGSchema', () => {
  it('validates valid TWG data', () => {
    const valid = {
      result: 'Evaluation result',
      notes: 'Some notes',
    };
    expect(TWGSchema.safeParse(valid).success).toBe(true);
  });

  it('requires result', () => {
    const invalid = { notes: 'Some notes' };
    expect(TWGSchema.safeParse(invalid).success).toBe(false);
  });

  it('requires result to be non-empty', () => {
    const invalid = { result: '' };
    expect(TWGSchema.safeParse(invalid).success).toBe(false);
  });

  it('allows notes to be optional', () => {
    const valid = { result: 'Evaluation result' };
    expect(TWGSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects notes longer than 1000 characters', () => {
    const invalid = { result: 'Result', notes: 'a'.repeat(1001) };
    expect(TWGSchema.safeParse(invalid).success).toBe(false);
  });

  it('accepts notes up to 1000 characters', () => {
    const valid = { result: 'Result', notes: 'a'.repeat(1000) };
    expect(TWGSchema.safeParse(valid).success).toBe(true);
  });
});

