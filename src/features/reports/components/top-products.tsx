"use client";

import { useState, useEffect, useCallback } from "react";
import { Select, DatePicker, Table, Spin } from "antd";
import { getTopProducts } from "../actions";
import type { TopProductRow } from "../types";

const { RangePicker } = DatePicker;

export function TopProductsReport() {
  const [data, setData] = useState<TopProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryId, setCategoryId] = useState<string>();
  const [dateFrom, setDateFrom] = useState<string>();
  const [dateTo, setDateTo] = useState<string>();
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
    try {
      const res = await getTopProducts({ dateFrom, dateTo, categoryId });
      if (res.success) setData(res.data as TopProductRow[]);
    } catch (err) {
      console.error("Gagal memuat produk terlaris:", err);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, categoryId]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { title: "Produk", dataIndex: "productName", key: "productName" },
    {
      title: "Kategori",
      dataIndex: "categoryName",
      key: "categoryName",
      width: 120,
      render: (v: string | null) => v ?? "-",
    },
    {
      title: "Terjual",
      dataIndex: "totalQuantity",
      key: "totalQuantity",
      width: 80,
      align: "center" as const,
    },
    {
      title: "Revenue",
      dataIndex: "totalRevenue",
      key: "totalRevenue",
      width: 140,
      align: "right" as const,
      render: (v: number) => `Rp ${v.toLocaleString("id")}`,
    },
    {
      title: "Laba Kotor",
      dataIndex: "grossProfit",
      key: "grossProfit",
      width: 140,
      align: "right" as const,
      render: (v: number) => (
        <span className={v >= 0 ? "text-green-600" : "text-red-500"}>Rp {v.toLocaleString("id")}</span>
      ),
    },
  ];

  if (loading) return <div className="flex justify-center py-16"><Spin /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <RangePicker
          onChange={(_, dateStrings) => {
            if (dateStrings[0] && dateStrings[1]) {
              setDateFrom(dateStrings[0]);
              setDateTo(dateStrings[1]);
            } else {
              setDateFrom(undefined);
              setDateTo(undefined);
            }
          }}
        />
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
        rowKey="productId"
        pagination={{ pageSize: 10 }}
        size="small"
      />
    </div>
  );
}
