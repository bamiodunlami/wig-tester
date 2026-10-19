"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  slug: string;
  color: string;
  capSize: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  open: boolean;
  add: (item: Omit<CartItem, "quantity">) => void;
  setQuantity: (index: number, quantity: number) => void;
  remove: (index: number) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
};

const sameLine = (a: Omit<CartItem, "quantity">, b: Omit<CartItem, "quantity">) =>
  a.slug === b.slug && a.color === b.color && a.capSize === b.capSize;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      open: false,
      add: (item) =>
        set((s) => {
          const i = s.items.findIndex((x) => sameLine(x, item));
          if (i === -1) return { items: [...s.items, { ...item, quantity: 1 }], open: true };
          const items = s.items.slice();
          items[i] = { ...items[i], quantity: items[i].quantity + 1 };
          return { items, open: true };
        }),
      setQuantity: (index, quantity) =>
        set((s) => ({
          items: s.items.map((x, i) => (i === index ? { ...x, quantity: Math.max(1, Math.min(10, quantity)) } : x)),
        })),
      remove: (index) => set((s) => ({ items: s.items.filter((_, i) => i !== index) })),
      clear: () => set({ items: [] }),
      setOpen: (open) => set({ open }),
    }),
    { name: "cart", partialize: (s) => ({ items: s.items }) },
  ),
);
