"use client";

import { useState, useEffect, useCallback } from "react";
import { Select, Tag, Table } from "antd";
import { DataTable } from "@/components/ui/data-table";
import { getRawMaterialMovements } from "../actions";
import type { MovementItem } from "../types";

const typeColors: Record<string, string> = {
  STOCK_IN: "blue",
  STOCK_OUT: "orange",
  ADJUSTMENT: "purple",
  OPNAME: "cyan",
};

const typeLabels: Record<string, string> = {
  STOCK_IN: "Stok Masuk",
  STOCK_OUT: "Stok Keluar",
  ADJUSTMENT: "Penyesuaian",
  OPNAME: "Opname",
};

export function RawMaterialMovementList() {
  const [data, setData] = useState<MovementItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string | undefined>();

  const load = async (p = page, s = search, t = type) => {
    setLoading(true);
    const res = await getRawMaterialMovements({ page: p, search: s, type: t });
    if (res.success) {
      setData(res.data as MovementItem[]);
      setTotal(res.total);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const columns = [
    {
      title: "Waktu", dataIndex: "createdAt", key: "createdAt", width: 160,
      render: (v: string) => new Date(v).toLocaleString("id"),
    },
    { title: "Bahan Baku", dataIndex: "rawMaterialName", key: "rawMaterialName" },
    { title: "SKU", dataIndex: "rawMaterialSku", key: "rawMaterialSku" },
    {
      title: "Tipe", dataIndex: "type", key: "type", width: 120,
      render: (v: string) => <Tag color={typeColors[v]}>{typeLabels[v] ?? v}</Tag>,
    },
    {
      title: "Qty", dataIndex: "quantity", key: "quantity", width: 80,
      render: (v: number, r: MovementItem) => (
        <span className={r.type === "STOCK_IN" ? "text-green-600" : "text-red-600"}>
          {r.type === "STOCK_IN" ? `+${v}` : `-${v}`}
        </span>
      ),
    },
    { title: "Stok Sebelum", dataIndex: "stockBefore", key: "stockBefore", width: 100 },
    { title: "Stok Sesudah", dataIndex: "stockAfter", key: "stockAfter", width: 100 },
    { title: "Batch", dataIndex: "batchCode", key: "batchCode", render: (v: string | null) => v ?? "-" },
    { title: "Supplier", dataIndex: "supplierName", key: "supplierName", render: (v: string | null) => v ?? "-" },
    { title: "Keterangan", dataIndex: "reason", key: "reason", render: (v: string | null) => v ?? "-" },
    { title: "Oleh", dataIndex: "userName", key: "userName" },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Cari bahan baku..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); load(1, e.target.value, type); }}
          className="flex-1 max-w-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
        />
        <Select
          placeholder="Semua tipe"
          allowClear
          style={{ minWidth: 150 }}
          value={type}
          onChange={(v) => { setType(v); load(1, search, v); }}
          options={Object.entries(typeLabels).map(([value, label]) => ({ label, value }))}
        />
      </div>

      <DataTable
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ current: page, total, onChange: (p) => { setPage(p); load(p, search, type); } }}
      />
    </div>
  );
}
