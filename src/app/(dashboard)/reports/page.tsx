"use client";

import { Tabs } from "antd";
import { PageHeader } from "@/components/ui/page-header";
import { DailySalesReport } from "@/features/reports/components/daily-sales";
import { MonthlySalesReport } from "@/features/reports/components/monthly-sales";
import { YearlySalesReport } from "@/features/reports/components/yearly-sales";
import { TopProductsReport } from "@/features/reports/components/top-products";
import { CashierReport } from "@/features/reports/components/cashier-report";

export default function ReportsPage() {
  return (
    <div>
      <PageHeader title="Laporan" subtitle="Laporan penjualan dan aktivitas" />
      <div className="mt-4">
        <Tabs
          defaultActiveKey="daily"
          items={[
            { key: "daily", label: "Penjualan Harian", children: <DailySalesReport /> },
            { key: "monthly", label: "Penjualan Bulanan", children: <MonthlySalesReport /> },
            { key: "yearly", label: "Penjualan Tahunan", children: <YearlySalesReport /> },
            { key: "top-products", label: "Produk Terlaris", children: <TopProductsReport /> },
            { key: "cashier", label: "Aktivitas Kasir", children: <CashierReport /> },
          ]}
        />
      </div>
    </div>
  );
}
