import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { legalConfig } from '@/lib/legal-config';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import type { CaseState } from '@/generated/prisma';

export const metadata: Metadata = {
  title: 'Administration',
};

export default async function AdminPage() {
  const users = await prisma.user.findMany({ orderBy: { role: 'asc' } });
  
  // Get some system stats
  const totalCases = await prisma.procurementCase.count();
  const activeCases = await prisma.procurementCase.count({ 
    where: { currentState: { notIn: ['CLOSED'] as CaseState[] } } 
  });

  return (
    <div className="w-full space-y-8 animate-fade-in">
      <section className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-text-tertiary)]">
          Administration Workspace
        </p>
        <h1 className="text-3xl font-bold leading-tight text-[var(--color-text-primary)]">
          System configuration and user management
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] max-w-3xl">
          View system statistics, manage user accounts and roles, and configure legal and compliance settings across the platform.
        </p>
      </section>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-[var(--color-border-primary)] shadow-none">
          <CardContent className="pt-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-[var(--color-primary)] mb-3">{totalCases}</div>
              <div className="text-sm font-medium text-[var(--color-text-secondary)]">Total Cases</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[var(--color-border-primary)] shadow-none">
          <CardContent className="pt-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-[var(--color-success)] mb-3">{activeCases}</div>
              <div className="text-sm font-medium text-[var(--color-text-secondary)]">Active Cases</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[var(--color-border-primary)] shadow-none">
          <CardContent className="pt-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-[var(--color-info)] mb-3">{users.length}</div>
              <div className="text-sm font-medium text-[var(--color-text-secondary)]">System Users</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="border-[var(--color-border-primary)] shadow-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-[var(--color-text-primary)]">System Users</CardTitle>
          <CardDescription>Manage user accounts and roles</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <EmptyState
              title="No users found"
              description="User accounts will appear here"
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Email</TH>
                  <TH>Role</TH>
                </TR>
              </THead>
              <TBody>
                {users.map((user) => (
                  <TR key={user.id}>
                    <TD className="font-medium">{user.name || '-'}</TD>
                    <TD className="text-[var(--color-text-secondary)]">{user.email}</TD>
                    <TD>
                      <Badge variant="primary" size="sm">
                        {user.role}
                      </Badge>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Legal Configuration */}
      <Card className="border-[var(--color-border-primary)] shadow-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-[var(--color-text-primary)]">Legal Configuration</CardTitle>
          <CardDescription>System-wide legal and compliance settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-8 border border-[var(--color-border-secondary)]">
            <pre className="text-sm text-[var(--color-text-primary)] overflow-auto leading-relaxed">
              {JSON.stringify(legalConfig, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
