import { describe, it, expect } from 'vitest';
import { NTPSchema } from '@/lib/validators/ntp';

describe('NTPSchema', () => {
  it('validates valid NTP data', () => {
    const valid = {
      issuedAt: '2024-01-01T00:00:00.000Z',
      daysToComply: 30,
    };
    expect(NTPSchema.safeParse(valid).success).toBe(true);
  });

  it('allows empty object', () => {
    expect(NTPSchema.safeParse({}).success).toBe(true);
  });

  it('allows only issuedAt', () => {
    const valid = { issuedAt: '2024-01-01T00:00:00.000Z' };
    expect(NTPSchema.safeParse(valid).success).toBe(true);
  });

  it('allows only daysToComply', () => {
    const valid = { daysToComply: 30 };
    expect(NTPSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects invalid datetime format', () => {
    const invalid = { issuedAt: 'not-a-date' };
    expect(NTPSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects negative daysToComply', () => {
    const invalid = { daysToComply: -1 };
    expect(NTPSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects zero daysToComply', () => {
    const invalid = { daysToComply: 0 };
    expect(NTPSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects non-integer daysToComply', () => {
    const invalid = { daysToComply: 30.5 };
    expect(NTPSchema.safeParse(invalid).success).toBe(false);
  });
});

