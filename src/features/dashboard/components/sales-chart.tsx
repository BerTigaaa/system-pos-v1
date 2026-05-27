"use client";

import { useEffect, useState } from "react";
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
        <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
        Penjualan 7 Hari
      </h3>
      <div className="flex items-end gap-2 h-40">
        {data.map((d) => (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] text-gray-400">{d.count}x</span>
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-blue-500 to-blue-400 transition-all duration-500"
              style={{ height: `${(d.total / max) * 100}%`, minHeight: 4 }}
            />
            <span className="text-[10px] text-gray-500">{d.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
