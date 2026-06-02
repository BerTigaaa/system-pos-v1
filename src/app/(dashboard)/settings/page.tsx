"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Card, Switch, Button, Form, Input, Spin, QRCode, Tabs } from "antd";
import { SettingOutlined, TableOutlined, PlusOutlined, MinusOutlined, PrinterOutlined, DollarOutlined, FileTextOutlined, UserOutlined } from "@ant-design/icons";
import { getBusinessInfo, updateBusinessInfo, saveSelfOrderSettings, saveTableSettings, updateTableLabel } from "@/features/settings/actions";
import { TaxSettings } from "@/features/settings/components/tax-settings";
import { ReceiptSettings } from "@/features/settings/components/receipt-settings";
import { useToast } from "@/components/ui/toast";

type DiningTable = { id: string; tableNumber: number; label: string; isActive: boolean };
type BusinessData = {
  id: string; name: string; ownerName: string; address: string | null;
  phone: string | null; email: string | null; logoUrl: string | null; selfOrderEnabled: boolean; totalTables: number;
  diningTables: DiningTable[];
};

export default function SettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [savingBiz, setSavingBiz] = useState(false);
  const [savedData, setSavedData] = useState<BusinessData | null>(null);
  const [bizInit, setBizInit] = useState<Record<string, unknown> | null>(null);
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getBusinessInfo();
    if (res.success && res.data) {
      const d = res.data as BusinessData;
      setSavedData(d);
      setBizInit({
        name: d.name ?? "",
        ownerName: d.ownerName ?? "",
        address: d.address ?? "",
        phone: d.phone ?? "",
        email: d.email ?? "",
        logoUrl: d.logoUrl ?? "",
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaveBiz = async (values: Record<string, unknown>) => {
    setSavingBiz(true);
    const res = await updateBusinessInfo({
      name: (values.name as string) ?? "",
      ownerName: (values.ownerName as string) ?? "",
      address: (values.address as string) ?? "",
      phone: (values.phone as string) ?? "",
      email: (values.email as string) ?? "",
      logoUrl: (values.logoUrl as string) ?? "",
    });
    setSavingBiz(false);
    if (res.success) {
      toast.success("Informasi bisnis disimpan");
    } else {
      toast.error(res.error?.message ?? "Gagal menyimpan");
    }
  };

  if (loading) return <div className="flex justify-center py-24"><Spin size="large" /></div>;

  const selfOrderEnabled = savedData?.selfOrderEnabled ?? false;
  const totalTables = savedData?.totalTables ?? 0;
  const tables = (savedData?.diningTables ?? []).filter((t) => t.tableNumber <= totalTables);

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pengaturan</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Kelola informasi bisnis dan fitur</p>
      </div>

      <Tabs
        defaultActiveKey="business"
        items={[
          {
            key: "business",
            label: <span><SettingOutlined /> Bisnis</span>,
            children: (
              <Card>
                <Form layout="vertical" initialValues={bizInit ?? undefined} onFinish={handleSaveBiz}>
                  <Form.Item label="Nama Bisnis" name="name" rules={[{ required: true, message: "Wajib diisi" }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item label="Nama Pemilik" name="ownerName" rules={[{ required: true, message: "Wajib diisi" }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item label="Alamat" name="address">
                    <Input.TextArea rows={2} />
                  </Form.Item>
                  <Form.Item label="Telepon" name="phone">
                    <Input />
                  </Form.Item>
                  <Form.Item label="Email" name="email">
                    <Input type="email" />
                  </Form.Item>
                  <Form.Item label="Logo URL" name="logoUrl">
                    <div className="flex gap-2">
                      <Input placeholder="https://example.com/logo.png" />
                      {!!bizInit?.logoUrl && (
                        <img
                          src={bizInit.logoUrl as string}
                          alt="Preview"
                          className="w-10 h-10 rounded-lg object-cover border"
                        />
                      )}
                    </div>
                  </Form.Item>
                  <div className="flex justify-end">
                    <Button type="primary" htmlType="submit" loading={savingBiz}>
                      Simpan Informasi Bisnis
                    </Button>
                  </div>
                </Form>
              </Card>
            ),
          },
          {
            key: "pos",
            label: <span><DollarOutlined /> POS</span>,
            children: (
              <Card title="Konfigurasi POS">
                <TaxSettings />
              </Card>
            ),
          },
          {
            key: "receipt",
            label: <span><FileTextOutlined /> Struk</span>,
            children: (
              <Card title="Konfigurasi Struk">
                <ReceiptSettings />
              </Card>
            ),
          },
          {
            key: "tables",
            label: <span><TableOutlined /> Meja</span>,
            children: (
              <>
                <Card title="Self-Order" className="mb-6">
                  <SelfOrderForm
                    baseUrl={baseUrl}
                    savedData={savedData}
                    selfOrderEnabled={selfOrderEnabled}
                    totalTables={totalTables}
                    tables={tables}
                    onDataChanged={load}
                  />
                </Card>
                <Card title="Jumlah Meja">
                  <TableCountForm totalTables={totalTables} onDataChanged={load} />
                </Card>
              </>
            ),
          },
          {
            key: "employees",
            label: <span><UserOutlined /> Karyawan</span>,
            children: (
              <Card title="Manajemen Karyawan">
                <p className="text-gray-400 text-sm">Manajemen karyawan tersedia di halaman terpisah.</p>
                <Button type="link" onClick={() => window.location.href = "/employees"}>
                  Buka Manajemen Karyawan →
                </Button>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}

function SelfOrderForm({
  baseUrl,
  savedData,
  selfOrderEnabled,
  totalTables,
  tables,
  onDataChanged,
}: {
  baseUrl: string;
  savedData: BusinessData | null;
  selfOrderEnabled: boolean;
  totalTables: number;
  tables: DiningTable[];
  onDataChanged: () => Promise<void>;
}) {
  const toast = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(selfOrderEnabled);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [savingLabels, setSavingLabels] = useState(false);

  useEffect(() => {
    setEnabled(selfOrderEnabled);
  }, [selfOrderEnabled]);

  useEffect(() => {
    const init: Record<string, string> = {};
    tables.forEach((t) => { init[t.id] = t.label; });
    setLabels(init);
  }, [tables]);

  const handleToggle = async (v: boolean) => {
    setEnabled(v);
    const res = await saveSelfOrderSettings({ selfOrderEnabled: v });
    if (res.success) {
      toast.success(v ? "Pemesanan mandiri diaktifkan" : "Pemesanan mandiri dinonaktifkan");
      onDataChanged();
    } else {
      toast.error(res.error?.message ?? "Gagal");
      setEnabled(!v);
    }
  };

  const handleSaveLabels = async () => {
    setSavingLabels(true);
    const entries = Object.entries(labels);
    const results = await Promise.allSettled(
      entries.map(([id, label]) => updateTableLabel(id, label))
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    setSavingLabels(false);
    if (failed === 0) {
      toast.success("Semua label disimpan");
      onDataChanged();
    } else {
      toast.error(`${failed} label gagal disimpan`);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
      <head><title>QR Code Meja - ${savedData?.name ?? "BertigaPos"}</title>
      <style>
        body { font-family: sans-serif; padding: 20px; }
        h1 { font-size: 16px; margin-bottom: 20px; color: #333; }
        .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .card { text-align: center; border: 1px solid #eee; border-radius: 8px; padding: 12px; }
        .card img { max-width: 120px; }
        .label { margin-top: 8px; font-size: 12px; font-weight: 600; color: #555; }
        @media print { .no-print { display: none; } }
      </style>
      </head>
      <body>
        <h1>QR Code Meja - ${savedData?.name ?? ""}</h1>
        <div class="grid">
        ${tables.map((t) => `
          <div class="card">
            <img src="${process.env.NEXT_PUBLIC_QR_API_URL}?size=150x150&data=${encodeURIComponent(`${baseUrl}/order/${t.tableNumber}`)}" alt="${t.label || `Meja ${t.tableNumber}`}" width="120" height="120" />
            <div class="label">${t.label || `Meja ${t.tableNumber}`}</div>
          </div>`).join("")}
        </div>
        <p class="no-print" style="margin-top:20px;color:#999;font-size:11px;">${baseUrl}</p>
        <script>window.onload = function() { window.print(); window.close(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div>
      {/* Toggle Self-Order */}
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">Aktifkan Pemesanan Mandiri</p>
          <p className="text-xs text-gray-500">Pelanggan dapat memesan dari meja masing-masing</p>
        </div>
        <Switch checked={enabled} onChange={handleToggle} />
      </div>

      {enabled && (
        <>
          {/* Label Meja */}
          {tables.length > 0 && (
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Label Meja</label>
              <div className="space-y-2 mb-4">
                {tables.map((t) => (
                  <div key={t.id} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500 w-20 shrink-0">
                      Meja {t.tableNumber}
                    </span>
                    <Input
                      value={labels[t.id] ?? ""}
                      onChange={(e) => setLabels((prev) => ({ ...prev, [t.id]: e.target.value }))}
                      placeholder="Label meja"
                      className="!flex-1"
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Button type="primary" htmlType="button" loading={savingLabels} onClick={handleSaveLabels}>
                  Simpan Label
                </Button>
              </div>
            </div>
          )}

          {/* QR Code */}
          {tables.length > 0 && (
            <div className="mb-6 pb-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-gray-500">QR Code Meja</p>
                <Button
                  htmlType="button"
                  size="small"
                  icon={<PrinterOutlined />}
                  onClick={handlePrint}
                  disabled={!baseUrl}
                >
                  Cetak QR
                </Button>
              </div>
              <div ref={printRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {tables.map((t) => (
                  <div key={t.id} className="flex flex-col items-center p-3 rounded-xl border border-gray-100 bg-gray-50">
                    <QRCode value={`${baseUrl}/order/${t.tableNumber}`} size={100} bordered={false} />
                    <p className="text-xs font-medium text-gray-600 mt-2">{t.label || `Meja ${t.tableNumber}`}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalTables === 0 && (
            <p className="text-sm text-gray-400 italic">Belum ada meja. Atur jumlah meja terlebih dahulu.</p>
          )}
        </>
      )}
    </div>
  );
}

function TableCountForm({
  totalTables,
  onDataChanged,
}: {
  totalTables: number;
  onDataChanged: () => Promise<void>;
}) {
  const toast = useToast();
  const [tableCount, setTableCount] = useState(totalTables);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTableCount(totalTables);
  }, [totalTables]);

  const handleSave = async () => {
    setSaving(true);
    const res = await saveTableSettings({ totalTables: tableCount });
    setSaving(false);
    if (res.success) {
      toast.success("Jumlah meja diperbarui");
      onDataChanged();
    } else {
      toast.error(res.error?.message ?? "Gagal");
    }
  };

  return (
    <div>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Jumlah Meja</label>
      <div className="flex items-center gap-2 mb-4">
        <Button
          htmlType="button"
          icon={<MinusOutlined />}
          disabled={tableCount <= 0 || saving}
          onClick={() => setTableCount(Math.max(0, tableCount - 1))}
        />
        <span className="text-lg font-bold tabular-nums w-8 text-center">{tableCount}</span>
        <Button
          htmlType="button"
          icon={<PlusOutlined />}
          disabled={tableCount >= 99 || saving}
          onClick={() => setTableCount(Math.min(99, tableCount + 1))}
        />
      </div>
      <div className="flex justify-end">
        <Button type="primary" htmlType="button" loading={saving} onClick={handleSave}>
          Simpan Jumlah Meja
        </Button>
      </div>
    </div>
  );
}


