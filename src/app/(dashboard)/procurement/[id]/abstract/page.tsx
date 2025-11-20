import { prisma } from '@/lib/prisma';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import Link from 'next/link';
import type { Prisma } from '@/generated/prisma';
import type { Quotation } from '@/generated/prisma';

export default async function AbstractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const include: Prisma.ProcurementCaseInclude = {
    quotations: true,
    abstract: true,
  };

  const c = await prisma.procurementCase.findUnique({
    where: { id },
    include,
  });

  if (!c) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-6xl mb-4">📋</div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Case Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The procurement case you’re looking for doesn’t exist.
        </p>
        <Link href="/procurement">
          <span className="inline-flex items-center px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition">
            Back to Procurement
          </span>
        </Link>
      </div>
    );
  }

  const quotations = [...(c.quotations ?? [])].sort(
    (a, b) => Number(a.amount) - Number(b.amount),
  );
  const hasQuotations = quotations.length > 0;
  const lowest = hasQuotations ? quotations[0] : null;

  if (!c.abstract) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Abstract of Quotations
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            No abstract has been generated yet for this case.
          </p>
        </div>
        <EmptyState
          title="No abstract yet"
          description="Generate the abstract from the case’s Quick Actions in the Procurement module once at least three quotations are recorded."
          action={
            <Link href={`/procurement/${c.id}`}>
              <span className="inline-flex items-center px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition">
                Back to Case Detail
              </span>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Abstract of Quotations
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
            This abstract summarizes all quotations received for this Small Value RFQ and
            highlights the lowest quotation. Use this document as the basis for your BAC
            Resolution and Award.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Link
            href={`/procurement/${c.id}`}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to case
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Case Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Case Title
            </div>
            <div className="text-base text-gray-900 dark:text-gray-100">{c.title}</div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Method
              </div>
              <Badge variant="info">{c.method}</Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Current State
              </div>
              <Badge>{c.currentState}</Badge>
            </div>
            {lowest && (
              <div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Lowest Quotation
                </div>
                <div className="text-base text-gray-900 dark:text-gray-100">
                  {lowest.supplierName} –{' '}
                  {Number(lowest.amount).toLocaleString('en-PH', {
                    style: 'currency',
                    currency: 'PHP',
                  })}
                </div>
              </div>
            )}
          </div>
          {c.abstract?.notes && (
            <div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Abstract Notes
              </div>
              <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-line">
                {c.abstract.notes}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quotations Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {hasQuotations ? (
            <Table striped>
              <THead>
                <TR hover={false}>
                  <TH>Rank</TH>
                  <TH>Supplier</TH>
                  <TH>Amount</TH>
                  <TH>Submitted At</TH>
                </TR>
              </THead>
              <TBody>
                {quotations.map((q: Quotation, index: number) => (
                  <TR key={q.id} hover={false}>
                    <TD className="w-24">
                      <div className="flex items-center gap-2">
                        {index === 0 && (
                          <Badge variant="success" size="sm">
                            Lowest
                          </Badge>
                        )}
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {index + 1}
                        </span>
                      </div>
                    </TD>
                    <TD>{q.supplierName}</TD>
                    <TD className="font-medium">
                      {Number(q.amount).toLocaleString('en-PH', {
                        style: 'currency',
                        currency: 'PHP',
                      })}
                    </TD>
                    <TD>
                      {q.submittedAt ? new Date(q.submittedAt).toLocaleString() : '-'}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          ) : (
            <EmptyState
              title="No quotations found"
              description="Quotations will appear here once they are recorded for this case."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}


