"use client";

import { useState } from "react";
import { Tabs } from "antd";
import { CashFlowList } from "@/features/finance/components/cash-flow-list";
import { FinanceSummary } from "@/features/finance/components/finance-summary";
import { PageHeader } from "@/components/ui/page-header";

export default function FinancePage() {
  return (
    <div>
      <PageHeader title="Keuangan" subtitle="Kas masuk, kas keluar, dan laporan keuangan" />
      <div className="mt-4">
        <Tabs
          defaultActiveKey="cash-in"
          items={[
            { key: "cash-in", label: "Kas Masuk", children: <CashFlowList flowType="IN" /> },
            { key: "cash-out", label: "Kas Keluar", children: <CashFlowList flowType="OUT" /> },
            { key: "summary", label: "Rekap", children: <FinanceSummary /> },
          ]}
        />
      </div>
    </div>
  );
}
