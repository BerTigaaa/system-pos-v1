"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { getSalesChart } from "../actions";

export function SalesChart() {
  const [data, setData] = useState<{ date: string; total: number; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSalesChart(7).then((res) => {
      if (res.success) setData(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse">
        <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Penjualan 7 Hari</h3>
        <p className="text-sm text-gray-400 text-center py-12">Belum ada data penjualan</p>
      </div>
    );
  }

  const formatRupiah = (v: number) =>
    `Rp ${v.toLocaleString("id")}`;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Penjualan 7 Hari</h3>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            Total
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-cyan-400" />
            Transaksi
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="countGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#94A3B8" }}
            axisLine={{ stroke: "#E2E8F0" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94A3B8" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => Number(v) >= 1_000_000 ? `${(Number(v) / 1_000_000).toFixed(1)}jt` : Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(0)}rb` : `${v}`}
            width={50}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #E2E8F0",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              fontSize: 12,
            }}
            formatter={(value, name) => [
              name === "total" ? formatRupiah(Number(value)) : `${value}x`,
              name === "total" ? "Total Penjualan" : "Jumlah Transaksi",
            ]}
            labelFormatter={(label) => label}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#totalGradient)"
            dot={{ r: 3, fill: "#3B82F6", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#3B82F6", stroke: "#fff", strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#22D3EE"
            strokeWidth={2}
            fill="url(#countGradient)"
            dot={{ r: 3, fill: "#22D3EE", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#22D3EE", stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
