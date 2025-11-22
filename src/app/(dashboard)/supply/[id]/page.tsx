import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { CaseHeader } from '@/components/app/CaseHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { getCurrentOwner, type LifecycleStageId } from '@/lib/casesLifecycle';
import { getActionMeta } from '@/lib/activityLabels';
import { recordDelivery, submitInspection, submitAcceptance } from '../supplyActions';
import { auth } from '@/lib/nextauth';
import type { Role } from '@/lib/permissions';
import { EditDeleteTab } from './EditDeleteTab';

async function recordDeliveryFormAction(formData: FormData): Promise<void> {
  'use server';
  await recordDelivery(formData);
}

async function submitInspectionFormAction(formData: FormData): Promise<void> {
  'use server';
  await submitInspection(formData);
}

async function submitAcceptanceFormAction(formData: FormData): Promise<void> {
  'use server';
  await submitAcceptance(formData);
}
import { Uploader } from '@/app/(dashboard)/procurement/[id]/Uploader';
import { getAttachmentDisplayName } from '@/lib/attachments';
import { ProgressStages } from '@/components/app/ProgressStages';
import type { ActivityLog } from '@/generated/prisma';

export default async function SupplyCaseDetail(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const session = await auth();
  const userEmail = session?.user?.email;
  const user = userEmail ? await prisma.user.findUnique({ where: { email: userEmail } }) : null;
  const role = (user?.role ?? 'SUPPLY_MANAGER') as Role;

  const c = await prisma.procurementCase.findUnique({
    where: { id },
    include: {
      deliveries: true,
      inspection: true,
      acceptance: true,
      attachments: true,
      activityLogs: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!c) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-6xl mb-4">📦</div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Case Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The case you&apos;re looking for doesn&apos;t exist or is not available in the Supply workspace.
        </p>
        <Link href="/supply">
          <Button variant="primary">Back to Supply</Button>
        </Link>
      </div>
    );
  }

  const owner = getCurrentOwner(c.currentState as LifecycleStageId);

  const latestDelivery = c.deliveries?.length
    ? c.deliveries[c.deliveries.length - 1]
    : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <CaseHeader
        title={c.title}
        method={c.method}
        currentState={c.currentState}
        owner={owner}
        backHref="/supply"
      />

      <Card>
        <CardHeader>
          <CardTitle>Case Actions</CardTitle>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Use these actions to record deliveries, inspection, and acceptance for this case. Changes here
            are reflected across the whole procurement lifecycle.
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Record Delivery */}
          <div className="p-6 rounded-lg bg-gray-50 dark:bg-[#1a1d23] border border-gray-100 dark:border-[#2d3139]">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Record Delivery
            </h3>
            {latestDelivery ? (
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Latest delivery recorded on{' '}
                {latestDelivery.deliveredAt
                  ? new Date(latestDelivery.deliveredAt).toLocaleString()
                  : '-'}
                . You can add another delivery if needed.
              </p>
            ) : (
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Record when items were actually delivered and any notes about partial deliveries or issues.
              </p>
            )}
            <form
              action={recordDeliveryFormAction}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <input type="hidden" name="id" value={c.id} />
              <Input
                name="deliveredAt"
                type="datetime-local"
                label="Delivered At"
                helperText="Date and time the items were received."
              />
              <Input
                name="notes"
                label="Delivery Notes"
                placeholder="e.g. Partial delivery, damaged boxes, etc."
              />
              <div className="flex items-end">
                <Button type="submit" variant="primary" className="w-full">
                  Record Delivery
                </Button>
              </div>
            </form>
          </div>

          {/* Inspection */}
          <div className="p-6 rounded-lg bg-gray-50 dark:bg-[#1a1d23] border border-gray-100 dark:border-[#2d3139]">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Inspection
            </h3>
            {c.inspection ? (
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Inspection recorded as{' '}
                <span className="font-semibold">
                  {c.inspection.status || 'N/A'}
                </span>{' '}
                by {c.inspection.inspector || '—'} on{' '}
                {c.inspection.inspectedAt
                  ? new Date(c.inspection.inspectedAt).toLocaleString()
                  : '-'}
                .
              </p>
            ) : (
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                After delivery, record whether items passed or failed inspection and who performed it.
              </p>
            )}
            <form
              action={submitInspectionFormAction}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <input type="hidden" name="id" value={c.id} />
              <Select name="status" label="Inspection Status">
                <option value="PASSED">Passed</option>
                <option value="FAILED">Failed</option>
              </Select>
              <Input
                name="inspector"
                label="Inspector"
                placeholder="Name of inspection officer"
              />
              <div className="flex items-end">
                <Button type="submit" variant="primary" className="w-full">
                  Submit Inspection
                </Button>
              </div>
            </form>
          </div>

          {/* Acceptance */}
          <div className="p-6 rounded-lg bg-gray-50 dark:bg-[#1a1d23] border border-gray-100 dark:border-[#2d3139]">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Acceptance
            </h3>
            {c.acceptance ? (
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Acceptance recorded by{' '}
                <span className="font-semibold">
                  {c.acceptance.officer || '—'}
                </span>{' '}
                on{' '}
                {c.acceptance.acceptedAt
                  ? new Date(c.acceptance.acceptedAt).toLocaleString()
                  : '-'}
                .
              </p>
            ) : (
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Once items have passed inspection and been accepted, record the accepting officer here.
              </p>
            )}
            <form
              action={submitAcceptanceFormAction}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <input type="hidden" name="id" value={c.id} />
              <Input
                name="officer"
                label="Accepting Officer"
                placeholder="Name of the supply or end-user officer"
              />
              <div className="flex items-end">
                <Button type="submit" variant="primary" className="w-full">
                  Submit Acceptance
                </Button>
              </div>
            </form>
          </div>

          {/* Completed Supply steps summary (mirrors Procurement layout) */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Completed Supply Steps
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              This summary helps you see what has already been recorded in Supply for this case.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              {c.deliveries?.length > 0 && (
                <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-800 dark:text-gray-100">
                  Delivered
                </span>
              )}
              {c.inspection && (
                <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-800 dark:text-gray-100">
                  Inspected
                </span>
              )}
              {c.acceptance && (
                <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-800 dark:text-gray-100">
                  Accepted
                </span>
              )}
              {!c.deliveries?.length && !c.inspection && !c.acceptance && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  No Supply steps have been completed yet.
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="edit-delete">Edit & Delete</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Supply Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Current State: </span>
                  {c.currentState}
                </div>
                {latestDelivery && (
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Last Delivery: </span>
                    {latestDelivery.deliveredAt
                      ? new Date(latestDelivery.deliveredAt).toLocaleString()
                      : '-'}
                  </div>
                )}
                {c.inspection && (
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Inspection Result: </span>
                    {c.inspection.status || 'N/A'} by {c.inspection.inspector || '—'}
                  </div>
                )}
                {c.acceptance && (
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Accepted By: </span>
                    {c.acceptance.officer || '—'}
                  </div>
                )}
              </CardContent>
            </Card>

            <ProgressStages
              stages={[
                { label: 'Delivery', completed: (c.deliveries?.length || 0) > 0 },
                { label: 'Inspection', completed: !!c.inspection },
                { label: 'Acceptance', completed: !!c.acceptance },
              ]}
            />
          </div>
        </TabsContent>

        <TabsContent value="edit-delete">
          <EditDeleteTab caseData={c} userRole={role} />
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Supply Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                // Filter activity logs to show only supply-related activities
                const supplyLogs = c.activityLogs?.filter((log: ActivityLog) => {
                  const meta = getActionMeta(log.action);
                  return meta.category === 'supply' || 
                         log.action === 'delivery_recorded' || 
                         log.action === 'inspection_recorded' || 
                         log.action === 'acceptance_recorded' ||
                         log.toState === 'DELIVERY' || 
                         log.toState === 'INSPECTION' || 
                         log.toState === 'ACCEPTANCE';
                }) || [];
                
                return supplyLogs.length > 0 ? (
                  <div className="space-y-4">
                    {supplyLogs.map((log: ActivityLog, index: number) => (
                      <div key={log.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-600 dark:bg-blue-500" />
                          {index < supplyLogs.length - 1 && (
                            <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 my-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {getActionMeta(log.action).label}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {new Date(log.createdAt).toLocaleString()}
                          </div>
                          {log.toState && (
                            <Badge variant="info" size="sm" className="mt-2">
                              → {getActionMeta(log.toState).label}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon="📅"
                    title="No supply activity yet"
                    description="Supply-related activity logs will appear here as actions are taken"
                  />
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attachments">
          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Uploader caseId={c.id} />
                {c.attachments?.length ? (
                  <div className="space-y-2">
                    {c.attachments.map((attachment: { id: string; type: string; url: string; uploadedBy: string | null; createdAt?: Date | null }) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">📎</div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {getAttachmentDisplayName(attachment)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {attachment.createdAt
                                ? new Date(attachment.createdAt).toLocaleDateString()
                                : ''}
                            </div>
                          </div>
                        </div>
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                        >
                          Open
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon="📎"
                    title="No attachments"
                    description="Upload delivery receipts, inspection reports, and other Supply-related documents."
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


