"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/toast";
import { ProductGrid } from "@/features/pos/components/product-grid";
import { CartPanel } from "@/features/pos/components/cart-panel";
import { getActiveShift } from "@/features/shifts/actions";

export function POSClient() {
  const toast = useToast();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;
    getActiveShift().then((res) => {
      if (res.success && !res.data) {
        toast.warning("Anda belum membuka shift. Buka shift di menu Shift.");
      }
    });
  }, [status]);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-gray-50 dark:bg-gray-950">
      <div className="flex-1 flex min-h-0 gap-0">
        <div className="flex-1 min-w-0">
          <ProductGrid />
        </div>
        <div className="w-[380px] hidden lg:flex flex-col shadow-[-2px_0_12px_rgba(0,0,0,0.04)] dark:shadow-[-2px_0_12px_rgba(0,0,0,0.2)]">
          <CartPanel />
        </div>
      </div>
    </div>
  );
}
