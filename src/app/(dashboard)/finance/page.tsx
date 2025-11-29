import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Metadata } from 'next';

const financeModules = [
  {
    title: 'Budget',
    description: 'Track appropriations, SARO releases, obligations, and disbursement limits.',
    href: '/budget',
    detail: 'Monitor fund availability, earmarks, and aligned procurement packages.',
  },
  {
    title: 'Accounting',
    description: 'Validate supporting documents and update journal entries for each case.',
    href: '/accounting',
    detail: 'Surface compliance issues before they reach COA or internal audit.',
  },
  {
    title: 'Cashier',
    description: 'Manage payments, OR tracking, and cash advances tied to procurement outputs.',
    href: '/cashier',
    detail: 'Keep signatories informed and export remittance summaries when needed.',
  },
];

export const metadata: Metadata = {
  title: 'Finance Hub',
};

export default function FinancePage() {
  return (
    <div className="w-full space-y-8 animate-fade-in">
      <section className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
          Finance Workspace
        </p>
        <h1 className="text-3xl font-bold leading-tight text-[var(--color-text-primary)]">
          Coordinate Budget, Accounting, and Cashier teams
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] max-w-3xl">
          Use this hub to see where procurement cases sit within the finance stream, spot blockers
          before release dates, and jump into the exact workspace your team owns.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {financeModules.map((module) => (
          <Card
            key={module.href}
            className="flex flex-col border-[var(--color-border-primary)] shadow-none hover:shadow-md transition-shadow"
          >
            <CardHeader className="space-y-1">
              <CardTitle className="text-[var(--color-text-primary)]">{module.title}</CardTitle>
              <CardDescription>{module.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 flex-1">
              <p className="text-sm text-[var(--color-text-secondary)] flex-1">{module.detail}</p>
              <Link href={module.href}>
                <Button variant="primary" className="w-full">
                  Open {module.title}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="border-[var(--color-border-primary)] shadow-none">
        <CardHeader className="space-y-1">
          <CardTitle>Upcoming Deliverables</CardTitle>
          <CardDescription>
            Align tasks across Budget, Accounting, and Cashier before quarter-end submissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-[var(--color-bg-tertiary)] p-4 border border-[var(--color-border-secondary)]">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Budget</p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              Validate obligation requests awaiting certification.
            </p>
          </div>
          <div className="rounded-lg bg-[var(--color-bg-tertiary)] p-4 border border-[var(--color-border-secondary)]">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Accounting</p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              Review liquidation packages tied to the next set of disbursements.
            </p>
          </div>
          <div className="rounded-lg bg-[var(--color-bg-tertiary)] p-4 border border-[var(--color-border-secondary)]">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Cashier</p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              Prepare ORs and release notes for contracts expected to be paid this week.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


