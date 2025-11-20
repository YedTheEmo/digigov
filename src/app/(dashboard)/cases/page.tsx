import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { getCurrentOwner, getStateVariant, type LifecycleStageId } from '@/lib/casesLifecycle';
import type { Prisma } from '@/generated/prisma';

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
    <div className="space-y-8 w-full">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3 leading-tight">
          Cases
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
          Read-only overview of all cases across Procurement, Supply, Budget, Accounting, and Cashier.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Cases</CardTitle>
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

      <Card>
        <CardHeader>
          <CardTitle>Cases</CardTitle>
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
                    className="flex items-center justify-between px-5 py-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-6">
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
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Updated {new Date(c.updatedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
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


