import { useQuery } from '@tanstack/react-query';
import {
  DollarSign, ShoppingCart, ShoppingBag, TrendingUp,
  Users, Truck, Package, AlertTriangle, Sparkles, Calendar,
  ArrowUpRight, Activity,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';
import { dashboardApi } from '@/lib/api';
import { formatCurrency, formatDateTime, cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner, ErrorState } from '@/components/ui/Loading';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store';

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg dark:border-slate-600 dark:bg-primary-800">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-bold text-primary-900 dark:text-white">
        {typeof payload[0].value === 'number' && payload[0].value > 100
          ? formatCurrency(payload[0].value)
          : payload[0].value}
      </p>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuthStore();

  const { data: statsData, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats(),
  });

  const { data: revenueData } = useQuery({
    queryKey: ['dashboard-revenue'],
    queryFn: () => dashboardApi.getRevenue('monthly'),
  });

  const { data: salesAnalytics } = useQuery({
    queryKey: ['dashboard-sales-analytics'],
    queryFn: () => dashboardApi.getSalesAnalytics('monthly'),
  });

  const stats = statsData?.data?.data;
  const revenueChart = revenueData?.data?.data || [];
  const salesCountChart = salesAnalytics?.data?.data?.salesCount || [];

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Failed to load dashboard" onRetry={refetch} />;
  if (!stats) return null;

  const primaryKpis = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      sub: `Today ${formatCurrency(stats.todayRevenue)}`,
      icon: DollarSign,
      accent: 'from-gold/20 to-gold/5 border-gold/30',
      iconBg: 'bg-gold text-primary-900',
    },
    {
      title: 'Net Profit',
      value: formatCurrency(stats.totalProfit),
      sub: stats.totalProfit >= 0 ? 'Healthy margin' : 'Review expenses',
      icon: TrendingUp,
      accent: 'from-emerald-500/10 to-transparent border-emerald-200 dark:border-emerald-800',
      iconBg: 'bg-emerald-500/15 text-emerald-600',
    },
    {
      title: 'Total Sales',
      value: stats.totalSales,
      sub: `${stats.monthSalesCount} this month`,
      icon: ShoppingCart,
      accent: 'from-primary-900/10 to-transparent border-slate-200 dark:border-slate-700',
      iconBg: 'bg-primary-900 text-white dark:bg-gold dark:text-primary-900',
    },
    {
      title: 'Low Stock',
      value: stats.lowStockCount,
      sub: stats.lowStockCount > 0 ? 'Needs attention' : 'All stocked',
      icon: AlertTriangle,
      accent: stats.lowStockCount > 0 ? 'from-red-500/10 to-transparent border-red-200 dark:border-red-900' : 'from-slate-100 to-transparent border-slate-200',
      iconBg: stats.lowStockCount > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500',
    },
  ];

  const secondaryKpis = [
    { label: 'Purchases', value: stats.totalPurchases, icon: ShoppingBag },
    { label: 'Customers', value: stats.totalCustomers, icon: Users },
    { label: 'Suppliers', value: stats.totalSuppliers, icon: Truck },
    { label: 'Products', value: stats.totalProducts, icon: Package },
  ];

  const topSelling = stats.topSellingPerfumes || [];
  const maxSold = topSelling[0]?.totalSold || 1;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-primary-900 p-6 sm:p-8 text-white">
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-gold/5 blur-2xl" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-gold text-sm font-medium mb-2">
              <Sparkles className="h-4 w-4" />
              Luxury Perfumes ERP
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold">
              Welcome back, {user?.firstName}
            </h1>
            <p className="mt-2 text-slate-400 max-w-lg">
              Real-time overview of revenue, sales, inventory, and business activity.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <div className="rounded-lg bg-white/10 backdrop-blur border border-white/10 px-3 py-1.5 min-w-[100px]">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide leading-none">Today</p>
              <p className="text-sm font-bold text-gold mt-0.5 leading-tight">{formatCurrency(stats.todayRevenue)}</p>
              <p className="text-[10px] text-slate-400 leading-none">{stats.todaySalesCount} sales</p>
            </div>
            <div className="rounded-lg bg-white/10 backdrop-blur border border-white/10 px-3 py-1.5 min-w-[100px]">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide leading-none">This Month</p>
              <p className="text-sm font-bold text-white mt-0.5 leading-tight">{formatCurrency(stats.monthRevenue)}</p>
              <p className="text-[10px] text-slate-400 leading-none">{stats.monthSalesCount} sales</p>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {primaryKpis.map((kpi) => (
          <div
            key={kpi.title}
            className={cn(
              'rounded-xl border bg-gradient-to-br p-5 transition-shadow hover:shadow-md',
              kpi.accent
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{kpi.title}</p>
                <p className="mt-2 text-2xl font-bold text-primary-900 dark:text-white">{kpi.value}</p>
                <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  {kpi.sub}
                </p>
              </div>
              <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', kpi.iconBg)}>
                <kpi.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {secondaryKpis.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3 dark:border-slate-700 dark:bg-primary-800/40"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-primary-900">
              <item.icon className="h-4 w-4 text-gold" />
            </div>
            <div>
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className="text-lg font-bold text-primary-900 dark:text-white">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Revenue Analytics" description="Monthly revenue performance" className="!overflow-hidden">
          <div className="h-80 -mx-2">
            {revenueChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `$${v}`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#D4AF37"
                    fill="url(#goldGradient)"
                    strokeWidth={2.5}
                    dot={{ fill: '#D4AF37', r: 3 }}
                    activeDot={{ r: 5, fill: '#0F172A', stroke: '#D4AF37', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                <Calendar className="h-10 w-10 opacity-40" />
                <p>No revenue data yet — complete sales to see trends</p>
              </div>
            )}
          </div>
        </Card>

        <Card title="Sales Volume" description="Completed sales per month">
          <div className="h-80 -mx-2">
            {salesCountChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesCountChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {salesCountChart.map((_: unknown, i: number) => (
                      <Cell key={i} fill={i % 2 === 0 ? '#D4AF37' : '#0F172A'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                <ShoppingCart className="h-10 w-10 opacity-40" />
                <p>No sales recorded yet</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top selling */}
        <Card title="Top Selling Perfumes" description="Best performers" className="lg:col-span-1">
          {topSelling.length > 0 ? (
            <ul className="space-y-4">
              {topSelling.map((item: { product?: { name: string; brand?: { name: string } }; totalSold: number }, i: number) => (
                <li key={item.product?.name || i} className="flex gap-3">
                  <span className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold',
                    i === 0 ? 'bg-gold text-primary-900' : 'bg-slate-100 text-slate-600 dark:bg-primary-900 dark:text-slate-300'
                  )}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-primary-900 dark:text-white truncate">
                      {item.product?.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-slate-500">{item.product?.brand?.name}</p>
                    <div className="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-primary-900 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gold transition-all"
                        style={{ width: `${(item.totalSold / maxSold) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gold shrink-0">{item.totalSold} sold</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-slate-400 py-10">No sales data yet</p>
          )}
        </Card>

        {/* Low stock */}
        <Card
          title="Low Stock Alerts"
          description="Products needing restock"
          className="lg:col-span-1"
          action={stats.lowStockCount > 0 ? <Badge variant="danger">{stats.lowStockCount} alerts</Badge> : null}
        >
          {stats.lowStockProducts?.length > 0 ? (
            <ul className="space-y-3">
              {stats.lowStockProducts.map((product: { id: string; name: string; stockQuantity: number; minimumStock: number; brand?: { name: string } }) => (
                <li
                  key={product.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-red-100 bg-red-50/50 px-4 py-3 dark:border-red-900/40 dark:bg-red-900/10"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-primary-900 dark:text-white truncate">{product.name}</p>
                    <p className="text-xs text-slate-500">{product.brand?.name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-red-600">{product.stockQuantity}</p>
                    <p className="text-[10px] text-slate-500">min {product.minimumStock}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <Package className="h-10 w-10 opacity-30 mb-2" />
              <p>All products well stocked</p>
            </div>
          )}
        </Card>

        {/* Activity */}
        <Card title="Recent Activity" description="Latest system actions" className="lg:col-span-1">
          {stats.recentActivities?.length > 0 ? (
            <ul className="space-y-0">
              {stats.recentActivities.slice(0, 8).map((activity: {
                id: string; action: string; entity: string; details?: string;
                createdAt: string; user?: { firstName: string; lastName: string };
              }) => (
                <li key={activity.id} className="flex gap-3 py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold text-xs font-bold">
                    {activity.user?.firstName?.[0] || 'S'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary-900 dark:text-white">
                      {activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : 'System'}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {activity.details || `${activity.action} · ${activity.entity}`}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">{formatDateTime(activity.createdAt)}</p>
                  </div>
                  <Activity className="h-4 w-4 text-slate-300 shrink-0 mt-1" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-slate-400 py-10">No recent activity</p>
          )}
        </Card>
      </div>
    </div>
  );
}
