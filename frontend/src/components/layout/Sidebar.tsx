import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tags, Award, Warehouse, Truck, Users,
  ShoppingCart, ShoppingBag, Receipt, BarChart3, UserCog,
  ScrollText, Bell, Settings, ChevronLeft, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/store';

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

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-slate-200 bg-white transition-all duration-300 dark:border-slate-700 dark:bg-primary-900',
        isOpen ? 'w-64' : 'w-20'
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-700">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold">
            <Sparkles className="h-5 w-5 text-primary-900" />
          </div>
          {isOpen && (
            <div>
              <h1 className="font-display text-lg font-bold text-primary-900 dark:text-white">Luxury</h1>
              <p className="text-[10px] text-gold font-medium tracking-widest uppercase">Perfumes ERP</p>
            </div>
          )}
        </Link>
        <button onClick={toggle} className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-primary-800">
          <ChevronLeft className={cn('h-4 w-4 transition-transform', !isOpen && 'rotate-180')} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
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
          <p className="text-xs text-slate-400 text-center">Luxury Perfumes ERP v1.0</p>
        </div>
      )}
    </aside>
  );
}
