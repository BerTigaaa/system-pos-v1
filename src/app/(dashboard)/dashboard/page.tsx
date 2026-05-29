"use client";

import { useEffect, useState } from "react";
import { DollarOutlined, ShoppingCartOutlined, RiseOutlined, TeamOutlined } from "@ant-design/icons";
import { useSession } from "next-auth/react";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { SalesChart } from "@/features/dashboard/components/sales-chart";
import { LowStockList } from "@/features/dashboard/components/low-stock-list";
import { RecentTransactions } from "@/features/dashboard/components/recent-transactions";
import { getDashboardStats } from "@/features/dashboard/actions";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<{
    todayTransactions: number;
    totalSales: number;
    avgTransaction: number;
    totalProducts: number;
    lowStockList: { id: string; name: string; sku: string; stock: number; min_stock: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats().then((res) => {
      if (res.success) setStats(res.data);
      setLoading(false);
    });
  }, []);

  if (status === "loading") return <LoadingSkeleton type="stat" />;

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Selamat datang, {session?.user?.name?.split(" ")[0] ?? "User"}
          </h1>
          <StatusBadge status={session?.user?.status ?? "ACTIVE"} />
        </div>
        <p className="text-gray-500 dark:text-gray-400">Ringkasan bisnis Anda hari ini</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Penjualan Hari Ini"
          value={`Rp ${(stats?.totalSales ?? 0).toLocaleString("id")}`}
          icon={<DollarOutlined />}
          color="linear-gradient(135deg, #10B981, #059669)"
          loading={loading}
        />
        <StatCard
          title="Transaksi"
          value={stats?.todayTransactions ?? 0}
          icon={<ShoppingCartOutlined />}
          color="linear-gradient(135deg, #3B82F6, #2563EB)"
          loading={loading}
        />
        <StatCard
          title="Rata-rata Transaksi"
          value={`Rp ${(stats?.avgTransaction ?? 0).toLocaleString("id")}`}
          icon={<TeamOutlined />}
          color="linear-gradient(135deg, #8B5CF6, #7C3AED)"
          loading={loading}
        />
        <StatCard
          title="Total Produk"
          value={stats?.totalProducts ?? 0}
          icon={<RiseOutlined />}
          color="linear-gradient(135deg, #F59E0B, #D97706)"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Stok Hampir Habis
          </h3>
          <LowStockList items={stats?.lowStockList ?? []} />
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Transaksi Terbaru
          </h3>
          <Link
            href="/transactions"
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Lihat Semua &rarr;
          </Link>
        </div>
        <RecentTransactions />
      </div>
    </div>
  );
}
