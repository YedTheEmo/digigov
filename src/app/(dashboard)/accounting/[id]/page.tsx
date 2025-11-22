import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { CaseHeader } from '@/components/app/CaseHeader';
import { getCurrentOwner, getNextStepMessage, type LifecycleStageId } from '@/lib/casesLifecycle';
import { DVSchema } from '@/lib/validators/finance';
import { assertCanTransition } from '@/lib/workflows/procurement';
import { AccountingDetailTabs } from './AccountingDetailTabs';
import { AccountingQuickActions } from './AccountingQuickActions';
import { ensureRole } from '@/lib/authz';
import { logActivity } from '@/lib/activity';
import type { Prisma } from '@/generated/prisma';
import type { CaseState, UserRole } from '@/generated/prisma';
import { auth } from '@/lib/nextauth';
import type { Role } from '@/lib/permissions';

export default async function AccountingCaseDetail(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const session = await auth();
  const userRole = session?.user?.role as UserRole | undefined;

  const include: Prisma.ProcurementCaseInclude = {
    dv: true,
    ors: true,
    attachments: true,
    activityLogs: { orderBy: { createdAt: 'asc' } },
    // Include related procurement data for context
    award: true,
    purchaseOrder: true,
    contract: true,
    ntp: true,
    deliveries: true,
    inspection: true,
    acceptance: true,
    check: true, // Needed for lock check
  };

  const c = await prisma.procurementCase.findUnique({
    where: { id },
    include,
  });

  if (!c) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-6xl mb-4">📋</div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Case Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">The accounting case you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/accounting">
          <Button variant="primary">Back to Accounting</Button>
        </Link>
      </div>
    );
  }

  const caseData = JSON.parse(JSON.stringify(c));
  const nextStepMessage = getNextStepMessage(c.currentState as LifecycleStageId);
  const owner = getCurrentOwner(c.currentState as LifecycleStageId);

  async function submitDV(formData: FormData) {
    'use server';
    try {
      const authz = await ensureRole(['ACCOUNTING_MANAGER', 'ADMIN'] as UserRole[]);
      if (!authz.ok) {
        return { success: false, error: 'Not authorized to submit DV.' };
      }
      const actorId = authz.user.id;

      const dvNumber = String(formData.get('dvNumber') || '');
      const approvedBy = String(formData.get('approvedBy') || '');

      const parsed = DVSchema.safeParse({
        dvNumber: dvNumber || undefined,
        preparedAt: new Date().toISOString(),
        approvedBy: approvedBy || undefined,
      });
      if (!parsed.success) {
        return {
          success: false,
          error: 'Invalid DV data',
        };
      }

      const existing = await prisma.procurementCase.findUnique({ where: { id } });
      if (!existing) {
        return {
          success: false,
          error: 'Case not found',
        };
      }
      const previousState = existing.currentState as CaseState;

      await assertCanTransition(existing, 'DV' as CaseState);

      await prisma.$transaction(async (tx) => {
        const created = await tx.dV.create({
           data: {
            caseId: id,
            dvNumber: parsed.data.dvNumber ?? null,
            preparedAt: parsed.data.preparedAt ? new Date(parsed.data.preparedAt) : null,
            approvedAt: parsed.data.approvedAt ? new Date(parsed.data.approvedAt) : null,
            approvedBy: parsed.data.approvedBy ?? null,
           }
        });
        await tx.procurementCase.update({
          where: { id },
          data: { currentState: 'DV' as CaseState },
        });
        
        await logActivity({
          caseId: id,
          action: 'dv',
          fromState: previousState,
          toState: 'DV' as CaseState,
          actorId,
          changeType: 'CREATE',
          entity: 'DV',
          entityId: created.id,
          payload: {
            dvNumber: parsed.data.dvNumber ?? null,
          }
        });
      });

      revalidatePath(`/(dashboard)/accounting/${id}`);
      return { success: true };
    } catch (error) {
      console.error('Failed to submit DV:', error);
      return {
        success: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error: (error as any)?.message ?? 'Failed to submit DV',
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
        backHref="/accounting"
      />

      {/* Case Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Case Actions</CardTitle>
          {nextStepMessage && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {nextStepMessage}
              {c.currentState === 'DV' && (
                <>
                  {' '}
                  <Link
                    href="/cashier"
                    className="font-medium text-green-700 dark:text-green-400 hover:underline"
                  >
                    Open Cashier module
                  </Link>
                </>
              )}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Accounting-specific actions */}
          <AccountingQuickActions
            caseData={caseData}
            submitDV={submitDV}
            userRole={userRole || 'ACCOUNTING_MANAGER'}
          />

          {/* Completed steps summary */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Completed Accounting Steps
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              This summary helps you see what has already been recorded in Accounting for this case.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              {c.ors && (
                <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-800 dark:text-gray-100">
                  ORS prepared {c.ors.orsNumber ? `(${c.ors.orsNumber})` : ''}
                </span>
              )}
              {c.dv && (
                <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-800 dark:text-gray-100">
                  DV prepared {c.dv.dvNumber ? `(${c.dv.dvNumber})` : ''}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Component */}
      <AccountingDetailTabs caseData={caseData} caseId={id} userRole={(userRole ?? 'ACCOUNTING_MANAGER') as Role} />
    </div>
  );
}
