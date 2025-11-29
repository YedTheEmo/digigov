import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { logActivity } from '@/lib/activity';
import type { ProcurementMethod, Prisma, CaseState } from '@/generated/prisma';

export const metadata: Metadata = {
  title: 'Procurement',
};

async function createCase(formData: FormData): Promise<{ success: boolean; id?: string; error?: string }> {
  'use server';
  try {
    const title = String(formData.get('title') || 'Untitled');
    const method = String(formData.get('method') || 'SMALL_VALUE_RFQ');
    const created = await prisma.procurementCase.create({
      data: { title, method: method as ProcurementMethod, regime: 'RA9184' },
    });
    await logActivity({ caseId: created.id, action: 'create_case', toState: 'DRAFT' });
    revalidatePath('/procurement');
    return { success: true, id: created.id };
  } catch (error) {
    console.error('Failed to create case:', error);
    return {
      success: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error: (error as any)?.message ?? 'Failed to create case',
    };
  }
}

async function createCaseFormAction(formData: FormData): Promise<void> {
  'use server';
  await createCase(formData);
  return;
}

function getStateVariant(
  state: string,
): 'completed' | 'cancelled' | 'pending' | 'info' | 'warning' {
  if (state === 'CLOSED') return 'completed';
  if (['DRAFT', 'POSTING'].includes(state)) return 'pending';
  if (['ORS', 'DV', 'CHECK'].includes(state)) return 'warning';
  return 'info';
}

const PRE_PROCUREMENT_STATES = [
  'DRAFT',
  'POSTING',
  'RFQ_ISSUED',
  'QUOTATION_COLLECTION',
  'ABSTRACT_OF_QUOTATIONS',
  'BID_BULLETIN',
  'PRE_BID_CONF',
  'BID_SUBMISSION_OPENING',
  'TWG_EVALUATION',
  'POST_QUALIFICATION',
  'BAC_RESOLUTION',
  'AWARDED',
  'PO_APPROVED',
  'CONTRACT_SIGNED',
  'NTP_ISSUED',
  'PROGRESS_BILLING',
  'PMT_INSPECTION',
] as const;

const POST_PROCUREMENT_STATES = [
  'DELIVERY',
  'INSPECTION',
  'ACCEPTANCE',
  'ORS',
  'DV',
  'CHECK',
  'CLOSED',
] as const;

export default async function ProcurementPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string; method?: string; state?: string; sort?: string; filter?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const { search, method, state, sort, filter } = params;

  // Build Prisma query with filters
  const where: Prisma.ProcurementCaseWhereInput = {};

  const filterMode = filter || 'pre-procurement'; // pre-procurement or post-procurement

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
    ];
  }
  
  if (method && method !== 'ALL') {
    where.method = method as ProcurementMethod;
  }

  if (state && state !== 'ALL') {
    where.currentState = state as CaseState;
  } else if (filterMode === 'pre-procurement') {
    // Cases in Procurement stages (DRAFT through NTP_ISSUED)
    where.currentState = { in: [...PRE_PROCUREMENT_STATES] as CaseState[] };
  } else if (filterMode === 'post-procurement') {
    // Cases that have gone through Procurement (DELIVERY and beyond)
    where.currentState = { in: [...POST_PROCUREMENT_STATES] as CaseState[] };
  }

  // Build orderBy
  let orderBy: Prisma.ProcurementCaseOrderByWithRelationInput = { createdAt: 'desc' }; // default
  if (sort === 'oldest') {
    orderBy = { createdAt: 'asc' };
  } else if (sort === 'title-asc') {
    orderBy = { title: 'asc' };
  } else if (sort === 'title-desc') {
    orderBy = { title: 'desc' };
  }

  const cases = await prisma.procurementCase.findMany({ where, orderBy });

  return (
    <div className="w-full space-y-8 animate-fade-in">
      {/* Page Header */}
      <section className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
          Procurement Workspace
        </p>
        <h1 className="text-3xl font-bold leading-tight text-[var(--color-text-primary)]">
          Manage procurement cases end-to-end
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] max-w-3xl">
          Create and manage procurement cases across the full workflow, from initial posting through to contract signing and notice to proceed.
        </p>
      </section>

      {/* Create New Case Card */}
      <Card className="border-[var(--color-border-primary)] shadow-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-[var(--color-text-primary)]">Create New Case</CardTitle>
          <CardDescription>Start a new procurement process</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createCaseFormAction} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] gap-8 items-end max-w-5xl">
            <Input 
              name="title" 
              label="Case Title"
              required
              className="input-animated"
            />
            <Select 
              name="method" 
              label="Procurement Method" 
              defaultValue="SMALL_VALUE_RFQ"
              className="input-animated"
            >
              <option value="SMALL_VALUE_RFQ">Small Value (RFQ)</option>
              <option value="PUBLIC_BIDDING">Public Bidding</option>
              <option value="INFRASTRUCTURE">Infrastructure</option>
            </Select>
            <Button 
              type="submit" 
              variant="primary"
              size="md"
              className="w-full lg:w-auto whitespace-nowrap btn-animated hover-lift"
              leftIcon={
                <svg className="w-5 h-5 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Create Case
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Cases List */}
      <Card className="border-[var(--color-border-primary)] shadow-none">
        <CardHeader className="space-y-1">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-[var(--color-text-primary)]">All Cases</CardTitle>
              <CardDescription className="mt-2">
                {cases.length} {search || method !== 'ALL' || state !== 'ALL' ? 'matching' : 'total'} case{cases.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
              <form action="" method="GET" className="flex items-center gap-3 flex-wrap md:flex-nowrap">
                <div className="relative w-full md:w-64">
                  <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none z-10 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    name="search"
                    defaultValue={search}
                    placeholder="Search cases..."
                    className="w-full border border-[var(--color-border-primary)] rounded-lg pl-10 pr-3 py-2 text-sm bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)]/20 focus:border-[var(--color-border-focus)] hover:border-[var(--color-border-secondary)]"
                  />
                </div>
                
                <select
                  name="method"
                  defaultValue={method || 'ALL'}
                  className="border border-[var(--color-border-primary)] rounded-lg px-3 py-2 text-sm bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)]/20 focus:border-[var(--color-border-focus)] hover:border-[var(--color-border-secondary)]"
                >
                  <option value="ALL">All Methods</option>
                  <option value="SMALL_VALUE_RFQ">Small Value</option>
                  <option value="PUBLIC_BIDDING">Public Bidding</option>
                  <option value="INFRASTRUCTURE">Infrastructure</option>
                </select>

                <select
                  name="state"
                  defaultValue={state || 'ALL'}
                  className="border border-[var(--color-border-primary)] rounded-lg px-3 py-2 text-sm bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)]/20 focus:border-[var(--color-border-focus)] hover:border-[var(--color-border-secondary)]"
                >
                  <option value="ALL">All States</option>
                  <option value="DRAFT">Draft</option>
                  <option value="POSTING">Posting</option>
                  <option value="RFQ_ISSUED">RFQ Issued</option>
                  <option value="QUOTATION_COLLECTION">Quotation Collection</option>
                  <option value="ABSTRACT_OF_QUOTATIONS">Abstract of Quotations</option>
                  <option value="BAC_RESOLUTION">BAC Resolution</option>
                  <option value="AWARDED">Awarded</option>
                  <option value="PO_APPROVED">PO Approved</option>
                  <option value="CONTRACT_SIGNED">Contract Signed</option>
                  <option value="NTP_ISSUED">NTP Issued</option>
                  <option value="DELIVERY">Delivery</option>
                  <option value="INSPECTION">Inspection</option>
                  <option value="ACCEPTANCE">Acceptance</option>
                  <option value="ORS">ORS</option>
                  <option value="DV">DV</option>
                  <option value="CHECK">Check</option>
                  <option value="CLOSED">Closed</option>
                </select>

                <select
                  name="sort"
                  defaultValue={sort || 'newest'}
                  className="border border-[var(--color-border-primary)] rounded-lg px-3 py-2 text-sm bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)]/20 focus:border-[var(--color-border-focus)] hover:border-[var(--color-border-secondary)]"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title-asc">Title A-Z</option>
                  <option value="title-desc">Title Z-A</option>
                </select>

                <select
                  name="filter"
                  defaultValue={filterMode}
                  className="border border-[var(--color-border-primary)] rounded-lg px-3 py-2 text-sm bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)]/20 focus:border-[var(--color-border-focus)] hover:border-[var(--color-border-secondary)]"
                >
                  <option value="pre-procurement">In Progress</option>
                  <option value="post-procurement">Past Procurement</option>
                </select>

                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  className="px-3 py-1 text-xs"
                >
                  Apply
                </Button>
                {(search ||
                  (method && method !== 'ALL') ||
                  (state && state !== 'ALL') ||
                  (sort && sort !== 'newest') ||
                  filterMode !== 'pre-procurement') && (
                  <Link href="/procurement">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="px-3 py-1 text-xs"
                    >
                      Clear
                    </Button>
                  </Link>
                )}
              </form>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {cases.length === 0 ? (
            <EmptyState
              title="No procurement cases yet"
              description="Create your first case to get started with the procurement process"
              action={
                <Button variant="primary" className="btn-animated">
                  Create Your First Case
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-[#2d3139]">
              {cases.map((c, index) => (
                <Link
                  key={c.id}
                  href={`/procurement/${c.id}`}
                  className="flex flex-col md:flex-row md:items-center md:justify-between px-10 py-7 hover:bg-[var(--color-bg-hover)] transition-all duration-250 group gap-5"
                  style={{ 
                    animation: `slideInUp 350ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: 'backwards'
                  }}
                >
                  <div className="flex-1 min-w-0 space-y-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <h3 className="font-semibold text-lg text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors duration-200 leading-snug">
                        {c.title}
                      </h3>
                      <Badge variant={c.method === 'PUBLIC_BIDDING' ? 'info' : 'default'} size="sm" className="transition-transform group-hover:scale-105">
                        {c.method === 'SMALL_VALUE_RFQ' ? 'Small Value' : 'Public Bidding'}
                      </Badge>
                    </div>
                  <div className="flex flex-wrap items-center gap-4 text-base text-[var(--color-text-secondary)] leading-relaxed">
                    <Badge
                      variant={getStateVariant(c.currentState as string)}
                      size="sm"
                      dot
                      className="transition-transform group-hover:scale-105"
                    >
                      {c.currentState}
                    </Badge>
                    <span className="hidden md:inline text-[var(--color-border-secondary)]">•</span>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {new Date(c.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="text-sm text-[var(--color-text-secondary)]">
                    Method:{' '}
                    {c.method === 'SMALL_VALUE_RFQ'
                      ? 'Small Value RFQ'
                      : c.method === 'INFRASTRUCTURE'
                      ? 'Infrastructure'
                      : 'Public Bidding'}
                  </div>
                  </div>
                  <div className="flex items-center gap-3 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-primary)] transition-all duration-200 flex-shrink-0 self-end md:self-center">
                    <span className="text-base font-medium">View Details</span>
                    <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
