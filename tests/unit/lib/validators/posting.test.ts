import { describe, it, expect } from 'vitest';
import { PostingSchema } from '@/lib/validators/posting';

describe('PostingSchema', () => {
  it('validates valid posting data', () => {
    const valid = {
      postingStartAt: '2024-01-01T00:00:00.000Z',
      postingEndAt: '2024-01-31T23:59:59.000Z',
    };
    expect(PostingSchema.safeParse(valid).success).toBe(true);
  });

  it('allows empty object', () => {
    expect(PostingSchema.safeParse({}).success).toBe(true);
  });

  it('allows only start date', () => {
    const valid = { postingStartAt: '2024-01-01T00:00:00.000Z' };
    expect(PostingSchema.safeParse(valid).success).toBe(true);
  });

  it('allows only end date', () => {
    const valid = { postingEndAt: '2024-01-31T23:59:59.000Z' };
    expect(PostingSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects invalid datetime format', () => {
    const invalid = { postingStartAt: 'not-a-date' };
    expect(PostingSchema.safeParse(invalid).success).toBe(false);
  });
});

