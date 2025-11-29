import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { getCurrentOwner, getStateVariant, type LifecycleStageId } from '@/lib/casesLifecycle';
import type { Prisma } from '@/generated/prisma';

export const metadata: Metadata = {
  title: 'Cases',
};

export default async function CasesPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const q = (sp?.q || '').trim();

  const where: Prisma.ProcurementCaseWhereInput = q
    ? {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { id: { contains: q, mode: 'insensitive' } },
        ],
      }
    : {};

  const cases = await prisma.procurementCase.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });

  return (
    <div className="w-full space-y-8 animate-fade-in">
      <section className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
          Cases Workspace
        </p>
        <h1 className="text-3xl font-bold leading-tight text-[var(--color-text-primary)]">
          Track procurement cases across all modules
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] max-w-3xl">
          Read-only overview of all cases across Procurement, Supply, Budget, Accounting, and Cashier. 
          Search by title or ID to view full lifecycle details and activity timeline.
        </p>
      </section>

      <Card className="border-[var(--color-border-primary)] shadow-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-[var(--color-text-primary)]">Search Cases</CardTitle>
          <CardDescription>
            Find a case by title or ID. Open a case to see its full lifecycle and timeline.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex gap-3">
            <Input
              name="q"
              defaultValue={q}
              className="flex-1"
              placeholder="Search by case title or ID"
            />
            <Button type="submit" variant="primary">
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-[var(--color-border-primary)] shadow-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-[var(--color-text-primary)]">All Cases</CardTitle>
          <CardDescription>
            {q
              ? cases.length > 0
                ? `Found ${cases.length} case${cases.length === 1 ? '' : 's'} for "${q}"`
                : `No cases found for "${q}"`
              : 'Recently updated cases'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cases.length === 0 ? (
            <EmptyState
              title={q ? 'No matching cases' : 'No cases yet'}
              description={
                q
                  ? 'Try a different keyword or check the spelling of the case title or ID.'
                  : 'Cases will appear here once created in Procurement.'
              }
            />
          ) : (
            <div className="space-y-2">
              {cases.map((c) => {
                const owner = getCurrentOwner(c.currentState as LifecycleStageId);
                return (
                  <Link
                    key={c.id}
                    href={`/cases/${c.id}`}
                    className="flex items-center justify-between px-5 py-4 border border-[var(--color-border-primary)] rounded-[var(--radius-lg)] hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-primary)] transition-all group"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-base text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors leading-6">
                        {c.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <Badge
                          variant={
                            c.method === 'PUBLIC_BIDDING'
                              ? 'info'
                              : c.method === 'INFRASTRUCTURE'
                              ? 'warning'
                              : 'default'
                          }
                          size="sm"
                        >
                          {c.method === 'SMALL_VALUE_RFQ'
                            ? 'Small Value RFQ'
                            : c.method === 'INFRASTRUCTURE'
                            ? 'Infrastructure'
                            : 'Public Bidding'}
                        </Badge>
                        <Badge variant={getStateVariant(c.currentState as string)} size="sm" dot>
                          {c.currentState}
                        </Badge>
                        {owner && (
                          <Badge variant="default" size="sm">
                            {owner.module} · {owner.roleHint}
                          </Badge>
                        )}
                        <span className="text-xs text-[var(--color-text-tertiary)]">
                          Updated {new Date(c.updatedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <svg
                      className="w-5 h-5 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-primary)] transition-colors flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


