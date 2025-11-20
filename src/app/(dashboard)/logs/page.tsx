import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { ACTION_FILTERS, getActionMeta } from '@/lib/activityLabels';
import { getStateVariant } from '@/lib/casesLifecycle';
import type { Prisma } from '@/generated/prisma';

export default async function LogsPage(props: {
  searchParams: Promise<{ q?: string; action?: string; page?: string }>;
}) {
  const searchParams = await props.searchParams;
  const q = (searchParams?.q || '').trim();
  const action = searchParams?.action || undefined;
  const pageParam = searchParams?.page;
  const page = Math.max(1, Number.isNaN(Number(pageParam)) ? 1 : Number(pageParam || 1));
  const pageSize = 50;

  const where: Prisma.ActivityLogWhereInput = {};

  if (q) {
    // Check if it looks like a UUID (case ID)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q.trim());
    
    if (isUUID) {
      // Exact match for case ID
      where.caseId = q.trim();
    } else {
      // Search in case title
      where.case = {
        title: { contains: q, mode: 'insensitive' },
      };
    }
  }

  if (action) {
    where.action = action;
  }

  const [total, logs] = await Promise.all([
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        case: {
          select: {
            title: true,
            method: true,
            currentState: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-8 w-full">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3 leading-tight">
          Activity Logs
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
          View and track all system activities with links to the unified case overview.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter logs by case title or ID, and optionally by a specific action.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form method="get" className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              name="q"
              defaultValue={q}
              label="Case title or ID"
              placeholder="e.g. Office chairs, or a case ID"
            />
            <Select
              name="action"
              defaultValue={action || ''}
              label="Action (optional)"
            >
              <option value="">All actions</option>
              {ACTION_FILTERS.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </Select>
            <div className="flex items-end gap-3">
              <Button type="submit" variant="primary" size="md">
                Apply Filters
              </Button>
              <a
                href="/logs"
                className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 min-h-[48px] px-6 py-3.5 text-base text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
              >
                Clear
              </a>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
          <CardDescription>
            {total} activities · Page {page} of {totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <EmptyState
              title="No activity logs found"
              description="Try adjusting your filters or check back later"
            />
          ) : (
            <Table striped>
              <THead>
                <TR>
                  <TH>Case</TH>
                  <TH>Action</TH>
                  <TH>Timestamp</TH>
                </TR>
              </THead>
              <TBody>
                {logs.map((log) => {
                  const meta = getActionMeta(log.action);
                  const caseState = log.case?.currentState as string | undefined;
                  return (
                    <TR key={log.id}>
                      <TD>
                        <a
                          href={`/cases/${log.caseId}`}
                          className="text-green-600 dark:text-green-400 hover:underline font-medium text-base"
                        >
                          {log.case?.title || log.caseId}
                        </a>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          {log.case?.method && (
                            <Badge
                              variant={
                                log.case.method === 'PUBLIC_BIDDING'
                                  ? 'info'
                                  : log.case.method === 'INFRASTRUCTURE'
                                  ? 'warning'
                                  : 'default'
                              }
                              size="sm"
                            >
                              {log.case.method === 'SMALL_VALUE_RFQ'
                                ? 'Small Value RFQ'
                                : log.case.method === 'INFRASTRUCTURE'
                                ? 'Infrastructure'
                                : 'Public Bidding'}
                            </Badge>
                          )}
                          {caseState && (
                            <Badge variant={getStateVariant(caseState)} size="sm" dot>
                              {caseState}
                            </Badge>
                          )}
                        </div>
                      </TD>
                      <TD>
                        <span
                          className="text-sm text-gray-900 dark:text-gray-100"
                          title={log.action}
                        >
                          {meta.label}
                        </span>
                      </TD>
                      <TD className="text-gray-600 dark:text-gray-400 text-base">
                        {new Date(log.createdAt).toLocaleString()}
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          )}
        </CardContent>
        {logs.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400">
            <span>
              Showing {(page - 1) * pageSize + 1}-
              {Math.min(page * pageSize, total)} of {total} activities
            </span>
            <div className="flex items-center gap-2">
              <a
                href={`?${new URLSearchParams({
                  ...(q ? { q } : {}),
                  ...(action ? { action } : {}),
                  page: String(Math.max(1, page - 1)),
                }).toString()}`}
                className={`px-3 py-1.5 rounded-md border text-sm ${
                  page <= 1
                    ? 'border-gray-300 text-gray-400 cursor-not-allowed opacity-60'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                aria-disabled={page <= 1}
              >
                Previous
              </a>
              <a
                href={`?${new URLSearchParams({
                  ...(q ? { q } : {}),
                  ...(action ? { action } : {}),
                  page: String(Math.min(totalPages, page + 1)),
                }).toString()}`}
                className={`px-3 py-1.5 rounded-md border text-sm ${
                  page >= totalPages
                    ? 'border-gray-300 text-gray-400 cursor-not-allowed opacity-60'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                aria-disabled={page >= totalPages}
              >
                Next
              </a>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

