import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { CaseHeader } from '@/components/app/CaseHeader';
import { getCurrentOwner, getNextStepMessage, type LifecycleStageId } from '@/lib/casesLifecycle';
import { CheckAdviceSchema, CheckSchema } from '@/lib/validators/finance';
import { assertCanTransition } from '@/lib/workflows/procurement';
import { CashierDetailTabs } from './CashierDetailTabs';
import { CashierQuickActions } from './CashierQuickActions';
import { ensureRole } from '@/lib/authz';
import { logActivity } from '@/lib/activity';
import type { Prisma } from '@/generated/prisma';
import type { CaseState, UserRole } from '@/generated/prisma';
import { auth } from '@/lib/nextauth';
import type { Role } from '@/lib/permissions';

export default async function CashierCaseDetail(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const session = await auth();
  const userEmail = session?.user?.email;
  const user = userEmail ? await prisma.user.findUnique({ where: { email: userEmail } }) : null;
  const userRole = (user?.role ?? 'CASHIER_MANAGER') as Role;

  const include: Prisma.ProcurementCaseInclude = {
    check: true,
    checkAdvice: true,
    dv: true,
    attachments: true,
    activityLogs: { orderBy: { createdAt: 'asc' } },
    // Include related procurement data for context
    ors: true,
    award: true,
    purchaseOrder: true,
    contract: true,
    ntp: true,
    deliveries: true,
    inspection: true,
    acceptance: true,
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
        <p className="text-gray-600 dark:text-gray-400 mb-6">The cashier case you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/cashier">
          <Button variant="primary">Back to Cashier</Button>
        </Link>
      </div>
    );
  }

  const caseData = JSON.parse(JSON.stringify(c));
  const nextStepMessage = getNextStepMessage(c.currentState as LifecycleStageId);
  const owner = getCurrentOwner(c.currentState as LifecycleStageId);

  async function submitCheck(formData: FormData) {
    'use server';
    try {
      const authz = await ensureRole(['CASHIER_MANAGER', 'ADMIN'] as UserRole[]);
      if (!authz.ok) {
        return { success: false, error: 'Not authorized to submit Check.' };
      }
      const actorId = authz.user.id;

      const checkNumber = String(formData.get('checkNumber') || '');
      const approvedBy = String(formData.get('approvedBy') || '');

      const parsed = CheckSchema.safeParse({
        checkNumber: checkNumber || undefined,
        preparedAt: new Date().toISOString(),
        approvedBy: approvedBy || undefined,
      });
      if (!parsed.success) {
        return {
          success: false,
          error: 'Invalid Check data',
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

      await assertCanTransition(existing, 'CHECK' as CaseState);

      await prisma.$transaction(async (tx) => {
        await tx.check.upsert({
          where: { caseId: id },
          update: {
            checkNumber: parsed.data.checkNumber ?? null,
            preparedAt: parsed.data.preparedAt ? new Date(parsed.data.preparedAt) : null,
            approvedAt: parsed.data.approvedAt ? new Date(parsed.data.approvedAt) : null,
            approvedBy: parsed.data.approvedBy ?? null,
          },
          create: {
            caseId: id,
            checkNumber: parsed.data.checkNumber ?? null,
            preparedAt: parsed.data.preparedAt ? new Date(parsed.data.preparedAt) : null,
            approvedAt: parsed.data.approvedAt ? new Date(parsed.data.approvedAt) : null,
            approvedBy: parsed.data.approvedBy ?? null,
          },
        });
        await tx.procurementCase.update({
          where: { id },
          data: { currentState: 'CHECK' as CaseState },
        });
      });
      try {
        await logActivity({
          caseId: id,
          action: 'check_recorded',
          fromState: previousState,
          toState: 'CHECK' as CaseState,
          actorId,
          payload: {
            checkNumber: parsed.data.checkNumber ?? null,
            approvedBy: parsed.data.approvedBy ?? null,
          },
        });
      } catch (error) {
        console.error('Failed to log Check activity:', error);
      }

      revalidatePath(`/(dashboard)/cashier/${id}`);
      return { success: true };
    } catch (error) {
      console.error('Failed to submit Check:', error);
      return {
        success: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error: (error as any)?.message ?? 'Failed to submit Check',
      };
    }
  }

  async function submitCheckAdvice(formData: FormData) {
    'use server';
    try {
      const authz = await ensureRole(['CASHIER_MANAGER', 'ADMIN'] as UserRole[]);
      if (!authz.ok) {
        return { success: false, error: 'Not authorized to submit Check Advice.' };
      }
      const actorId = authz.user.id;

      const adviceNumber = String(formData.get('adviceNumber') || '');

      const parsed = CheckAdviceSchema.safeParse({
        adviceNumber: adviceNumber || undefined,
        approvedAt: new Date().toISOString(),
      });
      if (!parsed.success) {
        return {
          success: false,
          error: 'Invalid Check Advice data',
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

      await assertCanTransition(existing, 'CLOSED' as CaseState);

      await prisma.$transaction(async (tx) => {
        await tx.checkAdvice.upsert({
          where: { caseId: id },
          update: {
            adviceNumber: parsed.data.adviceNumber ?? null,
            approvedAt: parsed.data.approvedAt ? new Date(parsed.data.approvedAt) : null,
          },
          create: {
            caseId: id,
            adviceNumber: parsed.data.adviceNumber ?? null,
            approvedAt: parsed.data.approvedAt ? new Date(parsed.data.approvedAt) : null,
          },
        });
        await tx.procurementCase.update({
          where: { id },
          data: { currentState: 'CLOSED' as CaseState },
        });
      });
      try {
        await logActivity({
          caseId: id,
          action: 'check_advice_recorded',
          fromState: previousState,
          toState: 'CLOSED' as CaseState,
          actorId,
          payload: {
            adviceNumber: parsed.data.adviceNumber ?? null,
          },
        });
      } catch (error) {
        console.error('Failed to log check advice activity:', error);
      }

      revalidatePath(`/(dashboard)/cashier/${id}`);
      return { success: true };
    } catch (error) {
      console.error('Failed to submit Check Advice:', error);
      return {
        success: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error: (error as any)?.message ?? 'Failed to submit Check Advice',
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
        backHref="/cashier"
      />

      {/* Case Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Case Actions</CardTitle>
          {nextStepMessage && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {nextStepMessage}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cashier-specific actions */}
          <CashierQuickActions
            caseData={caseData}
            submitCheck={submitCheck}
            submitCheckAdvice={submitCheckAdvice}
          />

          {/* Completed steps summary */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Completed Cashier Steps
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              This summary helps you see what has already been recorded in Cashier for this case.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              {c.dv && (
                <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-800 dark:text-gray-100">
                  DV prepared {c.dv.dvNumber ? `(${c.dv.dvNumber})` : ''}
                </span>
              )}
              {c.check && (
                <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-800 dark:text-gray-100">
                  Check prepared {c.check.checkNumber ? `(${c.check.checkNumber})` : ''}
                </span>
              )}
              {c.checkAdvice && (
                <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-800 dark:text-gray-100">
                  Check Advice issued {c.checkAdvice.adviceNumber ? `(${c.checkAdvice.adviceNumber})` : ''}
                </span>
              )}
              {c.currentState === 'CLOSED' && (
                <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-1 text-xs font-medium text-green-800 dark:text-green-100">
                  Case Closed
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Component */}
      <CashierDetailTabs caseData={caseData} caseId={id} userRole={userRole} />
    </div>
  );
}

