"use client";

import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CartDrawer() {
  const [open, setOpen] = useState(false);
  const {
    items,
    restaurantName,
    totalItems,
    subtotal,
    deliveryFee,
    total,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCart();
  const router = useRouter();

  if (totalItems === 0) return null;

  return (
    <>
      {/* Floating Cart Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 sm:bottom-6 right-4 z-40 flex items-center gap-3 bg-primary text-white px-4 py-3 rounded-full shadow-xl hover:bg-primary-dark transition-all"
      >
        <div className="relative">
          <ShoppingBag size={20} />
          <span className="absolute -top-2 -right-2 bg-white text-primary text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {totalItems}
          </span>
        </div>
        <span className="text-sm font-semibold">${total}</span>
        <span className="text-sm opacity-80">View Cart</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-in Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">Your Cart</h2>
            {restaurantName && (
              <p className="text-sm text-gray-500">{restaurantName}</p>
            )}
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.map(({ item, quantity }) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                <p className="text-sm text-gray-500">${item.price} each</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.id, quantity - 1)}
                  className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:border-primary hover:text-primary transition"
                >
                  <Minus size={13} />
                </button>
                <span className="w-6 text-center font-semibold text-sm">{quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, quantity + 1)}
                  className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition"
                >
                  <Plus size={13} />
                </button>
              </div>
              <p className="w-16 text-right font-semibold text-sm text-gray-900">
                ${item.price * quantity}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 space-y-3">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>${subtotal}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Delivery fee</span>
              <span>${deliveryFee}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-100">
              <span>Total</span>
              <span>${total}</span>
            </div>
          </div>

          <button
            onClick={() => {
              setOpen(false);
              router.push("/checkout");
            }}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3.5 rounded-xl hover:bg-primary-dark transition"
          >
            Proceed to Checkout
            <ArrowRight size={18} />
          </button>

          <button
            onClick={() => {
              clearCart();
              setOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 text-gray-400 text-sm hover:text-red-500 transition py-1"
          >
            <Trash2 size={14} />
            Clear Cart
          </button>
        </div>
      </div>
    </>
  );
}
