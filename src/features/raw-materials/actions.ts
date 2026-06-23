"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit-log";
import { hasPermissionAsync } from "@/lib/permissions-db";
import { notifyRole } from "@/lib/notifications";
import { rawMaterialSchema, stockInSchema, stockOutSchema } from "./types";

export async function getRawMaterials(params: {
  search?: string;
  category?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const session = await auth();
  if (!session?.user?.id)
    return { success: false, error: { message: "Unauthorized" }, data: [], total: 0, page: 1, pageSize: 10 };
  if (!await hasPermissionAsync(session.user.role, "inventory", "view"))
    return { success: false, error: { message: "Forbidden" }, data: [], total: 0, page: 1, pageSize: 10 };

  const { search, category, isActive, page = 1, pageSize = 10 } = params;

  const where: Record<string, unknown> = { deletedAt: null };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
    ];
  }
  if (category) where.category = category;
  if (isActive !== undefined) where.isActive = isActive;

  const [data, total] = await Promise.all([
    prisma.rawMaterial.findMany({
      where,
      include: {
        batches: {
          select: {
            id: true,
            batchCode: true,
            quantity: true,
            expiryDate: true,
          },
          where: { quantity: { gt: 0 } },
          orderBy: { expiryDate: "asc" },
        },
        movements: {
          select: { type: true, quantity: true },
          where: { createdAt: { gte: new Date(new Date().setDate(new Date().getDate() - 30)) } },
        },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.rawMaterial.count({ where }),
  ]);

  return {
    success: true,
    data: data.map(({ movements, batches, ...rm }) => {
      const totalStockIn = movements.filter((m) => m.type === "STOCK_IN").reduce((s, m) => s + m.quantity, 0);
      const totalStockOut = movements.filter((m) => m.type === "STOCK_OUT").reduce((s, m) => s + m.quantity, 0);
      const latestBatchExpiry = batches.length > 0
        ? batches.filter((b) => b.expiryDate).sort((a, b) => a.expiryDate!.getTime() - b.expiryDate!.getTime())[0]
            ?.expiryDate?.toISOString() ?? null
        : null;
      return {
        ...rm,
        buyPrice: Number(rm.buyPrice),
        totalStockIn,
        totalStockOut,
        latestBatchExpiry,
        activeBatches: batches.length,
      };
    }),
    total,
    page,
    pageSize,
  };
}

export async function getRawMaterialById(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };
  if (!await hasPermissionAsync(session.user.role, "inventory", "view"))
    return { success: false, error: { message: "Forbidden" } };

  const rm = await prisma.rawMaterial.findUnique({
    where: { id },
    include: {
      batches: {
        where: { quantity: { gt: 0 } },
        include: { supplier: { select: { name: true } } },
        orderBy: { expiryDate: "asc" },
      },
    },
  });
  if (!rm) return { success: false, error: { message: "Bahan baku tidak ditemukan" } };

  return {
    success: true,
    data: {
      ...rm,
      buyPrice: Number(rm.buyPrice),
      batches: rm.batches.map((b) => ({
        ...b,
        buyPrice: Number(b.buyPrice),
        expiryDate: b.expiryDate?.toISOString() ?? null,
        supplierName: b.supplier?.name ?? null,
      })),
    },
  };
}

export async function createRawMaterial(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };
  if (!await hasPermissionAsync(session.user.role, "inventory", "manage"))
    return { success: false, error: { message: "Forbidden" } };

  const parsed = rawMaterialSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, error: { message: parsed.error.issues[0].message } };

  const exists = await prisma.rawMaterial.findUnique({ where: { sku: parsed.data.sku } });
  if (exists) return { success: false, error: { message: "SKU sudah digunakan" } };

  const rm = await prisma.rawMaterial.create({ data: parsed.data });

  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    module: "inventory",
    description: `Membuat bahan baku ${rm.name} (${rm.sku})`,
    newData: parsed.data as unknown as Record<string, unknown>,
  });

  revalidatePath("/inventory");
  return { success: true, data: { id: rm.id } };
}

export async function updateRawMaterial(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };
  if (!await hasPermissionAsync(session.user.role, "inventory", "manage"))
    return { success: false, error: { message: "Forbidden" } };

  const parsed = rawMaterialSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, error: { message: parsed.error.issues[0].message } };

  const dup = await prisma.rawMaterial.findFirst({
    where: { sku: parsed.data.sku, id: { not: id }, deletedAt: null },
  });
  if (dup) return { success: false, error: { message: "SKU sudah digunakan" } };

  const oldData = await prisma.rawMaterial.findUnique({ where: { id } });

  await prisma.rawMaterial.update({ where: { id }, data: parsed.data });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    module: "inventory",
    description: `Mengupdate bahan baku ${parsed.data.name}`,
    oldData: { name: oldData?.name, sku: oldData?.sku } as unknown as Record<string, unknown>,
    newData: parsed.data as unknown as Record<string, unknown>,
  });

  revalidatePath("/inventory");
  return { success: true };
}

export async function deleteRawMaterial(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };
  if (!await hasPermissionAsync(session.user.role, "inventory", "manage"))
    return { success: false, error: { message: "Forbidden" } };

  const rm = await prisma.rawMaterial.findUnique({ where: { id }, select: { name: true, sku: true } });

  const hasMovements = await prisma.rawMaterialMovement.count({ where: { rawMaterialId: id } });
  if (hasMovements > 0) {
    await prisma.rawMaterial.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  } else {
    await prisma.rawMaterial.delete({ where: { id } });
  }

  await createAuditLog({
    userId: session.user.id,
    action: "DELETE",
    module: "inventory",
    description: `Menghapus bahan baku ${rm?.name ?? id}`,
  });

  revalidatePath("/inventory");
  return { success: true };
}

export async function stockIn(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };
  if (!await hasPermissionAsync(session.user.role, "inventory", "manage"))
    return { success: false, error: { message: "Forbidden" } };

  const parsed = stockInSchema.safeParse({
    rawMaterialId: formData.get("rawMaterialId"),
    batchCode: formData.get("batchCode") || null,
    quantity: formData.get("quantity"),
    buyPrice: formData.get("buyPrice") || "0",
    expiryDate: formData.get("expiryDate") || null,
    supplierId: formData.get("supplierId") || null,
    notes: formData.get("notes") || null,
  });
  if (!parsed.success) return { success: false, error: { message: parsed.error.issues[0].message } };

  const rm = await prisma.rawMaterial.findUnique({ where: { id: parsed.data.rawMaterialId } });
  if (!rm) return { success: false, error: { message: "Bahan baku tidak ditemukan" } };

  const expiryDate = parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : null;

  await prisma.$transaction(async (tx) => {
    const batch = await tx.rawMaterialBatch.create({
      data: {
        rawMaterialId: parsed.data.rawMaterialId,
        batchCode: parsed.data.batchCode,
        quantity: parsed.data.quantity,
        buyPrice: parsed.data.buyPrice,
        expiryDate,
        supplierId: parsed.data.supplierId,
        notes: parsed.data.notes,
      },
    });

    await tx.rawMaterial.update({
      where: { id: parsed.data.rawMaterialId },
      data: { stock: { increment: parsed.data.quantity } },
    });

    await tx.rawMaterialMovement.create({
      data: {
        rawMaterialId: parsed.data.rawMaterialId,
        userId: session.user.id,
        supplierId: parsed.data.supplierId,
        type: "STOCK_IN",
        quantity: parsed.data.quantity,
        stockBefore: rm.stock,
        stockAfter: rm.stock + parsed.data.quantity,
        buyPrice: parsed.data.buyPrice,
        batchId: batch.id,
        notes: parsed.data.notes,
      },
    });
  });

  await createAuditLog({
    userId: session.user.id,
    action: "STOCK_IN",
    module: "inventory",
    description: `Stok masuk ${rm.name}: +${parsed.data.quantity} (${parsed.data.batchCode ?? "tanpa batch"})`,
    newData: parsed.data as unknown as Record<string, unknown>,
  });

  revalidatePath("/inventory");
  return { success: true };
}

export async function stockOut(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };
  if (!await hasPermissionAsync(session.user.role, "inventory", "manage"))
    return { success: false, error: { message: "Forbidden" } };

  const parsed = stockOutSchema.safeParse({
    rawMaterialId: formData.get("rawMaterialId"),
    quantity: formData.get("quantity"),
    reason: formData.get("reason") || null,
    notes: formData.get("notes") || null,
  });
  if (!parsed.success) return { success: false, error: { message: parsed.error.issues[0].message } };

  const rm = await prisma.rawMaterial.findUnique({ where: { id: parsed.data.rawMaterialId } });
  if (!rm) return { success: false, error: { message: "Bahan baku tidak ditemukan" } };

  if (rm.stock < parsed.data.quantity) {
    return { success: false, error: { message: `Stok tidak mencukupi (tersedia: ${rm.stock})` } };
  }

  await prisma.$transaction(async (tx) => {
    // FIFO: deduct from oldest batches first
    const batches = await tx.rawMaterialBatch.findMany({
      where: { rawMaterialId: parsed.data.rawMaterialId, quantity: { gt: 0 } },
      orderBy: [{ expiryDate: "asc" }, { createdAt: "asc" }],
    });

    let remaining = parsed.data.quantity;

    for (const batch of batches) {
      if (remaining <= 0) break;
      const deduct = Math.min(remaining, batch.quantity);
      remaining -= deduct;

      await tx.rawMaterialBatch.update({
        where: { id: batch.id },
        data: { quantity: { decrement: deduct } },
      });
    }

    if (remaining > 0) {
      throw new Error("Stok tidak mencukupi di batch");
    }

    await tx.rawMaterial.update({
      where: { id: parsed.data.rawMaterialId },
      data: { stock: { decrement: parsed.data.quantity } },
    });

    await tx.rawMaterialMovement.create({
      data: {
        rawMaterialId: parsed.data.rawMaterialId,
        userId: session.user.id,
        type: "STOCK_OUT",
        quantity: parsed.data.quantity,
        stockBefore: rm.stock,
        stockAfter: rm.stock - parsed.data.quantity,
        reason: parsed.data.reason,
        notes: parsed.data.notes,
      },
    });
  });

  await createAuditLog({
    userId: session.user.id,
    action: "STOCK_OUT",
    module: "inventory",
    description: `Stok keluar ${rm.name}: -${parsed.data.quantity}${parsed.data.reason ? ` (${parsed.data.reason})` : ""}`,
    newData: parsed.data as unknown as Record<string, unknown>,
  });

  revalidatePath("/inventory");
  return { success: true };
}

export async function getRawMaterialMovements(params: {
  rawMaterialId?: string;
  type?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const session = await auth();
  if (!session?.user?.id)
    return { success: false, error: { message: "Unauthorized" }, data: [], total: 0, page: 1, pageSize: 10 };
  if (!await hasPermissionAsync(session.user.role, "inventory", "view"))
    return { success: false, error: { message: "Forbidden" }, data: [], total: 0, page: 1, pageSize: 10 };

  const { rawMaterialId, type, search, page = 1, pageSize = 10 } = params;

  const where: Record<string, unknown> = {};
  if (rawMaterialId) where.rawMaterialId = rawMaterialId;
  if (type) where.type = type;
  if (search) {
    where.rawMaterial = {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  const [data, total] = await Promise.all([
    prisma.rawMaterialMovement.findMany({
      where,
      include: {
        rawMaterial: { select: { name: true, sku: true } },
        user: { select: { name: true } },
        supplier: { select: { name: true } },
        batch: { select: { batchCode: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.rawMaterialMovement.count({ where }),
  ]);

  return {
    success: true,
    data: data.map((m) => ({
      id: m.id,
      rawMaterialId: m.rawMaterialId,
      rawMaterialName: m.rawMaterial.name,
      rawMaterialSku: m.rawMaterial.sku,
      type: m.type,
      quantity: m.quantity,
      stockBefore: m.stockBefore,
      stockAfter: m.stockAfter,
      buyPrice: m.buyPrice ? Number(m.buyPrice) : null,
      userName: m.user.name,
      supplierName: m.supplier?.name ?? null,
      batchCode: m.batch?.batchCode ?? null,
      reason: m.reason,
      notes: m.notes,
      createdAt: m.createdAt,
    })),
    total,
    page,
    pageSize,
  };
}

export async function getExpiringBatches(days = 14) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" }, data: [] };
  if (!await hasPermissionAsync(session.user.role, "inventory", "view"))
    return { success: false, error: { message: "Forbidden" }, data: [] };

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);

  const batches = await prisma.rawMaterialBatch.findMany({
    where: {
      expiryDate: { not: null, lte: cutoff },
      quantity: { gt: 0 },
    },
    include: {
      rawMaterial: { select: { name: true, sku: true, unit: true } },
      supplier: { select: { name: true } },
    },
    orderBy: { expiryDate: "asc" },
  });

  return {
    success: true,
    data: batches.map((b) => ({
      id: b.id,
      rawMaterialId: b.rawMaterialId,
      rawMaterialName: b.rawMaterial.name,
      rawMaterialSku: b.rawMaterial.sku,
      unit: b.rawMaterial.unit,
      batchCode: b.batchCode,
      quantity: b.quantity,
      expiryDate: b.expiryDate!.toISOString(),
      supplierName: b.supplier?.name ?? null,
    })),
  };
}

export async function getLowStockRawMaterials() {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" }, data: [] };
  if (!await hasPermissionAsync(session.user.role, "inventory", "view"))
    return { success: false, error: { message: "Forbidden" }, data: [] };

  const data = await prisma.$queryRawUnsafe<{ id: string; name: string; sku: string; stock: number; min_stock: number; unit: string }[]>(
    `SELECT id, name, sku, stock, min_stock, unit FROM raw_materials WHERE deleted_at IS NULL AND is_active = true AND stock <= min_stock ORDER BY stock ASC LIMIT 10`
  );

  const mapped = data.map((r) => ({ ...r, minStock: r.min_stock }));

  return { success: true, data: mapped };
}

export async function getRawMaterialCategories() {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" }, data: [] };

  const result = await prisma.rawMaterial.findMany({
    where: { deletedAt: null, category: { not: null } },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });

  return { success: true, data: result.map((r) => r.category!).filter(Boolean) };
}

export async function getAllRawMaterials() {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" }, data: [] };

  const data = await prisma.rawMaterial.findMany({
    where: { deletedAt: null, isActive: true },
    select: { id: true, name: true, sku: true, stock: true, unit: true },
    orderBy: { name: "asc" },
  });

  return { success: true, data };
}
