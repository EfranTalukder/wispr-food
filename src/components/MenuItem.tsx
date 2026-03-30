"use client";

import Image from "next/image";
import { MenuItem as MenuItemType } from "@/types";
import { Flame, Plus, Minus } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";

interface MenuItemProps {
  item: MenuItemType;
  restaurantId: string;
  restaurantName: string;
}

export default function MenuItemCard({ item, restaurantId, restaurantName }: MenuItemProps) {
  const { addItem, confirmClearAndAdd, removeItem, getItemQuantity } = useCart();
  const quantity = getItemQuantity(item.id);
  const [showConfirm, setShowConfirm] = useState(false);

  function handleAdd() {
    const result = addItem(item, restaurantId, restaurantName);
    if (result === "needs_confirm") {
      setShowConfirm(true);
    }
  }

  function handleConfirmClear() {
    confirmClearAndAdd(item, restaurantId, restaurantName);
    setShowConfirm(false);
  }

  return (
    <>
      <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-sm transition-all group">
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
              {item.name}
            </h4>
            {item.is_popular && (
              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-full shrink-0">
                <Flame size={10} />
                Popular
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 mb-3">
            {item.description}
          </p>

          <div className="flex items-center justify-between">
            <p className="text-base font-bold text-gray-900">৳{item.price}</p>

            {/* Add / Quantity Controls */}
            {quantity === 0 ? (
              <button
                onClick={handleAdd}
                className="flex items-center gap-1 bg-primary text-white text-sm font-semibold px-4 py-1.5 rounded-full hover:bg-primary-dark transition"
              >
                <Plus size={14} />
                Add
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => removeItem(item.id)}
                  className="w-7 h-7 rounded-full border border-primary text-primary flex items-center justify-center hover:bg-primary hover:text-white transition"
                >
                  <Minus size={13} />
                </button>
                <span className="w-5 text-center font-bold text-gray-900 text-sm">
                  {quantity}
                </span>
                <button
                  onClick={handleAdd}
                  className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition"
                >
                  <Plus size={13} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Image */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0">
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="112px"
          />
        </div>
      </div>

      {/* Clear Cart Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-gray-900 text-lg mb-2">Start a new cart?</h3>
            <p className="text-gray-500 text-sm mb-5">
              Your cart has items from <strong>{restaurantName}</strong>. Adding from a different restaurant will clear your current cart.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Keep Cart
              </button>
              <button
                onClick={handleConfirmClear}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-dark transition"
              >
                Clear & Add
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
