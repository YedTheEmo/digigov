import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { getActionMeta } from '@/lib/activityLabels';
import { getLifecycleSummary, getCurrentOwner, getNextStepMessage, getStateVariant, type LifecycleStageId } from '@/lib/casesLifecycle';
import type { Prisma, ActivityLog } from '@/generated/prisma';

export default async function CaseOverviewPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const include: Prisma.ProcurementCaseInclude = {
    rfq: true,
    quotations: true,
    abstract: true,
    bacResolution: true,
    award: true,
    purchaseOrder: true,
    contract: true,
    ntp: true,
    progressBilling: true,
    pmtInspection: true,
    deliveries: true,
    inspection: true,
    acceptance: true,
    ors: true,
    dv: true,
    check: true,
    checkAdvice: true,
    bidBulletins: true,
    preBid: true,
    bids: true,
    twgEvaluation: true,
    postQualification: true,
    attachments: true,
    activityLogs: {
      orderBy: { createdAt: 'asc' },
      include: {
        actor: {
          select: {
            name: true,
          },
        },
      },
    },
  };

  const c = await prisma.procurementCase.findUnique({
    where: { id },
    include,
  });

  if (!c) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-6xl mb-4">📋</div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Case Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The case you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Link href="/cases" className="text-green-600 dark:text-green-400 hover:underline">
          Back to Cases
        </Link>
      </div>
    );
  }

  const lifecycle = getLifecycleSummary(c);
  const owner = getCurrentOwner(c.currentState as LifecycleStageId);
  const nextStepMessage = getNextStepMessage(c.currentState as LifecycleStageId);

  const stagesByModule = lifecycle.stages.reduce<Record<string, typeof lifecycle.stages>>(
    (acc, stage) => {
      acc[stage.module] = acc[stage.module] || [];
      acc[stage.module].push(stage);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/cases" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 break-words">
              {c.title}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant={
                c.method === 'PUBLIC_BIDDING'
                  ? 'info'
                  : c.method === 'INFRASTRUCTURE'
                  ? 'warning'
                  : 'default'
              }
            >
              {c.method === 'SMALL_VALUE_RFQ'
                ? 'Small Value RFQ'
                : c.method === 'INFRASTRUCTURE'
                ? 'Infrastructure'
                : 'Public Bidding'}
            </Badge>
            <Badge variant={getStateVariant(c.currentState as string)} dot>
              {c.currentState}
            </Badge>
            {owner && (
              <Badge variant="default">
                Owner: {owner.module} ({owner.roleHint})
              </Badge>
            )}
          </div>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Created {new Date(c.createdAt).toLocaleString()}
            {c.endUserUnit && ` · End-user: ${c.endUserUnit}`}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            This is a read-only overview. To perform actions, open the appropriate workspace:
          </p>
          <div className="flex flex-col items-end gap-1">
            <Link
              href={`/procurement/${c.id}`}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Open in Procurement
            </Link>
            <Link
              href={`/supply/${c.id}`}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Open in Supply
            </Link>
            <Link
              href={`/budget/${c.id}`}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Open in Budget
            </Link>
            <Link
              href={`/accounting/${c.id}`}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Open in Accounting
            </Link>
            <Link
              href={`/cashier/${c.id}`}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Open in Cashier
            </Link>
          </div>
        </div>
      </div>

      {nextStepMessage && (
        <Card>
          <CardHeader>
            <CardTitle>Where this case is now</CardTitle>
            <CardDescription>{nextStepMessage}</CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Global Progress</CardTitle>
            <CardDescription>
              End-to-end stages across Procurement, Supply, Budget, Accounting, and Cashier.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(stagesByModule).length === 0 ? (
              <EmptyState
                icon="📋"
                title="No lifecycle information"
                description="This case has no recorded lifecycle events yet."
              />
            ) : (
              <div className="space-y-5">
                {(['Procurement', 'Supply', 'Budget', 'Accounting', 'Cashier'] as const).map(
                  (moduleKey) => {
                    const stages = stagesByModule[moduleKey];
                    if (!stages || stages.length === 0) return null;
                    return (
                      <div key={moduleKey}>
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                          {moduleKey}
                        </div>
                        <div className="space-y-2">
                          {stages.map((stage, index) => (
                            <div key={stage.id} className="flex items-center gap-3">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                  stage.completed
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                                }`}
                              >
                                {stage.completed ? '✓' : index + 1}
                              </div>
                              <div className="flex flex-col">
                                <div
                                  className={`text-sm ${
                                    stage.completed
                                      ? 'text-gray-900 dark:text-gray-100 font-medium'
                                      : 'text-gray-500 dark:text-gray-400'
                                  }`}
                                >
                                  {stage.label}
                                </div>
                                {stage.completedAt && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {stage.completedAt.toLocaleString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                ABC
              </div>
              <div className="text-sm text-gray-900 dark:text-gray-100">
                {c.abc
                  ? Number(c.abc).toLocaleString('en-PH', {
                      style: 'currency',
                      currency: 'PHP',
                    })
                  : 'Not specified'}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                Regime
              </div>
              <div className="text-sm text-gray-900 dark:text-gray-100">{c.regime}</div>
            </div>
            {c.method === 'SMALL_VALUE_RFQ' && c.abstract && (
              <div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Abstract of Quotations
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-900 dark:text-gray-100">
                    Generated{' '}
                    {c.abstract.createdAt
                      ? new Date(c.abstract.createdAt).toLocaleString()
                      : ''}
                  </span>
                  <Link
                    href={`/procurement/${c.id}/abstract`}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View
                  </Link>
                </div>
              </div>
            )}
            {c.postingStartAt && (
              <div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Posting period
                </div>
                <div className="text-sm text-gray-900 dark:text-gray-100">
                  {new Date(c.postingStartAt).toLocaleDateString()} –{' '}
                  {c.postingEndAt
                    ? new Date(c.postingEndAt).toLocaleDateString()
                    : 'Ongoing'}
                </div>
              </div>
            )}
            {c.deliveryDueAt && (
              <div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Delivery due
                </div>
                <div className="text-sm text-gray-900 dark:text-gray-100">
                  {new Date(c.deliveryDueAt).toLocaleDateString()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>
                All recorded actions for this case, across all modules (latest first).
              </CardDescription>
            </div>
            <a
              href={`/api/cases/${c.id}/timeline`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Download timeline (JSON)
            </a>
          </CardHeader>
        <CardContent>
          {c.activityLogs.length === 0 ? (
            <EmptyState
              icon="📅"
              title="No activity yet"
              description="Activity logs will appear here as actions are taken on this case."
            />
          ) : (
            <div className="space-y-4">
              {c.activityLogs
                .slice()
                .reverse()
                .map((log: ActivityLog, index: number) => {
                  const meta = getActionMeta(log.action);
                  return (
                    <div key={log.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-600 dark:bg-blue-500" />
                        {index < c.activityLogs.length - 1 && (
                          <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 my-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <div
                            className="font-medium text-gray-900 dark:text-gray-100"
                            title={log.action}
                          >
                            {meta.label}
                          </div>
                          {log.toState && (
                            <Badge variant="info" size="sm">
                              → {log.toState}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(log.createdAt).toLocaleString()}
                          {log.actor?.name && ` · ${log.actor.name}`}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


