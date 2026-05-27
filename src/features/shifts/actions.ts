"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { openShiftSchema, closeShiftSchema } from "./types";
import { auth } from "@/lib/auth";

export async function getActiveShift() {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" }, data: null };

  const shift = await prisma.shift.findFirst({
    where: { userId: session.user.id, status: "OPEN" },
    orderBy: { openedAt: "desc" },
  });

  return {
    success: true,
    data: shift
      ? {
          ...shift,
          openingBalance: Number(shift.openingBalance),
          closingBalance: shift.closingBalance ? Number(shift.closingBalance) : null,
          totalCash: Number(shift.totalCash),
          totalQris: Number(shift.totalQris),
          totalTransfer: Number(shift.totalTransfer),
          totalCard: Number(shift.totalCard),
          totalSales: Number(shift.totalSales),
        }
      : null,
  };
}

export async function getShiftList(params: {
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const session = await auth();
  if (!session?.user?.id)
    return { success: false, error: { message: "Unauthorized" }, data: [], total: 0, page: 1, pageSize: 10 };

  const { search, page = 1, pageSize = 10 } = params;

  const where: Record<string, unknown> = {};
  if (session.user.role === "CASHIER") {
    where.userId = session.user.id;
  }
  if (search) {
    where.OR = [{ user: { name: { contains: search, mode: "insensitive" } } }];
  }

  const [data, total] = await Promise.all([
    prisma.shift.findMany({
      where,
      include: { user: { select: { name: true } } },
      orderBy: { openedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.shift.count({ where }),
  ]);

  return {
    success: true,
    data: data.map((s) => ({
      id: s.id,
      userId: s.userId,
      userName: s.user.name,
      status: s.status,
      openingBalance: Number(s.openingBalance),
      closingBalance: s.closingBalance ? Number(s.closingBalance) : null,
      totalCash: Number(s.totalCash),
      totalQris: Number(s.totalQris),
      totalTransfer: Number(s.totalTransfer),
      totalCard: Number(s.totalCard),
      totalSales: Number(s.totalSales),
      totalTransactions: s.totalTransactions,
      openedAt: s.openedAt,
      closedAt: s.closedAt,
      notes: s.notes,
    })),
    total,
    page,
    pageSize,
  };
}

export async function openShift(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };

  const active = await prisma.shift.findFirst({
    where: { userId: session.user.id, status: "OPEN" },
  });
  if (active) return { success: false, error: { message: "Anda masih memiliki shift aktif" } };

  const parsed = openShiftSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, error: { message: parsed.error.issues[0].message } };

  await prisma.shift.create({
    data: {
      userId: session.user.id,
      openingBalance: parsed.data.openingBalance,
      notes: parsed.data.notes,
    },
  });

  revalidatePath("/shifts");
  return { success: true };
}

export async function closeShift(shiftId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };

  const parsed = closeShiftSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, error: { message: parsed.error.issues[0].message } };

  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
    include: {
      transactions: {
        where: { status: "COMPLETED" },
        include: { payments: true },
      },
    },
  });
  if (!shift) return { success: false, error: { message: "Shift tidak ditemukan" } };
  if (shift.status === "CLOSED") return { success: false, error: { message: "Shift sudah ditutup" } };

  let totalCash = 0;
  let totalQris = 0;
  let totalTransfer = 0;
  let totalCard = 0;
  let totalSales = 0;

  for (const tx of shift.transactions) {
    totalSales += Number(tx.total);
    for (const p of tx.payments) {
      const amt = Number(p.amount);
      switch (p.method) {
        case "CASH": totalCash += amt; break;
        case "QRIS": totalQris += amt; break;
        case "BANK_TRANSFER": totalTransfer += amt; break;
        case "DEBIT_CARD":
        case "CREDIT_CARD": totalCard += amt; break;
      }
    }
  }

  await prisma.shift.update({
    where: { id: shiftId },
    data: {
      status: "CLOSED",
      closingBalance: parsed.data.closingBalance,
      totalCash,
      totalQris,
      totalTransfer,
      totalCard,
      totalSales,
      totalTransactions: shift.transactions.length,
      closedAt: new Date(),
      notes: parsed.data.notes || shift.notes,
    },
  });

  revalidatePath("/shifts");
  return { success: true };
}
