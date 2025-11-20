import { z } from 'zod';

/**
 * Helper for accepting flexible datetime strings.
 *
 * We intentionally support values coming from `<input type="datetime-local">`
 * (e.g. `2025-11-19T03:15`) as well as full RFC3339 strings. Zod's built‑in
 * `.datetime()` is too strict for `datetime-local`, so we validate by trying
 * to construct a JS `Date` and checking that it is valid.
 */
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

export const DeliverySchema = z.object({
  deliveredAt: flexibleDateTimeString.optional(),
  notes: z.string().max(1000).optional(),
});

export const InspectionSchema = z.object({
  status: z.enum(['PASSED', 'FAILED']).optional(),
  inspector: z.string().min(1).optional(),
  inspectedAt: flexibleDateTimeString.optional(),
  notes: z.string().max(1000).optional(),
  coaSignatory: z.string().min(1).optional(),
  coaSignedAt: flexibleDateTimeString.optional(),
  endUserSignatory: z.string().min(1).optional(),
  endUserSignedAt: flexibleDateTimeString.optional(),
});

export const AcceptanceSchema = z.object({
  acceptedAt: flexibleDateTimeString.optional(),
  officer: z.string().min(1).optional(),
});


