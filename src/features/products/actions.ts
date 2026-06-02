"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { productSchema, categorySchema } from "./types";
import { createUploadUrl, getImageUrl } from "@/lib/cloudflare-images";
import { hasPermissionAsync } from "@/lib/permissions-db";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit-log";
import { notifyRole } from "@/lib/notifications";

export async function getProducts(params: {
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" }, data: [], total: 0, page: 1, pageSize: 10 };
  if (!await hasPermissionAsync(session.user.role, "products", "view"))
    return { success: false, error: { message: "Forbidden" }, data: [], total: 0, page: 1, pageSize: 10 };

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
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };
  if (!await hasPermissionAsync(session.user.role, "products", "view"))
    return { success: false, error: { message: "Forbidden" } };

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
  if (!await hasPermissionAsync(session.user.role, "products", "manage"))
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

  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    module: "products",
    description: `Membuat produk ${product.name} (${product.sku})`,
    newData: parsed.data as unknown as Record<string, unknown>,
  });

  await notifyRole(["OWNER", "WAREHOUSE"], {
    type: "PRODUCT_ADDED",
    title: "Produk Baru",
    message: `${product.name} (${product.sku}) telah ditambahkan.`,
    data: { productId: product.id },
  });

  revalidatePath("/products");
  return { success: true, data: { id: product.id } };
}

export async function updateProduct(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };
  if (!await hasPermissionAsync(session.user.role, "products", "manage"))
    return { success: false, error: { message: "Forbidden" } };

  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, error: { message: parsed.error.issues[0].message } };

  const dup = await prisma.product.findFirst({
    where: { sku: parsed.data.sku, id: { not: id }, deletedAt: null },
  });
  if (dup) return { success: false, error: { message: "SKU sudah digunakan" } };

  const oldData = await prisma.product.findUnique({
    where: { id },
    select: { name: true, sku: true, buyPrice: true, sellPrice: true, stock: true, minStock: true },
  });

  await prisma.product.update({
    where: { id },
    data: { ...parsed.data, categoryId: parsed.data.categoryId || null },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    module: "products",
    description: `Mengupdate produk ${parsed.data.name}`,
    oldData: oldData as unknown as Record<string, unknown>,
    newData: parsed.data as unknown as Record<string, unknown>,
  });

  if (parsed.data.stock <= parsed.data.minStock) {
    await notifyRole(["OWNER", "WAREHOUSE"], {
      type: "LOW_STOCK",
      title: "Stok Menipis",
      message: `${parsed.data.name} (${parsed.data.sku}): stok ${parsed.data.stock}/${parsed.data.minStock}.`,
      data: { productId: id, stock: parsed.data.stock, minStock: parsed.data.minStock },
    });
  }

  revalidatePath("/products");
  return { success: true };
}

export async function deleteProduct(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };
  if (!await hasPermissionAsync(session.user.role, "products", "manage"))
    return { success: false, error: { message: "Forbidden" } };

  const txCount = await prisma.transactionItem.count({ where: { productId: id } });
  const p = await prisma.product.findUnique({ where: { id }, select: { name: true, sku: true } });

  if (txCount > 0) {
    await prisma.product.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  } else {
    await prisma.product.delete({ where: { id } });
  }

  await createAuditLog({
    userId: session.user.id,
    action: "DELETE",
    module: "products",
    description: `Menghapus produk ${p?.name ?? id}`,
  });

  await notifyRole(["OWNER", "WAREHOUSE"], {
    type: "PRODUCT_DELETED",
    title: "Produk Dihapus",
    message: `${p?.name} (${p?.sku}) telah dihapus.`,
    data: { productId: id },
  });

  revalidatePath("/products");
  return { success: true };
}

export async function toggleProductActive(id: string, isActive: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };
  if (!await hasPermissionAsync(session.user.role, "products", "manage"))
    return { success: false, error: { message: "Forbidden" } };

  const p = await prisma.product.findUnique({ where: { id }, select: { name: true } });
  await prisma.product.update({ where: { id }, data: { isActive } });

  await createAuditLog({
    userId: session.user.id,
    action: isActive ? "ACTIVATE" : "DEACTIVATE",
    module: "products",
    description: `${isActive ? "Mengaktifkan" : "Menonaktifkan"} produk ${p?.name ?? id}`,
  });

  await notifyRole(["OWNER", "WAREHOUSE"], {
    type: "PRODUCT_STATUS_CHANGED",
    title: isActive ? "Produk Diaktifkan" : "Produk Dinonaktifkan",
    message: `${p?.name} telah ${isActive ? "diaktifkan" : "dinonaktifkan"}.`,
    data: { productId: id, isActive },
  });

  revalidatePath("/products");
  return { success: true };
}

// ── Categories ──

export async function getCategories() {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" }, data: [] };

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
  if (!await hasPermissionAsync(session.user.role, "products", "manage"))
    return { success: false, error: { message: "Forbidden" } };

  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, error: { message: parsed.error.issues[0].message } };

  await prisma.category.create({ data: parsed.data });

  await createAuditLog({
    userId: session.user.id,
    action: "CREATE",
    module: "categories",
    description: `Membuat kategori ${parsed.data.name}`,
  });

  revalidatePath("/products");
  return { success: true };
}

export async function updateCategory(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };
  if (!await hasPermissionAsync(session.user.role, "products", "manage"))
    return { success: false, error: { message: "Forbidden" } };

  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, error: { message: parsed.error.issues[0].message } };

  await prisma.category.update({ where: { id }, data: parsed.data });

  await createAuditLog({
    userId: session.user.id,
    action: "UPDATE",
    module: "categories",
    description: `Mengupdate kategori ${parsed.data.name}`,
  });

  revalidatePath("/products");
  return { success: true };
}

export async function deleteCategory(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: { message: "Unauthorized" } };
  if (!await hasPermissionAsync(session.user.role, "products", "manage"))
    return { success: false, error: { message: "Forbidden" } };

  const count = await prisma.product.count({ where: { categoryId: id, deletedAt: null } });
  if (count > 0) return { success: false, error: { message: `Kategori digunakan ${count} produk` } };

  const c = await prisma.category.findUnique({ where: { id }, select: { name: true } });

  await prisma.category.delete({ where: { id } });

  await createAuditLog({
    userId: session.user.id,
    action: "DELETE",
    module: "categories",
    description: `Menghapus kategori ${c?.name ?? id}`,
  });

  revalidatePath("/products");
  return { success: true };
}

export async function getUploadUrlAction() {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: { message: "Unauthorized" } };
  if (!await hasPermissionAsync(session.user.role, "products", "manage"))
    return { success: false as const, error: { message: "Forbidden" } };

  const res = await createUploadUrl();
  if (!res.success) return { success: false as const, error: { message: res.error.message } };

  const imageUrl = getImageUrl(res.data.imageId);
  if (!imageUrl) return { success: false as const, error: { message: "Cloudflare Images not configured" } };

  return {
    success: true as const,
    data: {
      uploadUrl: res.data.uploadUrl,
      imageUrl,
    },
  };
}
