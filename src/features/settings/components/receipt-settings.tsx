"use client";

import { useState, useEffect } from "react";
import { Card, Form, Switch, Input, Select, Button, Spin } from "antd";
import { useToast } from "@/components/ui/toast";
import { getSettings, saveSetting } from "@/features/settings/actions";

export function ReceiptSettings() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [header, setHeader] = useState("");
  const [footer, setFooter] = useState("Terima kasih telah berbelanja");
  const [showLogo, setShowLogo] = useState(true);
  const [paperSize, setPaperSize] = useState("58");

  useEffect(() => {
    getSettings().then((res) => {
      if (res.success && res.data) {
        setHeader(res.data.receipt_header || "");
        setFooter(res.data.receipt_footer || "Terima kasih telah berbelanja");
        setShowLogo(res.data.receipt_show_logo !== "false");
        setPaperSize(res.data.receipt_paper_size || "58");
      }
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    await saveSetting("receipt_header", header);
    await saveSetting("receipt_footer", footer);
    await saveSetting("receipt_show_logo", String(showLogo));
    await saveSetting("receipt_paper_size", paperSize);
    setSaving(false);
    toast.success("Pengaturan struk disimpan");
  }

  if (loading) return <Spin />;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium block mb-1">Header Struk</label>
        <Input.TextArea
          rows={2}
          value={header}
          onChange={(e) => setHeader(e.target.value)}
          placeholder="Nama usaha, alamat, telepon"
        />
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">Footer Struk</label>
        <Input.TextArea
          rows={2}
          value={footer}
          onChange={(e) => setFooter(e.target.value)}
          placeholder="Ucapan terima kasih"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Tampilkan Logo di Struk</p>
        </div>
        <Switch checked={showLogo} onChange={setShowLogo} />
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">Ukuran Kertas</label>
        <Select
          value={paperSize}
          onChange={setPaperSize}
          style={{ width: 200 }}
          options={[
            { label: "58 mm (thermal kecil)", value: "58" },
            { label: "80 mm (thermal besar)", value: "80" },
          ]}
        />
      </div>

      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
        <p className="text-xs font-medium text-gray-500 mb-2">Preview Struk</p>
        <div className="bg-white dark:bg-gray-900 rounded-lg p-3 text-[10px] font-mono max-w-[200px] mx-auto">
          {header && <div className="text-center font-bold mb-1">{header}</div>}
          <div className="border-t border-dashed border-gray-300 my-1" />
          <div className="text-center text-gray-400">— Daftar Belanja —</div>
          <div className="border-t border-dashed border-gray-300 my-1" />
          <div className="text-center text-gray-400 mt-2">{footer}</div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="primary" onClick={handleSave} loading={saving}>
          Simpan Pengaturan Struk
        </Button>
      </div>
    </div>
  );
}
