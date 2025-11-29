import { describe, it, expect } from 'vitest';
import { ORSSchema, DVSchema, CheckSchema, CheckAdviceSchema } from '@/lib/validators/finance';

describe('ORSSchema', () => {
  it('validates valid ORS data', () => {
    const valid = {
      orsNumber: 'ORS-001',
      preparedAt: '2024-01-01T00:00:00.000Z',
      approvedAt: '2024-01-02T00:00:00.000Z',
      approvedBy: 'John Doe',
    };
    expect(ORSSchema.safeParse(valid).success).toBe(true);
  });

  it('allows empty object', () => {
    expect(ORSSchema.safeParse({}).success).toBe(true);
  });

  it('allows all fields to be optional', () => {
    const valid = { orsNumber: 'ORS-001' };
    expect(ORSSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects invalid datetime format', () => {
    const invalid = { preparedAt: 'not-a-date' };
    expect(ORSSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('DVSchema', () => {
  it('validates valid DV data', () => {
    const valid = {
      dvNumber: 'DV-001',
      preparedAt: '2024-01-01T00:00:00.000Z',
      approvedAt: '2024-01-02T00:00:00.000Z',
      approvedBy: 'Jane Doe',
    };
    expect(DVSchema.safeParse(valid).success).toBe(true);
  });

  it('allows empty object', () => {
    expect(DVSchema.safeParse({}).success).toBe(true);
  });
});

describe('CheckSchema', () => {
  it('validates valid Check data', () => {
    const valid = {
      checkNumber: 'CHECK-001',
      preparedAt: '2024-01-01T00:00:00.000Z',
      approvedAt: '2024-01-02T00:00:00.000Z',
      approvedBy: 'Admin',
    };
    expect(CheckSchema.safeParse(valid).success).toBe(true);
  });

  it('allows empty object', () => {
    expect(CheckSchema.safeParse({}).success).toBe(true);
  });
});

describe('CheckAdviceSchema', () => {
  it('validates valid CheckAdvice data', () => {
    const valid = {
      adviceNumber: 'ADVICE-001',
      approvedAt: '2024-01-01T00:00:00.000Z',
    };
    expect(CheckAdviceSchema.safeParse(valid).success).toBe(true);
  });

  it('allows empty object', () => {
    expect(CheckAdviceSchema.safeParse({}).success).toBe(true);
  });
});

