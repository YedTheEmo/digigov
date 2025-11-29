import { describe, it, expect } from 'vitest';
import { PostQualificationSchema } from '@/lib/validators/post-qualification';

describe('PostQualificationSchema', () => {
  it('validates valid post-qualification data', () => {
    const valid = {
      lowestResponsiveBidder: 'Bidder ABC',
      passed: true,
      notes: 'Some notes',
      completedAt: '2024-01-01T00:00:00.000Z',
    };
    expect(PostQualificationSchema.safeParse(valid).success).toBe(true);
  });

  it('allows empty object', () => {
    expect(PostQualificationSchema.safeParse({}).success).toBe(true);
  });

  it('allows all fields to be optional', () => {
    const valid = { passed: true };
    expect(PostQualificationSchema.safeParse(valid).success).toBe(true);
  });

  it('requires lowestResponsiveBidder to be non-empty if provided', () => {
    const invalid = { lowestResponsiveBidder: '' };
    expect(PostQualificationSchema.safeParse(invalid).success).toBe(false);
  });

  it('accepts passed as boolean', () => {
    const valid = { passed: false };
    expect(PostQualificationSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects notes longer than 1000 characters', () => {
    const invalid = { notes: 'a'.repeat(1001) };
    expect(PostQualificationSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects invalid datetime format for completedAt', () => {
    const invalid = { completedAt: 'not-a-date' };
    expect(PostQualificationSchema.safeParse(invalid).success).toBe(false);
  });
});

