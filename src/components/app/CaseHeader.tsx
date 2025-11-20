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
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2 mb-2">
          {backHref && (
            <Link
              href={backHref}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {title}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {methodLabel && (
            <Badge variant={method === 'PUBLIC_BIDDING' ? 'info' : 'default'}>
              {methodLabel}
            </Badge>
          )}
          <span>
            <Badge variant={stateVariant} dot>
              {currentState}
            </Badge>
          </span>
          {owner && (
            <Badge variant="default">
              Owner: {owner.module}
              {owner.roleHint ? ` (${owner.roleHint})` : ''}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}


