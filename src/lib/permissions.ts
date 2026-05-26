import { UserRole } from "@prisma/client";

export type ModuleAction = "view" | "create" | "edit" | "delete";

type PermissionMap = Record<string, UserRole[]>;

const modulePermissions: Record<string, PermissionMap> = {
  dashboard: {
    view: ["SUPER_ADMIN", "OWNER", "FINANCE", "WAREHOUSE", "CASHIER"],
  },
  pos: {
    view: ["SUPER_ADMIN", "OWNER", "CASHIER"],
    create: ["SUPER_ADMIN", "OWNER", "CASHIER"],
  },
  products: {
    view: ["SUPER_ADMIN", "OWNER", "WAREHOUSE"],
    create: ["SUPER_ADMIN", "OWNER", "WAREHOUSE"],
    edit: ["SUPER_ADMIN", "OWNER", "WAREHOUSE"],
    delete: ["SUPER_ADMIN", "OWNER"],
  },
  inventory: {
    view: ["SUPER_ADMIN", "OWNER", "WAREHOUSE"],
    create: ["SUPER_ADMIN", "OWNER", "WAREHOUSE"],
    edit: ["SUPER_ADMIN", "OWNER", "WAREHOUSE"],
    delete: ["SUPER_ADMIN", "OWNER"],
  },
  customers: {
    view: ["SUPER_ADMIN", "OWNER", "CASHIER"],
    create: ["SUPER_ADMIN", "OWNER", "CASHIER"],
    edit: ["SUPER_ADMIN", "OWNER"],
    delete: ["SUPER_ADMIN", "OWNER"],
  },
  transactions: {
    view: ["SUPER_ADMIN", "OWNER", "FINANCE", "CASHIER"],
    create: ["SUPER_ADMIN", "OWNER", "CASHIER"],
  },
  refund: {
    view: ["SUPER_ADMIN", "OWNER"],
    create: ["SUPER_ADMIN", "OWNER"],
  },
  finance: {
    view: ["SUPER_ADMIN", "OWNER", "FINANCE"],
    create: ["SUPER_ADMIN", "OWNER", "FINANCE"],
    edit: ["SUPER_ADMIN", "OWNER"],
    delete: ["SUPER_ADMIN", "OWNER"],
  },
  reports: {
    view: ["SUPER_ADMIN", "OWNER", "FINANCE"],
    export: ["SUPER_ADMIN", "OWNER", "FINANCE"],
  },
  settings: {
    view: ["SUPER_ADMIN", "OWNER"],
    edit: ["SUPER_ADMIN", "OWNER"],
  },
  employees: {
    view: ["SUPER_ADMIN", "OWNER"],
    create: ["SUPER_ADMIN", "OWNER"],
    edit: ["SUPER_ADMIN", "OWNER"],
    delete: ["SUPER_ADMIN", "OWNER"],
  },
  audit: {
    view: ["SUPER_ADMIN", "OWNER"],
  },
  shifts: {
    view: ["SUPER_ADMIN", "OWNER", "CASHIER"],
    create: ["SUPER_ADMIN", "OWNER", "CASHIER"],
    close: ["SUPER_ADMIN", "OWNER", "CASHIER"],
  },
  admin: {
    view: ["SUPER_ADMIN"],
    manage: ["SUPER_ADMIN"],
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

export function canAccessModule(role: UserRole, module: string): boolean {
  return hasPermission(role, module, "view");
}
