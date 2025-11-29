import { describe, it, expect } from 'vitest';
import { AwardSchema } from '@/lib/validators/award';

describe('AwardSchema', () => {
  it('validates valid award data', () => {
    const valid = {
      awardedTo: 'Supplier ABC',
      noticeDate: '2024-01-01T00:00:00.000Z',
    };
    expect(AwardSchema.safeParse(valid).success).toBe(true);
  });

  it('requires awardedTo', () => {
    const invalid = { noticeDate: '2024-01-01T00:00:00.000Z' };
    expect(AwardSchema.safeParse(invalid).success).toBe(false);
  });

  it('requires awardedTo to be non-empty', () => {
    const invalid = { awardedTo: '' };
    expect(AwardSchema.safeParse(invalid).success).toBe(false);
  });

  it('allows noticeDate to be optional', () => {
    const valid = { awardedTo: 'Supplier ABC' };
    expect(AwardSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects invalid datetime format for noticeDate', () => {
    const invalid = { awardedTo: 'Supplier ABC', noticeDate: 'not-a-date' };
    expect(AwardSchema.safeParse(invalid).success).toBe(false);
  });
});

