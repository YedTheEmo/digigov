"use client";

import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

import type { ProcurementCase, Quotation, Bid, RFQ, Award, BACResolution } from '@/generated/prisma';

type QuickActionsProps = {
  caseData: ProcurementCase & {
    quotations?: Quotation[];
    bids?: Bid[];
    rfq?: RFQ | null;
    abstract?: { id: string } | null;
    bacResolution?: BACResolution | null;
    award?: Award | null;
    purchaseOrder?: { id: string } | null;
    contract?: { id: string } | null;
    ntp?: { id: string } | null;
  };
  role: string;
  startPosting: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  issueRFQ: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  submitAward: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  approvePO: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  signContract: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  issueNTP: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  recordBACResolution: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
};

function can(role: string, allowed: string[]) {
  return allowed.includes(role);
}

export function QuickActions({
  caseData,
  role,
  startPosting,
  issueRFQ,
  submitAward,
  approvePO,
  signContract,
  issueNTP,
  recordBACResolution,
}: QuickActionsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleStartPosting = async (formData: FormData) => {
    const startRaw = String(formData.get('postingStartAt') || '');
    const endRaw = String(formData.get('postingEndAt') || '');

    if (startRaw && endRaw) {
      const start = new Date(startRaw);
      const end = new Date(endRaw);
      const diffMs = end.getTime() - start.getTime();
      const minMs = 7 * 24 * 60 * 60 * 1000;
      if (Number.isFinite(diffMs) && diffMs < minMs) {
        toast.error('Posting period must be at least 7 days.');
        return;
      }
    }

    startTransition(async () => {
      const res = await startPosting(formData);
      if (res?.success === false && res?.error) {
        toast.error(String(res.error));
      } else {
        toast.success('Posting started successfully.');
      }
    });
  };

  const makeHandler =
    (action: (fd: FormData) => Promise<{ success: boolean; error?: string }>, successMessage: string) =>
      async (formData: FormData) => {
        startTransition(async () => {
          const res = await action(formData);
          if (res?.success === false && res?.error) {
            toast.error(String(res.error));
          } else {
            toast.success(successMessage);
          }
        });
      };

  const handleIssueRFQ = makeHandler(issueRFQ, 'RFQ issued successfully.');
  const handleSubmitAward = makeHandler(submitAward, 'Award submitted successfully.');
  const handleApprovePO = makeHandler(approvePO, 'PO approved successfully.');
  const handleSignContract = makeHandler(signContract, 'Contract signed successfully.');
  const handleIssueNTP = makeHandler(issueNTP, 'NTP issued successfully.');
  const handleRecordBACResolution = makeHandler(
    recordBACResolution,
    'BAC Resolution recorded successfully.',
  );

  const c = caseData;
  const quotationCount = (c.quotations?.length as number | undefined) ?? 0;
  const remainingForAbstract = Math.max(0, 3 - quotationCount);

  const handleGenerateAbstract = async () => {
    if (!can(role, ['PROCUREMENT_MANAGER', 'ADMIN'])) {
      toast.error('You do not have permission to generate the abstract.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/cases/${c.id}/abstract`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': `${c.id}:${Date.now()}:abstract`,
          },
          body: JSON.stringify({}),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          const message =
            typeof data?.error === 'string'
              ? data.error
              : 'Failed to generate abstract. Please check quotations and try again.';
          toast.error(message);
          return;
        }

        toast.success('Abstract generated successfully.');
        router.push(`/procurement/${c.id}/abstract`);
      } catch (error) {
        console.error('Failed to generate abstract:', error);
        toast.error('Unexpected error while generating abstract.');
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        {c.method === 'SMALL_VALUE_RFQ' &&
          !c.rfq &&
          ['DRAFT'].includes(c.currentState as string) &&
          can(role, ['PROCUREMENT_MANAGER', 'BAC_SECRETARIAT', 'ADMIN']) && (
            <form action={handleIssueRFQ} className="flex items-center gap-2">
              <Input
                name="issuedAt"
                type="datetime-local"
                label="RFQ Issue Date"
                className="w-auto"
              />
              <Button type="submit" variant="primary" size="sm" disabled={isPending}>
                Issue RFQ
              </Button>
            </form>
          )}

        {c.currentState === 'DRAFT' &&
          (c.method !== 'SMALL_VALUE_RFQ' || !!c.rfq) &&
          can(role, ['PROCUREMENT_MANAGER', 'BAC_SECRETARIAT', 'ADMIN']) && (
            <form action={handleStartPosting} className="flex items-center gap-2">
              <Input
                name="postingStartAt"
                type="datetime-local"
                label="Posting Start Date"
                className="w-auto"
              />
              <Input
                name="postingEndAt"
                type="datetime-local"
                label="Posting End Date (min 7 days)"
                className="w-auto"
              />
              <Button type="submit" variant="primary" size="sm" disabled={isPending}>
                Start Posting
              </Button>
            </form>
          )}

        {c.method === 'SMALL_VALUE_RFQ' &&
          c.rfq &&
          ['POSTING'].includes(c.currentState as string) &&
          can(role, ['PROCUREMENT_MANAGER', 'BAC_SECRETARIAT', 'ADMIN']) && (
             // Re-show Issue RFQ if in Posting state just in case they need to re-issue or it's a different flow?
             // The user said "Sequential". If it's already issued (c.rfq is true), maybe we don't show it. 
             // But what if they want to edit? The current impl was create-only (Issue RFQ).
             // I'll hide it if c.rfq is present to be strict sequential as requested.
             null
          )}

        {/* RFQ Abstract (Stage 3) guidance + action */}
        {c.method === 'SMALL_VALUE_RFQ' &&
          !c.abstract &&
          can(role, ['PROCUREMENT_MANAGER', 'ADMIN']) && (
            <>
              {quotationCount >= 3 ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={isPending}
                  onClick={handleGenerateAbstract}
                >
                  Generate Abstract
                </Button>
              ) : (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Add at least 3 quotations to proceed to Abstract (Stage 3). You currently have{' '}
                  {quotationCount}. Need {remainingForAbstract} more quotation
                  {remainingForAbstract === 1 ? '' : 's'}.
                </p>
              )}
            </>
          )}

        {c.method === 'SMALL_VALUE_RFQ' &&
          c.abstract &&
          !c.bacResolution &&
          can(role, ['PROCUREMENT_MANAGER', 'BAC_SECRETARIAT', 'ADMIN']) && (
            <form action={handleRecordBACResolution} className="flex items-center gap-2">
              <Input
                name="notes"
                placeholder="BAC Resolution Notes (optional)"
                className="w-auto min-w-[250px]"
              />
              <Button type="submit" variant="primary" size="sm" disabled={isPending}>
                Record BAC Resolution
              </Button>
            </form>
          )}

        {c.bacResolution && !c.award && can(role, ['APPROVER', 'BAC_SECRETARIAT', 'ADMIN']) && (
          <form action={handleSubmitAward} className="flex items-center gap-2">
            <Select name="awardedTo" className="w-[250px]" defaultValue="">
              <option value="" disabled>Select Supplier</option>
              {c.quotations?.map((q: Quotation) => (
                <option key={q.id} value={q.supplierName}>
                  {q.supplierName} - {q.amount ? String(q.amount) : 'N/A'}
                </option>
              ))}
              {c.bids?.map((b: Bid) => (
                <option key={b.id} value={b.bidderName}>
                  {b.bidderName} - {b.amount ? String(b.amount) : 'N/A'}
                </option>
              ))}
            </Select>
            <Input
              name="noticeDate"
              type="datetime-local"
              label="Notice of Award Date"
              className="w-auto"
            />
            <Button type="submit" variant="primary" size="sm" disabled={isPending}>
              Award
            </Button>
          </form>
        )}

        {c.award && !c.purchaseOrder && can(role, ['APPROVER', 'ADMIN']) && (
          <form action={handleApprovePO} className="flex items-center gap-2">
            <Input
              name="poNo"
              label="Purchase Order Number"
              placeholder="e.g. PO-2025-001"
              className="w-auto"
            />
            <Button type="submit" variant="primary" size="sm" disabled={isPending}>
              Approve PO
            </Button>
          </form>
        )}

        {c.award && c.purchaseOrder && !c.contract && can(role, ['PROCUREMENT_MANAGER', 'ADMIN']) && (
          <form action={handleSignContract} className="flex items-center gap-2">
            <Input
              name="contractNo"
              label="Contract Number"
              placeholder="e.g. 2025-Contract-01"
              className="w-auto"
            />
            <Input
              name="signedAt"
              type="datetime-local"
              label="Contract Signed At"
              className="w-auto"
            />
            <Button type="submit" variant="primary" size="sm" disabled={isPending}>
              Sign Contract
            </Button>
          </form>
        )}

        {c.contract && !c.ntp && can(role, ['PROCUREMENT_MANAGER', 'ADMIN']) && (
          <form action={handleIssueNTP} className="flex items-center gap-2">
            <Input
              name="issuedAt"
              type="datetime-local"
              label="NTP Issue Date"
              className="w-auto"
            />
            <Input
              name="daysToComply"
              type="number"
              defaultValue={30}
              label="Days to Comply (calendar days to deliver)"
              className="w-24"
            />
            <Button type="submit" variant="primary" size="sm" disabled={isPending}>
              Issue NTP
            </Button>
          </form>
        )}
      </div>

      {/* Extra guidance when nothing is actionable */}
      {!c.abstract &&
        c.method === 'SMALL_VALUE_RFQ' &&
        quotationCount === 0 &&
        can(role, ['PROCUREMENT_MANAGER', 'ADMIN']) && (
          <p className="text-xs text-gray-600 dark:text-gray-400">
            To progress this Small Value RFQ, issue the RFQ and record at least 3 quotations in the
            Quotations tab.
          </p>
        )}
    </div>
  );
}
