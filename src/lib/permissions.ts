import { UserRole } from "@prisma/client";

export type ModuleAction = "view" | "manage" | "visible";

type PermissionMap = Record<string, UserRole[]>;

const modulePermissions: Record<string, PermissionMap> = {
  dashboard: {
    view: ["SUPER_ADMIN", "OWNER", "FINANCE", "WAREHOUSE", "CASHIER"],
    visible: ["SUPER_ADMIN", "OWNER", "FINANCE", "WAREHOUSE", "CASHIER"],
  },
  pos: {
    view: ["SUPER_ADMIN", "OWNER", "CASHIER"],
    manage: ["SUPER_ADMIN", "OWNER", "CASHIER"],
    visible: ["SUPER_ADMIN", "OWNER", "CASHIER"],
  },
  products: {
    view: ["SUPER_ADMIN", "OWNER", "WAREHOUSE"],
    manage: ["SUPER_ADMIN", "OWNER", "WAREHOUSE"],
    visible: ["SUPER_ADMIN", "OWNER", "WAREHOUSE"],
  },
  inventory: {
    view: ["SUPER_ADMIN", "OWNER", "WAREHOUSE"],
    manage: ["SUPER_ADMIN", "OWNER", "WAREHOUSE"],
    visible: ["SUPER_ADMIN", "OWNER", "WAREHOUSE"],
  },
  transactions: {
    view: ["SUPER_ADMIN", "OWNER", "FINANCE", "CASHIER"],
    manage: ["SUPER_ADMIN", "OWNER", "CASHIER"],
    visible: ["SUPER_ADMIN", "OWNER", "FINANCE", "CASHIER"],
  },
  refund: {
    view: ["SUPER_ADMIN", "OWNER"],
    manage: ["SUPER_ADMIN", "OWNER"],
    visible: ["SUPER_ADMIN", "OWNER"],
  },
  finance: {
    view: ["SUPER_ADMIN", "OWNER", "FINANCE"],
    manage: ["SUPER_ADMIN", "OWNER", "FINANCE"],
    visible: ["SUPER_ADMIN", "OWNER", "FINANCE"],
  },
  reports: {
    view: ["SUPER_ADMIN", "OWNER", "FINANCE"],
    manage: ["SUPER_ADMIN", "OWNER", "FINANCE"],
    visible: ["SUPER_ADMIN", "OWNER", "FINANCE"],
  },
  settings: {
    view: ["SUPER_ADMIN", "OWNER"],
    manage: ["SUPER_ADMIN", "OWNER"],
    visible: ["SUPER_ADMIN", "OWNER"],
  },
  employees: {
    view: ["SUPER_ADMIN", "OWNER"],
    manage: ["SUPER_ADMIN", "OWNER"],
    visible: ["SUPER_ADMIN", "OWNER"],
  },
  audit: {
    view: ["SUPER_ADMIN", "OWNER"],
    visible: ["SUPER_ADMIN", "OWNER"],
  },
  shifts: {
    view: ["SUPER_ADMIN", "OWNER", "CASHIER"],
    manage: ["SUPER_ADMIN", "OWNER", "CASHIER"],
    visible: ["SUPER_ADMIN", "OWNER", "CASHIER"],
  },
  suppliers: {
    view: ["SUPER_ADMIN", "OWNER", "WAREHOUSE"],
    manage: ["SUPER_ADMIN", "OWNER", "WAREHOUSE"],
    visible: ["SUPER_ADMIN", "OWNER", "WAREHOUSE"],
  },
  orders: {
    view: ["SUPER_ADMIN", "OWNER", "CASHIER"],
    manage: ["SUPER_ADMIN", "OWNER", "CASHIER"],
    visible: ["SUPER_ADMIN", "OWNER", "CASHIER"],
  },
  selfOrder: {
    view: ["SUPER_ADMIN", "OWNER"],
    manage: ["SUPER_ADMIN"],
    visible: ["SUPER_ADMIN", "OWNER"],
  },
  admin: {
    view: ["SUPER_ADMIN", "OWNER"],
    manage: ["SUPER_ADMIN", "OWNER"],
    visible: ["SUPER_ADMIN", "OWNER"],
  },
  notifications: {
    view: ["SUPER_ADMIN", "OWNER", "FINANCE", "CASHIER", "WAREHOUSE"],
    visible: ["SUPER_ADMIN", "OWNER", "FINANCE", "CASHIER", "WAREHOUSE"],
  },
};

export function hasPermission(
  role: UserRole,
  module: string,
  action: ModuleAction = "view"
): boolean {
  if (role === "SUPER_ADMIN") return true;

  const modulePerms = modulePermissions[module];
  if (!modulePerms) return false;

  const allowedRoles = modulePerms[action];
  if (!allowedRoles) return false;

  return allowedRoles.includes(role);
}
