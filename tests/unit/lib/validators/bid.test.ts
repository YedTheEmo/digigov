import { describe, it, expect } from 'vitest';
import { BidSchema } from '@/lib/validators/bid';

describe('BidSchema', () => {
  it('validates valid bid data', () => {
    const valid = {
      bidderName: 'Bidder ABC',
      amount: 5000.75,
      isResponsive: true,
      openedAt: '2024-01-01T00:00:00.000Z',
    };
    expect(BidSchema.safeParse(valid).success).toBe(true);
  });

  it('requires bidderName', () => {
    const invalid = { amount: 5000 };
    expect(BidSchema.safeParse(invalid).success).toBe(false);
  });

  it('requires bidderName to be non-empty', () => {
    const invalid = { bidderName: '', amount: 5000 };
    expect(BidSchema.safeParse(invalid).success).toBe(false);
  });

  it('accepts amount as number', () => {
    const valid = { bidderName: 'Bidder', amount: 5000 };
    expect(BidSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts amount as string and transforms to number', () => {
    const valid = { bidderName: 'Bidder', amount: '5000.75' };
    const result = BidSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(5000.75);
    }
  });

  it('allows isResponsive to be optional', () => {
    const valid = { bidderName: 'Bidder', amount: 5000 };
    expect(BidSchema.safeParse(valid).success).toBe(true);
  });

  it('allows openedAt to be optional', () => {
    const valid = { bidderName: 'Bidder', amount: 5000 };
    expect(BidSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects invalid datetime format for openedAt', () => {
    const invalid = { bidderName: 'Bidder', amount: 5000, openedAt: 'not-a-date' };
    expect(BidSchema.safeParse(invalid).success).toBe(false);
  });
});

