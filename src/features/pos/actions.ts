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

export async function createPosOrder(data: {
  tableNumber: number;
  customerName: string;
  notes?: string;
  items: { productId: string; quantity: number; sellPrice: number }[];
}) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };

  const activeShift = await prisma.shift.findFirst({
    where: { userId: session.user.id, status: "OPEN" },
  });
  if (!activeShift) return { success: false, error: { message: "Tidak ada shift aktif" } };

  if (!data.items.length) return { success: false, error: { message: "Pilih minimal 1 item" } };
  if (!data.customerName.trim()) return { success: false, error: { message: "Nama pemesan wajib diisi" } };

  let total = 0;
  const orderItemsData: {
    productId: string;
    productName: string;
    quantity: number;
    sellPrice: number;
    subtotal: number;
  }[] = [];

  for (const item of data.items) {
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

  await prisma.order.create({
    data: {
      tableNumber: data.tableNumber,
      customerName: data.customerName,
      notes: data.notes ?? null,
      total,
      shiftId: activeShift.id,
      items: { create: orderItemsData },
    },
  });

  revalidatePath("/pos");
  return { success: true };
}

export async function getPosOrders() {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" }, data: [] };

  const activeShift = await prisma.shift.findFirst({
    where: { userId: session.user.id, status: "OPEN" },
  });
  if (!activeShift) return { success: true, data: [] };

  const orders = await prisma.order.findMany({
    where: { shiftId: activeShift.id, paidAt: null },
    include: { items: true },
    orderBy: { createdAt: "desc" },
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

export async function getPaidOrders() {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" }, data: [] };

  const activeShift = await prisma.shift.findFirst({
    where: { userId: session.user.id, status: "OPEN" },
  });
  if (!activeShift) return { success: true, data: [] };

  const orders = await prisma.order.findMany({
    where: { shiftId: activeShift.id, paidAt: { not: null } },
    include: { items: true },
    orderBy: { createdAt: "desc" },
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
      paidAt: o.paidAt,
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

export async function getCompletedOrdersByTable(tableNumber: number) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" }, data: [] };

  const activeShift = await prisma.shift.findFirst({
    where: { userId: session.user.id, status: "OPEN" },
  });
  if (!activeShift) return { success: true, data: [] };

  const orders = await prisma.order.findMany({
    where: { shiftId: activeShift.id, tableNumber, status: "COMPLETED", paidAt: null },
    include: { items: true },
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

export async function updatePosOrderStatus(orderId: string, status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED") {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return { success: false, error: { message: "Order tidak ditemukan" } };

  if (status === "CONFIRMED") {
    if (order.status !== "PENDING") return { success: false, error: { message: "Order sudah diproses" } };
    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
      await tx.order.update({ where: { id: orderId }, data: { status: "CONFIRMED" } });
    });
  } else if (status === "COMPLETED") {
    if (order.status !== "CONFIRMED") return { success: false, error: { message: "Order belum dikonfirmasi" } };
    await prisma.order.update({ where: { id: orderId }, data: { status: "COMPLETED" } });
  } else if (status === "CANCELLED") {
    if (order.status !== "PENDING") return { success: false, error: { message: "Order sudah diproses, tidak bisa dibatalkan" } };
    await prisma.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
  }

  revalidatePath("/pos");
  return { success: true };
}

export async function getTablesWithCompletedOrders() {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" }, data: [] };

  const activeShift = await prisma.shift.findFirst({
    where: { userId: session.user.id, status: "OPEN" },
  });
  if (!activeShift) return { success: true, data: [] };

  const tables = await prisma.order.findMany({
    where: { shiftId: activeShift.id, status: "COMPLETED", paidAt: null },
    select: { tableNumber: true },
    distinct: ["tableNumber"],
    orderBy: { tableNumber: "asc" },
  });

  return { success: true, data: tables.map((t) => t.tableNumber) };
}

export async function checkout(data: {
  items: { productId: string; name: string; sku: string; quantity: number; sellPrice: number; discountAmount: number }[];
  customerName?: string;
  notes?: string;
  discountPercent: number;
  payments: { method: string; amount: number; changeAmount?: number }[];
  subtotal: number;
  totalDiscount: number;
  total: number;
  tableNumber?: number | null;
  orderIds?: string[];
}) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };

  if (!data.items.length) return { success: false, error: { message: "Keranjang kosong" } };

  const activeShift = await prisma.shift.findFirst({
    where: { userId: session.user.id, status: "OPEN" },
  });
  if (!activeShift) return { success: false, error: { message: "Tidak ada shift aktif. Buka shift terlebih dahulu." } };

  const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  // Resolve random table
  let tableNumber = data.tableNumber ?? null;
  if (tableNumber === -1) {
    const biz = await prisma.businessInfo.findFirst();
    const [occupiedByTx, occupiedByOrder] = biz
      ? await Promise.all([
          prisma.transaction.findMany({
            where: { shiftId: activeShift.id, tableNumber: { not: null }, status: { not: "COMPLETED" } },
            select: { tableNumber: true },
            distinct: ["tableNumber"],
          }),
          prisma.order.findMany({
            where: { shiftId: activeShift.id, status: { in: ["PENDING", "CONFIRMED"] } },
            select: { tableNumber: true },
            distinct: ["tableNumber"],
          }),
        ])
      : [[], []];
    const occupiedSet = new Set([
      ...occupiedByTx.map((t) => t.tableNumber),
      ...occupiedByOrder.map((o) => o.tableNumber),
    ]);
    const availableTables = [];
    for (let i = 1; i <= (biz?.totalTables ?? 10); i++) {
      if (!occupiedSet.has(i)) availableTables.push(i);
    }
    if (availableTables.length > 0) {
      tableNumber = availableTables[Math.floor(Math.random() * availableTables.length)];
    } else {
      tableNumber = null;
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    // Skip stock deduction when paying from Bayar tab (already deducted on order confirm)
    if (!data.orderIds?.length) {
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
    }

    const txData = {
      invoiceNumber,
      shiftId: activeShift.id,
      cashierId: session.user.id,
      customerName: data.customerName ?? null,
      status: "COMPLETED" as const,
      subtotal: data.subtotal,
      discountAmount: data.totalDiscount,
      taxPercent: 0,
      taxAmount: 0,
      total: data.total,
      notes: data.notes ?? null,
      tableNumber: tableNumber,
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

    return transaction;
  });

  // Mark orders as paid
  if (data.orderIds?.length) {
    await prisma.order.updateMany({
      where: { id: { in: data.orderIds } },
      data: { paidAt: new Date() },
    });
  }

  revalidatePath("/pos");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  if (data.tableNumber && data.orderIds?.length) {
    revalidatePath(`/order/${data.tableNumber}`);
  }

  return { success: true, data: { id: result.id, invoiceNumber: result.invoiceNumber } };
}
