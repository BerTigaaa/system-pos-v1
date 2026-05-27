import { create } from "zustand";

export type CartItem = {
  productId: string;
  name: string;
  sku: string;
  sellPrice: number;
  quantity: number;
  subtotal: number;
  discountAmount: number;
  stock: number;
};

export type PosProduct = {
  id: string;
  name: string;
  sku: string;
  sellPrice: number;
  stock: number;
  imageUrl: string | null;
  categoryName: string | null;
  unit: string;
};

type CartState = {
  items: CartItem[];
  customerId: string | null;
  customerName: string | null;
  notes: string;
  discountPercent: number;
  paymentMethod: "CASH" | "QRIS" | "BANK_TRANSFER" | "DEBIT_CARD" | "CREDIT_CARD";
  addItem: (product: PosProduct) => void;
  updateQuantity: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  setCustomer: (id: string | null, name: string | null) => void;
  setNotes: (notes: string) => void;
  setDiscountPercent: (pct: number) => void;
  setPaymentMethod: (method: CartState["paymentMethod"]) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartState>((set) => ({
  items: [],
  customerId: null,
  customerName: null,
  notes: "",
  discountPercent: 0,
  paymentMethod: "CASH",

  addItem: (product) =>
    set((state) => {
      const existing = state.items.find((i) => i.productId === product.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === product.id
              ? {
                  ...i,
                  quantity: Math.min(i.quantity + 1, i.stock),
                  subtotal: Math.min(i.quantity + 1, i.stock) * i.sellPrice - i.discountAmount,
                }
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
            stock: product.stock,
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
              ? { ...i, quantity: Math.min(qty, i.stock), subtotal: Math.min(qty, i.stock) * i.sellPrice - i.discountAmount }
              : i
          ),
    })),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    })),

  setCustomer: (id, name) => set({ customerId: id, customerName: name }),
  setNotes: (notes) => set({ notes }),
  setDiscountPercent: (pct) => set({ discountPercent: Math.max(0, Math.min(100, pct)) }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  clearCart: () =>
    set({
      items: [],
      customerId: null,
      customerName: null,
      notes: "",
      discountPercent: 0,
      paymentMethod: "CASH",
    }),
}));
