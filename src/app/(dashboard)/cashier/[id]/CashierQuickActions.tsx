"use client";

import { useTransition } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type CashierQuickActionsProps = {
  caseData: any;
  submitCheck: (formData: FormData) => Promise<any>;
  submitCheckAdvice: (formData: FormData) => Promise<any>;
};

export function CashierQuickActions({
  caseData,
  submitCheck,
  submitCheckAdvice,
}: CashierQuickActionsProps) {
  const [isPending, startTransition] = useTransition();

  const handleSubmitCheck = async (formData: FormData) => {
    startTransition(async () => {
      const res = await submitCheck(formData);
      if (res?.success === false && res?.error) {
        toast.error(String(res.error));
      } else {
        toast.success('Check submitted successfully.');
        window.location.reload();
      }
    });
  };

  const handleSubmitCheckAdvice = async (formData: FormData) => {
    startTransition(async () => {
      const res = await submitCheckAdvice(formData);
      if (res?.success === false && res?.error) {
        toast.error(String(res.error));
      } else {
        toast.success('Check Advice submitted successfully.');
        window.location.reload();
      }
    });
  };

  const c = caseData;

  return (
    <div className="flex flex-col gap-4">
      {/* Submit Check */}
      {c.currentState === 'DV' && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Submit Check</h4>
          <form action={handleSubmitCheck} className="flex items-center gap-2 flex-wrap">
            <Input
              name="checkNumber"
              label="Check Number"
              placeholder="e.g. CHK-2025-001"
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
              {isPending ? 'Submitting...' : 'Submit Check'}
            </Button>
          </form>
        </div>
      )}

      {/* Submit Check Advice */}
      {c.currentState === 'CHECK' && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Submit Check Advice</h4>
          <form action={handleSubmitCheckAdvice} className="flex items-center gap-2 flex-wrap">
            <Input
              name="adviceNumber"
              label="Check Advice Number"
              placeholder="e.g. CA-2025-001"
              className="w-auto min-w-[200px]"
              required
            />
            <Button type="submit" variant="primary" size="sm" disabled={isPending}>
              {isPending ? 'Submitting...' : 'Submit Check Advice'}
            </Button>
          </form>
        </div>
      )}

      {c.currentState === 'CLOSED' && (
        <p className="text-xs text-gray-600 dark:text-gray-400">
          This case is fully closed. No further actions are required.
        </p>
      )}
    </div>
  );
}



