"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Clock, MapPin, Phone, Bike, Home } from "lucide-react";
import { Order } from "@/types";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    async function loadOrder() {
      // Try sessionStorage first (fast path — just placed)
      const raw = sessionStorage.getItem("wispr_last_order");
      if (raw) {
        const parsed: Order = JSON.parse(raw);
        if (parsed.id === params.id) {
          setOrder(parsed);
          return;
        }
      }

      // Fall back to Supabase (works after page refresh)
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase
          .from("orders")
          .select("*")
          .eq("id", params.id)
          .single();
        if (data) {
          setOrder(data as Order);
          return;
        }
      }

      router.replace("/");
    }
    loadOrder();
  }, [params.id, router]);

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const placedAt = new Date(order.created_at).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-10 space-y-6">
      {/* Success header */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
            <CheckCircle size={44} className="text-accent-green" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Confirmed!</h1>
          <p className="text-gray-500 text-sm mt-1">
            Your order has been placed successfully.
          </p>
        </div>
        <div className="inline-block bg-gray-100 px-4 py-1.5 rounded-full">
          <span className="text-xs text-gray-500 font-medium">Order ID: </span>
          <span className="text-xs font-bold text-gray-800">{order.id}</span>
        </div>
      </div>

      {/* Estimated delivery */}
      <div className="bg-primary text-white rounded-2xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
          <Bike size={24} />
        </div>
        <div>
          <p className="text-sm text-white/80">Estimated Delivery Time</p>
          <p className="text-xl font-bold">
            {order.delivery_time_min}–{order.delivery_time_max} minutes
          </p>
        </div>
      </div>

      {/* Order details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {/* Restaurant */}
        <div className="px-5 py-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Restaurant</p>
          <p className="font-semibold text-gray-900">{order.restaurant_name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{placedAt}</p>
        </div>

        {/* Items */}
        <div className="px-5 py-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Items Ordered</p>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.item_id} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.name}{" "}
                  <span className="text-gray-400">× {item.quantity}</span>
                </span>
                <span className="font-medium text-gray-900">
                  ৳{item.price * item.quantity}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-3 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal</span>
              <span>৳{order.subtotal}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Delivery fee</span>
              <span>৳{order.delivery_fee}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-base pt-1">
              <span>Total Paid (COD)</span>
              <span>৳{order.total}</span>
            </div>
          </div>
        </div>

        {/* Delivery info */}
        <div className="px-5 py-4 space-y-3">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Delivery Info</p>
          <div className="flex items-start gap-3 text-sm">
            <Phone size={15} className="text-primary mt-0.5 shrink-0" />
            <span className="text-gray-700">{order.phone}</span>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <MapPin size={15} className="text-primary mt-0.5 shrink-0" />
            <span className="text-gray-700">{order.address}</span>
          </div>
          {order.notes && (
            <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-500 italic">
              &ldquo;{order.notes}&rdquo;
            </div>
          )}
        </div>

        {/* Payment */}
        <div className="px-5 py-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Payment</p>
          <p className="text-sm font-medium text-gray-900">Cash on Delivery</p>
          <p className="text-xs text-gray-400">Please have ৳{order.total} ready</p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full bg-primary text-white font-semibold py-3.5 rounded-xl hover:bg-primary-dark transition"
        >
          <Home size={18} />
          Back to Home
        </Link>
        <p className="text-center text-xs text-gray-400">
          Questions? Call us at{" "}
          <span className="font-semibold text-gray-600">+880 1234-567890</span>
        </p>
      </div>
    </div>
  );
}
