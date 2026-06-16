import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useSidebarStore } from '@/store';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const { isOpen } = useSidebarStore();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-primary-900">
      <Sidebar />
      <div
        className={cn(
          'transition-all duration-300',
          isOpen ? 'ml-64' : 'ml-20'
        )}
      >
        <Header />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
