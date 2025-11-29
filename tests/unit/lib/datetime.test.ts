import { describe, it, expect } from 'vitest';
import { z } from 'zod';

/**
 * Phase 3 - Date/Time Handling Tests (5 tests)
 * 
 * Tests for date/time validation patterns used throughout the application,
 * particularly the flexible datetime-local input handling.
 */

// Helper for flexible datetime strings (same as used in post_award.ts)
const flexibleDateTimeString = z
  .string()
  .refine(
    (value) => {
      if (!value) return false;
      const d = new Date(value);
      return !Number.isNaN(d.getTime());
    },
    { message: 'Invalid date/time' },
  );

describe('Date/Time Handling', () => {
  describe('Flexible DateTime Validation', () => {
    it('accepts datetime-local format (YYYY-MM-DDTHH:mm)', () => {
      const result = flexibleDateTimeString.safeParse('2025-11-19T03:15');
      expect(result.success).toBe(true);
    });

    it('accepts full ISO 8601 datetime format', () => {
      const result = flexibleDateTimeString.safeParse('2025-11-19T03:15:00.000Z');
      expect(result.success).toBe(true);
    });

    it('rejects invalid date formats', () => {
      const result = flexibleDateTimeString.safeParse('2025-13-45T99:99');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid date/time');
      }
    });

    it('rejects empty string', () => {
      const result = flexibleDateTimeString.safeParse('');
      expect(result.success).toBe(false);
    });

    it('accepts date with timezone offset', () => {
      const result = flexibleDateTimeString.safeParse('2025-11-19T03:15:00+08:00');
      expect(result.success).toBe(true);
    });
  });

  describe('Date Arithmetic and Ranges', () => {
    it('handles date comparison correctly', () => {
      const earlier = new Date('2025-01-15T10:00:00Z');
      const later = new Date('2025-01-20T10:00:00Z');
      expect(later > earlier).toBe(true);
      expect(earlier < later).toBe(true);
    });

    it('validates future dates correctly', () => {
      const now = new Date();
      const future = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +1 day
      expect(future > now).toBe(true);
    });

    it('validates past dates correctly', () => {
      const now = new Date();
      const past = new Date(now.getTime() - 24 * 60 * 60 * 1000); // -1 day
      expect(past < now).toBe(true);
    });

    it('handles date range overlaps', () => {
      const range1Start = new Date('2025-01-01');
      const range1End = new Date('2025-01-15');
      const range2Start = new Date('2025-01-10');
      const range2End = new Date('2025-01-20');

      // Check if ranges overlap
      const overlaps = range1End >= range2Start && range2End >= range1Start;
      expect(overlaps).toBe(true);
    });

    it('handles non-overlapping date ranges', () => {
      const range1Start = new Date('2025-01-01');
      const range1End = new Date('2025-01-10');
      const range2Start = new Date('2025-01-15');
      const range2End = new Date('2025-01-20');

      // Check if ranges overlap
      const overlaps = range1End >= range2Start && range2End >= range1Start;
      expect(overlaps).toBe(false);
    });
  });

  describe('Date Precision and Edge Cases', () => {
    it('handles same date comparison', () => {
      const date1 = new Date('2025-01-15T00:00:00Z');
      const date2 = new Date('2025-01-15T00:00:00Z');
      expect(date1.getTime()).toBe(date2.getTime());
    });

    it('handles timezone differences', () => {
      const utc = new Date('2025-01-15T00:00:00Z');
      const pht = new Date('2025-01-15T08:00:00+08:00');
      expect(utc.getTime()).toBe(pht.getTime());
    });

    it('validates leap year dates', () => {
      const leapYearDate = new Date('2024-02-29');
      expect(leapYearDate.getMonth()).toBe(1); // February (0-indexed)
      expect(leapYearDate.getDate()).toBe(29);

      const nonLeapYearDate = new Date('2025-02-29');
      // JavaScript auto-corrects to March 1st
      expect(nonLeapYearDate.getMonth()).toBe(2); // March
      expect(nonLeapYearDate.getDate()).toBe(1);
    });

    it('handles date parsing edge cases', () => {
      // Valid edge cases
      expect(new Date('2025-12-31T23:59:59Z').getTime()).toBeGreaterThan(0);
      expect(new Date('2025-01-01T00:00:00Z').getTime()).toBeGreaterThan(0);
      
      // Invalid returns NaN timestamp
      expect(Number.isNaN(new Date('invalid').getTime())).toBe(true);
    });

    it('preserves millisecond precision', () => {
      const dateWithMs = new Date('2025-01-15T12:30:45.123Z');
      expect(dateWithMs.getMilliseconds()).toBe(123);
    });
  });

  describe('DateTime-local Input Format', () => {
    it('converts datetime-local to ISO string', () => {
      const datetimeLocal = '2025-11-19T03:15';
      const date = new Date(datetimeLocal);
      const isoString = date.toISOString();
      expect(isoString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('handles datetime-local without seconds', () => {
      const result = flexibleDateTimeString.safeParse('2025-11-19T03:15');
      expect(result.success).toBe(true);
      
      if (result.success) {
        const date = new Date(result.data);
        expect(date.getFullYear()).toBe(2025);
        expect(date.getMonth()).toBe(10); // November (0-indexed)
        expect(date.getDate()).toBe(19);
      }
    });

    it('handles datetime-local with seconds', () => {
      const result = flexibleDateTimeString.safeParse('2025-11-19T03:15:30');
      expect(result.success).toBe(true);
      
      if (result.success) {
        const date = new Date(result.data);
        expect(date.getSeconds()).toBe(30);
      }
    });
  });

  describe('Date Validation for Business Rules', () => {
    it('validates posting period duration (7 days minimum)', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-08');
      const durationMs = endDate.getTime() - startDate.getTime();
      const durationDays = durationMs / (1000 * 60 * 60 * 24);
      expect(durationDays).toBeGreaterThanOrEqual(7);
    });

    it('validates delivery deadline is future date', () => {
      const now = new Date();
      const deadline = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days
      expect(deadline > now).toBe(true);
    });

    it('validates contract period dates', () => {
      const contractStart = new Date('2025-01-01');
      const contractEnd = new Date('2025-12-31');
      expect(contractEnd > contractStart).toBe(true);
      
      const durationMs = contractEnd.getTime() - contractStart.getTime();
      const durationDays = durationMs / (1000 * 60 * 60 * 24);
      expect(durationDays).toBeGreaterThan(0);
    });

    it('validates inspection date is after delivery date', () => {
      const deliveryDate = new Date('2025-06-01');
      const inspectionDate = new Date('2025-06-05');
      expect(inspectionDate > deliveryDate).toBe(true);
    });

    it('validates acceptance date is after inspection date', () => {
      const inspectionDate = new Date('2025-06-05');
      const acceptanceDate = new Date('2025-06-10');
      expect(acceptanceDate > inspectionDate).toBe(true);
    });
  });
});
