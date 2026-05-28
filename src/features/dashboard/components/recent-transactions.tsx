"use client";

import { useEffect, useState } from "react";
import { getRecentTransactions } from "../actions";

type Tx = {
  id: string;
  invoiceNumber: string;
  total: number;
  status: string;
  createdAt: Date;
  cashier: { name: string };
};

export function RecentTransactions() {
  const [data, setData] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecentTransactions(10).then((res) => {
      if (res.success) setData(res.data as Tx[]);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Transaksi Terbaru</h3>
        <p className="text-sm text-gray-400 text-center py-4">Belum ada transaksi</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Transaksi Terbaru</h3>
      <div className="space-y-2">
        {data.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">{tx.invoiceNumber}</div>
              <div className="text-xs text-gray-400">
                {tx.cashier.name} • {new Date(tx.createdAt).toLocaleTimeString("id", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              Rp {Number(tx.total).toLocaleString("id")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
