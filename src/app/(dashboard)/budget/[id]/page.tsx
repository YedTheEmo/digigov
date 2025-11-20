import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { CaseHeader } from '@/components/app/CaseHeader';
import { getCurrentOwner, getNextStepMessage } from '@/lib/casesLifecycle';
import { ORSSchema } from '@/lib/validators/finance';
import { assertCanTransition } from '@/lib/workflows/procurement';
import { BudgetDetailTabs } from './BudgetDetailTabs';
import { BudgetQuickActions } from './BudgetQuickActions';
import { ensureRole } from '@/lib/authz';
import { logActivity } from '@/lib/activity';

export default async function BudgetCaseDetail(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const c = await prisma.procurementCase.findUnique({
    where: { id },
    include: {
      ors: true,
      acceptance: true,
      attachments: true,
      activityLogs: { orderBy: { createdAt: 'asc' } },
      // Include related procurement data for context
      award: true,
      purchaseOrder: true,
      contract: true,
      ntp: true,
      deliveries: true,
      inspection: true,
    } as any,
  }) as any;

  if (!c) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-6xl mb-4">📋</div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Case Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">The budget case you're looking for doesn't exist.</p>
        <Link href="/budget">
          <Button variant="primary">Back to Budget</Button>
        </Link>
      </div>
    );
  }

  const caseData = JSON.parse(JSON.stringify(c));
  const nextStepMessage = getNextStepMessage(c.currentState as any);
  const owner = getCurrentOwner(c.currentState as any);

  async function submitORS(formData: FormData) {
    'use server';
    try {
      const authz = await ensureRole(['BUDGET_MANAGER', 'ADMIN'] as any);
      if (!authz.ok) {
        return { success: false, error: 'Not authorized to submit ORS.' };
      }
      const actorId = authz.user.id;

      const orsNumber = String(formData.get('orsNumber') || '');
      const approvedBy = String(formData.get('approvedBy') || '');

      const parsed = ORSSchema.safeParse({
        orsNumber: orsNumber || undefined,
        preparedAt: new Date().toISOString(),
        approvedBy: approvedBy || undefined,
      });
      if (!parsed.success) {
        return {
          success: false,
          error: 'Invalid ORS data',
        };
      }

      const existing = await prisma.procurementCase.findUnique({ where: { id } });
      if (!existing) {
        return {
          success: false,
          error: 'Case not found',
        };
      }
      const previousState = existing.currentState as any;

      await assertCanTransition(existing as any, 'ORS' as any);

      await prisma.$transaction(async (tx) => {
        await tx.oRS.upsert({
          where: { caseId: id },
          update: {
            orsNumber: parsed.data.orsNumber ?? null,
            preparedAt: parsed.data.preparedAt ? new Date(parsed.data.preparedAt) : null,
            approvedAt: parsed.data.approvedAt ? new Date(parsed.data.approvedAt) : null,
            approvedBy: parsed.data.approvedBy ?? null,
          },
          create: {
            caseId: id,
            orsNumber: parsed.data.orsNumber ?? null,
            preparedAt: parsed.data.preparedAt ? new Date(parsed.data.preparedAt) : null,
            approvedAt: parsed.data.approvedAt ? new Date(parsed.data.approvedAt) : null,
            approvedBy: parsed.data.approvedBy ?? null,
          },
        });
        await tx.procurementCase.update({
          where: { id },
          data: { currentState: 'ORS' as any },
        });
      });
      try {
        await logActivity({
          caseId: id,
          action: 'ors_recorded',
          fromState: previousState,
          toState: 'ORS' as any,
          actorId,
          payload: {
            orsNumber: parsed.data.orsNumber ?? null,
            approvedBy: parsed.data.approvedBy ?? null,
          },
        });
      } catch (error) {
        console.error('Failed to log ORS activity:', error);
      }

      revalidatePath(`/(dashboard)/budget/${id}`);
      return { success: true };
    } catch (error) {
      console.error('Failed to submit ORS:', error);
      return {
        success: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error: (error as any)?.message ?? 'Failed to submit ORS',
      };
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <CaseHeader
        title={c.title}
        method={c.method}
        currentState={c.currentState}
        owner={owner}
        backHref="/budget"
      />

      {/* Case Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Case Actions</CardTitle>
          {nextStepMessage && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {nextStepMessage}
              {c.currentState === 'ORS' && (
                <>
                  {' '}
                  <Link
                    href="/accounting"
                    className="font-medium text-green-700 dark:text-green-400 hover:underline"
                  >
                    Open Accounting module
                  </Link>
                </>
              )}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Budget-specific actions */}
          <BudgetQuickActions
            caseData={caseData}
            submitORS={submitORS}
          />

          {/* Completed steps summary */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Completed Budget Steps
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              This summary helps you see what has already been recorded in Budget for this case.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              {c.acceptance && (
                <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-800 dark:text-gray-100">
                  Acceptance recorded ({c.acceptance.acceptedAt ? new Date(c.acceptance.acceptedAt).toLocaleDateString() : '—'})
                </span>
              )}
              {c.ors && (
                <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-800 dark:text-gray-100">
                  ORS prepared {c.ors.orsNumber ? `(${c.ors.orsNumber})` : ''}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Component */}
      <BudgetDetailTabs caseData={caseData} caseId={id} />
    </div>
  );
}

