import { prisma } from "./prisma";
import { hasPermission } from "./permissions";
import type { UserRole } from "@prisma/client";
import type { ModuleAction } from "./permissions";

function db() {
  if (!("rolePermission" in prisma)) return null;
  return prisma.rolePermission;
}

export async function hasPermissionAsync(
  role: UserRole,
  module: string,
  action: ModuleAction = "view"
): Promise<boolean> {
  if (role === "SUPER_ADMIN") return true;

  const delegate = db();
  if (delegate) {
    try {
      const override = await delegate.findUnique({
        where: { role_module: { role, module } },
      });
      if (override) return override.actions.includes(action);
    } catch {
      // fall back to hardcoded
    }
  }

  return hasPermission(role, module, action);
}

export async function getPermissionOverrides(role: UserRole) {
  const delegate = db();
  if (!delegate) return [];
  return delegate.findMany({ where: { role } });
}

export async function setPermissionOverride(
  role: UserRole,
  module: string,
  actions: string[]
) {
  const delegate = db();
  if (!delegate) throw new Error("RolePermission model not available");
  await delegate.upsert({
    where: { role_module: { role, module } },
    update: { actions },
    create: { role, module, actions },
  });
}

export async function deletePermissionOverride(role: UserRole, module: string) {
  const delegate = db();
  if (!delegate) return;
  await delegate.deleteMany({
    where: { role, module },
  });
}
