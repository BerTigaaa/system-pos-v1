"use client";

import { useState, useEffect, useCallback } from "react";
import { Select, Table, Spin } from "antd";
import { getYearlySales } from "../actions";
import type { YearlySalesRow } from "../types";

export function YearlySalesReport() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<YearlySalesRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getYearlySales(year);
      if (res.success) setData(res.data as YearlySalesRow[]);
    } catch (err) {
      console.error("Gagal memuat laporan tahunan:", err);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { load(); }, [load]);

  const totalTransaksi = data.reduce((s, r) => s + r.transactionCount, 0);
  const totalRevenue = data.reduce((s, r) => s + r.totalRevenue, 0);

  const columns = [
    { title: "Bulan", dataIndex: "monthName", key: "monthName", width: 120 },
    { title: "Transaksi", dataIndex: "transactionCount", key: "transactionCount", width: 100, align: "center" as const },
    {
      title: "Pendapatan",
      dataIndex: "totalRevenue",
      key: "totalRevenue",
      width: 150,
      align: "right" as const,
      render: (v: number) => `Rp ${v.toLocaleString("id")}`,
    },
  ];

  if (loading) return <div className="flex justify-center py-16"><Spin /></div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Select value={year} onChange={setYear} style={{ width: 120 }} options={[2025, 2026, 2027].map((y) => ({ label: String(y), value: y }))} />
      </div>
      <div className="flex gap-6 text-sm">
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3">
          <span className="text-gray-500">Total Transaksi</span>
          <div className="text-xl font-bold">{totalTransaksi}</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3">
          <span className="text-gray-500">Pendapatan</span>
          <div className="text-xl font-bold text-green-600">Rp {totalRevenue.toLocaleString("id")}</div>
        </div>
      </div>
      <Table
        dataSource={data}
        columns={columns}
        rowKey="month"
        pagination={false}
        size="small"
      />
    </div>
  );
}
