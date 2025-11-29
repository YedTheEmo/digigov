import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { publishToPhilGEPS } from '@/lib/integrations/philgeps';
import { sendEmail } from '@/lib/notifications/resend';

/**
 * Phase 3 - Integration Service Tests (10 tests)
 * 
 * Tests for external service integrations with mocked HTTP calls.
 * Validates error handling, payload formatting, and configuration.
 */

describe('Integration Services - PhilGEPS', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    global.fetch = vi.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('publishToPhilGEPS', () => {
    it('returns stubbed response when PHILGEPS disabled', async () => {
      process.env.PHILGEPS_ENABLED = 'false';

      const result = await publishToPhilGEPS({
        title: 'Test Procurement',
        method: 'PUBLIC_BIDDING',
        abc: 100000,
      });

      expect(result).toEqual({
        ok: true,
        stubbed: true,
        message: 'PHILGEPS disabled',
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    it('returns error when API URL not configured', async () => {
      process.env.PHILGEPS_ENABLED = 'true';
      delete process.env.PHILGEPS_API_URL;

      const result = await publishToPhilGEPS({
        title: 'Test Procurement',
        method: 'PUBLIC_BIDDING',
      });

      expect(result).toEqual({
        ok: false,
        message: 'Missing PHILGEPS_API_URL',
      });
    });

    it('sends correct payload to PhilGEPS API', async () => {
      process.env.PHILGEPS_ENABLED = 'true';
      process.env.PHILGEPS_API_URL = 'https://philgeps.example.com/api/publish';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ reference: 'PG-2025-001' }),
      });
      global.fetch = mockFetch;

      const payload = {
        title: 'Medical Supplies Procurement',
        method: 'PUBLIC_BIDDING',
        abc: 500000,
        postingStartAt: '2025-01-15T00:00:00Z',
        postingEndAt: '2025-01-22T00:00:00Z',
      };

      const result = await publishToPhilGEPS(payload);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://philgeps.example.com/api/publish',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      expect(result).toEqual({
        ok: true,
        reference: 'PG-2025-001',
      });
    });

    it('handles HTTP error responses', async () => {
      process.env.PHILGEPS_ENABLED = 'true';
      process.env.PHILGEPS_API_URL = 'https://philgeps.example.com/api/publish';

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await publishToPhilGEPS({
        title: 'Test',
        method: 'SMALL_VALUE_RFQ',
      });

      expect(result).toEqual({
        ok: false,
        message: 'HTTP 500',
      });
    });

    it('handles network errors', async () => {
      process.env.PHILGEPS_ENABLED = 'true';
      process.env.PHILGEPS_API_URL = 'https://philgeps.example.com/api/publish';

      global.fetch = vi.fn().mockRejectedValue(new Error('Network timeout'));

      const result = await publishToPhilGEPS({
        title: 'Test',
        method: 'PUBLIC_BIDDING',
      });

      expect(result).toEqual({
        ok: false,
        message: 'Network timeout',
      });
    });

    it('handles malformed JSON response', async () => {
      process.env.PHILGEPS_ENABLED = 'true';
      process.env.PHILGEPS_API_URL = 'https://philgeps.example.com/api/publish';

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const result = await publishToPhilGEPS({
        title: 'Test',
        method: 'PUBLIC_BIDDING',
      });

      expect(result.ok).toBe(true);
      expect(result.reference).toBeNull();
    });
  });
});

describe('Integration Services - Email (Resend)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    global.fetch = vi.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('sendEmail', () => {
    it('returns success without calling API when API key not configured (dev mode)', async () => {
      delete process.env.RESEND_API_KEY;

      const result = await sendEmail({
        to: 'user@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      });

      expect(result).toEqual({ ok: true });
      expect(fetch).not.toHaveBeenCalled();
    });

    it('sends email with correct payload when API key configured', async () => {
      process.env.RESEND_API_KEY = 'test_api_key_123';

      const mockFetch = vi.fn().mockResolvedValue({ ok: true });
      global.fetch = mockFetch;

      const result = await sendEmail({
        to: 'procurement@example.com',
        subject: 'Bid Submission Received',
        html: '<p>Your bid has been received.</p>',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer test_api_key_123',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'noreply@digigov.local',
            to: ['procurement@example.com'],
            subject: 'Bid Submission Received',
            html: '<p>Your bid has been received.</p>',
          }),
        }
      );

      expect(result).toEqual({ ok: true });
    });

    it('handles email API errors', async () => {
      process.env.RESEND_API_KEY = 'test_api_key_123';

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429, // Rate limit
      });

      const result = await sendEmail({
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result).toEqual({ ok: false, status: 429 });
    });

    it('handles unauthorized API key', async () => {
      process.env.RESEND_API_KEY = 'invalid_key';

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      const result = await sendEmail({
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result).toEqual({ ok: false, status: 401 });
    });
  });
});
