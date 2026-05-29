"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { transactionFilterSchema, refundSchema } from "./types";
import { getClientIp } from "@/lib/audit-log";
import { Prisma, TransactionStatus, InventoryMovementType } from "@prisma/client";

function parseDecimal(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value);
  return Number(value);
}

export async function getTransactions(params: {
  search?: string;
  cashierId?: string;
  status?: string;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}) {
  const session = await auth();
  if (!session?.user?.id)
    return { success: false as const, error: { message: "Unauthorized" }, data: [], total: 0, page: 1, pageSize: 20 };

  if (!hasPermission(session.user.role, "transactions", "view"))
    return { success: false as const, error: { message: "Forbidden" }, data: [], total: 0, page: 1, pageSize: 20 };

  const parsed = transactionFilterSchema.safeParse(params);
  if (!parsed.success)
    return { success: false as const, error: { message: parsed.error.issues[0].message }, data: [], total: 0, page: 1, pageSize: 20 };

  const { search, cashierId, status, paymentMethod, dateFrom, dateTo, page, pageSize } = parsed.data;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
    ];
  }
  if (cashierId) where.cashierId = cashierId;
  if (status) where.status = status;
  if (dateFrom || dateTo) {
    const createdAt: Record<string, Date> = {};
    if (dateFrom) createdAt.gte = new Date(dateFrom);
    if (dateTo) createdAt.lte = new Date(dateTo + "T23:59:59.999Z");
    where.createdAt = createdAt;
  }

  const paymentWhere = paymentMethod ? { payments: { some: { method: paymentMethod } } } : {};

  const [data, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { ...where, ...paymentWhere } as Prisma.TransactionWhereInput,
      include: {
        cashier: { select: { id: true, name: true, email: true } },
        payments: true,
        items: { take: 1, orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.transaction.count({ where: { ...where, ...paymentWhere } as Prisma.TransactionWhereInput }),
  ]);

  return {
    success: true as const,
    data: data.map((t) => ({
      id: t.id,
      invoiceNumber: t.invoiceNumber,
      cashierName: t.cashier.name,
      customerName: t.customerName,
      status: t.status,
      total: Number(t.total),
      paymentMethods: t.payments.map((p) => p.method),
      createdAt: t.createdAt,
      itemCount: t.items.length,
    })),
    total,
    page,
    pageSize,
  };
}

export async function getTransactionById(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: { message: "Unauthorized" } };

  if (!hasPermission(session.user.role, "transactions", "view"))
    return { success: false as const, error: { message: "Forbidden" } };

  const t = await prisma.transaction.findUnique({
    where: { id },
    include: {
      cashier: { select: { id: true, name: true, email: true } },
      items: true,
      payments: true,
      refunds: {
        include: {
          items: true,
          processedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!t) return { success: false as const, error: { message: "Transaksi tidak ditemukan" } };

  return {
    success: true as const,
    data: {
      id: t.id,
      invoiceNumber: t.invoiceNumber,
      cashier: { id: t.cashier.id, name: t.cashier.name, email: t.cashier.email },
      customerName: t.customerName,
      status: t.status,
      subtotal: Number(t.subtotal),
      discountAmount: Number(t.discountAmount),
      taxPercent: Number(t.taxPercent),
      taxAmount: Number(t.taxAmount),
      total: Number(t.total),
      notes: t.notes,
      tableNumber: t.tableNumber,
      createdAt: t.createdAt,
      items: t.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.productName,
        productSku: i.productSku,
        buyPrice: Number(i.buyPrice),
        sellPrice: Number(i.sellPrice),
        quantity: i.quantity,
        discountAmount: Number(i.discountAmount),
        subtotal: Number(i.subtotal),
      })),
      payments: t.payments.map((p) => ({
        id: p.id,
        method: p.method,
        amount: Number(p.amount),
        reference: p.reference,
        changeAmount: Number(p.changeAmount),
      })),
      refunds: t.refunds.map((r) => ({
        id: r.id,
        refundNumber: r.refundNumber,
        totalAmount: Number(r.totalAmount),
        reason: r.reason,
        processedBy: { id: r.processedBy.id, name: r.processedBy.name },
        createdAt: r.createdAt,
        items: r.items.map((ri) => ({
          id: ri.id,
          transactionItemId: ri.transactionItemId,
          quantity: ri.quantity,
          amount: Number(ri.amount),
        })),
      })),
    },
  };
}

export async function processRefund(formData: RefundFormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: { message: "Unauthorized" } };

  if (!hasPermission(session.user.role, "refund", "create"))
    return { success: false as const, error: { message: "Forbidden" } };

  const parsed = refundSchema.safeParse(formData);
  if (!parsed.success)
    return { success: false as const, error: { message: parsed.error.issues[0].message } };

  const { transactionId, items, reason } = parsed.data;

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { items: true, refunds: { include: { items: true } } },
  });

  if (!transaction) return { success: false as const, error: { message: "Transaksi tidak ditemukan" } };
  if (transaction.status === "REFUNDED") return { success: false as const, error: { message: "Transaksi sudah direfund全部" } };
  if (transaction.status !== "COMPLETED" && transaction.status !== "PARTIALLY_REFUNDED")
    return { success: false as const, error: { message: "Transaksi tidak dapat direfund" } };

  const alreadyRefundedMap = new Map<string, number>();
  for (const refund of transaction.refunds) {
    for (const ri of refund.items) {
      alreadyRefundedMap.set(ri.transactionItemId, (alreadyRefundedMap.get(ri.transactionItemId) ?? 0) + ri.quantity);
    }
  }

  for (const item of items) {
    const txItem = transaction.items.find((i) => i.id === item.transactionItemId);
    if (!txItem) return { success: false as const, error: { message: `Item ${item.transactionItemId} tidak ditemukan di transaksi` } };
    const alreadyRefunded = alreadyRefundedMap.get(item.transactionItemId) ?? 0;
    const available = txItem.quantity - alreadyRefunded;
    if (item.quantity > available)
      return { success: false as const, error: { message: `Item ${txItem.productName}: refund melebihi sisa (max ${available})` } };
  }

  const refundNumber = await generateRefundNumber();
  const clientIp = await getClientIp();

  const result = await prisma.$transaction(async (tx) => {
    const refund = await tx.refund.create({
      data: {
        transactionId,
        refundNumber,
        totalAmount: items.reduce((sum, i) => sum + i.amount, 0),
        reason,
        processedById: session.user.id,
        items: {
          create: items.map((item) => ({
            transactionItemId: item.transactionItemId,
            quantity: item.quantity,
            amount: item.amount,
          })),
        },
      },
    });

    const totalRefundedSoFar = items.reduce((sum, i) => sum + i.amount, 0) +
      transaction.refunds.reduce((s, r) => s + Number(r.totalAmount), 0);

    const newStatus: TransactionStatus =
      totalRefundedSoFar >= Number(transaction.subtotal) ? "REFUNDED" : "PARTIALLY_REFUNDED";

    await tx.transaction.update({
      where: { id: transactionId },
      data: { status: newStatus },
    });

    const refundItemIds = items.map((i) => i.transactionItemId);
    const txItems = transaction.items.filter((ti) => refundItemIds.includes(ti.id));
    const productIds = [...new Set(txItems.map((ti) => ti.productId))];
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, stock: true },
    });
    const productStockMap = new Map(products.map((p) => [p.id, p.stock]));

    await Promise.all(
      items.map((item) => {
        const txItem = txItems.find((i) => i.id === item.transactionItemId)!;
        const stockBefore = productStockMap.get(txItem.productId) ?? 0;
        productStockMap.set(txItem.productId, stockBefore + item.quantity);
        return tx.product.update({
          where: { id: txItem.productId },
          data: { stock: { increment: item.quantity } },
        });
      })
    );

    const movements = items.map((item) => {
      const txItem = txItems.find((i) => i.id === item.transactionItemId)!;
      return {
        productId: txItem.productId,
        userId: session.user.id,
        type: "RETURN" as InventoryMovementType,
        quantity: item.quantity,
        stockBefore: productStockMap.get(txItem.productId)! - item.quantity,
        stockAfter: productStockMap.get(txItem.productId)!,
        notes: `Refund: ${refundNumber} - ${txItem.productName} x${item.quantity}`,
      };
    });
    await tx.inventoryMovement.createMany({ data: movements });

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "TRANSACTION_REFUNDED",
        module: "transactions",
        description: `Refund ${refundNumber}: ${items.length} item, total Rp ${items.reduce((s, i) => s + i.amount, 0).toLocaleString()}`,
        newData: { transactionId, refundNumber, items, reason, status: newStatus },
        ipAddress: clientIp,
      },
    });

    const adminUsers = await tx.user.findMany({
      where: { role: { in: ["OWNER", "FINANCE"] }, status: "ACTIVE" },
      select: { id: true },
    });

    if (adminUsers.length > 0) {
      await tx.notification.createMany({
        data: adminUsers.map((u) => ({
          userId: u.id,
          type: "REFUND_SUCCESS",

          title: "Refund Berhasil",
          message: `Refund ${refundNumber} sebesar Rp ${items.reduce((s, i) => s + i.amount, 0).toLocaleString()} telah diproses.`,
          data: { transactionId, refundNumber, totalAmount: items.reduce((s, i) => s + i.amount, 0) },
        })),
      });
    }

    return refund;
  });

  revalidatePath("/transactions");

  return { success: true as const, data: { id: result.id, refundNumber: result.refundNumber } };
}

async function generateRefundNumber(): Promise<string> {
  const today = new Date();
  const yyyy = today.getFullYear().toString();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const prefix = `RFN-${yyyy}${mm}${dd}-`;

  const lastRefund = await prisma.refund.findFirst({
    where: { refundNumber: { startsWith: prefix } },
    orderBy: { refundNumber: "desc" },
    select: { refundNumber: true },
  });

  let seq = 1;
  if (lastRefund) {
    const lastSeq = parseInt(lastRefund.refundNumber.slice(-4), 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }

  return `${prefix}${String(seq).padStart(4, "0")}`;
}

type RefundFormData = {
  transactionId: string;
  items: { transactionItemId: string; quantity: number; amount: number }[];
  reason: string;
};

export async function exportTransactions(params: {
  search?: string;
  cashierId?: string;
  status?: string;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
  format: "xlsx" | "pdf";
}) {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: { message: "Unauthorized" } };

  if (!hasPermission(session.user.role, "transactions", "view"))
    return { success: false as const, error: { message: "Forbidden" } };

  const transactions = await prisma.transaction.findMany({
    where: buildTransactionWhere(params),
    include: {
      cashier: { select: { name: true } },
      payments: true,
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = transactions.map((t) => ({
    "No. Invoice": t.invoiceNumber,
    Tanggal: t.createdAt.toLocaleDateString("id-ID"),
    Kasir: t.cashier.name,
    Pelanggan: t.customerName ?? "-",
    Status: t.status,
    Subtotal: Number(t.subtotal),
    Diskon: Number(t.discountAmount),
    Pajak: Number(t.taxAmount),
    Total: Number(t.total),
    "Metode Bayar": t.payments.map((p) => p.method).join(", "),
  }));

  let buffer: Uint8Array;
  let contentType: string;
  let extension: string;

  if (params.format === "xlsx") {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Transaksi");
    const data = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    buffer = new Uint8Array(data);
    contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    extension = "xlsx";
  } else {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF();
    doc.text("Daftar Transaksi", 14, 15);
    const headers = Object.keys(rows[0] ?? {});
    const body = rows.map((r) => headers.map((h) => String((r as Record<string, unknown>)[h] ?? "")));
    autoTable(doc, {
      head: [headers],
      body,
      startY: 20,
      styles: { fontSize: 8 },
    });
    buffer = new Uint8Array(doc.output("arraybuffer"));
    contentType = "application/pdf";
    extension = "pdf";
  }

  return { success: true as const, data: { buffer: Array.from(buffer), contentType, extension } };
}

function buildTransactionWhere(params: Record<string, unknown>) {
  const where: Record<string, unknown> = {};
  if (params.search) {
    where.OR = [
      { invoiceNumber: { contains: params.search, mode: "insensitive" } },
      { customerName: { contains: params.search, mode: "insensitive" } },
    ];
  }
  if (params.cashierId) where.cashierId = params.cashierId;
  if (params.status) where.status = params.status;
  if (params.paymentMethod) where.payments = { some: { method: params.paymentMethod } };
  if (params.dateFrom || params.dateTo) {
    const createdAt: Record<string, Date> = {};
    if (params.dateFrom) createdAt.gte = new Date(params.dateFrom as string);
    if (params.dateTo) createdAt.lte = new Date((params.dateTo as string) + "T23:59:59.999Z");
    where.createdAt = createdAt;
  }
  return where as Prisma.TransactionWhereInput;
}

export async function getTransactionStats() {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: { message: "Unauthorized" }, data: null };
  if (!hasPermission(session.user.role, "transactions", "view"))
    return { success: false as const, error: { message: "Forbidden" }, data: null };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalTransactions, todayTransactions, totalRevenue, todayRevenue] = await Promise.all([
    prisma.transaction.count(),
    prisma.transaction.count({ where: { createdAt: { gte: today } } }),
    prisma.transaction.aggregate({ _sum: { total: true } }),
    prisma.transaction.aggregate({
      where: { createdAt: { gte: today } },
      _sum: { total: true },
    }),
  ]);

  return {
    success: true as const,
    data: {
      totalTransactions,
      todayTransactions,
      totalRevenue: Number(totalRevenue._sum.total ?? 0),
      todayRevenue: Number(todayRevenue._sum.total ?? 0),
    },
  };
}
