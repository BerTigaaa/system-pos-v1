"use client";

import { useEffect, useState } from "react";
import { Card, Button, Statistic, Modal, InputNumber, Input } from "antd";
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
  const [openBalance, setOpenBalance] = useState<number>(0);
  const [openNotes, setOpenNotes] = useState("");
  const [closeBalance, setCloseBalance] = useState<number>(0);
  const [closeNotes, setCloseNotes] = useState("");

  const load = async () => {
    setLoading(true);
    const res = await getActiveShift();
    if (res.success) setActive(res.data as ShiftItem | null);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleOpen = async () => {
    if (openBalance < 0) {
      toast.error("Saldo awal tidak boleh negatif");
      return;
    }
    setSubmitting(true);
    const fd = new FormData();
    fd.set("openingBalance", String(openBalance));
    if (openNotes) fd.set("notes", openNotes);
    try {
      const res = await openShift(fd);
      if (res.success) {
        toast.success("Shift dibuka");
        setOpenModal(false);
        setOpenBalance(0);
        setOpenNotes("");
        await load();
        onChanged();
      } else {
        toast.error(res.error?.message ?? "Gagal");
      }
    } catch (err) {
      toast.error("Gagal membuka shift");
      console.error(err);
    }
    setSubmitting(false);
  };

  const handleClose = async () => {
    if (!active) return;
    if (closeBalance < 0) {
      toast.error("Saldo akhir tidak boleh negatif");
      return;
    }
    setSubmitting(true);
    const fd = new FormData();
    fd.set("closingBalance", String(closeBalance));
    if (closeNotes) fd.set("notes", closeNotes);
    try {
      const res = await closeShift(active.id, fd);
      if (res.success) {
        toast.success("Shift ditutup");
        setCloseModal(false);
        setCloseBalance(0);
        setCloseNotes("");
        await load();
        onChanged();
      } else {
        toast.error(res?.error?.message ?? "Gagal");
      }
    } catch (err) {
      toast.error("Gagal menutup shift");
      console.error(err);
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

            {!active && can("shifts", "manage") && (
              <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => setOpenModal(true)}>
                Buka Shift
              </Button>
            )}
            {active && can("shifts", "manage") && (
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
        onCancel={() => { setOpenModal(false); setOpenBalance(0); setOpenNotes(""); }}
        footer={null}
        width={500}
        destroyOnHidden
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Saldo Awal</label>
            <InputNumber
              className="!w-full"
              min={0}
              prefix="Rp"
              placeholder="0"
              value={openBalance}
              onChange={(v) => setOpenBalance(v ?? 0)}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
              parser={(v) => Number(v?.replace(/\./g, "") ?? 0) as unknown as 0}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Catatan</label>
            <Input.TextArea rows={3} placeholder="Catatan (opsional)" value={openNotes} onChange={(e) => setOpenNotes(e.target.value)} />
          </div>
          <div className="text-right">
            <Button onClick={() => { setOpenModal(false); setOpenBalance(0); setOpenNotes(""); }} className="mr-2">Batal</Button>
            <Button type="primary" loading={submitting} onClick={handleOpen}>Buka Shift</Button>
          </div>
        </div>
      </Modal>

      <Modal
        title="Tutup Shift"
        open={closeModal}
        onCancel={() => { setCloseModal(false); setCloseBalance(0); setCloseNotes(""); }}
        footer={null}
        width={500}
        destroyOnHidden
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Saldo Akhir</label>
            <InputNumber
              className="!w-full"
              min={0}
              prefix="Rp"
              placeholder="0"
              value={closeBalance}
              onChange={(v) => setCloseBalance(v ?? 0)}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
              parser={(v) => Number(v?.replace(/\./g, "") ?? 0) as unknown as 0}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Catatan</label>
            <Input.TextArea rows={3} placeholder="Catatan (opsional)" value={closeNotes} onChange={(e) => setCloseNotes(e.target.value)} />
          </div>
          <div className="text-right">
            <Button onClick={() => { setCloseModal(false); setCloseBalance(0); setCloseNotes(""); }} className="mr-2">Batal</Button>
            <Button type="primary" loading={submitting} danger onClick={handleClose}>Tutup Shift</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
