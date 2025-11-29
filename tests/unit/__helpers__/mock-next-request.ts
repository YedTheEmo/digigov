import { vi } from 'vitest';
import type { NextRequest } from 'next/server';

/**
 * Creates a mock NextRequest for testing API routes
 */
export function createMockNextRequest(
  options: {
    url?: string;
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  } = {},
): NextRequest {
  const url = options.url || 'http://localhost:3000/api/test';
  const method = options.method || 'GET';
  const headers = new Headers(options.headers || {});
  
  // Add search params to URL if provided
  let finalUrl = url;
  if (options.searchParams) {
    const urlObj = new URL(url);
    Object.entries(options.searchParams).forEach(([key, value]) => {
      urlObj.searchParams.set(key, value);
    });
    finalUrl = urlObj.toString();
  }

  const request = new Request(finalUrl, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  }) as NextRequest;

  // Mock json() method if body is provided
  if (options.body) {
    request.json = vi.fn().mockResolvedValue(options.body);
  } else {
    request.json = vi.fn().mockResolvedValue({});
  }

  return request;
}

/**
 * Helper to create a mock NextRequest with JSON body
 */
export function createMockPostRequest(body: unknown, headers?: Record<string, string>) {
  return createMockNextRequest({
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

/**
 * Helper to create a mock NextRequest with GET method and query params
 */
export function createMockGetRequest(
  searchParams?: Record<string, string>,
  headers?: Record<string, string>,
) {
  return createMockNextRequest({
    method: 'GET',
    searchParams,
    headers,
  });
}

