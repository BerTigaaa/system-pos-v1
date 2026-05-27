import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Nama produk wajib diisi"),
  sku: z.string().min(1, "SKU wajib diisi"),
  barcode: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  unit: z.string().min(1, "Satuan wajib diisi"),
  buyPrice: z.coerce.number().min(0, "Harga beli tidak boleh negatif"),
  sellPrice: z.coerce.number().min(1, "Harga jual wajib diisi"),
  stock: z.coerce.number().int().min(0, "Stok tidak boleh negatif").default(0),
  minStock: z.coerce.number().int().min(0, "Min stok tidak boleh negatif").default(5),
  description: z.string().optional(),
  imageUrl: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
}).refine((d) => d.sellPrice >= d.buyPrice, {
  message: "Harga jual harus lebih besar atau sama dengan harga beli",
  path: ["sellPrice"],
});

export type ProductFormData = z.infer<typeof productSchema>;

export const categorySchema = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi"),
  description: z.string().optional(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

export type ProductWithCategory = {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  description: string | null;
  imageUrl: string | null;
  unit: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  isActive: boolean;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  createdAt: Date;
};

export type CategoryItem = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  _count?: { products: number };
};
