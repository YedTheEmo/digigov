import { describe, it, expect } from 'vitest';
import { PresignSchema, AttachmentSchema } from '@/lib/validators/upload';

describe('PresignSchema', () => {
  it('validates valid presign data', () => {
    const valid = {
      key: 'uploads/file.pdf',
      contentType: 'application/pdf',
    };
    expect(PresignSchema.safeParse(valid).success).toBe(true);
  });

  it('requires key', () => {
    const invalid = { contentType: 'application/pdf' };
    expect(PresignSchema.safeParse(invalid).success).toBe(false);
  });

  it('requires key to be at least 3 characters', () => {
    const invalid = { key: 'ab', contentType: 'application/pdf' };
    expect(PresignSchema.safeParse(invalid).success).toBe(false);
  });

  it('requires contentType', () => {
    const invalid = { key: 'uploads/file.pdf' };
    expect(PresignSchema.safeParse(invalid).success).toBe(false);
  });

  it('requires contentType to be at least 3 characters', () => {
    const invalid = { key: 'uploads/file.pdf', contentType: 'ab' };
    expect(PresignSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('AttachmentSchema', () => {
  it('validates valid attachment data with absolute URL', () => {
    const valid = {
      caseId: 'case-123',
      type: 'document',
      url: 'https://example.com/file.pdf',
    };
    expect(AttachmentSchema.safeParse(valid).success).toBe(true);
  });

  it('validates valid attachment data with relative path', () => {
    const valid = {
      caseId: 'case-123',
      type: 'document',
      url: '/uploads/file.pdf',
    };
    expect(AttachmentSchema.safeParse(valid).success).toBe(true);
  });

  it('requires caseId', () => {
    const invalid = { type: 'document', url: '/uploads/file.pdf' };
    expect(AttachmentSchema.safeParse(invalid).success).toBe(false);
  });

  it('requires caseId to be non-empty', () => {
    const invalid = { caseId: '', type: 'document', url: '/uploads/file.pdf' };
    expect(AttachmentSchema.safeParse(invalid).success).toBe(false);
  });

  it('requires type', () => {
    const invalid = { caseId: 'case-123', url: '/uploads/file.pdf' };
    expect(AttachmentSchema.safeParse(invalid).success).toBe(false);
  });

  it('requires type to be non-empty', () => {
    const invalid = { caseId: 'case-123', type: '', url: '/uploads/file.pdf' };
    expect(AttachmentSchema.safeParse(invalid).success).toBe(false);
  });

  it('requires url', () => {
    const invalid = { caseId: 'case-123', type: 'document' };
    expect(AttachmentSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects invalid URL format', () => {
    const invalid = { caseId: 'case-123', type: 'document', url: 'not-a-url' };
    expect(AttachmentSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects relative path without leading slash', () => {
    const invalid = { caseId: 'case-123', type: 'document', url: 'uploads/file.pdf' };
    expect(AttachmentSchema.safeParse(invalid).success).toBe(false);
  });
});

