import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Metadata } from 'next';

const insightsModules = [
  {
    title: 'Reports',
    description: 'Generate regulatory, management, or ad-hoc procurement reports.',
    href: '/reports',
    detail: 'Use filters to slice by procurement method, funding source, or current stage.',
  },
  {
    title: 'Activity Logs',
    description: 'Trace every workflow update, attachment, and user action.',
    href: '/logs',
    detail: 'Audit-ready timeline that can be exported for oversight bodies.',
  },
];

const quickQuestions = [
  'Which cases are stuck in post-qualification beyond 14 days?',
  'How much of the current budget has been obligated vs. disbursed?',
  'Who touched the latest BAC resolution before it was approved?',
];

export const metadata: Metadata = {
  title: 'Insights Hub',
};

export default function InsightsPage() {
  return (
    <div className="w-full space-y-8 animate-fade-in">
      <section className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
          Insights Workspace
        </p>
        <h1 className="text-3xl font-bold leading-tight text-[var(--color-text-primary)]">
          Turn procurement data into action
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] max-w-3xl">
          Whether you&apos;re compiling a BAC report or reviewing who updated a case, start here to
          jump into the right analytics or audit tool.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {insightsModules.map((module) => (
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
          <CardTitle>Quick questions you can answer here</CardTitle>
          <CardDescription>
            Open Reports or Activity Logs and apply the recommended filters.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {quickQuestions.map((question) => (
            <div
              key={question}
              className="rounded-lg bg-[var(--color-bg-tertiary)] p-4 border border-[var(--color-border-secondary)]"
            >
              <p className="text-sm font-medium text-[var(--color-text-primary)]">{question}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}


