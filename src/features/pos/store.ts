import { create } from "zustand";

export type CartItem = {
  productId: string;
  name: string;
  sku: string;
  sellPrice: number;
  quantity: number;
  subtotal: number;
  discountAmount: number;
};

export type PosProduct = {
  id: string;
  name: string;
  sku: string;
  sellPrice: number;
  imageUrl: string | null;
  categoryName: string | null;
  unit: string;
};

type CartState = {
  items: CartItem[];
  customerName: string;
  notes: string;
  discountPercent: number;
  paymentMethod: "CASH" | "QRIS" | "BANK_TRANSFER" | "DEBIT_CARD" | "CREDIT_CARD";
  tableNumber: number | null;
  addItem: (product: PosProduct) => void;
  updateQuantity: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  setCustomerName: (name: string) => void;
  setNotes: (notes: string) => void;
  setDiscountPercent: (pct: number) => void;
  setPaymentMethod: (method: CartState["paymentMethod"]) => void;
  setTableNumber: (num: number | null) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartState>((set) => ({
  items: [],
  customerName: "",
  notes: "",
  discountPercent: 0,
  paymentMethod: "CASH",
  tableNumber: null,

  addItem: (product) =>
    set((state) => {
      const existing = state.items.find((i) => i.productId === product.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === product.id
              ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.sellPrice - i.discountAmount }
              : i
          ),
        };
      }
      return {
        items: [
          ...state.items,
          {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            sellPrice: Number(product.sellPrice),
            quantity: 1,
            subtotal: Number(product.sellPrice),
            discountAmount: 0,
          },
        ],
      };
    }),

  updateQuantity: (productId, qty) =>
    set((state) => ({
      items: qty <= 0
        ? state.items.filter((i) => i.productId !== productId)
        : state.items.map((i) =>
            i.productId === productId
              ? { ...i, quantity: qty, subtotal: qty * i.sellPrice - i.discountAmount }
              : i
          ),
    })),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    })),

  setCustomerName: (name) => set({ customerName: name }),
  setNotes: (notes) => set({ notes }),
  setDiscountPercent: (pct) => set({ discountPercent: Math.max(0, Math.min(100, pct)) }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setTableNumber: (num) => set({ tableNumber: num }),
  clearCart: () =>
    set({
      items: [],
      customerName: "",
      notes: "",
      discountPercent: 0,
      paymentMethod: "CASH",
      tableNumber: null,
    }),
}));
