"use client";

import Image from "next/image";
import { MenuItem as MenuItemType } from "@/types";
import { Flame, Plus, Minus, ImageOff } from "lucide-react";
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

  const discountedPrice =
    item.discount_percent && item.discount_percent > 0
      ? Math.round(item.price * (1 - item.discount_percent / 100))
      : null;

  return (
    <>
      <div className="flex gap-3 p-4 bg-white rounded-2xl border border-gray-100 active:bg-gray-50 transition-colors">
        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="font-semibold text-gray-900 text-sm leading-snug">
                {item.name}
              </h4>
              {item.is_popular && (
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full shrink-0">
                  <Flame size={9} />
                  Popular
                </span>
              )}
              {item.discount_percent && item.discount_percent > 0 ? (
                <span className="text-[10px] font-bold text-primary bg-pink-50 px-2 py-0.5 rounded-full shrink-0">
                  {item.discount_percent}% OFF
                </span>
              ) : null}
            </div>
            {item.description ? (
              <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">
                {item.description}
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-between mt-1">
            <div className="flex items-baseline gap-1.5">
              <p className="text-base font-bold text-gray-900">
                ${discountedPrice ?? item.price}
              </p>
              {discountedPrice && (
                <p className="text-xs text-gray-400 line-through">${item.price}</p>
              )}
            </div>

            {/* Add / Quantity Controls */}
            {quantity === 0 ? (
              <button
                onClick={handleAdd}
                className="flex items-center gap-1 bg-primary text-white text-sm font-bold px-4 py-2 rounded-full active:scale-95 transition-transform shadow-sm shadow-primary/30"
              >
                <Plus size={14} />
                Add
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-primary/10 rounded-full px-1 py-1">
                <button
                  onClick={() => removeItem(item.id)}
                  className="w-7 h-7 rounded-full bg-white border border-primary/30 text-primary flex items-center justify-center active:scale-90 transition-transform shadow-sm"
                >
                  <Minus size={13} />
                </button>
                <span className="w-5 text-center font-bold text-primary text-sm">
                  {quantity}
                </span>
                <button
                  onClick={handleAdd}
                  className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center active:scale-90 transition-transform shadow-sm"
                >
                  <Plus size={13} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Image */}
        <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-gray-100">
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={item.name}
              fill
              className="object-cover"
              sizes="96px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageOff size={20} className="text-gray-300" />
            </div>
          )}
        </div>
      </div>

      {/* Clear Cart Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl rounded-b-xl sm:rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-5 sm:hidden" />
            <h3 className="font-bold text-gray-900 text-lg mb-2">Start a new cart?</h3>
            <p className="text-gray-500 text-sm mb-5 leading-relaxed">
              Your cart has items from <strong className="text-gray-800">{restaurantName}</strong>. Adding from a different restaurant will clear your current cart.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-700 font-semibold active:scale-95 transition-transform"
              >
                Keep Cart
              </button>
              <button
                onClick={handleConfirmClear}
                className="flex-1 py-3.5 rounded-2xl bg-primary text-white font-semibold active:scale-95 transition-transform shadow-md shadow-primary/30"
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
