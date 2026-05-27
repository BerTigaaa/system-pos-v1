"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { customerSchema } from "./types";
import { auth } from "@/lib/auth";

export async function getCustomers(params: {
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const { search, page = 1, pageSize = 10 } = params;

  const where: Record<string, unknown> = { deletedAt: null };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    success: true,
    data: data.map((c) => ({ ...c, totalSpent: Number(c.totalSpent) })),
    total,
    page,
    pageSize,
  };
}

export async function getCustomerById(id: string) {
  const c = await prisma.customer.findUnique({
    where: { id },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
  if (!c) return { success: false, error: { message: "Pelanggan tidak ditemukan" } };
  return {
    success: true,
    data: {
      ...c,
      totalSpent: Number(c.totalSpent),
      transactions: c.transactions.map((t) => ({
        ...t,
        subtotal: Number(t.subtotal),
        discountAmount: Number(t.discountAmount),
        taxPercent: Number(t.taxPercent),
        taxAmount: Number(t.taxAmount),
        total: Number(t.total),
      })),
    },
  };
}

export async function createCustomer(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };

  const parsed = customerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, error: { message: parsed.error.issues[0].message } };

  const dup = await prisma.customer.findUnique({ where: { phone: parsed.data.phone } });
  if (dup) return { success: false, error: { message: "Nomor telepon sudah terdaftar" } };

  await prisma.customer.create({ data: parsed.data });
  revalidatePath("/customers");
  return { success: true };
}

export async function updateCustomer(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };

  const parsed = customerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, error: { message: parsed.error.issues[0].message } };

  const dup = await prisma.customer.findFirst({
    where: { phone: parsed.data.phone, id: { not: id }, deletedAt: null },
  });
  if (dup) return { success: false, error: { message: "Nomor telepon sudah terdaftar" } };

  await prisma.customer.update({ where: { id }, data: parsed.data });
  revalidatePath("/customers");
  return { success: true };
}

export async function deleteCustomer(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };

  const txCount = await prisma.transaction.count({ where: { customerId: id } });
  if (txCount > 0) {
    await prisma.customer.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  } else {
    await prisma.customer.delete({ where: { id } });
  }

  revalidatePath("/customers");
  return { success: true };
}
