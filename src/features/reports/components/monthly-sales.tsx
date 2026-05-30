"use client";

import { useState, useEffect, useCallback } from "react";
import { Select, Table, Spin } from "antd";
import { getMonthlySales } from "../actions";
import type { MonthlySalesRow } from "../types";

export function MonthlySalesReport() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<MonthlySalesRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMonthlySales(month, year);
      if (res.success) setData(res.data as MonthlySalesRow[]);
    } catch (err) {
      console.error("Gagal memuat laporan bulanan:", err);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const totalTransaksi = data.reduce((s, r) => s + r.transactionCount, 0);
  const totalRevenue = data.reduce((s, r) => s + r.totalRevenue, 0);

  const months = Array.from({ length: 12 }, (_, i) => ({
    label: new Date(2000, i).toLocaleString("id", { month: "long" }),
    value: i + 1,
  }));

  const columns = [
    { title: "Tanggal", dataIndex: "date", key: "date", width: 120 },
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
        <Select value={month} onChange={setMonth} style={{ width: 160 }} options={months} />
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
        rowKey="day"
        pagination={false}
        size="small"
      />
    </div>
  );
}
