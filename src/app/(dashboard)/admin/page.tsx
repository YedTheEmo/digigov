import { prisma } from '@/lib/prisma';
import { legalConfig } from '@/lib/legal-config';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import type { CaseState } from '@/generated/prisma';

export default async function AdminPage() {
  const users = await prisma.user.findMany({ orderBy: { role: 'asc' } });
  
  // Get some system stats
  const totalCases = await prisma.procurementCase.count();
  const activeCases = await prisma.procurementCase.count({ 
    where: { currentState: { notIn: ['CLOSED'] as CaseState[] } } 
  });

  return (
    <div className="space-y-8 w-full">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3 leading-tight">Administration</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
          System configuration and user management
        </p>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card>
          <CardContent className="pt-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-3">{totalCases}</div>
              <div className="text-base text-gray-600 dark:text-gray-400">Total Cases</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-green-600 dark:text-green-400 mb-3">{activeCases}</div>
              <div className="text-base text-gray-600 dark:text-gray-400">Active Cases</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-purple-600 dark:text-purple-400 mb-3">{users.length}</div>
              <div className="text-base text-gray-600 dark:text-gray-400">System Users</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
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
                    <TD className="text-gray-600 dark:text-gray-400">{user.email}</TD>
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
      <Card>
        <CardHeader>
          <CardTitle>Legal Configuration</CardTitle>
          <CardDescription>System-wide legal and compliance settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 dark:bg-[#1a1d23] rounded-lg p-8 border border-gray-100 dark:border-[#2d3139]">
            <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-auto leading-relaxed">
              {JSON.stringify(legalConfig, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
