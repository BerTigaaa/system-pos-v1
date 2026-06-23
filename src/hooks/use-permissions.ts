"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { hasPermission, ModuleAction } from "@/lib/permissions";
import { getMyRoleOverrides } from "@/features/admin/actions";

export function usePermissions() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const [overrides, setOverrides] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!role) { setOverrides({}); return; }
    getMyRoleOverrides().then((res) => {
      if (res.success) {
        const map: Record<string, string[]> = {};
        res.data.forEach((o) => { map[o.module] = o.actions; });
        setOverrides(map);
      }
    });
  }, [role]);

  const can = useCallback(
    (module: string, action: ModuleAction = "view"): boolean => {
      if (!role) return false;
      if (module in overrides) return overrides[module].includes(action);
      return hasPermission(role, module, action);
    },
    [role, overrides]
  );

  return { role, can };
}
