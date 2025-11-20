import { auth } from '@/lib/nextauth';
import { prisma } from '@/lib/prisma';
import { Sidebar } from '@/components/app/Sidebar';
import { Header } from '@/components/app/Header';

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const user = session?.user;

  let role: string | undefined;
  if (user?.email) {
    const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
    role = dbUser?.role as string | undefined;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0d0f12]">
      <Sidebar role={role} />
      <div className="flex flex-col flex-1 overflow-hidden relative" style={{ backgroundColor: '#1a1d23' }}>
        <Header userName={user?.name || undefined} userEmail={user?.email || undefined} />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto border-t-2 border-gray-300 dark:border-gray-700"
          style={{ backgroundColor: '#0d0f12', marginTop: '8px' }}
        >
          <div className="px-8 pt-4 pb-4 md:pt-8 md:pb-8 lg:px-12 w-full max-w-[1920px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
