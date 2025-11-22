"use client";

import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ProcurementCase } from '@/generated/prisma';

type BudgetQuickActionsProps = {
  caseData: ProcurementCase & {
    ors?: { orsNumber: string | null; approvedBy: string | null } | null;
    acceptance?: { acceptedAt: Date | null } | null;
  };
  submitORS: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  userRole: string;
};

export function BudgetQuickActions({
  caseData,
  submitORS,
}: BudgetQuickActionsProps) {
  const [isPending, startTransition] = useTransition();

  const handleSubmitORS = async (formData: FormData) => {
    startTransition(async () => {
      const res = await submitORS(formData);
      if (res?.success === false && res?.error) {
        toast.error(String(res.error));
      } else {
        toast.success('ORS submitted successfully.');
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Initial Submission Form (Only if no ORS and can create) */}
      {!caseData.ors && caseData.currentState === 'ACCEPTANCE' && (
        <form action={handleSubmitORS} className="flex items-center gap-2 flex-wrap p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <Input
            name="orsNumber"
            label="ORS Number"
            placeholder="e.g. ORS-2025-001"
            className="w-auto min-w-[200px]"
            required
          />
          <Input
            name="approvedBy"
            label="Approved By"
            placeholder="Name of approver"
            className="w-auto min-w-[200px]"
          />
          <Button type="submit" variant="primary" size="sm" disabled={isPending}>
            {isPending ? 'Submitting...' : 'Submit ORS'}
          </Button>
        </form>
      )}
    </div>
  );
}
