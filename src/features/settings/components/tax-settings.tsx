"use client";

import { useState, useEffect } from "react";
import { Card, Form, Switch, Input, InputNumber, Select, Button, Spin } from "antd";
import { useToast } from "@/components/ui/toast";
import { getSettings, saveSetting } from "@/features/settings/actions";

export function TaxSettings() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [percentage, setPercentage] = useState(11);
  const [invoicePrefix, setInvoicePrefix] = useState("INV");

  useEffect(() => {
    getSettings().then((res) => {
      if (res.success && res.data) {
        setEnabled(res.data.tax_enabled === "true");
        setPercentage(Number(res.data.tax_percentage) || 11);
        setInvoicePrefix(res.data.invoice_prefix || "INV");
      }
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    await saveSetting("tax_enabled", String(enabled));
    await saveSetting("tax_percentage", String(percentage));
    await saveSetting("invoice_prefix", invoicePrefix);
    setSaving(false);
    toast.success("Pengaturan pajak disimpan");
  }

  if (loading) return <Spin />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Aktifkan Pajak (PPN)</p>
          <p className="text-xs text-gray-500">Pajak akan ditambahkan otomatis di transaksi POS</p>
        </div>
        <Switch checked={enabled} onChange={setEnabled} />
      </div>

      {enabled && (
        <div>
          <label className="text-sm font-medium block mb-1">Persentase PPN (%)</label>
          <InputNumber
            min={0}
            max={100}
            value={percentage}
            onChange={(v) => setPercentage(v ?? 11)}
            className="w-full"
          />
        </div>
      )}

      <div>
        <label className="text-sm font-medium block mb-1">Prefix Nomor Invoice</label>
        <Input value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)} />
      </div>

      <div className="flex justify-end">
        <Button type="primary" onClick={handleSave} loading={saving}>
          Simpan Pengaturan POS
        </Button>
      </div>
    </div>
  );
}
