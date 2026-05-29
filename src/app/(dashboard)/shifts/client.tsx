"use client";

import { useState, useCallback } from "react";
import { Modal, Form, InputNumber, Input, Button } from "antd";
import { useToast } from "@/components/ui/toast";
import { ShiftHeader } from "@/features/shifts/components/shift-header";
import { ShiftList } from "@/features/shifts/components/shift-list";
import { closeShift } from "@/features/shifts/actions";
import type { ShiftItem } from "@/features/shifts/types";

export function ShiftsClient() {
  const toast = useToast();
  const [closeTarget, setCloseTarget] = useState<ShiftItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleClose = async (values: { closingBalance: number; notes?: string }) => {
    if (!closeTarget) return;
    setSubmitting(true);
    const fd = new FormData();
    fd.set("closingBalance", String(values.closingBalance));
    if (values.notes) fd.set("notes", values.notes);
    const res = await closeShift(closeTarget.id, fd);
    if (res.success) {
      toast.success("Shift ditutup");
      setCloseTarget(null);
      form.resetFields();
      triggerRefresh();
    } else {
      toast.error(res?.error?.message ?? "Gagal");
    }
    setSubmitting(false);
  };

  return (
    <div key={refreshKey}>
      <ShiftHeader onChanged={triggerRefresh} />
      <div className="mt-8">
        <ShiftList onClose={setCloseTarget} />
      </div>

      <Modal
        title="Tutup Shift"
        open={!!closeTarget}
        onCancel={() => { setCloseTarget(null); form.resetFields(); }}
        footer={null}
        width={500}
        destroyOnHidden
      >
        <p className="text-sm text-gray-500 mb-4">
          Tutup shift milik <strong>{closeTarget?.userName}</strong>?
        </p>
        <Form form={form} layout="vertical" onFinish={handleClose}>
          <Form.Item
            name="closingBalance"
            label="Saldo Akhir"
            rules={[{ required: true, message: "Masukkan saldo akhir" }]}
          >
            <InputNumber
              className="!w-full"
              min={0}
              prefix="Rp"
              placeholder="0"
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
            />
          </Form.Item>
          <Form.Item name="notes" label="Catatan">
            <Input.TextArea rows={3} placeholder="Catatan (opsional)" />
          </Form.Item>
          <Form.Item className="mb-0 text-right">
            <Button onClick={() => { setCloseTarget(null); form.resetFields(); }} className="mr-2">
              Batal
            </Button>
            <Button type="primary" htmlType="submit" loading={submitting} danger>
              Tutup Shift
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
