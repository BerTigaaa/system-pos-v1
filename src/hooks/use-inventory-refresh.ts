"use client";

import { useEffect } from "react";

export function notifyInventoryUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("inventory:updated"));
  }
}

export function useInventoryRefresh(loadFn: () => void) {
  useEffect(() => {
    const handler = () => loadFn();
    window.addEventListener("inventory:updated", handler);
    return () => window.removeEventListener("inventory:updated", handler);
  }, [loadFn]);
}
