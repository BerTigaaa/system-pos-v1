import { z } from "zod";

export type OrderStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

export type OrderItemData = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  sellPrice: number;
  subtotal: number;
};

export type OrderData = {
  id: string;
  tableNumber: number;
  customerName: string;
  notes: string | null;
  status: OrderStatus;
  total: number;
  items: OrderItemData[];
  shiftId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export const createOrderSchema = z.object({
  tableNumber: z.coerce.number().int().min(1, "Nomor meja tidak valid"),
  customerName: z.string().min(1, "Nama pemesan wajib diisi"),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.coerce.number().int().min(1),
    sellPrice: z.coerce.number().min(0),
    productName: z.string().optional(),
  })).min(1, "Minimal 1 item"),
});
