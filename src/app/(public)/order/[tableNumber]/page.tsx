import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { OrderPageClient } from "./client";

export default async function OrderPage({ params }: { params: Promise<{ tableNumber: string }> }) {
  const { tableNumber } = await params;
  const num = parseInt(tableNumber, 10);
  if (isNaN(num) || num < 1) redirect("/");

  const info = await prisma.businessInfo.findFirst();
  if (!info?.selfOrderEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Pemesanan Mandiri</h1>
          <p className="text-gray-500">Fitur pemesanan mandiri belum tersedia saat ini.</p>
        </div>
      </div>
    );
  }

  return <OrderPageClient tableNumber={num} businessName={info.name} logoUrl={info.logoUrl} />;
}
