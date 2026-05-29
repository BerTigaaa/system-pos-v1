import { z } from "zod";
import { TransactionStatus, PaymentMethod } from "@prisma/client";

export const transactionFilterSchema = z.object({
  search: z.string().optional(),
  cashierId: z.string().optional(),
  status: z.nativeEnum(TransactionStatus).optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().default(20),
});

export type TransactionFilter = z.infer<typeof transactionFilterSchema>;

export const refundItemSchema = z.object({
  transactionItemId: z.string().min(1),
  quantity: z.number().int().positive("Jumlah refund harus lebih dari 0"),
  amount: z.number().min(0, "Jumlah refund tidak boleh negatif"),
});

export const refundSchema = z.object({
  transactionId: z.string().min(1, "Transaksi wajib dipilih"),
  items: z.array(refundItemSchema).min(1, "Pilih minimal 1 item untuk direfund"),
  reason: z.string().min(1, "Alasan refund wajib diisi"),
});

export type RefundFormData = z.infer<typeof refundSchema>;

export type TransactionWithRelations = {
  id: string;
  invoiceNumber: string;
  cashier: { id: string; name: string; email: string };
  customerName: string | null;
  status: TransactionStatus;
  subtotal: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  notes: string | null;
  tableNumber: number | null;
  createdAt: Date;
  items: {
    id: string;
    productId: string;
    productName: string;
    productSku: string;
    buyPrice: number;
    sellPrice: number;
    quantity: number;
    discountAmount: number;
    subtotal: number;
  }[];
  payments: {
    id: string;
    method: PaymentMethod;
    amount: number;
    reference: string | null;
    changeAmount: number;
  }[];
  refunds: {
    id: string;
    refundNumber: string;
    totalAmount: number;
    reason: string;
    processedBy: { id: string; name: string };
    createdAt: Date;
    items: {
      id: string;
      transactionItemId: string;
      quantity: number;
      amount: number;
    }[];
  }[];
};
