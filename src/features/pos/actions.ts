"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

export async function getPosProducts(params: {
  search?: string;
  categoryId?: string;
  page?: number;
  pageSize?: number;
}) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" }, data: [], total: 0 };

  const { search, categoryId, page = 1, pageSize = 50 } = params;

  const where: Record<string, unknown> = { deletedAt: null, isActive: true };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
      { barcode: { contains: search } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: { select: { name: true } } },
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    success: true,
    data: data.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      sellPrice: Number(p.sellPrice),
      stock: p.stock,
      imageUrl: p.imageUrl,
      categoryName: p.category?.name ?? null,
      unit: p.unit,
    })),
    total,
  };
}

export async function getPosCustomers(search?: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" }, data: [] };

  const where: Record<string, unknown> = { deletedAt: null };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
    ];
  }

  const data = await prisma.customer.findMany({
    where,
    orderBy: { name: "asc" },
    take: 20,
  });

  return { success: true, data: data.map((c) => ({ ...c, totalSpent: Number(c.totalSpent) })) };
}

export async function checkout(data: {
  items: { productId: string; name: string; sku: string; quantity: number; sellPrice: number; discountAmount: number }[];
  customerId?: string | null;
  notes?: string;
  discountPercent: number;
  payments: { method: string; amount: number; changeAmount?: number }[];
  subtotal: number;
  totalDiscount: number;
  total: number;
}) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };

  if (!data.items.length) return { success: false, error: { message: "Keranjang kosong" } };

  const activeShift = await prisma.shift.findFirst({
    where: { userId: session.user.id, status: "OPEN" },
  });
  if (!activeShift) return { success: false, error: { message: "Tidak ada shift aktif. Buka shift terlebih dahulu." } };

  const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const result = await prisma.$transaction(async (tx) => {
    for (const item of data.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product || product.stock < item.quantity) {
        throw new Error(`Stok ${product?.name ?? "produk"} tidak mencukupi`);
      }
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    const txData = {
      invoiceNumber,
      shiftId: activeShift.id,
      cashierId: session.user.id,
      customerId: data.customerId ?? null,
      status: "COMPLETED" as const,
      subtotal: data.subtotal,
      discountAmount: data.totalDiscount,
      taxPercent: 0,
      taxAmount: 0,
      total: data.total,
      notes: data.notes ?? null,
    };

    const transaction = await tx.transaction.create({
      data: {
        ...txData,
        items: {
          create: data.items.map((item) => {
            const subtotal = item.quantity * item.sellPrice - item.discountAmount;
            return {
              productId: item.productId,
              productName: item.name ?? "",
              productSku: item.sku ?? "",
              buyPrice: 0,
              sellPrice: item.sellPrice,
              quantity: item.quantity,
              discountAmount: item.discountAmount,
              subtotal,
            };
          }),
        },
        payments: {
          create: data.payments.map((p) => ({
            method: p.method as "CASH" | "QRIS" | "BANK_TRANSFER" | "DEBIT_CARD" | "CREDIT_CARD",
            amount: p.amount,
            changeAmount: p.changeAmount ?? 0,
          })),
        },
      },
    });

    if (data.customerId) {
      await tx.customer.update({
        where: { id: data.customerId },
        data: {
          totalSpent: { increment: data.total },
          totalOrders: { increment: 1 },
        },
      });
    }

    return transaction;
  });

  revalidatePath("/pos");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");

  return { success: true, data: { id: result.id, invoiceNumber: result.invoiceNumber } };
}
