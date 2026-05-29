"use client";

import { useState, useEffect, useCallback } from "react";
import { Select, Table, Tag, Spin } from "antd";
import { getStockReport } from "../actions";
import type { StockReportRow } from "../types";

export function StockReport() {
  const [data, setData] = useState<StockReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryId, setCategoryId] = useState<string>();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    import("@/features/products/actions").then((m) =>
      m.getCategories().then((res) => {
        if (res.success) setCategories(res.data as { id: string; name: string }[]);
      })
    );
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getStockReport(categoryId);
    if (res.success) setData(res.data as StockReportRow[]);
    setLoading(false);
  }, [categoryId]);

  useEffect(() => { load(); }, [load]);

  const statusConfig: Record<string, { color: string; label: string }> = {
    in_stock: { color: "green", label: "Tersedia" },
    low: { color: "orange", label: "Hampir Habis" },
    out: { color: "red", label: "Habis" },
  };

  const columns = [
    { title: "Produk", dataIndex: "name", key: "name" },
    { title: "SKU", dataIndex: "sku", key: "sku", width: 120 },
    {
      title: "Kategori",
      dataIndex: "categoryName",
      key: "categoryName",
      width: 120,
      render: (v: string | null) => v ?? "-",
    },
    {
      title: "Stok",
      dataIndex: "stock",
      key: "stock",
      width: 80,
      align: "center" as const,
      render: (v: number, r: StockReportRow) => (
        <span className={r.status !== "in_stock" ? "font-bold" : ""}>{v}</span>
      ),
    },
    {
      title: "Min Stok",
      dataIndex: "minStock",
      key: "minStock",
      width: 80,
      align: "center" as const,
    },
    {
      title: "Harga Beli",
      dataIndex: "buyPrice",
      key: "buyPrice",
      width: 120,
      align: "right" as const,
      render: (v: number) => `Rp ${v.toLocaleString("id")}`,
    },
    {
      title: "Harga Jual",
      dataIndex: "sellPrice",
      key: "sellPrice",
      width: 120,
      align: "right" as const,
      render: (v: number) => `Rp ${v.toLocaleString("id")}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (v: string) => {
        const cfg = statusConfig[v] ?? { color: "default", label: v };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
  ];

  if (loading) return <div className="flex justify-center py-16"><Spin /></div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Select
          allowClear
          placeholder="Kategori"
          style={{ width: 160 }}
          value={categoryId}
          onChange={setCategoryId}
          options={categories.map((c) => ({ label: c.name, value: c.id }))}
        />
      </div>
      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 20 }}
        size="small"
      />
    </div>
  );
}
