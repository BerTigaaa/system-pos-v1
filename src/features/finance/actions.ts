"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { hasPermissionAsync } from "@/lib/permissions-db";
import { notifyRole } from "@/lib/notifications";
import { getClientIp } from "@/lib/audit-log";
import { cashFlowFilterSchema, cashFlowFormSchema } from "./types";
import { Prisma } from "@prisma/client";

export async function getCashFlowCategories(type?: "IN" | "OUT") {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: { message: "Unauthorized" }, data: [] };
  if (!await hasPermissionAsync(session.user.role, "finance", "view"))
    return { success: false as const, error: { message: "Forbidden" }, data: [] };

  const where: Record<string, unknown> = {};
  if (type) where.type = type;

  const data = await prisma.cashFlowCategory.findMany({
    where: where as Prisma.CashFlowCategoryWhereInput,
    orderBy: { name: "asc" },
  });

  return { success: true as const, data };
}

export async function getCashFlows(params: {
  type?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}) {
  const session = await auth();
  if (!session?.user?.id)
    return { success: false as const, error: { message: "Unauthorized" }, data: [], total: 0, page: 1, pageSize: 20 };

  if (!await hasPermissionAsync(session.user.role, "finance", "view"))
    return { success: false as const, error: { message: "Forbidden" }, data: [], total: 0, page: 1, pageSize: 20 };

  const parsed = cashFlowFilterSchema.safeParse(params);
  if (!parsed.success)
    return { success: false as const, error: { message: parsed.error.issues[0].message }, data: [], total: 0, page: 1, pageSize: 20 };

  const { type, categoryId, dateFrom, dateTo, page, pageSize } = parsed.data;

  const where: Record<string, unknown> = { deletedAt: null };
  if (type) where.type = type;
  if (categoryId) where.categoryId = categoryId;
  if (dateFrom || dateTo) {
    const date: Record<string, Date> = {};
    if (dateFrom) date.gte = new Date(dateFrom);
    if (dateTo) date.lte = new Date(dateTo + "T23:59:59.999Z");
    where.date = date;
  }

  const [data, total] = await Promise.all([
    prisma.cashFlow.findMany({
      where: where as Prisma.CashFlowWhereInput,
      include: {
        category: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.cashFlow.count({ where: where as Prisma.CashFlowWhereInput }),
  ]);

  return {
    success: true as const,
    data: data.map((d) => ({
      id: d.id,
      type: d.type,
      amount: Number(d.amount),
      description: d.description,
      reference: d.reference,
      date: d.date,
      category: d.category,
      user: d.user,
      createdAt: d.createdAt,
    })),
    total,
    page,
    pageSize,
  };
}

export async function createCashFlow(formData: CashFlowFormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: { message: "Unauthorized" } };

  if (!await hasPermissionAsync(session.user.role, "finance", "manage"))
    return { success: false as const, error: { message: "Forbidden" } };

  const parsed = cashFlowFormSchema.safeParse(formData);
  if (!parsed.success)
    return { success: false as const, error: { message: parsed.error.issues[0].message } };

  const { type, categoryId, amount, description, reference, date } = parsed.data;

  const category = await prisma.cashFlowCategory.findUnique({ where: { id: categoryId } });
  if (!category) return { success: false as const, error: { message: "Kategori tidak ditemukan" } };
  if (category.type !== type) return { success: false as const, error: { message: "Kategori tidak sesuai tipe" } };

  const clientIp = await getClientIp();

  await prisma.$transaction(async (tx) => {
    await tx.cashFlow.create({
      data: {
        userId: session.user.id,
        categoryId,
        type,
        amount,
        description,
        reference: reference || null,
        date: new Date(date),
      },
    });

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: type === "IN" ? "CASH_IN_CREATED" : "CASH_OUT_CREATED",
        module: "finance",
        description: `${type === "IN" ? "Kas Masuk" : "Kas Keluar"}: ${description} — Rp ${amount.toLocaleString("id")}`,
        newData: { type, categoryId, amount, description, reference, date },
        ipAddress: clientIp,
      },
    });
  });

  await notifyRole(["OWNER", "FINANCE"], {
    type: "CASH_FLOW_CREATED",
    title: type === "IN" ? "Kas Masuk" : "Kas Keluar",
    message: `${type === "IN" ? "Kas Masuk" : "Kas Keluar"}: ${description} — Rp ${amount.toLocaleString("id")}.`,
    data: { type, amount, description, reference, date },
  });

  revalidatePath("/finance");
  return { success: true as const };
}

export async function updateCashFlow(id: string, formData: CashFlowFormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: { message: "Unauthorized" } };
  if (!await hasPermissionAsync(session.user.role, "finance", "manage"))
    return { success: false as const, error: { message: "Forbidden" } };

  const existing = await prisma.cashFlow.findUnique({ where: { id } });
  if (!existing) return { success: false as const, error: { message: "Data tidak ditemukan" } };
  if (existing.deletedAt) return { success: false as const, error: { message: "Data sudah dihapus" } };

  const parsed = cashFlowFormSchema.safeParse(formData);
  if (!parsed.success)
    return { success: false as const, error: { message: parsed.error.issues[0].message } };

  const { type, categoryId, amount, description, reference, date } = parsed.data;
  const oldData = { ...existing, amount: Number(existing.amount) };
  const clientIp = await getClientIp();

  await prisma.$transaction(async (tx) => {
    await tx.cashFlow.update({
      where: { id },
      data: {
        categoryId,
        type,
        amount,
        description,
        reference: reference || null,
        date: new Date(date),
      },
    });

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CASH_FLOW_UPDATED",
        module: "finance",
        description: `Update ${type === "IN" ? "kas masuk" : "kas keluar"}: ${description}`,
        oldData: { amount: Number(oldData.amount), description: oldData.description },
        newData: { amount, description },
        ipAddress: clientIp,
      },
    });
  });

  revalidatePath("/finance");
  return { success: true as const };
}

export async function deleteCashFlow(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: { message: "Unauthorized" } };
  if (!await hasPermissionAsync(session.user.role, "finance", "manage"))
    return { success: false as const, error: { message: "Forbidden" } };

  const existing = await prisma.cashFlow.findUnique({ where: { id } });
  if (!existing) return { success: false as const, error: { message: "Data tidak ditemukan" } };

  const clientIp = await getClientIp();

  await prisma.$transaction(async (tx) => {
    await tx.cashFlow.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CASH_FLOW_DELETED",
        module: "finance",
        description: `Hapus ${existing.type === "IN" ? "kas masuk" : "kas keluar"}: ${existing.description}`,
        oldData: { amount: Number(existing.amount), description: existing.description },
        ipAddress: clientIp,
      },
    });
  });

  await notifyRole(["OWNER", "FINANCE"], {
    type: "CASH_FLOW_DELETED",
    title: "Catatan Keuangan Dihapus",
    message: `Hapus ${existing.type === "IN" ? "kas masuk" : "kas keluar"}: ${existing.description} — Rp ${Number(existing.amount).toLocaleString("id")}.`,
    data: { amount: Number(existing.amount), description: existing.description },
  });

  revalidatePath("/finance");
  return { success: true as const };
}

export async function getFinanceSummary(period?: { month?: number; year?: number }) {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: { message: "Unauthorized" }, data: null };
  if (!await hasPermissionAsync(session.user.role, "finance", "view"))
    return { success: false as const, error: { message: "Forbidden" }, data: null };

  const now = new Date();
  const month = period?.month ?? now.getMonth() + 1;
  const year = period?.year ?? now.getFullYear();

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const wherePeriod = { createdAt: { gte: startDate, lte: endDate }, deletedAt: null } as Prisma.CashFlowWhereInput;

  const [cashIn, cashOut, salesTotal] = await Promise.all([
    prisma.cashFlow.aggregate({
      where: { ...wherePeriod, type: "IN" },
      _sum: { amount: true },
    }),
    prisma.cashFlow.aggregate({
      where: { ...wherePeriod, type: "OUT" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { createdAt: { gte: startDate, lte: endDate }, status: "COMPLETED" },
      _sum: { total: true },
    }),
  ]);

  // HPP: sum of buyPrice * quantity for completed transactions in period
  const txItems = await prisma.transactionItem.findMany({
    where: {
      transaction: {
        createdAt: { gte: startDate, lte: endDate },
        status: "COMPLETED",
      },
    },
    select: { buyPrice: true, quantity: true },
  });
  const hpp = txItems.reduce((sum, i) => sum + Number(i.buyPrice) * i.quantity, 0);

  const revenue = Number(salesTotal._sum.total ?? 0);
  const totalCashIn = Number(cashIn._sum.amount ?? 0);
  const totalCashOut = Number(cashOut._sum.amount ?? 0);
  const grossProfit = revenue - hpp;
  const netProfit = grossProfit - totalCashOut;

  return {
    success: true as const,
    data: {
      period: { month, year },
      sales: revenue,
      cashIn: totalCashIn,
      totalRevenue: revenue + totalCashIn,
      hpp,
      grossProfit,
      cashOut: totalCashOut,
      netProfit,
    },
  };
}

export async function exportFinance(params: {
  type: "cash-in" | "cash-out" | "summary";
  format: "xlsx" | "pdf";
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  month?: number;
  year?: number;
}) {
  const session = await auth();
  if (!session?.user?.id)
    return { success: false as const, error: { message: "Unauthorized" } };
  if (!await hasPermissionAsync(session.user.role, "finance", "view"))
    return { success: false as const, error: { message: "Forbidden" } };

  let rows: Record<string, unknown>[] = [];
  let title = "";

  if (params.type === "summary") {
    const res = await getFinanceSummary({ month: params.month, year: params.year });
    if (res.success && res.data) {
      const d = res.data;
      title = `Rekap Keuangan - ${d.period.month}/${d.period.year}`;
      rows = [
        { Metrik: "Penjualan", Nilai: d.sales },
        { Metrik: "Kas Masuk", Nilai: d.cashIn },
        { Metrik: "Total Pendapatan", Nilai: d.totalRevenue },
        { Metrik: "HPP", Nilai: d.hpp },
        { Metrik: "Gross Profit", Nilai: d.grossProfit },
        { Metrik: "Kas Keluar", Nilai: d.cashOut },
        { Metrik: "Net Profit", Nilai: d.netProfit },
      ];
    }
  } else {
    const flowType = params.type === "cash-in" ? "IN" : "OUT";
    const res = await getCashFlows({
      type: flowType,
      categoryId: params.categoryId,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      page: 1,
      pageSize: 5000,
    });
    if (res.success) {
      title = flowType === "IN" ? "Kas Masuk" : "Kas Keluar";
      rows = res.data.map((d) => ({
        Tanggal: new Date(d.date).toLocaleDateString("id-ID"),
        Kategori: d.category.name,
        Deskripsi: d.description,
        Referensi: d.reference ?? "-",
        Jumlah: d.amount,
        User: d.user.name,
      }));
    }
  }

  if (rows.length === 0) {
    return { success: false as const, error: { message: "Tidak ada data untuk diexport" } };
  }

  if (params.format === "xlsx") {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    return {
      success: true as const,
      data: {
        buffer: Array.from(new Uint8Array(buf)),
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        extension: "xlsx",
      },
    };
  } else {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF();
    doc.text(title, 14, 15);
    if (rows.length > 0) {
      const headers = Object.keys(rows[0]);
      const body = rows.map((r) => headers.map((h) => String(r[h] ?? "")));
      autoTable(doc, {
        head: [headers],
        body,
        startY: 20,
        styles: { fontSize: 8 },
      });
    }
    return {
      success: true as const,
      data: {
        buffer: Array.from(new Uint8Array(doc.output("arraybuffer"))),
        contentType: "application/pdf",
        extension: "pdf",
      },
    };
  }
}

type CashFlowFormData = {
  type: "IN" | "OUT";
  categoryId: string;
  amount: number;
  description: string;
  reference?: string;
  date: string;
};
