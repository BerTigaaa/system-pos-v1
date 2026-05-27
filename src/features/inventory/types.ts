import { z } from "zod";

export const adjustmentSchema = z.object({
  productId: z.string().min(1, "Produk wajib dipilih"),
  type: z.enum(["PURCHASE", "MANUAL_OUT", "ADJUSTMENT", "RETURN"]),
  quantity: z.coerce.number().int().min(1, "Jumlah minimal 1"),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export const opnameSchema = z.object({
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    physicalStock: z.coerce.number().int().min(0),
  })).min(1, "Minimal 1 item"),
});

export type AdjustmentFormData = z.infer<typeof adjustmentSchema>;
export type OpnameFormData = z.infer<typeof opnameSchema>;

export type MovementItem = {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  type: string;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  reason: string | null;
  notes: string | null;
  userName: string;
  createdAt: Date;
};
