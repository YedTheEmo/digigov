import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { getCurrentOwner, getStateVariant, type LifecycleStageId } from '@/lib/casesLifecycle';

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const q = (sp?.q || '').trim();
  const cases = q
    ? await prisma.procurementCase.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { id: { contains: q, mode: 'insensitive' } },
          ],
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      })
    : [];

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 leading-tight">
          Search
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-6">
          Find cases by title or ID, then open the unified case overview.
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle>Search Cases</CardTitle>
          <CardDescription>Enter keywords to search across all case titles and IDs.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex gap-3">
            <Input
              name="q"
              defaultValue={q}
              className="flex-1"
              autoFocus
              placeholder="Search by case title or ID"
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              }
            />
            <Button type="submit" variant="primary">
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Search Results */}
      {q && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              {cases.length > 0
                ? `Found ${cases.length} case${cases.length === 1 ? '' : 's'}`
                : 'No results found'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cases.length > 0 ? (
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
                            Updated {new Date(c.updatedAt).toLocaleDateString()}
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
            ) : (
              <EmptyState
                title={`No results for "${q}"`}
                description="Try different keywords or check your spelling"
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Initial State */}
      {!q && (
        <EmptyState
          title="Start searching"
          description="Enter a search term above to find cases"
        />
      )}
    </div>
  );
}
