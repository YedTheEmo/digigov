import { auth } from '@/lib/nextauth';
import { Sidebar } from '@/components/app/Sidebar';
import { Header } from '@/components/app/Header';

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-100 dark:bg-[#0d0f12]">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header userName={user?.name || undefined} userEmail={user?.email || undefined} />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto"
        >
          <div className="px-8 py-8 lg:px-12 lg:py-10 w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
