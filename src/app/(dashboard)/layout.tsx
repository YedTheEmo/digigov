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
    <div className="flex h-screen w-full overflow-hidden bg-[var(--color-bg-secondary)]">
      <Sidebar role={role} />
      <div className="flex flex-col flex-1 overflow-hidden bg-[var(--color-bg-secondary)]">
        <Header userName={user?.name || undefined} userEmail={user?.email || undefined} />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto bg-[var(--color-bg-primary)] container-content"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
