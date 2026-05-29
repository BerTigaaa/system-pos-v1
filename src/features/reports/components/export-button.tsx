"use client";

import { Button, Dropdown } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { useToast } from "@/components/ui/toast";
import { exportReport } from "../actions";

export function ExportButton({
  type,
  date,
  month,
  year,
  categoryId,
  cashierId,
  dateFrom,
  dateTo,
}: {
  type: string;
  date?: string;
  month?: number;
  year?: number;
  categoryId?: string;
  cashierId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const toast = useToast();

  async function handleExport(format: "xlsx" | "pdf") {
    toast.info("Menyiapkan file...");
    const res = await exportReport({ type, format, date, month, year, categoryId, cashierId, dateFrom, dateTo });
    if (res.success && res.data) {
      const { buffer, contentType, extension } = res.data;
      const blob = new Blob([new Uint8Array(buffer)], { type: contentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-report.${extension}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("File diunduh");
    } else {
      toast.error(res.error?.message ?? "Gagal export");
    }
  }

  return (
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
  );
}
