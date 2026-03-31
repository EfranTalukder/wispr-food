"use client";

import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bike, CheckCircle, Banknote } from "lucide-react";
import { CheckoutFormData, Order, OrderLineItem } from "@/types";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function CheckoutPage() {
  const { items, restaurantId, restaurantName, subtotal, deliveryFee, total, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState<CheckoutFormData>({
    customer_name: user?.user_metadata?.name ?? "",
    phone: user?.user_metadata?.phone ?? "",
    address: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Partial<CheckoutFormData>>({});
  const [loading, setLoading] = useState(false);

  // Redirect if cart is empty
  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-gray-400 text-lg mb-4">Your cart is empty.</p>
        <Link href="/" className="text-primary font-semibold hover:underline">
          Browse restaurants
        </Link>
      </div>
    );
  }

  function validate(): boolean {
    const newErrors: Partial<CheckoutFormData> = {};
    if (!form.customer_name.trim()) newErrors.customer_name = "Name is required";
    if (!form.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^\+?[0-9\s\-().]{7,15}$/.test(form.phone.trim()))
      newErrors.phone = "Enter a valid phone number";
    if (!form.address.trim()) newErrors.address = "Delivery address is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    // Build the order object (stored in sessionStorage for the confirmation page)
    const orderItems: OrderLineItem[] = items.map(({ item, quantity }) => ({
      item_id: item.id,
      name: item.name,
      price: item.price,
      quantity,
    }));

    const order: Order = {
      id: `WP-${Date.now()}`,
      restaurant_id: restaurantId!,
      restaurant_name: restaurantName!,
      items: orderItems,
      subtotal,
      delivery_fee: deliveryFee,
      total,
      status: "confirmed",
      customer_name: form.customer_name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      notes: form.notes.trim(),
      created_at: new Date().toISOString(),
      delivery_time_min: 25,
      delivery_time_max: 45,
    };

    // Save to Supabase (primary) — keep sessionStorage as fallback
    if (isSupabaseConfigured && supabase) {
      await supabase.from("orders").insert({
        id: order.id,
        restaurant_id: order.restaurant_id,
        restaurant_name: order.restaurant_name,
        items: order.items,
        subtotal: order.subtotal,
        delivery_fee: order.delivery_fee,
        total: order.total,
        status: order.status,
        customer_name: order.customer_name,
        phone: order.phone,
        address: order.address,
        notes: order.notes,
        delivery_time_min: order.delivery_time_min,
        delivery_time_max: order.delivery_time_max,
        created_at: order.created_at,
        ...(user ? { customer_id: user.id } : {}),
      });
    }

    // Save order to sessionStorage so confirmation page can read it (fast path)
    sessionStorage.setItem("wispr_last_order", JSON.stringify(order));

    // Save to localStorage for order history
    const existing = JSON.parse(localStorage.getItem("wispr_order_history") || "[]");
    existing.unshift(order);
    localStorage.setItem("wispr_order_history", JSON.stringify(existing.slice(0, 20)));

    clearCart();

    // Small delay for UX
    await new Promise((r) => setTimeout(r, 600));
    router.push(`/order-confirmation/${order.id}`);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof CheckoutFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition mb-6"
      >
        <ArrowLeft size={18} />
        <span className="text-sm">Back</span>
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form — left column */}
        <div className="lg:col-span-3 space-y-5">
          {/* Delivery Details */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Bike size={18} className="text-primary" />
              Delivery Details
            </h2>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="customer_name"
                value={form.customer_name}
                onChange={handleChange}
                placeholder="Your full name"
                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-primary transition ${
                  errors.customer_name ? "border-red-400" : "border-gray-200"
                }`}
              />
              {errors.customer_name && (
                <p className="text-red-500 text-xs mt-1">{errors.customer_name}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="01XXXXXXXXX"
                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-primary transition ${
                  errors.phone ? "border-red-400" : "border-gray-200"
                }`}
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Address <span className="text-red-500">*</span>
              </label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="House no., Road, Area, City..."
                rows={3}
                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-primary transition resize-none ${
                  errors.address ? "border-red-400" : "border-gray-200"
                }`}
              />
              {errors.address && (
                <p className="text-red-500 text-xs mt-1">{errors.address}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Instructions{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="e.g. Ring the bell twice, leave at door..."
                rows={2}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary transition resize-none"
              />
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
              <Banknote size={18} className="text-primary" />
              Payment Method
            </h2>
            <div className="flex items-center gap-3 p-4 bg-primary-light rounded-xl border border-primary/20">
              <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Cash on Delivery</p>
                <p className="text-xs text-gray-500">Pay in cash when your order arrives</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary — right column */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm sticky top-20">
            <h2 className="font-bold text-gray-900 mb-1">Order Summary</h2>
            <p className="text-sm text-gray-500 mb-4">{restaurantName}</p>

            <div className="space-y-2 mb-4">
              {items.map(({ item, quantity }) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.name}{" "}
                    <span className="text-gray-400">× {quantity}</span>
                  </span>
                  <span className="font-medium text-gray-900">
                    ${item.price * quantity}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>${subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Delivery fee</span>
                <span>${deliveryFee}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
                <span>Total</span>
                <span>${total}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-5 flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3.5 rounded-xl hover:bg-primary-dark transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Placing Order...
                </span>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Place Order · ${total}
                </>
              )}
            </button>

            <p className="text-xs text-gray-400 text-center mt-3">
              By placing your order you agree to our terms of service.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
