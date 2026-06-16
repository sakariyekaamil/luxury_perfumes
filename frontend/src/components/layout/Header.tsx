import { Moon, Sun, Bell, LogOut, Menu } from 'lucide-react';
import { useAuthStore, useThemeStore, useSidebarStore } from '@/store';
import { authApi } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { formatRoleLabel } from '@/lib/roles';

export function Header() {
  const { user, logout, refreshToken } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const { isOpen, toggle } = useSidebarStore();
  const navigate = useNavigate();

  const { data: notifications } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => adminApi.getNotifications({ unreadOnly: true, limit: 1 }),
    refetchInterval: 60000,
  });

  const unreadCount = notifications?.data?.unreadCount || 0;

  const handleLogout = async () => {
    try {
      await authApi.logout(refreshToken || undefined);
    } catch {
      // ignore
    }
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md dark:border-slate-700 dark:bg-primary-900/80">
      <div className="flex items-center gap-4">
        {!isOpen && (
          <button onClick={toggle} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-primary-800">
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div>
          <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Welcome back,
          </h2>
          <p className="text-lg font-semibold text-primary-900 dark:text-white">
            {user?.firstName} {user?.lastName}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-primary-800"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <button
          onClick={() => navigate('/notifications')}
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-primary-800"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>

        <div className="hidden sm:flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 dark:bg-primary-800">
          <div className="h-8 w-8 rounded-full bg-gold flex items-center justify-center text-primary-900 font-bold text-sm">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="text-sm">
            <p className="font-medium text-primary-900 dark:text-white">{formatRoleLabel(user?.role)}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
