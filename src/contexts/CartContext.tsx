"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CartItem, MenuItem } from "@/types";
import { getRestaurantById } from "@/lib/data";

interface CartContextValue {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  totalItems: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  addItem: (item: MenuItem, restaurantId: string, restaurantName: string) => "added" | "needs_confirm";
  confirmClearAndAdd: (item: MenuItem, restaurantId: string, restaurantName: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (itemId: string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);

  const totalItems = items.reduce((sum, ci) => sum + ci.quantity, 0);
  const subtotal = items.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0);
  const deliveryFee = restaurantId
    ? (getRestaurantById(restaurantId)?.delivery_fee ?? 0)
    : 0;
  const total = subtotal + deliveryFee;

  const addItem = useCallback(
    (item: MenuItem, rid: string, rname: string): "added" | "needs_confirm" => {
      // If cart has items from a different restaurant, signal that we need confirmation
      if (restaurantId && restaurantId !== rid && items.length > 0) {
        return "needs_confirm";
      }
      setRestaurantId(rid);
      setRestaurantName(rname);
      setItems((prev) => {
        const existing = prev.find((ci) => ci.item.id === item.id);
        if (existing) {
          return prev.map((ci) =>
            ci.item.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
          );
        }
        return [...prev, { item, quantity: 1, restaurant_id: rid, restaurant_name: rname }];
      });
      return "added";
    },
    [items, restaurantId]
  );

  const confirmClearAndAdd = useCallback(
    (item: MenuItem, rid: string, rname: string) => {
      setItems([{ item, quantity: 1, restaurant_id: rid, restaurant_name: rname }]);
      setRestaurantId(rid);
      setRestaurantName(rname);
    },
    []
  );

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => {
      const updated = prev
        .map((ci) =>
          ci.item.id === itemId ? { ...ci, quantity: ci.quantity - 1 } : ci
        )
        .filter((ci) => ci.quantity > 0);
      if (updated.length === 0) {
        setRestaurantId(null);
        setRestaurantName(null);
      }
      return updated;
    });
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => {
        const updated = prev.filter((ci) => ci.item.id !== itemId);
        if (updated.length === 0) {
          setRestaurantId(null);
          setRestaurantName(null);
        }
        return updated;
      });
    } else {
      setItems((prev) =>
        prev.map((ci) => (ci.item.id === itemId ? { ...ci, quantity } : ci))
      );
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setRestaurantId(null);
    setRestaurantName(null);
  }, []);

  const getItemQuantity = useCallback(
    (itemId: string) => items.find((ci) => ci.item.id === itemId)?.quantity ?? 0,
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
