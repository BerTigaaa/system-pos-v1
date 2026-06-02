"use client";

import { useState, useEffect } from "react";
import { Card, Statistic, Row, Col, Select, Spin, Button, Dropdown, Space } from "antd";
import { useToast } from "@/components/ui/toast";
import { ArrowUpOutlined, ArrowDownOutlined, DollarOutlined, ShoppingCartOutlined, DownloadOutlined } from "@ant-design/icons";
import { getFinanceSummary, exportFinance } from "../actions";

export function FinanceSummary() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<{
    sales: number;
    cashIn: number;
    totalRevenue: number;
    hpp: number;
    grossProfit: number;
    cashOut: number;
    netProfit: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    getFinanceSummary({ month, year }).then((res) => {
      if (res.success && res.data) setData(res.data);
      setLoading(false);
    });
  }, [month, year]);

  async function handleExport(format: "xlsx" | "pdf") {
    toast.info("Menyiapkan file...");
    const res = await exportFinance({ type: "summary", format, month, year });
    if (res.success && res.data) {
      const { buffer, contentType, extension } = res.data;
      const blob = new Blob([new Uint8Array(buffer)], { type: contentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rekap-keuangan-${month}-${year}.${extension}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("File diunduh");
    } else {
      toast.error(res.error?.message ?? "Gagal export");
    }
  }

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];

  if (loading) return <div className="flex justify-center py-16"><Spin /></div>;
  if (!data) return <div className="text-center py-16 text-gray-400">Data tidak tersedia</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Space>
          <Select
            value={month}
            onChange={setMonth}
            style={{ width: 160 }}
            options={months.map((m, i) => ({ label: m, value: i + 1 }))}
          />
          <Select
            value={year}
            onChange={setYear}
            style={{ width: 120 }}
            options={[2025, 2026, 2027].map((y) => ({ label: String(y), value: y }))}
          />
        </Space>
        <Dropdown
          menu={{
            items: [
              { key: "xlsx", label: "Excel (.xlsx)", onClick: () => handleExport("xlsx") },
              { key: "pdf", label: "PDF (.pdf)", onClick: () => handleExport("pdf") },
            ],
          }}
        >
          <Button icon={<DownloadOutlined />}>Export</Button>
        </Dropdown>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Penjualan"
              value={data.sales}
              prefix={<ShoppingCartOutlined />}
              suffix="Rp"
              precision={0}
              styles={{ content: { color: "#1677ff" } }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Kas Masuk"
              value={data.cashIn}
              prefix={<ArrowUpOutlined />}
              suffix="Rp"
              precision={0}
              styles={{ content: { color: "#52c41a" } }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Pendapatan"
              value={data.totalRevenue}
              prefix={<DollarOutlined />}
              suffix="Rp"
              precision={0}
              styles={{ content: { color: "#1677ff" } }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card>
            <Statistic
              title="HPP"
              value={data.hpp}
              prefix={<ArrowDownOutlined />}
              suffix="Rp"
              precision={0}
              styles={{ content: { color: "#faad14" } }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Gross Profit"
              value={data.grossProfit}
              prefix={<DollarOutlined />}
              suffix="Rp"
              precision={0}
              styles={{ content: { color: data.grossProfit >= 0 ? "#52c41a" : "#ff4d4f" } }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Kas Keluar"
              value={data.cashOut}
              prefix={<ArrowDownOutlined />}
              suffix="Rp"
              precision={0}
              styles={{ content: { color: "#ff4d4f" } }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Net Profit"
              value={data.netProfit}
              prefix={<DollarOutlined />}
              suffix="Rp"
              precision={0}
              styles={{ content: { color: data.netProfit >= 0 ? "#52c41a" : "#ff4d4f", fontWeight: 700 } }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
