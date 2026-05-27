"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

export async function getMovements(params: {
  search?: string;
  type?: string;
  page?: number;
  pageSize?: number;
}) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" }, data: [], total: 0, page: 1, pageSize: 10 };

  const { search, type, page = 1, pageSize = 10 } = params;

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (search) {
    where.product = {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  const [data, total] = await Promise.all([
    prisma.inventoryMovement.findMany({
      where,
      include: {
        product: { select: { name: true, sku: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.inventoryMovement.count({ where }),
  ]);

  return {
    success: true,
    data: data.map((m) => ({
      id: m.id,
      productId: m.productId,
      productName: m.product.name,
      productSku: m.product.sku,
      type: m.type,
      quantity: m.quantity,
      stockBefore: m.stockBefore,
      stockAfter: m.stockAfter,
      reason: m.reason,
      notes: m.notes,
      userName: m.user.name,
      createdAt: m.createdAt,
    })),
    total,
    page,
    pageSize,
  };
}

export async function adjustStock(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };

  const productId = formData.get("productId") as string;
  const type = formData.get("type") as string;
  const quantity = parseInt(formData.get("quantity") as string, 10);
  const reason = (formData.get("reason") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!productId || !type || !quantity) {
    return { success: false, error: { message: "Data tidak lengkap" } };
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return { success: false, error: { message: "Produk tidak ditemukan" } };

  const isOut = type === "MANUAL_OUT" || type === "SALE";
  const sign = isOut ? -1 : 1;
  const newStock = product.stock + sign * quantity;

  if (newStock < 0) return { success: false, error: { message: "Stok tidak mencukupi" } };

  await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: { stock: newStock },
    }),
    prisma.inventoryMovement.create({
      data: {
        productId,
        userId: session.user.id,
        type: type as "PURCHASE" | "SALE" | "MANUAL_OUT" | "ADJUSTMENT" | "OPNAME" | "RETURN",
        quantity,
        stockBefore: product.stock,
        stockAfter: newStock,
        reason,
        notes,
      },
    }),
  ]);

  revalidatePath("/inventory");
  return { success: true };
}

export async function getStockOpnameList(params: { page?: number; pageSize?: number }) {
  const { page = 1, pageSize = 10 } = params;

  const [data, total] = await Promise.all([
    prisma.stockOpname.findMany({
      include: {
        user: { select: { name: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.stockOpname.count(),
  ]);

  return { success: true, data, total, page, pageSize };
}

export async function createStockOpname(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };

  const rawItems = formData.getAll("items") as string[];
  const notes = (formData.get("notes") as string) || null;

  if (!rawItems.length) return { success: false, error: { message: "Minimal 1 item" } };

  const items = rawItems.map((i) => JSON.parse(i));
  const opnameItems = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product) continue;
    const diff = item.physicalStock - product.stock;
    opnameItems.push({
      productId: product.id,
      systemStock: product.stock,
      physicalStock: item.physicalStock,
      difference: diff,
    });
  }

  await prisma.stockOpname.create({
    data: {
      userId: session.user.id,
      notes,
      items: { create: opnameItems },
    },
  });

  revalidatePath("/inventory");
  return { success: true };
}

export async function applyStockOpname(opnameId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };

  const opname = await prisma.stockOpname.findUnique({
    where: { id: opnameId },
    include: { items: true },
  });

  if (!opname) return { success: false, error: { message: "Opname tidak ditemukan" } };
  if (opname.isAdjusted) return { success: false, error: { message: "Sudah diaplikasikan" } };

  await prisma.$transaction(async (tx) => {
    for (const item of opname.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) continue;

      await tx.product.update({
        where: { id: item.productId },
        data: { stock: item.physicalStock },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          userId: session.user.id,
          type: "OPNAME",
          quantity: Math.abs(item.difference),
          stockBefore: item.systemStock,
          stockAfter: item.physicalStock,
          referenceId: opnameId,
          referenceType: "STOCK_OPNAME",
          reason: item.difference > 0 ? "Kelebihan stok" : "Kekurangan stok",
        },
      });
    }

    await tx.stockOpname.update({
      where: { id: opnameId },
      data: { isAdjusted: true, adjustedAt: new Date() },
    });
  });

  revalidatePath("/inventory");
  return { success: true };
}
