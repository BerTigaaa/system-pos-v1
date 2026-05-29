"use client";

import { useState, useEffect } from "react";
import { Drawer, Descriptions, Table, Button, Space, Spin } from "antd";
import { PrinterOutlined, DollarOutlined } from "@ant-design/icons";
import { useToast } from "@/components/ui/toast";
import { StatusBadge } from "@/components/ui/status-badge";
import { usePermissions } from "@/hooks/use-permissions";
import { getTransactionById } from "../actions";
import type { TransactionWithRelations } from "../types";

export function TransactionDetail({
  transactionId,
  open,
  onClose,
  onRefund,
}: {
  transactionId: string | null;
  open: boolean;
  onClose: () => void;
  onRefund?: (tx: {
    transactionId: string;
    invoiceNumber: string;
    items: { id: string; productName: string; quantity: number; sellPrice: number; subtotal: number }[];
  }) => void;
}) {
  const toast = useToast();
  const { can } = usePermissions();
  const [data, setData] = useState<TransactionWithRelations | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!transactionId || !open) return;
    setLoading(true);
    getTransactionById(transactionId).then((res) => {
      if (res.success && res.data) {
        setData(res.data as TransactionWithRelations);
      } else {
        toast.error(res.error?.message ?? "Gagal memuat detail");
      }
      setLoading(false);
    });
  }, [transactionId, open]);

  function handlePrint() {
    window.print();
  }

  function handleRefund() {
    if (!data) return;
    onRefund?.({
      transactionId: data.id,
      invoiceNumber: data.invoiceNumber,
      items: data.items.map((i) => ({
        id: i.id,
        productName: i.productName,
        quantity: i.quantity,
        sellPrice: i.sellPrice,
        subtotal: i.subtotal,
      })),
    });
  }

  const itemColumns = [
    { title: "Produk", dataIndex: "productName", key: "productName" },
    { title: "SKU", dataIndex: "productSku", key: "productSku", width: 120 },
    {
      title: "Harga",
      dataIndex: "sellPrice",
      key: "sellPrice",
      width: 120,
      align: "right" as const,
      render: (v: number) => `Rp ${v.toLocaleString("id")}`,
    },
    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      width: 80,
      align: "center" as const,
    },
    {
      title: "Diskon",
      dataIndex: "discountAmount",
      key: "discountAmount",
      width: 100,
      align: "right" as const,
      render: (v: number) => (v ? `Rp ${v.toLocaleString("id")}` : "-"),
    },
    {
      title: "Subtotal",
      dataIndex: "subtotal",
      key: "subtotal",
      width: 140,
      align: "right" as const,
      render: (v: number) => <span className="font-medium">Rp {v.toLocaleString("id")}</span>,
    },
  ];

  const refundColumns = [
    { title: "No. Refund", dataIndex: "refundNumber", key: "refundNumber", width: 180 },
    {
      title: "Total",
      dataIndex: "totalAmount",
      key: "totalAmount",
      width: 140,
      align: "right" as const,
      render: (v: number) => `Rp ${v.toLocaleString("id")}`,
    },
    { title: "Alasan", dataIndex: "reason", key: "reason" },
    { title: "Diproses Oleh", dataIndex: ["processedBy", "name"], key: "processedBy", width: 150 },
    {
      title: "Tanggal",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 170,
      render: (v: Date) => new Date(v).toLocaleString("id-ID"),
    },
  ];

  return (
    <Drawer
      title={data ? `Transaksi ${data.invoiceNumber}` : "Detail Transaksi"}
      open={open}
      onClose={onClose}
      size={640}
      extra={
        <Space>
          {can("refund", "create") && data?.status === "COMPLETED" && (
            <Button icon={<DollarOutlined />} onClick={handleRefund}>
              Refund
            </Button>
          )}
          <Button icon={<PrinterOutlined />} onClick={handlePrint}>
            Cetak Struk
          </Button>
        </Space>
      }
    >
      {loading ? (
        <div className="flex justify-center py-16"><Spin /></div>
      ) : !data ? (
        <div className="text-center py-16 text-gray-400">Data tidak ditemukan</div>
      ) : (
        <div className="space-y-6">
          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="Invoice" span={2}>
              <span className="font-mono font-medium">{data.invoiceNumber}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Tanggal">
              {new Date(data.createdAt).toLocaleString("id-ID")}
            </Descriptions.Item>
            <Descriptions.Item label="Kasir">{data.cashier.name}</Descriptions.Item>
            <Descriptions.Item label="Pelanggan">{data.customerName ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <StatusBadge status={data.status} />
            </Descriptions.Item>
            <Descriptions.Item label="Meja">{data.tableNumber ?? "-"}</Descriptions.Item>
          </Descriptions>

          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Item</h4>
            <Table
              dataSource={data.items}
              columns={itemColumns}
              rowKey="id"
              pagination={false}
              size="small"
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={4}>
                    <span className="font-medium">Subtotal</span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4}>
                    <span className="font-medium">Rp {data.discountAmount.toLocaleString("id")}</span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5}>
                    <span className="font-bold">Rp {data.subtotal.toLocaleString("id")}</span>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </div>

          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="Subtotal" span={2}>
              <div className="text-right">Rp {data.subtotal.toLocaleString("id")}</div>
            </Descriptions.Item>
            <Descriptions.Item label="Diskon" span={2}>
              <div className="text-right text-red-500">-Rp {data.discountAmount.toLocaleString("id")}</div>
            </Descriptions.Item>
            <Descriptions.Item label={`Pajak (${data.taxPercent}%)`} span={2}>
              <div className="text-right">Rp {data.taxAmount.toLocaleString("id")}</div>
            </Descriptions.Item>
            <Descriptions.Item label="Total" span={2}>
              <div className="text-right font-bold text-lg">Rp {data.total.toLocaleString("id")}</div>
            </Descriptions.Item>
          </Descriptions>

          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Pembayaran</h4>
            {data.payments.map((p) => (
              <div key={p.id} className="flex justify-between py-1 text-sm">
                <span className="font-medium">{p.method}</span>
                <span>Rp {p.amount.toLocaleString("id")}</span>
              </div>
            ))}
          </div>

          {data.refunds.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Riwayat Refund</h4>
              <Table
                dataSource={data.refunds}
                columns={refundColumns}
                rowKey="id"
                pagination={false}
                size="small"
                expandable={{
                  expandedRowRender: (record) => (
                    <div className="pl-4">
                      {record.items.map((ri) => {
                        const item = data.items.find((i) => i.id === ri.transactionItemId);
                        return (
                          <div key={ri.id} className="flex justify-between text-sm py-1">
                            <span>{item?.productName ?? ri.transactionItemId} x{ri.quantity}</span>
                            <span>Rp {ri.amount.toLocaleString("id")}</span>
                          </div>
                        );
                      })}
                    </div>
                  ),
                  rowExpandable: (record) => record.items.length > 0,
                }}
              />
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}
