"use client";

import { useEffect, useState } from "react";
import { DollarOutlined, ShoppingCartOutlined, RiseOutlined, TeamOutlined, RollbackOutlined } from "@ant-design/icons";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { getAdminStats } from "../actions";

export function DashboardStats() {
  const [stats, setStats] = useState<{
    totalUsers: number;
    totalProducts: number;
    totalTransactions: number;
    todayTransactions: number;
    todayRevenue: number;
    totalRefunds: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStats().then((res) => {
      if (res.success) setStats(res.data);
      setLoading(false);
    });
  }, []);

  const cards = [
    {
      title: "Pendapatan Hari Ini",
      value: `Rp ${(stats?.todayRevenue ?? 0).toLocaleString("id")}`,
      icon: <DollarOutlined />,
      color: "linear-gradient(135deg, #10B981, #059669)",
    },
    {
      title: "Transaksi Hari Ini",
      value: stats?.todayTransactions ?? 0,
      icon: <ShoppingCartOutlined />,
      color: "linear-gradient(135deg, #3B82F6, #2563EB)",
    },
    {
      title: "Total Produk",
      value: stats?.totalProducts ?? 0,
      icon: <RiseOutlined />,
      color: "linear-gradient(135deg, #F59E0B, #D97706)",
    },
    {
      title: "Total User",
      value: stats?.totalUsers ?? 0,
      icon: <TeamOutlined />,
      color: "linear-gradient(135deg, #8B5CF6, #6D28D9)",
    },
    {
      title: "Total Transaksi",
      value: stats?.totalTransactions ?? 0,
      icon: <ShoppingCartOutlined />,
      color: "linear-gradient(135deg, #EC4899, #BE185D)",
    },
    {
      title: "Total Refund",
      value: stats?.totalRefunds ?? 0,
      icon: <RollbackOutlined />,
      color: "linear-gradient(135deg, #EF4444, #DC2626)",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {cards.map((card) => (
        <StatCard key={card.title} {...card} loading={loading} />
      ))}
    </div>
  );
}
