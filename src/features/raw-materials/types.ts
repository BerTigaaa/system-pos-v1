import { z } from "zod";

export const rawMaterialSchema = z.object({
  name: z.string().min(1, "Nama bahan baku wajib diisi"),
  sku: z.string().min(1, "SKU wajib diisi"),
  category: z.string().optional().nullable(),
  unit: z.string().min(1, "Satuan wajib diisi"),
  buyPrice: z.coerce.number().min(0, "Harga beli tidak boleh negatif").default(0),
  minStock: z.coerce.number().int().min(0, "Min stok tidak boleh negatif").default(0),
  isActive: z.boolean().default(true),
});

export type RawMaterialFormData = z.infer<typeof rawMaterialSchema>;

export const stockInSchema = z.object({
  rawMaterialId: z.string().min(1, "Bahan baku wajib dipilih"),
  batchCode: z.string().optional().nullable(),
  quantity: z.coerce.number().int().min(1, "Jumlah minimal 1"),
  buyPrice: z.coerce.number().min(0, "Harga beli tidak boleh negatif").default(0),
  expiryDate: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type StockInFormData = z.infer<typeof stockInSchema>;

export const stockOutSchema = z.object({
  rawMaterialId: z.string().min(1, "Bahan baku wajib dipilih"),
  quantity: z.coerce.number().int().min(1, "Jumlah minimal 1"),
  reason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type StockOutFormData = z.infer<typeof stockOutSchema>;

export type RawMaterialWithStats = {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  unit: string;
  stock: number;
  minStock: number;
  buyPrice: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  totalStockIn: number;
  totalStockOut: number;
  latestBatchExpiry: string | null;
  activeBatches: number;
};

export type BatchItem = {
  id: string;
  rawMaterialId: string;
  batchCode: string | null;
  quantity: number;
  buyPrice: number;
  expiryDate: string | null;
  receivedDate: Date;
  supplierId: string | null;
  supplierName: string | null;
  notes: string | null;
};

export type MovementItem = {
  id: string;
  rawMaterialId: string;
  rawMaterialName: string;
  rawMaterialSku: string;
  type: string;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  buyPrice: number | null;
  userName: string;
  supplierName: string | null;
  batchCode: string | null;
  reason: string | null;
  notes: string | null;
  createdAt: Date;
};
