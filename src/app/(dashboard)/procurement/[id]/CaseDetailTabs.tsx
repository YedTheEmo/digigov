"use client";

import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { Uploader } from './Uploader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getActionMeta } from '@/lib/activityLabels';
import { getAttachmentDisplayName } from '@/lib/attachments';
import { ProgressStages } from '@/components/app/ProgressStages';
import type { ProcurementCase, ActivityLog, Bid, Quotation, Attachment } from '@/generated/prisma';

type CaseStateVariant = 'completed' | 'cancelled' | 'pending' | 'info' | 'warning';

function getStateVariant(state: string): CaseStateVariant {
  if (state === 'CLOSED') return 'completed';
  if (['DRAFT', 'POSTING'].includes(state)) return 'pending';
  if (['ORS', 'DV', 'CHECK'].includes(state)) return 'warning';
  return 'info';
}

type CaseDetailData = ProcurementCase & {
  activityLogs?: ActivityLog[];
  bids?: Bid[];
  quotations?: Quotation[];
  attachments?: Attachment[];
};

export function CaseDetailTabs({ caseData, caseId }: { caseData: CaseDetailData; caseId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [quoteError, setQuoteError] = useState<string | null>(null);

  async function handleCreateQuotation(formData: FormData) {
    setQuoteError(null);
    const supplierName = String(formData.get('supplierName') || '').trim();
    const amountRaw = String(formData.get('amount') || '').trim();
    const isResponsive = String(formData.get('isResponsive') || 'true') === 'true';

    if (!supplierName || !amountRaw) {
      setQuoteError('Supplier name and amount are required.');
      return;
    }

    const amount = Number(amountRaw);
    if (Number.isNaN(amount) || amount <= 0) {
      setQuoteError('Amount must be a positive number.');
      return;
    }

    try {
      const res = await fetch(`/api/cases/${caseId}/quotations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `${caseId}:${Date.now()}:quotation`,
        },
        body: JSON.stringify({ supplierName, amount, isResponsive }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message =
          typeof data?.error === 'string'
            ? data.error
            : 'Failed to add quotation. Please try again.';
        setQuoteError(message);
        toast.error(message);
        return;
      }

      toast.success('Quotation added successfully.');
      startTransition(() => {
        router.refresh();
      });
    } catch {
      const message = 'Unexpected error while adding quotation.';
      setQuoteError(message);
      toast.error(message);
    }
  }

  const isRFQ = caseData.method === 'SMALL_VALUE_RFQ';
  const isPB = caseData.method === 'PUBLIC_BIDDING';

  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
        <TabsTrigger value="quotations">
          {caseData.method === 'PUBLIC_BIDDING' ? 'Bids' : 'Quotations'}
        </TabsTrigger>
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
                <Badge variant="info">{caseData.method}</Badge>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Current State</div>
                <Badge variant={getStateVariant(caseData.currentState)} dot>
                  {caseData.currentState}
                </Badge>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Created</div>
                <div className="text-base text-gray-900 dark:text-gray-100">
                  {new Date(caseData.createdAt).toLocaleString()}
                </div>
              </div>
              {caseData.postingStartAt && (
                <div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Posting Period</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {new Date(caseData.postingStartAt).toLocaleDateString()} - {' '}
                    {caseData.postingEndAt ? new Date(caseData.postingEndAt).toLocaleDateString() : 'Ongoing'}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <ProgressStages
            stages={
              isPB
                ? [
                  { label: 'Posting', completed: caseData.currentState !== 'DRAFT' },
                  { label: 'Bid Bulletin', completed: (caseData.bidBulletins?.length || 0) > 0 },
                  { label: 'Pre-Bid Conf', completed: !!caseData.preBid },
                  { label: 'Bids Recorded', completed: (caseData.bids?.length || 0) > 0 },
                  { label: 'TWG Evaluation', completed: !!caseData.twgEvaluation },
                  { label: 'Post-Qualification', completed: !!caseData.postQualification },
                  { label: 'BAC Resolution', completed: !!caseData.bacResolution },
                  { label: 'Award', completed: !!caseData.award },
                  { label: 'Contract Signed', completed: !!caseData.contract },
                  { label: 'NTP Issued', completed: !!caseData.ntp },
                ]
                : isRFQ
                  ? [
                    { label: 'RFQ Issued', completed: !!caseData.rfq },
                    { label: 'Quotations Collected', completed: (caseData.quotations?.length || 0) > 0 },
                    { label: 'Abstract Generated', completed: !!caseData.abstract },
                    { label: 'BAC Resolution', completed: !!caseData.bacResolution },
                    { label: 'Award', completed: !!caseData.award },
                    { label: 'Contract Signed', completed: !!caseData.contract },
                    { label: 'NTP Issued', completed: !!caseData.ntp },
                  ]
                  : [
                    { label: 'Posting', completed: caseData.currentState !== 'DRAFT' },
                    { label: 'Award', completed: !!caseData.award },
                    { label: 'Contract Signed', completed: !!caseData.contract },
                    { label: 'NTP Issued', completed: !!caseData.ntp },
                  ]
            }
          />
        </div>
      </TabsContent>

      {/* Timeline Tab */}
      <TabsContent value="timeline">
        <Card>
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {caseData.activityLogs?.length > 0 ? (
              <div className="space-y-4">
                {caseData.activityLogs.map((log: ActivityLog, index: number) => (
                  <div key={log.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-600 dark:bg-blue-500"></div>
                      {index < caseData.activityLogs.length - 1 && (
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
                title="No activity yet"
                description="Activity logs will appear here as actions are taken"
              />
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Quotations/Bids Tab */}
      <TabsContent value="quotations">
        <Card>
          <CardHeader>
            <CardTitle>
              {caseData.method === 'PUBLIC_BIDDING' ? 'Bidders' : 'Quotations'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {caseData.method === 'PUBLIC_BIDDING' ? (
              caseData.bids?.length > 0 ? (
                <Table>
                  <THead>
                    <TR>
                      <TH>Bidder Name</TH>
                      <TH>Amount</TH>
                      <TH>Opened At</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {caseData.bids
                      .sort((a: Bid, b: Bid) => Number(a.amount) - Number(b.amount))
                      .map((bid: Bid, index: number) => (
                        <TR key={bid.id}>
                          <TD>
                            <div className="flex items-center gap-2">
                              {index === 0 && (
                                <Badge variant="success" size="sm">Lowest</Badge>
                              )}
                              {bid.bidderName}
                            </div>
                          </TD>
                          <TD className="font-medium">
                            {Number(bid.amount).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}
                          </TD>
                          <TD>
                            {bid.openedAt ? new Date(bid.openedAt).toLocaleString() : '-'}
                          </TD>
                        </TR>
                      ))}
                  </TBody>
                </Table>
              ) : (
                <EmptyState
                  icon="📊"
                  title="No bids recorded yet"
                  description="Bids will appear here once they are recorded"
                />
              )
            ) : (
              <div className="space-y-6">
                {isRFQ && caseData.abstract && (
                  <div>
                    <Link
                      href={`/procurement/${caseId}/abstract`}
                      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View Abstract of Quotations
                    </Link>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Generated on{' '}
                      {caseData.abstract.createdAt
                        ? new Date(caseData.abstract.createdAt).toLocaleString()
                        : '—'}
                    </p>
                  </div>
                )}

                {caseData.quotations?.length > 0 ? (
                  <Table>
                    <THead>
                      <TR>
                        <TH>Supplier Name</TH>
                        <TH>Amount</TH>
                        <TH>Submitted At</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {caseData.quotations
                        .sort((a: Quotation, b: Quotation) => Number(a.amount) - Number(b.amount))
                        .map((quotation: Quotation, index: number) => (
                          <TR key={quotation.id}>
                            <TD>
                              <div className="flex items-center gap-2">
                                {index === 0 && (
                                  <Badge variant="success" size="sm">Lowest</Badge>
                                )}
                                {quotation.supplierName}
                              </div>
                            </TD>
                            <TD className="font-medium">
                              {Number(quotation.amount).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}
                            </TD>
                            <TD>
                              {new Date(quotation.submittedAt).toLocaleString()}
                            </TD>
                          </TR>
                        ))}
                    </TBody>
                  </Table>
                ) : (
                  <EmptyState
                    icon="📄"
                    title="No quotations yet"
                    description="Quotations will appear here once they are submitted"
                  />
                )}

                {/* New Quotation form for Small Value RFQ */}
                {isRFQ && (
                  <form
                    className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end"
                    action={(formData) => {
                      // use a wrapper because action must be synchronous; we call async handler inside
                      handleCreateQuotation(formData);
                    }}
                  >
                    <Input
                      name="supplierName"
                      label="Supplier Name"
                      placeholder="e.g. ABC Trading"
                      required
                    />
                    <Input
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      label="Amount"
                      placeholder="e.g. 100000"
                      required
                    />
                    <div className="flex flex-col gap-2">
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={isPending}
                        className="w-full"
                      >
                        {isPending ? 'Adding...' : 'Add Quotation'}
                      </Button>
                      {quoteError && (
                        <p className="text-xs text-red-600 dark:text-red-400">{quoteError}</p>
                      )}
                    </div>
                  </form>
                )}
              </div>
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

              {caseData.attachments?.length > 0 ? (
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
                  description="Upload documents and files related to this procurement case"
                />
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs >
  );
}

