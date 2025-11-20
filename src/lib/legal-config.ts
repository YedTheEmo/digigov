export type Regime = 'RA12009' | 'RA9184';
export const legalConfig = {
  RA12009: { postingDays: 7, smallValueThreshold: 1_000_000, minQuotations: 3, deliveryDaysFromPO: 30 },
  RA9184:  { postingDays: 7, smallValueThreshold: 1_000_000, minQuotations: 3, deliveryDaysFromPO: 30 },
} as const;
