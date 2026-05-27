"use client";

import { useState } from "react";
import { Tabs } from "antd";
import { MovementList } from "@/features/inventory/components/movement-list";
import { AdjustmentForm } from "@/features/inventory/components/adjustment-form";
import { SupplierTable } from "@/features/suppliers/components/supplier-table";

export function InventoryClient() {
  const [tab, setTab] = useState("movements");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gudang</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manajemen stok & supplier</p>
      </div>

      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: "movements",
            label: "Riwayat Stok",
            children: <MovementList />,
          },
          {
            key: "adjustment",
            label: "Penyesuaian Stok",
            children: <AdjustmentForm />,
          },
          {
            key: "suppliers",
            label: "Supplier",
            children: <SupplierTable />,
          },
        ]}
      />
    </div>
  );
}
