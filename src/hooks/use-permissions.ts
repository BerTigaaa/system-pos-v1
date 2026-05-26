"use client";

import { useSession } from "next-auth/react";
import { hasPermission, ModuleAction } from "@/lib/permissions";

export function usePermissions() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  return {
    role,
    can: (module: string, action: ModuleAction = "view") => {
      if (!role) return false;
      return hasPermission(role, module, action);
    },
  };
}
