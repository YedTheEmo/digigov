import { describe, it, expect, beforeEach } from 'vitest';
import { useIdempotencyKey } from '@/lib/idempotency';

describe('idempotency', () => {
  beforeEach(() => {
    // Clear the in-memory map by re-importing
    // Note: This is a limitation of the current implementation
    // In a real scenario, you'd want to expose a reset function
  });

  it('allows first request with unique key', async () => {
    const result = await useIdempotencyKey('unique-key-1', 60000);
    expect(result.ok).toBe(true);
  });

  it('blocks duplicate request with same key', async () => {
    const key = 'duplicate-key-1';
    
    // First request
    const first = await useIdempotencyKey(key, 60000);
    expect(first.ok).toBe(true);
    
    // Duplicate request
    const second = await useIdempotencyKey(key, 60000);
    expect(second.ok).toBe(false);
  });

  it('allows request after TTL expires', async () => {
    const key = 'ttl-key-1';
    const shortTtl = 100; // 100ms
    
    // First request
    await useIdempotencyKey(key, shortTtl);
    
    // Wait for TTL to expire
    await new Promise((resolve) => setTimeout(resolve, shortTtl + 10));
    
    // Should be allowed again
    const result = await useIdempotencyKey(key, shortTtl);
    expect(result.ok).toBe(true);
  });

  it('treats different keys as separate', async () => {
    const key1 = 'different-key-1';
    const key2 = 'different-key-2';
    
    const result1 = await useIdempotencyKey(key1, 60000);
    const result2 = await useIdempotencyKey(key2, 60000);
    
    expect(result1.ok).toBe(true);
    expect(result2.ok).toBe(true);
  });

  it('uses default TTL of 5 minutes when not specified', async () => {
    const key = 'default-ttl-key';
    
    const first = await useIdempotencyKey(key);
    expect(first.ok).toBe(true);
    
    const second = await useIdempotencyKey(key);
    expect(second.ok).toBe(false);
  });
});

