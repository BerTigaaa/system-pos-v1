"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { supplierSchema } from "./types";
import { auth } from "@/lib/auth";

export async function getSuppliers(params: { search?: string; page?: number; pageSize?: number }) {
  const { search, page = 1, pageSize = 10 } = params;

  const where: Record<string, unknown> = { isActive: true };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.supplier.count({ where }),
  ]);

  return { success: true, data, total, page, pageSize };
}

export async function createSupplier(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };

  const parsed = supplierSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, error: { message: parsed.error.issues[0].message } };

  await prisma.supplier.create({ data: parsed.data });
  revalidatePath("/inventory");
  return { success: true };
}

export async function updateSupplier(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };

  const parsed = supplierSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, error: { message: parsed.error.issues[0].message } };

  await prisma.supplier.update({ where: { id }, data: parsed.data });
  revalidatePath("/inventory");
  return { success: true };
}

export async function deleteSupplier(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };

  const count = await prisma.inventoryMovement.count({ where: { supplierId: id } });
  if (count > 0) {
    await prisma.supplier.update({ where: { id }, data: { isActive: false } });
  } else {
    await prisma.supplier.delete({ where: { id } });
  }

  revalidatePath("/inventory");
  return { success: true };
}
