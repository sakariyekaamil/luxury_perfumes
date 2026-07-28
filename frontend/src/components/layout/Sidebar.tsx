import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, Package, Tags, Award, Warehouse, Truck, Users,
  ShoppingCart, ShoppingBag, Receipt, BarChart3, UserCog,
  ScrollText, Bell, Settings, ChevronLeft,
} from 'lucide-react';
import { cn, resolveMediaUrl } from '@/lib/utils';
import { useAuthStore, useSidebarStore } from '@/store';
import { canAccessNav } from '@/lib/roles';
import { adminApi } from '@/lib/api';
import type { CompanySettings } from '@/types';

const FALLBACK_LOGO = '/brand/luxy-logo.png';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/products', label: 'Products', icon: Package },
  { path: '/categories', label: 'Categories', icon: Tags },
  { path: '/brands', label: 'Brands', icon: Award },
  { path: '/inventory', label: 'Inventory', icon: Warehouse },
  { path: '/suppliers', label: 'Suppliers', icon: Truck },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/purchases', label: 'Purchases', icon: ShoppingBag },
  { path: '/sales', label: 'Sales', icon: ShoppingCart },
  { path: '/expenses', label: 'Expenses', icon: Receipt },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/users', label: 'Users', icon: UserCog },
  { path: '/audit-logs', label: 'Audit Logs', icon: ScrollText },
  { path: '/notifications', label: 'Notifications', icon: Bell },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { isOpen, toggle } = useSidebarStore();
  const { user, isAuthenticated } = useAuthStore();

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => adminApi.getSettings(),
    enabled: isAuthenticated,
  });

  const settings = settingsData?.data?.data as CompanySettings | undefined;
  const companyLogo = settings?.companyLogo
    ? resolveMediaUrl(settings.companyLogo)
    : FALLBACK_LOGO;
  const companyName = settings?.companyName || 'Luxy Perfumes';

  const visibleItems = navItems.filter((item) => canAccessNav(item.path, user?.role));

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-slate-200 bg-white transition-all duration-300 dark:border-slate-700 dark:bg-primary-900',
        isOpen ? 'w-64' : 'w-20'
      )}
    >
      <div
        className={cn(
          'border-b border-slate-200 dark:border-slate-700',
          isOpen
            ? 'flex h-20 items-center justify-between px-3'
            : 'flex flex-col items-center gap-1 px-2 py-3'
        )}
      >
        <Link
          to="/"
          className={cn(
            'flex items-center justify-center',
            isOpen ? 'min-w-0' : 'h-14 w-14'
          )}
          title={companyName}
        >
          <img
            src={companyLogo}
            alt={companyName}
            className={cn(
              'object-contain',
              isOpen ? 'h-14 w-auto max-w-[170px]' : 'h-14 w-14 rounded-lg'
            )}
            onError={(e) => {
              const img = e.currentTarget;
              if (img.src !== window.location.origin + FALLBACK_LOGO) {
                img.src = FALLBACK_LOGO;
              }
            }}
          />
        </Link>
        <button
          onClick={toggle}
          className="shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-primary-900 dark:text-slate-300 dark:hover:bg-primary-800 dark:hover:text-white"
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', !isOpen && 'rotate-180')} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary-900 text-white dark:bg-gold dark:text-primary-900'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-primary-800 dark:hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {isOpen && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {isOpen && (
        <div className="border-t border-slate-200 p-4 dark:border-slate-700">
          <p className="text-xs text-slate-400 text-center">{companyName} ERP v1.0</p>
        </div>
      )}
    </aside>
  );
}
