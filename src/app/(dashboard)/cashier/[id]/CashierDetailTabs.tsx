"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Uploader } from '@/app/(dashboard)/procurement/[id]/Uploader';
import { getActionMeta } from '@/lib/activityLabels';
import { getAttachmentDisplayName } from '@/lib/attachments';
import { ProgressStages } from '@/components/app/ProgressStages';
import type { ProcurementCase, ActivityLog, Attachment, Check, CheckAdvice, DV } from '@/generated/prisma';

type CaseStateVariant = 'completed' | 'cancelled' | 'pending' | 'info' | 'warning';

function getStateVariantLocal(state: string): CaseStateVariant {
  if (state === 'CLOSED') return 'completed';
  if (['DRAFT', 'POSTING'].includes(state)) return 'pending';
  if (['ORS', 'DV', 'CHECK'].includes(state)) return 'warning';
  return 'info';
}

type CashierCaseData = ProcurementCase & {
  check?: Check | null;
  checkAdvice?: CheckAdvice | null;
  dv?: DV | null;
  attachments?: Attachment[];
  activityLogs?: ActivityLog[];
};

export function CashierDetailTabs({ caseData, caseId }: { caseData: CashierCaseData; caseId: string }) {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
        <TabsTrigger value="check">Check Details</TabsTrigger>
        <TabsTrigger value="checkAdvice">Check Advice Details</TabsTrigger>
        <TabsTrigger value="attachments">Attachments</TabsTrigger>
      </TabsList>

      {/* Overview Tab */}
      <TabsContent value="overview">
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Case Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Title</div>
                <div className="text-base text-gray-900 dark:text-gray-100">{caseData.title}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Method</div>
                <Badge variant="info">
                  {caseData.method === 'SMALL_VALUE_RFQ' ? 'Small Value RFQ' : caseData.method === 'INFRASTRUCTURE' ? 'Infrastructure' : 'Public Bidding'}
                </Badge>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Current State</div>
                <Badge variant={getStateVariantLocal(caseData.currentState)} dot>
                  {caseData.currentState}
                </Badge>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Created</div>
                <div className="text-base text-gray-900 dark:text-gray-100">
                  {new Date(caseData.createdAt).toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>

          <ProgressStages
            stages={[
              { label: 'DV', completed: !!caseData.dv },
              { label: 'Check', completed: !!caseData.check },
              { label: 'Closed', completed: caseData.currentState === 'CLOSED' },
            ]}
          />
        </div>

        {/* Related DV Information */}
        {caseData.dv && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>DV Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">DV Number</div>
                <div className="text-base text-gray-900 dark:text-gray-100">
                  {caseData.dv.dvNumber || '—'}
                </div>
              </div>
              {caseData.dv.preparedAt && (
                <div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Prepared At</div>
                  <div className="text-base text-gray-900 dark:text-gray-100">
                    {new Date(caseData.dv.preparedAt).toLocaleString()}
                  </div>
                </div>
              )}
              {caseData.dv.approvedBy && (
                <div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved By</div>
                  <div className="text-base text-gray-900 dark:text-gray-100">
                    {caseData.dv.approvedBy}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Timeline Tab */}
      <TabsContent value="timeline">
        <Card>
          <CardHeader>
            <CardTitle>Cashier Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              // Filter activity logs to show only cashier-related activities
              const cashierLogs = caseData.activityLogs?.filter((log: ActivityLog) => {
                const meta = getActionMeta(log.action);
                return meta.category === 'cashier' || 
                       log.action === 'check_recorded' || 
                       log.action === 'check_advice_recorded' ||
                       log.toState === 'CHECK' || 
                       log.toState === 'CLOSED';
              }) || [];
              
              return cashierLogs.length > 0 ? (
                <div className="space-y-4">
                  {cashierLogs.map((log: ActivityLog, index: number) => (
                    <div key={log.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-600 dark:bg-blue-500"></div>
                        {index < cashierLogs.length - 1 && (
                          <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 my-1"></div>
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
                  title="No cashier activity yet"
                  description="Cashier-related activity logs will appear here as actions are taken"
                />
              );
            })()}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Check Details Tab */}
      <TabsContent value="check">
        <Card>
          <CardHeader>
            <CardTitle>Check Details</CardTitle>
          </CardHeader>
          <CardContent>
            {caseData.check ? (
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Check Number</div>
                  <div className="text-base text-gray-900 dark:text-gray-100 font-semibold">
                    {caseData.check.checkNumber || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Prepared At</div>
                  <div className="text-base text-gray-900 dark:text-gray-100">
                    {caseData.check.preparedAt 
                      ? new Date(caseData.check.preparedAt).toLocaleString() 
                      : '—'}
                  </div>
                </div>
                {caseData.check.approvedAt && (
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved At</div>
                    <div className="text-base text-gray-900 dark:text-gray-100">
                      {new Date(caseData.check.approvedAt).toLocaleString()}
                    </div>
                  </div>
                )}
                {caseData.check.approvedBy && (
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved By</div>
                    <div className="text-base text-gray-900 dark:text-gray-100">
                      {caseData.check.approvedBy}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                icon="💳"
                title="No check recorded yet"
                description="Check will appear here once it has been prepared for this case"
              />
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Check Advice Details Tab */}
      <TabsContent value="checkAdvice">
        <Card>
          <CardHeader>
            <CardTitle>Check Advice Details</CardTitle>
          </CardHeader>
          <CardContent>
            {caseData.checkAdvice ? (
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Check Advice Number</div>
                  <div className="text-base text-gray-900 dark:text-gray-100 font-semibold">
                    {caseData.checkAdvice.adviceNumber || '—'}
                  </div>
                </div>
                {caseData.checkAdvice.approvedAt && (
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved At</div>
                    <div className="text-base text-gray-900 dark:text-gray-100">
                      {new Date(caseData.checkAdvice.approvedAt).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                icon="📋"
                title="No check advice recorded yet"
                description="Check advice will appear here once it has been issued for this case"
              />
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Attachments Tab */}
      <TabsContent value="attachments">
        <Card>
          <CardHeader>
            <CardTitle>Attachments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Uploader caseId={caseId} />
              
              {caseData.attachments && caseData.attachments.length > 0 ? (
                <div className="space-y-2">
                  {caseData.attachments.map((attachment: Attachment) => (
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
                            {attachment.createdAt ? new Date(attachment.createdAt).toLocaleDateString() : ''}
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
                  description="Upload documents and files related to this cashier case"
                />
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

