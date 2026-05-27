"use client";

import { Modal, Button } from "antd";
import { CheckCircleOutlined, PrinterOutlined, XOutlined } from "@ant-design/icons";

export function ReceiptModal({
  data,
  onClose,
}: {
  data: { id: string; invoiceNumber: string } | null;
  onClose: () => void;
}) {
  return (
    <Modal
      open={!!data}
      onCancel={onClose}
      footer={null}
      width={380}
      closable={false}
      centered

    >
      {data && (
        <div className="text-center space-y-5 py-2">
          <div className="w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-950/30 flex items-center justify-center mx-auto">
            <CheckCircleOutlined className="text-3xl text-green-500" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pembayaran Berhasil</h3>
            <p className="text-sm text-gray-400 mt-1">Transaksi telah selesai diproses</p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl py-3 px-4">
            <p className="text-[11px] text-gray-400 mb-1 uppercase tracking-wider">Nomor Invoice</p>
            <p className="text-base font-mono font-bold text-gray-900 dark:text-white tracking-tight">
              {data.invoiceNumber}
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              icon={<PrinterOutlined />}
              block
              size="large"
              onClick={() => window.print()}
              className="!h-11 !rounded-xl !text-sm"
            >
              Cetak Struk
            </Button>
            <Button
              icon={<XOutlined />}
              block
              size="large"
              onClick={onClose}
              className="!h-11 !rounded-xl !text-sm"
            >
              Tutup
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
