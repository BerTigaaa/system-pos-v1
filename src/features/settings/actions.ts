"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { notifyRole } from "@/lib/notifications";

export async function getBusinessInfo() {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };
  const info = await prisma.businessInfo.findFirst({ include: { diningTables: { where: { isActive: true }, orderBy: { tableNumber: "asc" } } } });
  return { success: true, data: info };
}

export async function updateBusinessInfo(data: {
  name: string;
  ownerName: string;
  address?: string;
  phone?: string;
  email?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };
  if (!hasPermission(session.user.role, "settings", "edit"))
    return { success: false, error: { message: "Forbidden" } };

  const existing = await prisma.businessInfo.findFirst();
  if (!existing) return { success: false, error: { message: "Data bisnis tidak ditemukan" } };

  await prisma.businessInfo.update({
    where: { id: existing.id },
    data: {
      name: data.name,
      ownerName: data.ownerName,
      address: data.address ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
    },
  });

  await notifyRole(["OWNER"], {
    type: "SETTINGS_CHANGED",
    title: "Profil Bisnis Diubah",
    message: "Profil bisnis telah diperbarui.",
    data: { section: "business_info" },
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function saveSelfOrderSettings(data: {
  selfOrderEnabled: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };
  if (!hasPermission(session.user.role, "settings", "edit"))
    return { success: false, error: { message: "Forbidden" } };

  const existing = await prisma.businessInfo.findFirst();
  if (!existing) return { success: false, error: { message: "Data bisnis tidak ditemukan" } };

  await prisma.businessInfo.update({
    where: { id: existing.id },
    data: { selfOrderEnabled: data.selfOrderEnabled },
  });

  await notifyRole(["OWNER"], {
    type: "SETTINGS_CHANGED",
    title: "Pengaturan Pesanan Diubah",
    message: `Pesanan mandiri ${data.selfOrderEnabled ? "diaktifkan" : "dinonaktifkan"}.`,
    data: { section: "self_order", selfOrderEnabled: data.selfOrderEnabled },
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function saveTableSettings(data: { totalTables: number }) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };
  if (!hasPermission(session.user.role, "settings", "edit"))
    return { success: false, error: { message: "Forbidden" } };

  const existing = await prisma.businessInfo.findFirst();
  if (!existing) return { success: false, error: { message: "Data bisnis tidak ditemukan" } };

  await prisma.$transaction(async (tx) => {
    await tx.businessInfo.update({
      where: { id: existing.id },
      data: { totalTables: data.totalTables },
    });

    const currentTables = await tx.diningTable.findMany({
      where: { businessInfoId: existing.id },
      orderBy: { tableNumber: "asc" },
    });

    const existingNumbers = currentTables.map((t) => t.tableNumber);
    const targetNumbers = Array.from({ length: data.totalTables }, (_, i) => i + 1);

    const toCreate = targetNumbers.filter((n) => !existingNumbers.includes(n));
    const toDelete = existingNumbers.filter((n) => !targetNumbers.includes(n));

    if (toDelete.length > 0) {
      await tx.diningTable.deleteMany({
        where: { businessInfoId: existing.id, tableNumber: { in: toDelete } },
      });
    }

    if (toCreate.length > 0) {
      await tx.diningTable.createMany({
        data: toCreate.map((num) => ({ businessInfoId: existing.id, tableNumber: num })),
      });
    }
  });

  await notifyRole(["OWNER"], {
    type: "SETTINGS_CHANGED",
    title: "Jumlah Meja Diubah",
    message: `Jumlah meja diubah menjadi ${data.totalTables}.`,
    data: { section: "tables", totalTables: data.totalTables },
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function getAvailableTables() {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" }, data: [] };

  const info = await prisma.businessInfo.findFirst({
    select: { id: true, totalTables: true },
  });
  if (!info || info.totalTables <= 0) return { success: true, data: [] };

  const activeShift = await prisma.shift.findFirst({
    where: { userId: session.user.id, status: "OPEN" },
  });
  if (!activeShift) return { success: true, data: Array.from({ length: info.totalTables }, (_, i) => i + 1).map((num) => ({ tableNumber: num, isAvailable: true })) };

  const [occupiedByTransaction, occupiedByOrder] = await Promise.all([
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
  ]);
  const occupiedNumbers = [
    ...occupiedByTransaction.map((t) => t.tableNumber).filter((n): n is number => n !== null),
    ...occupiedByOrder.map((o) => o.tableNumber).filter((n): n is number => n !== null),
  ];

  const tables = Array.from({ length: info.totalTables }, (_, i) => i + 1);
  return {
    success: true,
    data: tables.map((num) => ({
      tableNumber: num,
      isAvailable: !occupiedNumbers.includes(num),
    })),
  };
}

export async function getSettings() {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: { message: "Unauthorized" }, data: {} };
  if (!hasPermission(session.user.role, "settings", "view"))
    return { success: false as const, error: { message: "Forbidden" }, data: {} };

  const settings = await prisma.setting.findMany();
  const map: Record<string, string> = {};
  for (const s of settings) {
    map[s.key] = s.value;
  }
  return { success: true as const, data: map };
}

export async function saveSetting(key: string, value: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: { message: "Unauthorized" } };
  if (!hasPermission(session.user.role, "settings", "edit"))
    return { success: false as const, error: { message: "Forbidden" } };

  await prisma.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });

  revalidatePath("/settings");
  return { success: true as const };
}
