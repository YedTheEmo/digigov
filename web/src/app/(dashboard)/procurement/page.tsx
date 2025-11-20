import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { logActivity } from '@/lib/activity';

async function createCase(formData: FormData) {
  'use server';
  try {
    const title = String(formData.get('title') || 'Untitled');
    const method = String(formData.get('method') || 'SMALL_VALUE_RFQ');
    const created = await prisma.procurementCase.create({
      data: { title, method: method as any, regime: 'RA9184' },
    });
    await logActivity({ caseId: created.id, action: 'create_case', toState: 'DRAFT' });
    revalidatePath('/procurement');
    return { success: true, id: created.id };
  } catch (error) {
    console.error('Failed to create case:', error);
    return {
      success: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error: (error as any)?.message ?? 'Failed to create case',
    };
  }
}

function getStateVariant(
  state: string,
): 'completed' | 'cancelled' | 'pending' | 'info' | 'warning' {
  if (state === 'CLOSED') return 'completed';
  if (['DRAFT', 'POSTING'].includes(state)) return 'pending';
  if (['ORS', 'DV', 'CHECK'].includes(state)) return 'warning';
  return 'info';
}

export default async function ProcurementPage() {
  const cases = await prisma.procurementCase.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div className="space-y-8 w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3 leading-tight">Procurement Cases</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            Manage and track all procurement activities
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Button variant="outline" size="md" leftIcon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }>
            Export
          </Button>
        </div>
      </div>

      {/* Create New Case Card */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Case</CardTitle>
          <CardDescription>Start a new procurement process</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createCase} className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-6 items-end">
            <Input 
              name="title" 
              label="Case Title"
              required
            />
            <Select name="method" label="Procurement Method" defaultValue="SMALL_VALUE_RFQ">
              <option value="SMALL_VALUE_RFQ">Small Value (RFQ)</option>
              <option value="PUBLIC_BIDDING">Public Bidding</option>
              <option value="INFRASTRUCTURE">Infrastructure</option>
            </Select>
            <Button 
              type="submit" 
              variant="primary"
              size="md"
              className="w-full lg:w-auto whitespace-nowrap"
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Create Case
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Cases List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex-1 min-w-0">
              <CardTitle>All Cases</CardTitle>
              <CardDescription>{cases.length} total cases</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="relative w-full md:w-80">
                <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search cases..."
                  className="w-full border border-gray-300 dark:border-[#3a3f4a] rounded-lg pl-14 pr-4 py-3.5 text-base min-h-[48px] bg-white dark:bg-[#242830] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {cases.length === 0 ? (
            <EmptyState
              title="No procurement cases yet"
              description="Create your first case to get started with the procurement process"
              action={
                <Button variant="primary">
                  Create Your First Case
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-[#2d3139]">
              {cases.map((c) => (
                <Link
                  key={c.id}
                  href={`/procurement/${c.id}`}
                  className="flex flex-col md:flex-row md:items-center md:justify-between px-8 py-6 hover:bg-gray-50 dark:hover:bg-[#242830] transition-colors group gap-4"
                >
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors leading-snug">
                        {c.title}
                      </h3>
                      <Badge variant={c.method === 'PUBLIC_BIDDING' ? 'info' : 'default'} size="sm">
                        {c.method === 'SMALL_VALUE_RFQ' ? 'Small Value' : 'Public Bidding'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                      <Badge variant={getStateVariant(c.currentState as string)} size="sm" dot>
                        {c.currentState}
                      </Badge>
                      <span className="hidden md:inline">•</span>
                      <span>Created {new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors flex-shrink-0 self-end md:self-center">
                    <span className="text-base font-medium">View Details</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
