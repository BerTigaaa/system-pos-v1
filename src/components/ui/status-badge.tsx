"use client";

import { Tag } from "antd";
import type { UserRole, AccountStatus, TransactionStatus } from "@prisma/client";

export type StatusType =
  | UserRole
  | AccountStatus
  | TransactionStatus
  | "ACTIVE"
  | "INACTIVE"
  | "TRIAL"
  | "SUSPENDED"
  | "COMPLETED"
  | "PENDING"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED"
  | "CANCELLED"
  | "OPEN"
  | "CLOSED";

const statusConfig: Record<string, { color: string }> = {
  // Account Status
  ACTIVE: { color: "green" },
  INACTIVE: { color: "red" },
  TRIAL: { color: "blue" },
  SUSPENDED: { color: "orange" },
  // Transaction Status
  COMPLETED: { color: "green" },
  PENDING: { color: "gold" },
  REFUNDED: { color: "purple" },
  PARTIALLY_REFUNDED: { color: "purple" },
  CANCELLED: { color: "red" },
  // User Roles
  SUPER_ADMIN: { color: "red" },
  OWNER: { color: "blue" },
  CASHIER: { color: "green" },
  WAREHOUSE: { color: "orange" },
  FINANCE: { color: "purple" },
  // Shift
  OPEN: { color: "green" },
  CLOSED: { color: "default" },
};

export type StatusBadgeProps = {
  status: StatusType | string;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { color: "default" };

  const labels: Record<string, string> = {
    SUPER_ADMIN: "Developer",
    OWNER: "Owner",
    CASHIER: "Kasir",
    WAREHOUSE: "Gudang",
    FINANCE: "Keuangan",
    TRIAL: "Trial",
    ACTIVE: "Aktif",
    INACTIVE: "Nonaktif",
    SUSPENDED: "Ditangguhkan",
    COMPLETED: "Selesai",
    PENDING: "Tertunda",
    REFUNDED: "Direfund",
    PARTIALLY_REFUNDED: "Refund Sebagian",
    CANCELLED: "Dibatalkan",
    OPEN: "Buka",
    CLOSED: "Tutup",
  };

  return (
    <Tag color={config.color}>
      {labels[status] ?? status}
    </Tag>
  );
}
