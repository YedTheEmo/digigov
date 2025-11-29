import { describe, it, expect } from 'vitest';
import { QuotationSchema } from '@/lib/validators/quotation';

describe('QuotationSchema', () => {
  it('validates valid quotation data', () => {
    const valid = {
      supplierName: 'Supplier ABC',
      amount: 1000.50,
      isResponsive: true,
    };
    expect(QuotationSchema.safeParse(valid).success).toBe(true);
  });

  it('requires supplierName', () => {
    const invalid = { amount: 1000 };
    expect(QuotationSchema.safeParse(invalid).success).toBe(false);
  });

  it('requires supplierName to be non-empty', () => {
    const invalid = { supplierName: '', amount: 1000 };
    expect(QuotationSchema.safeParse(invalid).success).toBe(false);
  });

  it('accepts amount as number', () => {
    const valid = { supplierName: 'Supplier', amount: 1000 };
    expect(QuotationSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts amount as string and transforms to number', () => {
    const valid = { supplierName: 'Supplier', amount: '1000.50' };
    const result = QuotationSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(1000.50);
    }
  });

  it('rejects invalid amount string', () => {
    const invalid = { supplierName: 'Supplier', amount: 'not-a-number' };
    expect(QuotationSchema.safeParse(invalid).success).toBe(false);
  });

  it('allows isResponsive to be optional', () => {
    const valid = { supplierName: 'Supplier', amount: 1000 };
    expect(QuotationSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts isResponsive as boolean', () => {
    const valid = { supplierName: 'Supplier', amount: 1000, isResponsive: false };
    expect(QuotationSchema.safeParse(valid).success).toBe(true);
  });
});

