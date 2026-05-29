import { z } from "zod";
import { CashFlowType } from "@prisma/client";

export const cashFlowFilterSchema = z.object({
  type: z.nativeEnum(CashFlowType).optional(),
  categoryId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().default(20),
});

export type CashFlowFilter = z.infer<typeof cashFlowFilterSchema>;

export const cashFlowFormSchema = z.object({
  type: z.nativeEnum(CashFlowType),
  categoryId: z.string().min(1, "Pilih kategori"),
  amount: z.coerce.number().min(1, "Jumlah harus lebih dari 0"),
  description: z.string().min(1, "Deskripsi wajib diisi"),
  reference: z.string().optional(),
  date: z.string().min(1, "Tanggal wajib diisi"),
});

export type CashFlowFormData = z.infer<typeof cashFlowFormSchema>;

export type CashFlowItem = {
  id: string;
  type: "IN" | "OUT";
  amount: number;
  description: string;
  reference: string | null;
  date: Date;
  category: { id: string; name: string };
  user: { id: string; name: string };
  createdAt: Date;
};

export type CashFlowCategoryItem = {
  id: string;
  name: string;
  type: "IN" | "OUT";
  isDefault: boolean;
};
