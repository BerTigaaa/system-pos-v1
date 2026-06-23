"use client";

import { useState, useEffect, useCallback } from "react";
import { Select, Table, Tag, Spin } from "antd";
import { getStockReport } from "../actions";
import { getRawMaterialCategories } from "@/features/raw-materials/actions";
import type { StockReportRow } from "../types";

export function StockReport() {
  const [data, setData] = useState<StockReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>();
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    getRawMaterialCategories().then((res) => {
      if (res.success) setCategories(res.data);
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStockReport(category);
      if (res.success) setData(res.data as StockReportRow[]);
    } catch (err) {
      console.error("Gagal memuat laporan stok:", err);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => { load(); }, [load]);

  const statusConfig: Record<string, { color: string; label: string }> = {
    in_stock: { color: "green", label: "Tersedia" },
    low: { color: "orange", label: "Hampir Habis" },
    out: { color: "red", label: "Habis" },
  };

  const columns = [
    { title: "Bahan Baku", dataIndex: "name", key: "name" },
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
      title: "Satuan",
      dataIndex: "unit",
      key: "unit",
      width: 80,
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
          value={category}
          onChange={setCategory}
          options={categories.map((c) => ({ label: c, value: c }))}
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
