"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Uploader } from '@/app/(dashboard)/procurement/[id]/Uploader';
import { getActionMeta } from '@/lib/activityLabels';
import { getAttachmentDisplayName } from '@/lib/attachments';
import { ProgressStages } from '@/components/app/ProgressStages';
import type { ProcurementCase, ActivityLog, Attachment, ORS, Acceptance } from '@/generated/prisma';
import { EditDeleteTab } from './EditDeleteTab';
import type { Role } from '@/lib/permissions';

type CaseStateVariant = 'completed' | 'cancelled' | 'pending' | 'info' | 'warning';

function getStateVariantLocal(state: string): CaseStateVariant {
  if (state === 'CLOSED') return 'completed';
  if (['DRAFT', 'POSTING'].includes(state)) return 'pending';
  if (['ORS', 'DV', 'CHECK'].includes(state)) return 'warning';
  return 'info';
}

type BudgetCaseData = ProcurementCase & {
  ors?: ORS | null;
  acceptance?: Acceptance | null;
  attachments?: Attachment[];
  activityLogs?: ActivityLog[];
  dv?: { id: string } | null;
};

export function BudgetDetailTabs({ caseData, caseId, userRole }: { caseData: BudgetCaseData; caseId: string; userRole: Role }) {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="edit-delete">Edit & Delete</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
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
              { label: 'Acceptance', completed: !!caseData.acceptance },
              { label: 'ORS', completed: !!caseData.ors },
            ]}
          />
        </div>

        {/* Related Procurement Information */}
        {caseData.acceptance && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Acceptance Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Accepted At</div>
                <div className="text-base text-gray-900 dark:text-gray-100">
                  {caseData.acceptance.acceptedAt 
                    ? new Date(caseData.acceptance.acceptedAt).toLocaleString() 
                    : '—'}
                </div>
              </div>
              {caseData.acceptance.officer && (
                <div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Accepted By</div>
                  <div className="text-base text-gray-900 dark:text-gray-100">
                    {caseData.acceptance.officer}
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
            <CardTitle>Budget Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              // Filter activity logs to show only budget-related activities
              const budgetLogs = caseData.activityLogs?.filter((log: ActivityLog) => {
                const meta = getActionMeta(log.action);
                return meta.category === 'budget' || log.action === 'ors_recorded' || log.toState === 'ORS';
              }) || [];
              
              return budgetLogs.length > 0 ? (
                <div className="space-y-4">
                  {budgetLogs.map((log: ActivityLog, index: number) => (
                    <div key={log.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-600 dark:bg-blue-500"></div>
                        {index < budgetLogs.length - 1 && (
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
                  title="No budget activity yet"
                  description="Budget-related activity logs will appear here as actions are taken"
                />
              );
            })()}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Edit & Delete Tab */}
      <TabsContent value="edit-delete">
        <EditDeleteTab caseData={caseData} userRole={userRole} />
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
                  description="Upload documents and files related to this budget case"
                />
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

