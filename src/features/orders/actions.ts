"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createOrderSchema } from "./types";

export async function getBusinessInfo() {
  const info = await prisma.businessInfo.findFirst();
  return { success: true, data: info };
}

export async function getOrderProducts(params: { search?: string; categoryId?: string }) {
  const { search, categoryId } = params;
  const where: Record<string, unknown> = { isActive: true, deletedAt: null };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;

  const products = await prisma.product.findMany({
    where,
    orderBy: { name: "asc" },
    select: { id: true, name: true, sku: true, sellPrice: true, stock: true, unit: true, imageUrl: true, categoryId: true },
  });

  return {
    success: true,
    data: products.map((p) => ({ ...p, sellPrice: Number(p.sellPrice) })),
    total: products.length,
  };
}

export async function createOrder(formData: FormData) {
  const info = await prisma.businessInfo.findFirst();
  if (!info?.selfOrderEnabled) {
    return { success: false, error: { message: "Pemesanan mandiri belum tersedia" } };
  }

  const activeShift = await prisma.shift.findFirst({ where: { status: "OPEN" }, orderBy: { openedAt: "desc" } });
  if (!activeShift) {
    return { success: false, error: { message: "Kafe belum buka. Belum ada shift aktif." } };
  }

  const rawItems = formData.getAll("items") as string[];
  let items: { productId: string; quantity: number; sellPrice: number }[];
  try {
    items = rawItems.map((i) => JSON.parse(i));
  } catch {
    return { success: false, error: { message: "Format item tidak valid" } };
  }

  const parsed = createOrderSchema.safeParse({
    tableNumber: formData.get("tableNumber"),
    customerName: formData.get("customerName"),
    notes: formData.get("notes") ?? undefined,
    items,
  });
  if (!parsed.success) {
    return { success: false, error: { message: parsed.error.issues[0]?.message ?? "Data tidak valid" } };
  }

  const { tableNumber, customerName, notes } = parsed.data;

  let total = 0;
  const orderItemsData: {
    productId: string;
    productName: string;
    quantity: number;
    sellPrice: number;
    subtotal: number;
  }[] = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product || product.stock < item.quantity) {
      return { success: false, error: { message: `Stok ${product?.name ?? "produk"} tidak mencukupi` } };
    }
    const subtotal = item.sellPrice * item.quantity;
    total += subtotal;
    orderItemsData.push({
      productId: item.productId,
      productName: product.name,
      quantity: item.quantity,
      sellPrice: item.sellPrice,
      subtotal,
    });
  }

  await prisma.order.create({
    data: {
      tableNumber,
      customerName,
      notes: notes ?? null,
      total,
      shiftId: activeShift.id,
      items: { create: orderItemsData },
    },
  });

  revalidatePath("/orders");
  return { success: true, data: { tableNumber } };
}

export async function getTableOrders(tableNumber: number, customerName: string) {
  if (!customerName.trim()) return { success: true, data: [] };
  const activeShift = await prisma.shift.findFirst({ where: { status: "OPEN" }, orderBy: { openedAt: "desc" } });
  if (!activeShift) return { success: true, data: [] };

  const orders = await prisma.order.findMany({
    where: { shiftId: activeShift.id, tableNumber, customerName, status: { not: "CANCELLED" }, paidAt: null },
    include: { items: { orderBy: { id: "asc" } } },
    orderBy: { createdAt: "asc" },
  });

  return {
    success: true,
    data: orders.map((o) => ({
      id: o.id,
      tableNumber: o.tableNumber,
      customerName: o.customerName,
      notes: o.notes,
      status: o.status,
      total: Number(o.total),
      items: o.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        sellPrice: Number(i.sellPrice),
        subtotal: Number(i.subtotal),
      })),
      createdAt: o.createdAt,
    })),
  };
}

export async function updateOrderItems(
  orderId: string,
  items: { productId: string; quantity: number; sellPrice: number }[]
) {
  const info = await prisma.businessInfo.findFirst();
  if (!info?.selfOrderEnabled) {
    return { success: false, error: { message: "Pemesanan mandiri belum tersedia" } };
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { success: false, error: { message: "Order tidak ditemukan" } };
  if (order.status !== "PENDING") return { success: false, error: { message: "Order sudah dikonfirmasi, tidak bisa diubah" } };

  let total = 0;
  const orderItemsData: {
    productId: string;
    productName: string;
    quantity: number;
    sellPrice: number;
    subtotal: number;
  }[] = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product) return { success: false, error: { message: `Produk tidak ditemukan` } };
    const subtotal = item.sellPrice * item.quantity;
    total += subtotal;
    orderItemsData.push({
      productId: item.productId,
      productName: product.name,
      quantity: item.quantity,
      sellPrice: item.sellPrice,
      subtotal,
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.orderItem.deleteMany({ where: { orderId } });
    await tx.orderItem.createMany({
      data: orderItemsData.map((d) => ({ ...d, orderId })),
    });
    await tx.order.update({ where: { id: orderId }, data: { total } });
  });

  return { success: true };
}

export async function getOrders(params: { status?: string; page?: number; pageSize?: number }) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" }, data: [], total: 0 };

  const { status, page = 1, pageSize = 20 } = params;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    success: true,
    data: data.map((o) => ({
      ...o,
      total: Number(o.total),
      items: o.items.map((i) => ({ ...i, sellPrice: Number(i.sellPrice), subtotal: Number(i.subtotal) })),
    })),
    total,
  };
}

export async function confirmOrder(orderId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return { success: false, error: { message: "Order tidak ditemukan" } };
  if (order.status !== "PENDING") return { success: false, error: { message: "Order sudah diproses" } };

  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }
    await tx.order.update({
      where: { id: orderId },
      data: { status: "CONFIRMED" },
    });
  });

  revalidatePath("/orders");
  return { success: true };
}

export async function completeOrder(orderId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { success: false, error: { message: "Order tidak ditemukan" } };
  if (order.status !== "CONFIRMED") return { success: false, error: { message: "Order belum dikonfirmasi" } };

  await prisma.order.update({ where: { id: orderId }, data: { status: "COMPLETED" } });
  revalidatePath("/orders");
  return { success: true };
}

export async function cancelOrder(orderId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return { success: false, error: { message: "Order tidak ditemukan" } };
  if (order.status !== "PENDING") return { success: false, error: { message: "Order sudah diproses, tidak bisa dibatalkan" } };

  await prisma.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
  revalidatePath("/orders");
  return { success: true };
}
