"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, ChevronRight, Clock } from "lucide-react";
import { Order } from "@/types";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700" },
  preparing: { label: "Preparing", color: "bg-yellow-100 text-yellow-700" },
  ready: { label: "Ready", color: "bg-green-100 text-green-700" },
  on_the_way: { label: "On the Way", color: "bg-purple-100 text-purple-700" },
  delivered: { label: "Delivered", color: "bg-gray-100 text-gray-600" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-600" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("wispr_order_history");
    if (raw) setOrders(JSON.parse(raw));
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-5">My Orders</h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <ClipboardList size={28} className="text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No orders yet</p>
          <p className="text-gray-400 text-sm mt-1">Your order history will appear here</p>
          <Link
            href="/"
            className="mt-5 bg-primary text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-primary-dark transition"
          >
            Browse Restaurants
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const st = STATUS_LABEL[order.status] ?? { label: order.status, color: "bg-gray-100 text-gray-600" };
            const date = new Date(order.created_at).toLocaleDateString("en-US", {
              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
            });
            return (
              <Link
                key={order.id}
                href={`/order-confirmation/${order.id}`}
                className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition active:scale-[0.99]"
              >
                <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <Clock size={20} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 truncate">{order.restaurant_name}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${st.color}`}>
                      {st.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {order.items.length} item{order.items.length > 1 ? "s" : ""} · ${order.total} · {date}
                  </p>
                </div>
                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
