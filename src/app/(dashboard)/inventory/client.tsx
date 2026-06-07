"use client";

import { useState } from "react";
import { Tabs } from "antd";
import { SupplierTable } from "@/features/suppliers/components/supplier-table";
import { RawMaterialTable } from "@/features/raw-materials/components/raw-material-table";
import { StockInForm } from "@/features/raw-materials/components/stock-in-form";
import { StockOutForm } from "@/features/raw-materials/components/stock-out-form";
import { ExpiryWarning } from "@/features/raw-materials/components/expiry-warning";
import { RawMaterialMovementList } from "@/features/raw-materials/components/raw-material-movement-list";

export function InventoryClient() {
  const [tab, setTab] = useState("raw-materials");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gudang</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manajemen bahan baku, stok & supplier</p>
      </div>

      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: "raw-materials",
            label: "Bahan Baku",
            children: <RawMaterialTable />,
          },
          {
            key: "stock-in",
            label: "Stok Masuk",
            children: <StockInForm />,
          },
          {
            key: "stock-out",
            label: "Stok Keluar",
            children: <StockOutForm />,
          },
          {
            key: "rm-movements",
            label: "Riwayat Bahan Baku",
            children: <RawMaterialMovementList />,
          },
          {
            key: "expiry",
            label: "Kadaluwarsa",
            children: <ExpiryWarning />,
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
