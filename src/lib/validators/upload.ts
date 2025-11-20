import { z } from 'zod';

export const PresignSchema = z.object({
  key: z.string().min(3),
  contentType: z.string().min(3),
});

export const AttachmentSchema = z.object({
  caseId: z.string().min(1),
  type: z.string().min(1),
  // Allow absolute URLs (e.g. https://...) or app-relative paths (e.g. /uploads/abc.png)
  url: z.union([
    z.string().url(),
    z.string().regex(/^\/[^\s]+$/, { message: 'Invalid URL' }),
  ]),
});











