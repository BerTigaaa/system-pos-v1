"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Space, Select, DatePicker } from "antd";
import { useToast } from "@/components/ui/toast";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { usePermissions } from "@/hooks/use-permissions";
import { getTransactions, exportTransactions } from "../actions";
import { TransactionDetail } from "./transaction-detail";
import { RefundModal } from "./refund-modal";
import { DownloadOutlined, SearchOutlined, EyeOutlined, DollarOutlined } from "@ant-design/icons";
import type { TransactionFilter } from "../types";

const { RangePicker } = DatePicker;

type TransactionRow = {
  id: string;
  invoiceNumber: string;
  cashierName: string;
  customerName: string | null;
  status: string;
  total: number;
  paymentMethods: string[];
  createdAt: Date;
  itemCount: number;
};

export function TransactionTable() {
  const toast = useToast();
  const { can } = usePermissions();
  const [data, setData] = useState<TransactionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>();
  const [paymentFilter, setPaymentFilter] = useState<string>();
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [refundTarget, setRefundTarget] = useState<{
    transactionId: string;
    invoiceNumber: string;
    items: { id: string; productName: string; quantity: number; sellPrice: number; subtotal: number }[];
  } | null>(null);

  const load = useCallback(async (p = page, ps = pageSize) => {
    setLoading(true);
    try {
      const params: TransactionFilter = { page: p, pageSize: ps };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter as TransactionFilter["status"];
      if (paymentFilter) params.paymentMethod = paymentFilter as TransactionFilter["paymentMethod"];
      if (dateRange) {
        params.dateFrom = dateRange[0];
        params.dateTo = dateRange[1];
      }
      const res = await getTransactions(params);
      if (res.success) {
        setData(res.data as TransactionRow[]);
        setTotal(res.total);
      } else {
        toast.error(res.error?.message ?? "Gagal memuat data");
      }
    } catch (err) {
      console.error("Gagal memuat transaksi:", err);
      toast.error("Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter, paymentFilter, dateRange]);

  useEffect(() => { load(); }, [load]);

  function handleView(id: string) {
    setSelectedId(id);
    setDetailOpen(true);
  }

  function handleExport(format: "xlsx" | "pdf") {
    toast.info("Menyiapkan file...");
    exportTransactions({
      search,
      status: statusFilter,
      paymentMethod: paymentFilter,
      dateFrom: dateRange?.[0],
      dateTo: dateRange?.[1],
      format,
    }).then((res) => {
      if (res.success && res.data) {
        const { buffer, contentType, extension } = res.data;
        const blob = new Blob([new Uint8Array(buffer)], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `transaksi.${extension}`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("File diunduh");
      } else {
        toast.error(res.error?.message ?? "Gagal export");
      }
    });
  }

  const columns = [
    {
      title: "Invoice",
      dataIndex: "invoiceNumber",
      key: "invoiceNumber",
      width: 200,
      render: (v: string) => (
        <span className="font-mono text-sm font-medium">{v}</span>
      ),
    },
    {
      title: "Tanggal",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 170,
      render: (v: Date) => new Date(v).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
    {
      title: "Kasir",
      dataIndex: "cashierName",
      key: "cashierName",
      width: 150,
    },
    {
      title: "Pelanggan",
      dataIndex: "customerName",
      key: "customerName",
      width: 150,
      render: (v: string | null) => v ?? "-",
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      width: 140,
      align: "right" as const,
      render: (v: number) => (
        <span className="font-semibold">Rp {v.toLocaleString("id")}</span>
      ),
    },
    {
      title: "Pembayaran",
      dataIndex: "paymentMethods",
      key: "paymentMethods",
      width: 140,
      render: (v: string[]) => v.join(", "),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (v: string) => <StatusBadge status={v} />,
    },
    {
      title: "Aksi",
      key: "action",
      width: 140,
      render: (_: unknown, r: TransactionRow) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(r.id)}
          />
          {can("refund", "create") && r.status === "COMPLETED" && (
            <Button
              size="small"
              icon={<DollarOutlined />}
              onClick={() => handleView(r.id)}
            >
              Refund
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Cari invoice..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-56 pl-8 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <Select
            allowClear
            placeholder="Status"
            style={{ width: 140 }}
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
            options={[
              { label: "Selesai", value: "COMPLETED" },
              { label: "Direfund", value: "REFUNDED" },
              { label: "Refund Sebagian", value: "PARTIALLY_REFUNDED" },
              { label: "Dibatalkan", value: "CANCELLED" },
            ]}
          />
          <Select
            allowClear
            placeholder="Pembayaran"
            style={{ width: 150 }}
            value={paymentFilter}
            onChange={(v) => { setPaymentFilter(v); setPage(1); }}
            options={[
              { label: "Tunai", value: "CASH" },
              { label: "QRIS", value: "QRIS" },
              { label: "Transfer", value: "BANK_TRANSFER" },
              { label: "Debit", value: "DEBIT_CARD" },
              { label: "Kredit", value: "CREDIT_CARD" },
            ]}
          />
          <RangePicker
            onChange={(_, dateStrings) => {
              if (dateStrings[0] && dateStrings[1]) {
                setDateRange([dateStrings[0], dateStrings[1]]);
              } else {
                setDateRange(null);
              }
              setPage(1);
            }}
          />
        </div>
        <div className="flex gap-2">
          <Button icon={<DownloadOutlined />} onClick={() => handleExport("xlsx")}>
            Excel
          </Button>
          <Button icon={<DownloadOutlined />} onClick={() => handleExport("pdf")}>
            PDF
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
        }}
        onRow={(record: TransactionRow) => ({
          onClick: () => handleView(record.id),
          style: { cursor: "pointer" },
        })}
      />

      <TransactionDetail
        transactionId={selectedId}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedId(null); }}
        onRefund={(tx) => {
          setDetailOpen(false);
          setRefundTarget(tx);
        }}
      />

      <RefundModal
        target={refundTarget}
        onClose={() => setRefundTarget(null)}
        onSuccess={() => { setRefundTarget(null); load(); }}
      />
    </div>
  );
}
