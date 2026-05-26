"use client";

import { Card, Row, Col, Statistic } from "antd";
import {
  ShoppingCartOutlined,
  DollarOutlined,
  RiseOutlined,
  TeamOutlined,
  WalletOutlined,
  ArrowUpOutlined,
} from "@ant-design/icons";
import { useSession } from "next-auth/react";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

const stats = [
  {
    title: "Penjualan Hari Ini",
    value: "Rp 0",
    icon: <DollarOutlined className="text-2xl" />,
    color: "from-emerald-500 to-green-600",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
  },
  {
    title: "Transaksi",
    value: "0",
    icon: <ShoppingCartOutlined className="text-2xl" />,
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50 dark:bg-blue-500/10",
  },
  {
    title: "Produk Terjual",
    value: "0",
    icon: <RiseOutlined className="text-2xl" />,
    color: "from-orange-500 to-amber-600",
    bg: "bg-orange-50 dark:bg-orange-500/10",
  },
  {
    title: "Pelanggan",
    value: "0",
    icon: <TeamOutlined className="text-2xl" />,
    color: "from-purple-500 to-violet-600",
    bg: "bg-purple-50 dark:bg-purple-500/10",
  },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "loading") return <LoadingSkeleton type="stat" />;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Selamat datang, {session?.user?.name?.split(" ")[0] ?? "User"}
          </h1>
          <StatusBadge status={session?.user?.status ?? "ACTIVE"} />
        </div>
        <p className="text-gray-500 dark:text-gray-400">
          Ringkasan bisnis Anda hari ini
        </p>
      </div>

      {/* Stat cards */}
      <Row gutter={[16, 16]}>
        {stats.map((stat) => (
          <Col xs={24} sm={12} lg={6} key={stat.title}>
            <Card
              className="!border-0 !shadow-sm hover:!shadow-md transition-shadow duration-200"
              classNames={{
                body: "p-5",
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-lg`}
                >
                  {stat.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
