"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { productSchema, categorySchema } from "./types";
import { hasPermission } from "@/lib/permissions";
import { auth } from "@/lib/auth";

export async function getProducts(params: {
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const { search, categoryId, isActive, page = 1, pageSize = 10 } = params;

  const where: Record<string, unknown> = { deletedAt: null };
  if (search) where.name = { contains: search, mode: "insensitive" };
  if (categoryId) where.categoryId = categoryId;
  if (isActive !== undefined) where.isActive = isActive;

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    success: true,
    data: data.map((p) => ({
      ...p,
      buyPrice: Number(p.buyPrice),
      sellPrice: Number(p.sellPrice),
    })),
    total,
    page,
    pageSize,
  };
}

export async function getProductById(id: string) {
  const p = await prisma.product.findUnique({
    where: { id },
    include: { category: { select: { id: true, name: true } } },
  });
  if (!p) return { success: false, error: { message: "Produk tidak ditemukan" } };
  return {
    success: true,
    data: { ...p, buyPrice: Number(p.buyPrice), sellPrice: Number(p.sellPrice) },
  };
}

export async function createProduct(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };
  if (!hasPermission(session.user.role, "products", "create"))
    return { success: false, error: { message: "Forbidden" } };

  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, error: { message: parsed.error.issues[0].message } };

  const exists = await prisma.product.findUnique({ where: { sku: parsed.data.sku } });
  if (exists) return { success: false, error: { message: "SKU sudah digunakan" } };

  const product = await prisma.product.create({
    data: {
      ...parsed.data,
      categoryId: parsed.data.categoryId || null,
    },
  });

  revalidatePath("/products");
  return { success: true, data: { id: product.id } };
}

export async function updateProduct(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };
  if (!hasPermission(session.user.role, "products", "edit"))
    return { success: false, error: { message: "Forbidden" } };

  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, error: { message: parsed.error.issues[0].message } };

  const dup = await prisma.product.findFirst({
    where: { sku: parsed.data.sku, id: { not: id }, deletedAt: null },
  });
  if (dup) return { success: false, error: { message: "SKU sudah digunakan" } };

  await prisma.product.update({
    where: { id },
    data: { ...parsed.data, categoryId: parsed.data.categoryId || null },
  });

  revalidatePath("/products");
  return { success: true };
}

export async function deleteProduct(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };
  if (!hasPermission(session.user.role, "products", "delete"))
    return { success: false, error: { message: "Forbidden" } };

  const txCount = await prisma.transactionItem.count({ where: { productId: id } });
  if (txCount > 0) {
    await prisma.product.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  } else {
    await prisma.product.delete({ where: { id } });
  }

  revalidatePath("/products");
  return { success: true };
}

export async function toggleProductActive(id: string, isActive: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };

  await prisma.product.update({ where: { id }, data: { isActive } });
  revalidatePath("/products");
  return { success: true };
}

// ── Categories ──

export async function getCategories() {
  const data = await prisma.category.findMany({
    where: { isActive: true },
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
  return { success: true, data };
}

export async function createCategory(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };

  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, error: { message: parsed.error.issues[0].message } };

  await prisma.category.create({ data: parsed.data });
  revalidatePath("/products");
  return { success: true };
}

export async function updateCategory(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };

  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, error: { message: parsed.error.issues[0].message } };

  await prisma.category.update({ where: { id }, data: parsed.data });
  revalidatePath("/products");
  return { success: true };
}

export async function deleteCategory(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };

  const count = await prisma.product.count({ where: { categoryId: id, deletedAt: null } });
  if (count > 0) return { success: false, error: { message: `Kategori digunakan ${count} produk` } };

  await prisma.category.delete({ where: { id } });
  revalidatePath("/products");
  return { success: true };
}
