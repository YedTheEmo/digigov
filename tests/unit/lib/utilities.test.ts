import { describe, it, expect } from 'vitest';
import { getAttachmentDisplayName } from '@/lib/attachments';
import { getActionMeta, ACTION_FILTERS } from '@/lib/activityLabels';

describe('Utility Functions - Attachment Display Name', () => {
  describe('getAttachmentDisplayName', () => {
    it('returns custom type when provided (not legacy)', () => {
      const result = getAttachmentDisplayName({
        type: 'Purchase Order',
        url: 'https://example.com/files/12345_contract.pdf',
      });
      expect(result).toBe('Purchase Order');
    });

    it('ignores legacy labels and falls back to filename', () => {
      const result = getAttachmentDisplayName({
        type: 'GENERIC',
        url: 'https://example.com/files/12345_budget.pdf',
      });
      expect(result).toBe('budget.pdf');
    });

    it('strips generated numeric prefix from filename', () => {
      const result = getAttachmentDisplayName({
        type: 'FILE',
        url: 'https://s3.amazonaws.com/bucket/98765_invoice.pdf',
      });
      expect(result).toBe('invoice.pdf');
    });

    it('handles URL with query parameters', () => {
      const result = getAttachmentDisplayName({
        url: 'https://example.com/files/12345_report.pdf?v=1&token=abc',
      });
      expect(result).toBe('report.pdf');
    });

    it('handles URL-encoded filenames', () => {
      const result = getAttachmentDisplayName({
        url: 'https://example.com/files/12345_My%20Document.pdf',
      });
      expect(result).toBe('My Document.pdf');
    });

    it('returns "Attachment" when no type and no URL', () => {
      const result = getAttachmentDisplayName({});
      expect(result).toBe('Attachment');
    });

    it('returns "Attachment" when URL is empty string', () => {
      const result = getAttachmentDisplayName({ url: '' });
      expect(result).toBe('Attachment');
    });

    it('returns "Attachment" when URL is only whitespace', () => {
      const result = getAttachmentDisplayName({ url: '   ' });
      expect(result).toBe('Attachment');
    });

    it('handles relative paths', () => {
      const result = getAttachmentDisplayName({
        url: '/uploads/12345_invoice.pdf',
      });
      expect(result).toBe('invoice.pdf');
    });

    it('returns filename from invalid URL format', () => {
      const result = getAttachmentDisplayName({
        type: 'DOCUMENT',
        url: 'invalid-url-no-path',
      });
      // The function extracts the string itself as the filename when no path separator exists
      expect(result).toBe('invalid-url-no-path');
    });
  });
});

describe('Utility Functions - Activity Labels', () => {
  describe('getActionMeta', () => {
    it('returns label for standard procurement action', () => {
      const meta = getActionMeta('posting');
      expect(meta.label).toBe('Posting Started');
      expect(meta.category).toBe('procurement');
    });

    it('returns label for bidding action', () => {
      const meta = getActionMeta('pre_bid_conf');
      expect(meta.label).toBe('Pre-Bid Conference Recorded');
      expect(meta.category).toBe('bidding');
    });

    it('returns label for supply action', () => {
      const meta = getActionMeta('delivery_recorded');
      expect(meta.label).toBe('Delivery Recorded');
      expect(meta.category).toBe('supply');
    });

    it('returns label for budget action', () => {
      const meta = getActionMeta('ors_recorded');
      expect(meta.label).toBe('ORS Recorded');
      expect(meta.category).toBe('budget');
    });

    it('returns label for accounting action', () => {
      const meta = getActionMeta('dv_recorded');
      expect(meta.label).toBe('DV Recorded');
      expect(meta.category).toBe('accounting');
    });

    it('returns label for cashier action', () => {
      const meta = getActionMeta('check_recorded');
      expect(meta.label).toBe('Check Recorded');
      expect(meta.category).toBe('cashier');
    });

    it('returns label for system action', () => {
      const meta = getActionMeta('create_case');
      expect(meta.label).toBe('Case Created');
      expect(meta.category).toBe('system');
    });

    it('returns label for state constant as action', () => {
      const meta = getActionMeta('BAC_RESOLUTION');
      expect(meta.label).toBe('BAC Resolution Stage');
      expect(meta.category).toBe('bidding');
    });

    it('generates label for unknown action with underscores', () => {
      const meta = getActionMeta('custom_procurement_step');
      expect(meta.label).toBe('Custom procurement step');
      expect(meta.category).toBe('other');
    });

    it('generates label for unknown action with dashes', () => {
      const meta = getActionMeta('new-bidding-phase');
      expect(meta.label).toBe('New bidding phase');
      expect(meta.category).toBe('other');
    });

    it('handles empty string action', () => {
      const meta = getActionMeta('');
      expect(meta.label).toBe('Activity');
      expect(meta.category).toBe('other');
    });
  });

  describe('ACTION_FILTERS', () => {
    it('contains expected number of filter items', () => {
      expect(ACTION_FILTERS.length).toBeGreaterThan(20);
    });

    it('all filters have key, label, and category', () => {
      ACTION_FILTERS.forEach((filter) => {
        expect(filter).toHaveProperty('key');
        expect(filter).toHaveProperty('label');
        expect(filter).toHaveProperty('category');
        expect(typeof filter.key).toBe('string');
        expect(typeof filter.label).toBe('string');
        expect(typeof filter.category).toBe('string');
      });
    });

    it('filters match their action metadata', () => {
      ACTION_FILTERS.forEach((filter) => {
        const meta = getActionMeta(filter.key);
        expect(meta.label).toBe(filter.label);
        expect(meta.category).toBe(filter.category);
      });
    });
  });
});
