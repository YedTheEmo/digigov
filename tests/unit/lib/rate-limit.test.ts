import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rateLimit, clientIpKey } from '@/lib/rate-limit';
import { createMockNextRequest } from '../__helpers__/mock-next-request';

describe('rate-limit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  describe('rateLimit - in-memory fallback', () => {
    it('allows request when under limit', async () => {
      const req = createMockNextRequest();
      const result = await rateLimit(req, 'test-key', 10, 60000);
      expect(result.ok).toBe(true);
    });

    it('blocks request when over limit', async () => {
      const req = createMockNextRequest();
      const key = 'test-key-over-limit';
      
      // Make 10 requests (limit is 10)
      for (let i = 0; i < 10; i++) {
        await rateLimit(req, key, 10, 60000);
      }
      
      // 11th request should be blocked
      const result = await rateLimit(req, key, 10, 60000);
      expect(result.ok).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('resets after window expires', async () => {
      const req = createMockNextRequest();
      const key = 'test-key-reset';
      const windowMs = 100; // Very short window for testing
      
      // Fill up the bucket
      for (let i = 0; i < 10; i++) {
        await rateLimit(req, key, 10, windowMs);
      }
      
      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, windowMs + 10));
      
      // Should be allowed again
      const result = await rateLimit(req, key, 10, windowMs);
      expect(result.ok).toBe(true);
    });
  });

  describe('rateLimit - Upstash Redis', () => {
    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    });

    it('allows request when Upstash returns count under limit', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ text: () => Promise.resolve('5') }) // incr returns 5
        .mockResolvedValueOnce({ text: () => Promise.resolve('60000') }); // pexpire returns TTL

      const req = createMockNextRequest();
      const result = await rateLimit(req, 'test-key', 10, 60000);
      
      expect(result.ok).toBe(true);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('blocks request when Upstash returns count over limit', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ text: () => Promise.resolve('11') }) // incr returns 11 (over limit)
        .mockResolvedValueOnce({ text: () => Promise.resolve('50000') }); // pttl returns remaining TTL

      const req = createMockNextRequest();
      const result = await rateLimit(req, 'test-key', 10, 60000);
      
      expect(result.ok).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('sets expiration on first request', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ text: () => Promise.resolve('1') }) // First request
        .mockResolvedValueOnce({ text: () => Promise.resolve('1') }); // pexpire success

      const req = createMockNextRequest();
      await rateLimit(req, 'test-key', 10, 60000);
      
      expect(global.fetch).toHaveBeenCalledTimes(2);
      // Check that pexpire was called
      const pexpireCall = (global.fetch as any).mock.calls.find((call: any[]) =>
        call[0]?.includes('/pexpire/')
      );
      expect(pexpireCall).toBeDefined();
    });
  });

  describe('clientIpKey', () => {
    it('extracts IP from x-forwarded-for header', () => {
      const req = createMockNextRequest({
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
      });
      const key = clientIpKey(req, 'test-route');
      expect(key).toBe('test-route:192.168.1.1');
    });

    it('uses first IP when multiple IPs in header', () => {
      const req = createMockNextRequest({
        headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
      });
      const key = clientIpKey(req, 'test-route');
      expect(key).toBe('test-route:1.2.3.4');
    });

    it('trims whitespace from IP', () => {
      const req = createMockNextRequest({
        headers: { 'x-forwarded-for': '  192.168.1.1  ' },
      });
      const key = clientIpKey(req, 'test-route');
      expect(key).toBe('test-route:192.168.1.1');
    });

    it('defaults to "local" when no x-forwarded-for header', () => {
      const req = createMockNextRequest();
      const key = clientIpKey(req, 'test-route');
      expect(key).toBe('test-route:local');
    });
  });
});

