"use client";

import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ProcurementCase } from '@/generated/prisma';

type AccountingQuickActionsProps = {
  caseData: ProcurementCase & {
    dv?: { dvNumber: string | null; approvedBy: string | null } | null;
    ors?: { orsNumber: string | null } | null;
  };
  submitDV: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  userRole: string;
};

export function AccountingQuickActions({
  caseData,
  submitDV,
}: AccountingQuickActionsProps) {
  const [isPending, startTransition] = useTransition();

  const handleSubmitDV = async (formData: FormData) => {
    startTransition(async () => {
      const res = await submitDV(formData);
      if (res?.success === false && res?.error) {
        toast.error(String(res.error));
      } else {
        toast.success('DV submitted successfully.');
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Initial Submission Form */}
      {!caseData.dv && caseData.currentState === 'ORS' && (
        <form action={handleSubmitDV} className="flex items-center gap-2 flex-wrap p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <Input
            name="dvNumber"
            label="DV Number"
            placeholder="e.g. DV-2025-001"
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
            {isPending ? 'Submitting...' : 'Submit DV'}
          </Button>
        </form>
      )}
    </div>
  );
}
