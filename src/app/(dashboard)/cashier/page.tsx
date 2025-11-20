import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import Link from 'next/link';

const PRE_CASHIER_STATES = ['DV'] as const;
const POST_CASHIER_STATES = ['CHECK', 'CLOSED'] as const;

function getStateVariantLocal(state: string): 'completed' | 'cancelled' | 'pending' | 'info' | 'warning' {
  if (state === 'CLOSED') return 'completed';
  if (['DRAFT', 'POSTING'].includes(state)) return 'pending';
  if (['ORS', 'DV', 'CHECK'].includes(state)) return 'warning';
  return 'info';
}

export default async function CashierPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string; state?: string; sort?: string; filter?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const { search, state, sort, filter } = params;

  // Build Prisma query with filters
  const where: any = {};

  const filterMode = filter || 'pre-cashier'; // pre-cashier or post-cashier

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { currentState: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (state && state !== 'ALL') {
    where.currentState = state;
  } else if (filterMode === 'pre-cashier') {
    // Cases ready for Cashier (DV)
    where.currentState = { in: PRE_CASHIER_STATES as any };
  } else if (filterMode === 'post-cashier') {
    // Cases that have gone through Cashier (CHECK and CLOSED)
    where.currentState = { in: POST_CASHIER_STATES as any };
  }

  // Build orderBy
  let orderBy: any = { updatedAt: 'desc' }; // default
  if (sort === 'oldest') {
    orderBy = { createdAt: 'asc' };
  } else if (sort === 'title-asc') {
    orderBy = { title: 'asc' };
  } else if (sort === 'title-desc') {
    orderBy = { title: 'desc' };
  }

  const cases = await prisma.procurementCase.findMany({ where, orderBy });

  return (
    <div className="space-y-10 w-full animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 animate-slide-right">
        <div className="flex-1 min-w-0">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
            Cashier
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            Manage check issuance and check advice
          </p>
        </div>
      </div>

      {/* Cases List */}
      <Card className="card-animated animate-slide-up">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="flex-1 min-w-0">
              <CardTitle>All Cases</CardTitle>
              <CardDescription className="mt-2">
                {cases.length} {search || state !== 'ALL' ? 'matching' : 'total'} case{cases.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
              <form action="" method="GET" className="flex items-center gap-3 flex-wrap md:flex-nowrap">
                <div className="relative w-full md:w-64">
                  <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    name="search"
                    defaultValue={search}
                    placeholder="Search cases..."
                    className="w-full border border-gray-300 dark:border-[#3a3f4a] rounded-lg pl-10 pr-3 py-2 text-sm bg-white dark:bg-[#242830] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 hover:border-gray-400 dark:hover:border-gray-500"
                  />
                </div>
                
                <select
                  name="state"
                  defaultValue={state || 'ALL'}
                  className="border border-gray-300 dark:border-[#3a3f4a] rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#242830] text-gray-900 dark:text-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 hover:border-gray-400 dark:hover:border-gray-500"
                >
                  <option value="ALL">All States</option>
                  <option value="DV">DV</option>
                  <option value="CHECK">Check</option>
                  <option value="CLOSED">Closed</option>
                </select>

                <select
                  name="sort"
                  defaultValue={sort || 'newest'}
                  className="border border-gray-300 dark:border-[#3a3f4a] rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#242830] text-gray-900 dark:text-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 hover:border-gray-400 dark:hover:border-gray-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title-asc">Title A-Z</option>
                  <option value="title-desc">Title Z-A</option>
                </select>

                <select
                  name="filter"
                  defaultValue={filterMode}
                  className="border border-gray-300 dark:border-[#3a3f4a] rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#242830] text-gray-900 dark:text-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 hover:border-gray-400 dark:hover:border-gray-500"
                >
                  <option value="pre-cashier">In Progress</option>
                  <option value="post-cashier">Past Cashier</option>
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
                  (state && state !== 'ALL') ||
                  (sort && sort !== 'newest') ||
                  filterMode !== 'pre-cashier') && (
                  <Link href="/cashier">
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
              title="No cashier cases found"
              description={
                filterMode === 'pre-cashier'
                  ? 'No cases currently need Cashier actions. Try switching to Post-Cashier filter or adjusting your search.'
                  : 'No cases match the current filters. Adjust your search or filters to see more results.'
              }
            />
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-[#2d3139]">
              {cases.map((c, index) => (
                <Link
                  key={c.id}
                  href={`/cashier/${c.id}`}
                  className="flex flex-col md:flex-row md:items-center md:justify-between px-10 py-7 hover:bg-gray-50 dark:hover:bg-[#242830] transition-all duration-250 group gap-5"
                  style={{ 
                    animation: `slideInUp 350ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: 'backwards'
                  }}
                >
                  <div className="flex-1 min-w-0 space-y-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-200 leading-snug">
                        {c.title}
                      </h3>
                      <Badge
                        variant={getStateVariantLocal(c.currentState as string)}
                        size="sm"
                        dot
                        className="transition-transform group-hover:scale-105"
                      >
                        {c.currentState}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-base text-gray-600 dark:text-gray-400 leading-relaxed">
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
                  </div>
                  <div className="flex items-center gap-3 text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-all duration-200 flex-shrink-0 self-end md:self-center">
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
