"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CartItem, MenuItem } from "@/types";
import { getRestaurantById } from "@/lib/data";

function lineKey(itemId: string, sizeLabel?: string) {
  return sizeLabel ? `${itemId}::${sizeLabel}` : itemId;
}

function resolveUnitPrice(item: MenuItem, sizeLabel?: string): number {
  let basePrice = item.price;
  if (sizeLabel && item.sizes && item.sizes.length > 0) {
    const size = item.sizes.find((s) => s.label === sizeLabel);
    if (size) basePrice = size.price;
  }
  if (item.discount_percent && item.discount_percent > 0) {
    return Math.round(basePrice * (1 - item.discount_percent / 100));
  }
  return basePrice;
}

interface CartContextValue {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  totalItems: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  addItem: (
    item: MenuItem,
    restaurantId: string,
    restaurantName: string,
    sizeLabel?: string
  ) => "added" | "needs_confirm";
  confirmClearAndAdd: (
    item: MenuItem,
    restaurantId: string,
    restaurantName: string,
    sizeLabel?: string
  ) => void;
  removeItem: (itemId: string, sizeLabel?: string) => void;
  updateQuantity: (itemId: string, quantity: number, sizeLabel?: string) => void;
  clearCart: () => void;
  getItemQuantity: (itemId: string, sizeLabel?: string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);

  const totalItems = items.reduce((sum, ci) => sum + ci.quantity, 0);
  const subtotal = items.reduce((sum, ci) => sum + ci.unit_price * ci.quantity, 0);
  const deliveryFee = restaurantId
    ? (getRestaurantById(restaurantId)?.delivery_fee ?? 0)
    : 0;
  const total = subtotal + deliveryFee;

  const addItem = useCallback(
    (
      item: MenuItem,
      rid: string,
      rname: string,
      sizeLabel?: string
    ): "added" | "needs_confirm" => {
      if (restaurantId && restaurantId !== rid && items.length > 0) {
        return "needs_confirm";
      }
      setRestaurantId(rid);
      setRestaurantName(rname);
      const key = lineKey(item.id, sizeLabel);
      const unitPrice = resolveUnitPrice(item, sizeLabel);
      setItems((prev) => {
        const existing = prev.find(
          (ci) => lineKey(ci.item.id, ci.size_label) === key
        );
        if (existing) {
          return prev.map((ci) =>
            lineKey(ci.item.id, ci.size_label) === key
              ? { ...ci, quantity: ci.quantity + 1 }
              : ci
          );
        }
        return [
          ...prev,
          {
            item,
            quantity: 1,
            restaurant_id: rid,
            restaurant_name: rname,
            size_label: sizeLabel,
            unit_price: unitPrice,
          },
        ];
      });
      return "added";
    },
    [items, restaurantId]
  );

  const confirmClearAndAdd = useCallback(
    (item: MenuItem, rid: string, rname: string, sizeLabel?: string) => {
      const unitPrice = resolveUnitPrice(item, sizeLabel);
      setItems([
        {
          item,
          quantity: 1,
          restaurant_id: rid,
          restaurant_name: rname,
          size_label: sizeLabel,
          unit_price: unitPrice,
        },
      ]);
      setRestaurantId(rid);
      setRestaurantName(rname);
    },
    []
  );

  const removeItem = useCallback((itemId: string, sizeLabel?: string) => {
    const key = lineKey(itemId, sizeLabel);
    setItems((prev) => {
      const updated = prev
        .map((ci) =>
          lineKey(ci.item.id, ci.size_label) === key
            ? { ...ci, quantity: ci.quantity - 1 }
            : ci
        )
        .filter((ci) => ci.quantity > 0);
      if (updated.length === 0) {
        setRestaurantId(null);
        setRestaurantName(null);
      }
      return updated;
    });
  }, []);

  const updateQuantity = useCallback(
    (itemId: string, quantity: number, sizeLabel?: string) => {
      const key = lineKey(itemId, sizeLabel);
      if (quantity <= 0) {
        setItems((prev) => {
          const updated = prev.filter(
            (ci) => lineKey(ci.item.id, ci.size_label) !== key
          );
          if (updated.length === 0) {
            setRestaurantId(null);
            setRestaurantName(null);
          }
          return updated;
        });
      } else {
        setItems((prev) =>
          prev.map((ci) =>
            lineKey(ci.item.id, ci.size_label) === key
              ? { ...ci, quantity }
              : ci
          )
        );
      }
    },
    []
  );

  const clearCart = useCallback(() => {
    setItems([]);
    setRestaurantId(null);
    setRestaurantName(null);
  }, []);

  const getItemQuantity = useCallback(
    (itemId: string, sizeLabel?: string) => {
      const key = lineKey(itemId, sizeLabel);
      return (
        items.find((ci) => lineKey(ci.item.id, ci.size_label) === key)
          ?.quantity ?? 0
      );
    },
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        restaurantId,
        restaurantName,
        totalItems,
        subtotal,
        deliveryFee,
        total,
        addItem,
        confirmClearAndAdd,
        removeItem,
        updateQuantity,
        clearCart,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
