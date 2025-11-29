import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { getStateVariant } from '@/lib/casesLifecycle';

type CaseHeaderProps = {
  title: string;
  method?: string | null;
  currentState: string;
  /**
   * When provided, shows an "Owner" badge like "Owner: Supply (Supply Manager)".
   */
  owner?: { module: string; roleHint?: string } | null;
  /**
   * Optional back link to the parent workspace (e.g. /procurement, /supply).
   * When omitted, the back arrow is not rendered.
   */
  backHref?: string;
};

function formatMethod(method: string | null | undefined): string {
  if (!method) return '';
  if (method === 'SMALL_VALUE_RFQ') return 'Small Value RFQ';
  if (method === 'INFRASTRUCTURE') return 'Infrastructure';
  if (method === 'PUBLIC_BIDDING') return 'Public Bidding';
  return method;
}

export function CaseHeader({
  title,
  method,
  currentState,
  owner,
  backHref,
}: CaseHeaderProps) {
  const methodLabel = formatMethod(method);
  const stateVariant = getStateVariant(currentState);

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        {backHref && (
          <Link
            href={backHref}
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
        )}
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
          Case Details
        </p>
      </div>
      <h1 className="text-3xl font-bold leading-tight text-[var(--color-text-primary)]">
        {title}
      </h1>
      <div className="flex flex-wrap items-center gap-3">
        {methodLabel && (
          <Badge variant={method === 'PUBLIC_BIDDING' ? 'info' : 'default'}>
            {methodLabel}
          </Badge>
        )}
        <Badge variant={stateVariant} dot data-testid="case-current-state">
          {currentState}
        </Badge>
        {owner && (
          <Badge variant="default">
            {owner.module} · {owner.roleHint || 'Team Member'}
          </Badge>
        )}
      </div>
    </section>
  );
}


