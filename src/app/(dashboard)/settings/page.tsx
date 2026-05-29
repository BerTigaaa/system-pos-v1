"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Card, Switch, Button, Form, Input, Spin, QRCode, Tabs } from "antd";
import { SettingOutlined, TableOutlined, PlusOutlined, MinusOutlined, PrinterOutlined, DollarOutlined, FileTextOutlined, UserOutlined } from "@ant-design/icons";
import { getBusinessInfo, updateBusinessInfo, saveSelfOrderSettings, saveTableSettings } from "@/features/settings/actions";
import { TaxSettings } from "@/features/settings/components/tax-settings";
import { ReceiptSettings } from "@/features/settings/components/receipt-settings";
import { useToast } from "@/components/ui/toast";
import { usePermissions } from "@/hooks/use-permissions";

type DiningTable = { id: string; tableNumber: number; isActive: boolean };
type BusinessData = {
  id: string; name: string; ownerName: string; address: string | null;
  phone: string | null; email: string | null; selfOrderEnabled: boolean; totalTables: number;
  diningTables: DiningTable[];
};

export default function SettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [savingBiz, setSavingBiz] = useState(false);
  const [savingSO, setSavingSO] = useState(false);
  const [savingTable, setSavingTable] = useState(false);
  const [savedData, setSavedData] = useState<BusinessData | null>(null);
  const [bizInit, setBizInit] = useState<Record<string, unknown> | null>(null);
  const [soInit, setSoInit] = useState<Record<string, unknown> | null>(null);
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
      });
      setSoInit({
        selfOrderEnabled: d.selfOrderEnabled ?? false,
        totalTables: d.totalTables ?? 0,
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
    });
    setSavingBiz(false);
    if (res.success) {
      toast.success("Informasi bisnis disimpan");
    } else {
      toast.error(res.error?.message ?? "Gagal menyimpan");
    }
  };

  const handleSaveSO = async (values: Record<string, unknown>) => {
    setSavingSO(true);
    const res = await saveSelfOrderSettings({
      selfOrderEnabled: values.selfOrderEnabled as boolean,
    });
    setSavingSO(false);
    if (res.success) {
      toast.success("Pengaturan pemesanan disimpan");
      load();
    } else {
      toast.error(res.error?.message ?? "Gagal menyimpan");
    }
  };

  const handleSaveTable = async (values: Record<string, unknown>) => {
    setSavingTable(true);
    const res = await saveTableSettings({
      totalTables: values.totalTables as number,
    });
    setSavingTable(false);
    if (res.success) {
      toast.success("Jumlah meja diperbarui");
      load();
    } else {
      toast.error(res.error?.message ?? "Gagal menyimpan");
    }
  };

  if (loading) return <div className="flex justify-center py-24"><Spin size="large" /></div>;

  const soValues = soInit as { selfOrderEnabled: boolean; totalTables: number } | null;
  const selfOrderEnabled = soValues?.selfOrderEnabled ?? false;
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
                  {soInit && (
                    <SelfOrderForm
                      key={JSON.stringify(soInit)}
                      initialValues={soInit as { selfOrderEnabled: boolean; totalTables: number }}
                      baseUrl={baseUrl}
                      savedData={savedData}
                      onSave={handleSaveSO}
                      saving={savingSO}
                    />
                  )}
                </Card>
                <Card title="Jumlah Meja">
                  <TableForm totalTables={totalTables} onSave={handleSaveTable} saving={savingTable} />
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

function TableForm({
  totalTables,
  onSave,
  saving,
}: {
  totalTables: number;
  onSave: (values: Record<string, unknown>) => Promise<void>;
  saving: boolean;
}) {
  const [form] = Form.useForm();
  const tableCount = Form.useWatch("totalTables", form) ?? totalTables;

  return (
    <Form form={form} layout="vertical" initialValues={{ totalTables }} onFinish={onSave}>
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Jumlah Meja</label>
        <div className="flex items-center gap-2">
          <Button
            htmlType="button"
            icon={<MinusOutlined />}
            disabled={tableCount <= 0}
            onClick={() => form.setFieldsValue({ totalTables: Math.max(0, tableCount - 1) })}
          />
          <span className="text-lg font-bold tabular-nums w-8 text-center">{tableCount}</span>
          <Button
            htmlType="button"
            icon={<PlusOutlined />}
            disabled={tableCount >= 99}
            onClick={() => form.setFieldsValue({ totalTables: Math.min(99, tableCount + 1) })}
          />
        </div>
      </div>
      <Form.Item name="totalTables" hidden>
        <Input />
      </Form.Item>
      <div className="flex justify-end pt-4 border-t border-gray-100">
        <Button type="primary" htmlType="submit" loading={saving}>
          Simpan Jumlah Meja
        </Button>
      </div>
    </Form>
  );
}

function SelfOrderForm({
  initialValues,
  baseUrl,
  savedData,
  onSave,
  saving,
}: {
  initialValues: { selfOrderEnabled: boolean; totalTables: number };
  baseUrl: string;
  savedData: BusinessData | null;
  onSave: (values: Record<string, unknown>) => Promise<void>;
  saving: boolean;
}) {
  const [form] = Form.useForm();
  const printRef = useRef<HTMLDivElement>(null);

  const selfOrderEnabled = Form.useWatch("selfOrderEnabled", form) ?? initialValues.selfOrderEnabled;
  const totalTables = savedData?.totalTables ?? 0;
  const tables = (savedData?.diningTables ?? []).filter((t) => t.tableNumber <= totalTables);

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
            <img src="${process.env.NEXT_PUBLIC_QR_API_URL}?size=150x150&data=${encodeURIComponent(`${baseUrl}/order/${t.tableNumber}`)}" alt="Meja ${t.tableNumber}" width="120" height="120" />
            <div class="label">Meja ${t.tableNumber}</div>
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
    <Form form={form} layout="vertical" initialValues={initialValues} onFinish={onSave}>
      <Form.Item name="selfOrderEnabled" valuePropName="checked" hidden>
        <Switch />
      </Form.Item>

      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">Aktifkan Pemesanan Mandiri</p>
          <p className="text-xs text-gray-500">Pelanggan dapat memesan dari meja masing-masing</p>
        </div>
        <Switch
          checked={selfOrderEnabled}
          onChange={(v) => {
            form.setFieldsValue({ selfOrderEnabled: v });
          }}
        />
      </div>

      {selfOrderEnabled && (
        <>
          {totalTables > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-gray-500">Tabel Meja — QR Code</p>
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
                    <p className="text-xs font-medium text-gray-600 mt-2">Meja {t.tableNumber}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {totalTables === 0 && (
            <p className="text-sm text-gray-400 italic mb-4">Tidak ada meja. Atur jumlah meja terlebih dahulu di bagian "Meja".</p>
          )}
        </>
      )}

      <div className="flex justify-end pt-4 border-t border-gray-100">
        <Button type="primary" htmlType="submit" loading={saving}>
          Simpan Pengaturan Pemesanan
        </Button>
      </div>
    </Form>
  );
}
