import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { auth } from '@/lib/nextauth';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { transitionCaseState } from '@/lib/workflows/procurement';
import Link from 'next/link';
import { CaseDetailTabs } from './CaseDetailTabs';
import { QuickActions } from './QuickActions';
import { getCurrentOwner, getNextStepMessage, type LifecycleStageId } from '@/lib/casesLifecycle';
import { CaseHeader } from '@/components/app/CaseHeader';
import type { Prisma } from '@/generated/prisma';

async function buildCookieHeader() {
  const store = await cookies();
  const all = store.getAll();
  if (!all.length) return '';
  return all.map((c) => `${c.name}=${encodeURIComponent(c.value)}`).join('; ');
}

function normalizeDateTimeLocal(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  // If the value looks like an HTML datetime-local (no seconds / timezone), convert to ISO.
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    const d = new Date(trimmed);
    if (!Number.isNaN(d.getTime())) {
      return d.toISOString();
    }
  }
  return trimmed;
}

export default async function CaseDetail(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await props.params;
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.BASE_URL ||
    'http://localhost:3000';
  const session = await auth();
  const userEmail = session?.user?.email;
  const user = userEmail ? await prisma.user.findUnique({ where: { email: userEmail } }) : null;
  const role = (user?.role ?? 'PROCUREMENT_MANAGER') as string;
  const include: Prisma.ProcurementCaseInclude = {
    rfq: true, quotations: true, abstract: true, bacResolution: true, award: true,
    purchaseOrder: true, contract: true, ntp: true, deliveries: true, inspection: true, acceptance: true,
    ors: true, dv: true, check: true, checkAdvice: true,
    bidBulletins: true, preBid: true, bids: true, twgEvaluation: true, postQualification: true,
    progressBilling: true, pmtInspection: true,
    attachments: true,
    activityLogs: { orderBy: { createdAt: 'asc' } },
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
        <p className="text-gray-600 dark:text-gray-400 mb-6">The procurement case you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/procurement">
          <Button variant="primary">Back to Procurement</Button>
        </Link>
      </div>
    );
  }
  
  const can = (allowed: string[]) => allowed.includes(role);
  const caseData = JSON.parse(JSON.stringify(c));
  const nextStepMessage = getNextStepMessage(c.currentState as LifecycleStageId);
  const owner = getCurrentOwner(c.currentState as LifecycleStageId);

  async function startPosting(formData: FormData) {
    'use server';
    try {
      const postingStartAtRaw = normalizeDateTimeLocal(
        String(formData.get('postingStartAt') || ''),
      );
      const postingEndAtRaw = normalizeDateTimeLocal(
        String(formData.get('postingEndAt') || ''),
      );

      const postingStartAt = postingStartAtRaw
        ? new Date(postingStartAtRaw)
        : new Date();
      const postingEndAt = postingEndAtRaw
        ? new Date(postingEndAtRaw)
        : new Date(postingStartAt.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Enforce minimum 7-day posting window for consistency with API
      const minMs = 7 * 24 * 60 * 60 * 1000;
      if (postingEndAt.getTime() - postingStartAt.getTime() < minMs) {
        return {
          success: false,
          error: 'Posting period must be at least 7 days.',
        };
      }

      await transitionCaseState(id, 'POSTING', {
        updateData: { postingStartAt, postingEndAt },
        action: 'posting',
      });

      revalidatePath(`/(dashboard)/procurement/${id}`);
      return { success: true };
    } catch (error) {
      console.error('Failed to start posting:', error);
      return {
        success: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error: (error as any)?.message ?? 'Failed to start posting',
      };
    }
  }

  async function issueRFQ(formData: FormData) {
    'use server';
    try {
      const cookieHeader = await buildCookieHeader();
      const issuedAt = normalizeDateTimeLocal(String(formData.get('issuedAt') || ''));
      const res = await fetch(`${base}/api/cases/${id}/rfq`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
        body: JSON.stringify({ issuedAt }),
      });
      if (!res.ok) {
        const message = await res.text().catch(() => res.statusText);
        return { success: false, error: message || 'Failed to issue RFQ' };
      }
      revalidatePath(`/(dashboard)/procurement/${id}`);
      return { success: true };
    } catch (error) {
      console.error('Failed to issue RFQ:', error);
      return {
        success: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error: (error as any)?.message ?? 'Failed to issue RFQ',
      };
    }
  }

  async function submitAward(formData: FormData) {
    'use server';
    try {
      const cookieHeader = await buildCookieHeader();
      const awardedTo = String(formData.get('awardedTo') || '');
      const noticeDate = normalizeDateTimeLocal(String(formData.get('noticeDate') || ''));
      const res = await fetch(`${base}/api/cases/${id}/award`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
        body: JSON.stringify({ awardedTo, noticeDate }),
      });
      if (!res.ok) {
        const message = await res.text().catch(() => res.statusText);
        return { success: false, error: message || 'Failed to submit award' };
      }
      revalidatePath(`/(dashboard)/procurement/${id}`);
      return { success: true };
    } catch (error) {
      console.error('Failed to submit award:', error);
      return {
        success: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error: (error as any)?.message ?? 'Failed to submit award',
      };
    }
  }

  async function approvePO(formData: FormData) {
    'use server';
    try {
      const cookieHeader = await buildCookieHeader();
      const poNo = String(formData.get('poNo') || '');
      const res = await fetch(`${base}/api/cases/${id}/po`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
        body: JSON.stringify({ poNo }),
      });
      if (!res.ok) {
        const message = await res.text().catch(() => res.statusText);
        return { success: false, error: message || 'Failed to approve PO' };
      }
      revalidatePath(`/(dashboard)/procurement/${id}`);
      return { success: true };
    } catch (error) {
      console.error('Failed to approve PO:', error);
      return {
        success: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error: (error as any)?.message ?? 'Failed to approve PO',
      };
    }
  }

  async function signContract(formData: FormData) {
    'use server';
    try {
      const cookieHeader = await buildCookieHeader();
      const contractNo = String(formData.get('contractNo') || '');
      const signedAt = normalizeDateTimeLocal(String(formData.get('signedAt') || ''));
      const response = await fetch(`${base}/api/cases/${id}/contract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
        body: JSON.stringify({ contractNo, signedAt }),
      });
      if (!response.ok) {
        const message = await response.text().catch(() => response.statusText);
        return {
          success: false,
          error: `Contract API failed (${response.status}): ${message}`,
        };
      }
      revalidatePath(`/(dashboard)/procurement/${id}`);
      return { success: true };
    } catch (error) {
      console.error('Failed to sign contract:', error);
      return {
        success: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error: (error as any)?.message ?? 'Failed to sign contract',
      };
    }
  }

  async function issueNTP(formData: FormData) {
    'use server';
    try {
      const cookieHeader = await buildCookieHeader();
      const issuedAt = normalizeDateTimeLocal(String(formData.get('issuedAt') || ''));
      const daysToComplyRaw = formData.get('daysToComply');
      const daysToComply = daysToComplyRaw ? Number(daysToComplyRaw) : undefined;
      const res = await fetch(`${base}/api/cases/${id}/ntp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
        body: JSON.stringify({ issuedAt, daysToComply }),
      });
      if (!res.ok) {
        const message = await res.text().catch(() => res.statusText);
        return { success: false, error: message || 'Failed to issue NTP' };
      }
      revalidatePath(`/(dashboard)/procurement/${id}`);
      return { success: true };
    } catch (error) {
      console.error('Failed to issue NTP:', error);
      return {
        success: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error: (error as any)?.message ?? 'Failed to issue NTP',
      };
    }
  }

  async function recordBidBulletin(formData: FormData) {
    'use server';
    try {
      const cookieHeader = await buildCookieHeader();
      const number = String(formData.get('number') || '') || undefined;
      const publishedAt = normalizeDateTimeLocal(String(formData.get('publishedAt') || ''));
      const notes = String(formData.get('notes') || '') || undefined;
      const res = await fetch(`${base}/api/cases/${id}/bid-bulletins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
        body: JSON.stringify({ number, publishedAt, notes }),
      });
      if (!res.ok) {
        const message = await res.text().catch(() => res.statusText);
        console.error('Failed to record bid bulletin:', message);
        return;
      }
      revalidatePath(`/(dashboard)/procurement/${id}`);
    } catch (error) {
      console.error('Failed to record bid bulletin:', error);
    }
  }

  async function recordPreBid(formData: FormData) {
    'use server';
    try {
      const cookieHeader = await buildCookieHeader();
      const scheduledAt = normalizeDateTimeLocal(String(formData.get('scheduledAt') || ''));
      const minutesUrl = String(formData.get('minutesUrl') || '') || undefined;
      const notes = String(formData.get('notes') || '') || undefined;
      const res = await fetch(`${base}/api/cases/${id}/pre-bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
        body: JSON.stringify({ scheduledAt, minutesUrl, notes }),
      });
      if (!res.ok) {
        const message = await res.text().catch(() => res.statusText);
        console.error('Failed to record pre-bid conference:', message);
        return;
      }
      revalidatePath(`/(dashboard)/procurement/${id}`);
    } catch (error) {
      console.error('Failed to record pre-bid conference:', error);
    }
  }

  async function recordBid(formData: FormData) {
    'use server';
    try {
      const cookieHeader = await buildCookieHeader();
      const bidderName = String(formData.get('bidderName') || '');
      const amountRaw = formData.get('amount');
      const amount = amountRaw ? Number(amountRaw) : undefined;
      const openedAt = normalizeDateTimeLocal(String(formData.get('openedAt') || ''));

      const apiUrl = `${base}/api/cases/${id}/bids`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
        body: JSON.stringify({ bidderName, amount, openedAt }),
      });

      if (!response.ok) {
        const message = await response.text().catch(() => response.statusText);
        console.error('[recordBid] API failed:', response.status, message);
        return;
      }

      revalidatePath(`/(dashboard)/procurement/${id}`);
    } catch (error) {
      console.error('[recordBid] Failed to record bid:', error);
    }
  }

  async function recordTWG(formData: FormData) {
    'use server';
    try {
      const cookieHeader = await buildCookieHeader();
      const result = String(formData.get('result') || '');
      const notes = String(formData.get('notes') || '') || undefined;
      const res = await fetch(`${base}/api/cases/${id}/twg`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
        body: JSON.stringify({ result, notes }),
      });
      if (!res.ok) {
        const message = await res.text().catch(() => res.statusText);
        console.error('Failed to record TWG evaluation:', message);
        return;
      }
      revalidatePath(`/(dashboard)/procurement/${id}`);
    } catch (error) {
      console.error('Failed to record TWG evaluation:', error);
    }
  }

  async function recordPostQualification(formData: FormData) {
    'use server';
    try {
      const cookieHeader = await buildCookieHeader();
      const lowestResponsiveBidder = String(formData.get('lowestResponsiveBidder') || '') || undefined;
      const passedRaw = formData.get('passed');
      const passed = passedRaw != null ? String(passedRaw) === 'true' : undefined;
      const notes = String(formData.get('notes') || '') || undefined;
      const completedAt = normalizeDateTimeLocal(String(formData.get('completedAt') || ''));
      const response = await fetch(`${base}/api/cases/${id}/post-qualification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
        body: JSON.stringify({ lowestResponsiveBidder, passed, notes, completedAt }),
      });
      if (!response.ok) {
        const message = await response.text().catch(() => response.statusText);
        console.error('Post-qualification API failed:', response.status, message);
        return;
      }
      revalidatePath(`/(dashboard)/procurement/${id}`);
    } catch (error) {
      console.error('Failed to record post-qualification:', error);
    }
  }

  async function recordBACResolution(formData: FormData): Promise<{ success: boolean; error?: string }> {
    'use server';
    try {
      const cookieHeader = await buildCookieHeader();
      const notes = String(formData.get('notes') || '') || undefined;
      const res = await fetch(`${base}/api/cases/${id}/bac-resolution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) {
        const message = await res.text().catch(() => res.statusText);
        console.error('Failed to record BAC Resolution:', message);
        return { success: false, error: message };
      }
      revalidatePath(`/(dashboard)/procurement/${id}`);
      return { success: true };
    } catch (error) {
      console.error('Failed to record BAC Resolution:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async function recordBACResolutionFormAction(formData: FormData) {
    'use server';
    await recordBACResolution(formData);
  }

  async function recordProgressBilling(formData: FormData) {
    'use server';
    try {
      const cookieHeader = await buildCookieHeader();
      const billingNo = String(formData.get('billingNo') || '') || undefined;
      const amountRaw = formData.get('amount');
      const amount = amountRaw ? Number(amountRaw) : undefined;
      const billedAt = normalizeDateTimeLocal(String(formData.get('billedAt') || ''));
      const notes = String(formData.get('notes') || '') || undefined;
      const res = await fetch(`${base}/api/cases/${id}/progress-billing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
        body: JSON.stringify({ billingNo, amount, billedAt, notes }),
      });
      if (!res.ok) {
        const message = await res.text().catch(() => res.statusText);
        console.error('Failed to record progress billing:', message);
        return;
      }
      revalidatePath(`/(dashboard)/procurement/${id}`);
    } catch (error) {
      console.error('Failed to record progress billing:', error);
    }
  }

  async function recordPMTInspection(formData: FormData) {
    'use server';
    try {
      const cookieHeader = await buildCookieHeader();
      const status = String(formData.get('status') || '') || undefined;
      const inspector = String(formData.get('inspector') || '') || undefined;
      const inspectedAt = normalizeDateTimeLocal(String(formData.get('inspectedAt') || ''));
      const notes = String(formData.get('notes') || '') || undefined;
      const res = await fetch(`${base}/api/cases/${id}/pmt-inspection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
        body: JSON.stringify({ status, inspector, inspectedAt, notes }),
      });
      if (!res.ok) {
        const message = await res.text().catch(() => res.statusText);
        console.error('Failed to record PMT inspection:', message);
        return;
      }
      revalidatePath(`/(dashboard)/procurement/${id}`);
    } catch (error) {
      console.error('Failed to record PMT inspection:', error);
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
        backHref="/procurement"
      />


      {/* Case Actions Card (unified) */}
      <Card>
        <CardHeader>
          <CardTitle>Case Actions</CardTitle>
          {nextStepMessage && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {nextStepMessage}{' '}
              {['NTP_ISSUED', 'DELIVERY', 'INSPECTION'].includes(c.currentState as string) && (
                <Link
                  href="/supply"
                  className="font-medium text-green-700 dark:text-green-400 hover:underline"
                >
                  Open Supply module
                </Link>
              )}
              {c.currentState === 'ACCEPTANCE' && (
                <>
                  {' '}
                  <Link
                    href="/budget"
                    className="font-medium text-green-700 dark:text-green-400 hover:underline"
                  >
                    Open Budget module
                  </Link>
                </>
              )}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current step / primary actions (RFQ, Award, PO, Contract, NTP, etc.) */}
          <QuickActions
            caseData={caseData}
            role={role}
            startPosting={startPosting}
            issueRFQ={issueRFQ}
            submitAward={submitAward}
            approvePO={approvePO}
            signContract={signContract}
            issueNTP={issueNTP}
            recordBACResolution={recordBACResolution}
          />

          {/* Competitive bidding & infra-specific steps, when applicable */}
          {(c.method === 'PUBLIC_BIDDING' || c.method === 'INFRASTRUCTURE') && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Competitive Bidding Steps
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Use these actions to record bid bulletins, conferences, bids, TWG evaluation, and
                  BAC decisions for this case.
                </p>
              </div>

              <div className="space-y-3">
                {/* TWG guidance when evaluation is not yet available */}
                {can(['TWG_MEMBER']) &&
                  !['BID_SUBMISSION_OPENING', 'TWG_EVALUATION', 'POST_QUALIFICATION', 'BAC_RESOLUTION'].includes(
                    c.currentState as string,
                  ) && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      TWG evaluation will be available once bids have been recorded and opened by the BAC.
                    </p>
                  )}

                {/* Bid Bulletin */}
                {c.currentState === 'POSTING' && can(['BAC_SECRETARIAT', 'ADMIN']) && (
                  <form action={recordBidBulletin} className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 mr-2">
                      Bid Bulletin
                    </span>
                    <Input
                      name="number"
                      label="Bulletin No."
                      placeholder="e.g. 1"
                      className="w-32"
                      fullWidth={false}
                    />
                    <Input
                      name="publishedAt"
                      label="Published At"
                      type="datetime-local"
                      className="w-56"
                      fullWidth={false}
                    />
                    <Input
                      name="notes"
                      label="Notes"
                      placeholder="Optional notes"
                      className="min-w-[200px]"
                    />
                    <Button type="submit" variant="secondary" size="sm">
                      Record Bid Bulletin
                    </Button>
                  </form>
                )}

                {/* Pre-Bid Conference */}
                {['POSTING', 'BID_BULLETIN'].includes(c.currentState as string) &&
                  can(['BAC_SECRETARIAT', 'ADMIN']) && (
                    <form action={recordPreBid} className="flex flex-wrap items-center gap-2">
                      <Input name="scheduledAt" type="datetime-local" className="w-56" />
                      <Input
                        name="minutesUrl"
                        placeholder="Minutes URL (optional)"
                        className="min-w-[200px]"
                      />
                      <Input name="notes" placeholder="Notes" className="min-w-[200px]" />
                      <Button type="submit" variant="secondary" size="sm">
                        Record Pre-Bid Conf
                      </Button>
                    </form>
                  )}

                {/* Record Bid */}
                {['POSTING', 'BID_BULLETIN', 'PRE_BID_CONF'].includes(c.currentState as string) &&
                  can(['BAC_SECRETARIAT', 'ADMIN']) && (
                    <form action={recordBid} className="flex flex-wrap items-center gap-2">
                      <Input name="bidderName" placeholder="Bidder Name" className="min-w-[200px]" />
                      <Input
                        name="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Amount"
                        className="w-40"
                      />
                      <Input name="openedAt" type="datetime-local" className="w-56" />
                      <Button type="submit" variant="secondary" size="sm">
                        Record Bid
                      </Button>
                    </form>
                  )}

                {/* TWG Evaluation */}
                {c.currentState === 'BID_SUBMISSION_OPENING' && can(['TWG_MEMBER', 'ADMIN']) && (
                  <form action={recordTWG} className="flex flex-wrap items-center gap-2">
                    <Select name="result" className="w-40">
                      <option value="Responsive">Responsive</option>
                      <option value="Non-Responsive">Non-Responsive</option>
                    </Select>
                    <Input name="notes" placeholder="Notes" className="min-w-[200px]" />
                    <Button type="submit" variant="secondary" size="sm">
                      Record TWG Evaluation
                    </Button>
                  </form>
                )}

                {/* Post-Qualification */}
                {c.currentState === 'TWG_EVALUATION' && can(['BAC_SECRETARIAT', 'ADMIN']) && (
                  <form action={recordPostQualification} className="flex flex-wrap items-center gap-2">
                    <Input
                      name="lowestResponsiveBidder"
                      placeholder="Lowest Responsive Bidder"
                      className="min-w-[200px]"
                    />
                    <Select name="passed" className="w-32">
                      <option value="true">Passed</option>
                      <option value="false">Failed</option>
                    </Select>
                    <Input name="completedAt" type="datetime-local" className="w-56" />
                    <Input name="notes" placeholder="Notes" className="min-w-[200px]" />
                    <Button type="submit" variant="secondary" size="sm">
                      Record Post-Qualification
                    </Button>
                  </form>
                )}

                {/* BAC Resolution */}
                {c.currentState === 'POST_QUALIFICATION' && can(['BAC_SECRETARIAT', 'ADMIN']) && (
                  <form action={recordBACResolutionFormAction} className="flex flex-wrap items-center gap-2">
                    <Input name="notes" placeholder="Resolution Notes" className="min-w-[200px]" />
                    <Button type="submit" variant="secondary" size="sm">
                      Record BAC Resolution
                    </Button>
                  </form>
                )}
              </div>

              {/* Infrastructure-only post-award steps */}
              {c.method === 'INFRASTRUCTURE' && (
                <div className="space-y-3">
                  {/* Progress Billing */}
                  {c.currentState === 'NTP_ISSUED' && can(['PROCUREMENT_MANAGER', 'ADMIN']) && (
                    <form action={recordProgressBilling} className="flex flex-wrap items-center gap-2">
                      <Input name="billingNo" placeholder="Billing No." className="w-40" />
                      <Input
                        name="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Amount"
                        className="w-40"
                      />
                      <Input name="billedAt" type="datetime-local" className="w-56" />
                      <Input name="notes" placeholder="Notes" className="min-w-[200px]" />
                      <Button type="submit" variant="secondary" size="sm">
                        Record Progress Billing
                      </Button>
                    </form>
                  )}

                  {/* PMT Inspection */}
                  {c.currentState === 'PROGRESS_BILLING' && can(['PROCUREMENT_MANAGER', 'ADMIN']) && (
                    <form action={recordPMTInspection} className="flex flex-wrap items-center gap-2">
                      <Select name="status" className="w-32">
                        <option value="PASSED">Passed</option>
                        <option value="FAILED">Failed</option>
                      </Select>
                      <Input name="inspector" placeholder="Inspector" className="w-40" />
                      <Input name="inspectedAt" type="datetime-local" className="w-56" />
                      <Input name="notes" placeholder="Notes" className="min-w-[200px]" />
                      <Button type="submit" variant="secondary" size="sm">
                        Record PMT Inspection
                      </Button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Completed high-level procurement steps summary */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Completed Procurement Steps
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              This summary helps you see what has already been recorded in Procurement for this case.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              {c.postingStartAt && (
                <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-800 dark:text-gray-100">
                  Posting started ({new Date(c.postingStartAt).toLocaleDateString()})
                </span>
              )}
              {(c.bidBulletins?.length || 0) > 0 && (
                <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-800 dark:text-gray-100">
                  {c.bidBulletins.length} Bid Bulletin{c.bidBulletins.length === 1 ? '' : 's'}
                </span>
              )}
              {c.preBid && (
                <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-800 dark:text-gray-100">
                  Pre-Bid Conf set
                </span>
              )}
              {(c.bids?.length || 0) > 0 && (
                <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-800 dark:text-gray-100">
                  {c.bids.length} Bid{c.bids.length === 1 ? '' : 's'} recorded
                </span>
              )}
              {c.twgEvaluation && (
                <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-800 dark:text-gray-100">
                  TWG Evaluation
                </span>
              )}
              {c.postQualification && (
                <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-800 dark:text-gray-100">
                  Post-Qualification
                </span>
              )}
              {c.bacResolution && (
                <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-800 dark:text-gray-100">
                  BAC Resolution
                </span>
              )}
              {c.award && (
                <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-800 dark:text-gray-100">
                  Awarded
                </span>
              )}
              {c.purchaseOrder && (
                <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-800 dark:text-gray-100">
                  PO Approved
                </span>
              )}
              {c.contract && (
                <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-800 dark:text-gray-100">
                  Contract Signed
                </span>
              )}
              {c.ntp && (
                <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-800 dark:text-gray-100">
                  NTP Issued
                </span>
              )}
              {c.progressBilling && (
                <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-800 dark:text-gray-100">
                  Progress Billing
                </span>
              )}
              {c.pmtInspection && (
                <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-800 dark:text-gray-100">
                  PMT Inspection
                </span>
              )}
              {c.method === 'SMALL_VALUE_RFQ' && c.abstract && (
                <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-800 dark:text-gray-100">
                  Abstract of Quotations
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Component - Client Side */}
      <CaseDetailTabs caseData={caseData} caseId={id} />
    </div>
  );
}
