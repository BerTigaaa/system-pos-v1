"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { hasPermissionAsync } from "@/lib/permissions-db";
import { notifyRole } from "@/lib/notifications";

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
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };
    if (!await hasPermissionAsync(session.user.role, "pos", "manage"))
      return { success: false, error: { message: "Forbidden" } };

    const activeShift = await prisma.shift.findFirst({
      where: { userId: session.user.id, status: "OPEN" },
    });
    if (!activeShift) return { success: false, error: { message: "Tidak ada shift aktif" } };

    if (!data.items.length) return { success: false, error: { message: "Pilih minimal 1 item" } };
    if (!data.customerName.trim()) return { success: false, error: { message: "Nama pemesan wajib diisi" } };

    // Handle Random Table Assignment (-1)
    let targetTable = data.tableNumber;
    if (targetTable === -1) {
      const biz = await prisma.businessInfo.findFirst();
      const occupiedByOrder = await prisma.order.findMany({
        where: { shiftId: activeShift.id, status: { notIn: ["CANCELLED"] }, paidAt: null },
        select: { tableNumber: true },
        distinct: ["tableNumber"],
      });
      const occupiedSet = new Set(occupiedByOrder.map((o) => o.tableNumber));
      const availableTables = [];
      for (let i = 1; i <= (biz?.totalTables ?? 10); i++) {
        if (!occupiedSet.has(i)) availableTables.push(i);
      }
      targetTable = availableTables.length > 0 
        ? availableTables[Math.floor(Math.random() * availableTables.length)]
        : 1; // Fallback to table 1 if full
    }

    const productIds = [...new Set(data.items.map((i) => i.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p.name]));

    let total = 0;
    const orderItemsData: {
      productId: string;
      productName: string;
      quantity: number;
      sellPrice: number;
      subtotal: number;
    }[] = [];

    for (const item of data.items) {
      const productName = productMap.get(item.productId);
      if (!productName) return { success: false, error: { message: `Produk tidak ditemukan` } };
      const subtotal = item.sellPrice * item.quantity;
      total += subtotal;
      orderItemsData.push({
        productId: item.productId,
        productName,
        quantity: item.quantity,
        sellPrice: item.sellPrice,
        subtotal,
      });
    }

    const order = await prisma.order.create({
      data: {
        tableNumber: targetTable,
        customerName: data.customerName,
        notes: data.notes ?? null,
        total,
        shiftId: activeShift.id,
        items: { create: orderItemsData },
      },
      select: { id: true },
    });

    await notifyRole(["OWNER"], {
      type: "ORDER_CREATED",
      title: "Pesanan Baru",
      message: `Pesanan dari meja ${targetTable} (${data.customerName}) — Rp ${total.toLocaleString("id")}.`,
      data: { orderId: order.id, tableNumber: targetTable, customerName: data.customerName, total },
    });

    revalidatePath("/pos");
    return { success: true };
  } catch (err) {
    console.error("createPosOrder error:", err);
    return { success: false, error: { message: "Gagal membuat pesanan (Server Error)" } };
  }
}

export async function getPosOrders() {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" }, data: [] };

  const openShifts = await prisma.shift.findMany({
    where: { status: "OPEN" },
    select: { id: true },
  });
  if (openShifts.length === 0) return { success: true, data: [] };

  const orders = await prisma.order.findMany({
    where: { shiftId: { in: openShifts.map((s) => s.id) }, paidAt: null },
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

  const openShifts = await prisma.shift.findMany({
    where: { status: "OPEN" },
    select: { id: true },
  });
  if (openShifts.length === 0) return { success: true, data: [] };

  const orders = await prisma.order.findMany({
    where: { shiftId: { in: openShifts.map((s) => s.id) }, paidAt: { not: null } },
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

  const openShifts = await prisma.shift.findMany({
    where: { status: "OPEN" },
    select: { id: true },
  });
  if (openShifts.length === 0) return { success: true, data: [] };

  const orders = await prisma.order.findMany({
    where: { shiftId: { in: openShifts.map((s) => s.id) }, tableNumber, status: "COMPLETED", paidAt: null },
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
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };
    if (!await hasPermissionAsync(session.user.role, "pos", "manage"))
      return { success: false, error: { message: "Forbidden" } };

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return { success: false, error: { message: "Pesanan tidak ditemukan" } };
    if (order.paidAt && status !== "CANCELLED") return { success: false, error: { message: "Pesanan sudah dibayar" } };
    if (order.status === "CANCELLED") return { success: false, error: { message: "Pesanan sudah dibatalkan" } };

    await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    revalidatePath("/pos");
    return { success: true };
  } catch (err) {
    console.error("updatePosOrderStatus error:", err);
    return { success: false, error: { message: "Gagal memperbarui status" } };
  }
}

export async function getTablesWithCompletedOrders() {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" }, data: [] };

  const openShifts = await prisma.shift.findMany({
    where: { status: "OPEN" },
    select: { id: true },
  });
  if (openShifts.length === 0) return { success: true, data: [] };

  const orders = await prisma.order.findMany({
    where: { shiftId: { in: openShifts.map((s) => s.id) }, status: "COMPLETED", paidAt: null },
    select: { tableNumber: true },
    distinct: ["tableNumber"],
    orderBy: { tableNumber: "asc" },
  });

  const biz = await prisma.businessInfo.findFirst({
    select: { diningTables: { select: { tableNumber: true, label: true } } },
  });
  const labelMap = new Map((biz?.diningTables ?? []).map((t) => [t.tableNumber, t.label]));

  return {
    success: true,
    data: orders.map((o) => ({
      tableNumber: o.tableNumber,
      label: labelMap.get(o.tableNumber) ?? `Meja ${o.tableNumber}`,
    })),
  };
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
  if (!await hasPermissionAsync(session.user.role, "pos", "manage"))
    return { success: false, error: { message: "Forbidden" } };

  if (!data.items.length) return { success: false, error: { message: "Keranjang kosong" } };

  const activeShift = await prisma.shift.findFirst({
    where: { userId: session.user.id, status: "OPEN" },
  });
  if (!activeShift) return { success: false, error: { message: "Tidak ada shift aktif. Buka shift terlebih dahulu." } };

  const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

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
            where: { shiftId: activeShift.id, status: { notIn: ["CANCELLED"] }, paidAt: null },
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

  const products = await prisma.product.findMany({
    where: { id: { in: data.items.map((i) => i.productId) } },
    select: { id: true, buyPrice: true },
  });
  const buyPriceMap = new Map(products.map((p) => [p.id, Number(p.buyPrice)]));

  const result = await prisma.$transaction(async (tx) => {
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
              buyPrice: buyPriceMap.get(item.productId) ?? 0,
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
