import { describe, it, expect } from 'vitest';
import { AbstractSchema } from '@/lib/validators/abstract';

describe('AbstractSchema', () => {
  it('validates valid abstract data', () => {
    const valid = { notes: 'Some notes' };
    expect(AbstractSchema.safeParse(valid).success).toBe(true);
  });

  it('allows empty object', () => {
    expect(AbstractSchema.safeParse({}).success).toBe(true);
  });

  it('allows notes to be optional', () => {
    expect(AbstractSchema.safeParse({ notes: undefined }).success).toBe(true);
  });

  it('rejects notes longer than 1000 characters', () => {
    const invalid = { notes: 'a'.repeat(1001) };
    expect(AbstractSchema.safeParse(invalid).success).toBe(false);
  });

  it('accepts notes up to 1000 characters', () => {
    const valid = { notes: 'a'.repeat(1000) };
    expect(AbstractSchema.safeParse(valid).success).toBe(true);
  });
});

