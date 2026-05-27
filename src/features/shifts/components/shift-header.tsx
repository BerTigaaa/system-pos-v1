"use client";

import { useEffect, useState } from "react";
import { Card, Button, Statistic, Modal, Form, InputNumber, Input } from "antd";
import { useToast } from "@/components/ui/toast";
import { PlayCircleOutlined, StopOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { usePermissions } from "@/hooks/use-permissions";
import { getActiveShift, openShift, closeShift } from "../actions";
import type { ShiftItem } from "../types";

export function ShiftHeader({ onChanged }: { onChanged: () => void }) {
  const toast = useToast();
  const { can } = usePermissions();
  const [active, setActive] = useState<ShiftItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [openForm] = Form.useForm();
  const [closeForm] = Form.useForm();

  const load = async () => {
    setLoading(true);
    const res = await getActiveShift();
    if (res.success) setActive(res.data as ShiftItem | null);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleOpen = async (values: { openingBalance: number; notes?: string }) => {
    setSubmitting(true);
    const fd = new FormData();
    fd.set("openingBalance", String(values.openingBalance));
    if (values.notes) fd.set("notes", values.notes);
    const res = await openShift(fd);
    if (res.success) {
      toast.success("Shift dibuka");
      setOpenModal(false);
      openForm.resetFields();
      await load();
      onChanged();
    } else {
      toast.error(res.error?.message ?? "Gagal");
    }
    setSubmitting(false);
  };

  const handleClose = async (values: { closingBalance: number; notes?: string }) => {
    if (!active) return;
    setSubmitting(true);
    const fd = new FormData();
    fd.set("closingBalance", String(values.closingBalance));
    if (values.notes) fd.set("notes", values.notes);
    const res = await closeShift(active.id, fd);
    if (res.success) {
      toast.success("Shift ditutup");
      setCloseModal(false);
      closeForm.resetFields();
      await load();
      onChanged();
    } else {
      toast.error(res?.error?.message ?? "Gagal");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <Card className="!border-0 !shadow-sm mb-6">
        <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
      </Card>
    );
  }

  return (
    <>
      <Card className="!border-0 !shadow-sm mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg ${
                active ? "bg-gradient-to-br from-emerald-500 to-green-600" : "bg-gradient-to-br from-gray-400 to-gray-500"
              }`}
            >
              {active ? <PlayCircleOutlined className="text-2xl" /> : <StopOutlined className="text-2xl" />}
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Status Shift</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {active ? "Shift Sedang Berjalan" : "Tidak Ada Shift Aktif"}
              </p>
              {active && (
                <p className="text-xs text-gray-400">
                  Dibuka {new Date(active.openedAt).toLocaleString("id")}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {active ? (
              <Statistic
                title="Penjualan"
                value={`Rp ${(active.totalSales ?? 0).toLocaleString("id")}`}
                prefix={<ClockCircleOutlined />}
                className="mr-6"
              />
            ) : null}

            {!active && can("shifts", "create") && (
              <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => setOpenModal(true)}>
                Buka Shift
              </Button>
            )}
            {active && can("shifts", "close") && (
              <Button danger icon={<StopOutlined />} onClick={() => setCloseModal(true)}>
                Tutup Shift
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Modal
        title="Buka Shift"
        open={openModal}
        onCancel={() => setOpenModal(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={openForm} layout="vertical" onFinish={handleOpen}>
          <Form.Item
            name="openingBalance"
            label="Saldo Awal"
            rules={[{ required: true, message: "Masukkan saldo awal" }]}
          >
            <InputNumber
              className="w-full"
              min={0}
              prefix="Rp"
              placeholder="0"
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                parser={(v) => Number(v?.replace(/\./g, "") ?? 0) as unknown as 0}
            />
          </Form.Item>
          <Form.Item name="notes" label="Catatan">
            <Input.TextArea rows={3} placeholder="Catatan (opsional)" />
          </Form.Item>
          <Form.Item className="mb-0 text-right">
            <Button onClick={() => setOpenModal(false)} className="mr-2">Batal</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>Buka Shift</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Tutup Shift"
        open={closeModal}
        onCancel={() => setCloseModal(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={closeForm} layout="vertical" onFinish={handleClose}>
          <Form.Item
            name="closingBalance"
            label="Saldo Akhir"
            rules={[{ required: true, message: "Masukkan saldo akhir" }]}
          >
            <InputNumber
              className="w-full"
              min={0}
              prefix="Rp"
              placeholder="0"
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                parser={(v) => Number(v?.replace(/\./g, "") ?? 0) as unknown as 0}
            />
          </Form.Item>
          <Form.Item name="notes" label="Catatan">
            <Input.TextArea rows={3} placeholder="Catatan (opsional)" />
          </Form.Item>
          <Form.Item className="mb-0 text-right">
            <Button onClick={() => setCloseModal(false)} className="mr-2">Batal</Button>
            <Button type="primary" htmlType="submit" loading={submitting} danger>
              Tutup Shift
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
