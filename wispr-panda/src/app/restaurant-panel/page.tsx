"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { DBRestaurant, DBMenuItem, MenuSize, Order } from "@/types";
import {
  ChefHat,
  ClipboardList,
  UtensilsCrossed,
  Settings,
  LogOut,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Upload,
  Save,
  Power,
  LayoutDashboard,
  Store,
  ArrowLeft,
  TrendingUp,
  Search,
  ShieldCheck,
  X,
  Bell,
  BellRing,
  BellOff,
  Bike,
  PackageCheck,
  Flame,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Printer,
  User,
} from "lucide-react";

const ADMIN_EMAIL = "ifran8413@gmail.com";

const CUISINE_TYPES = [
  "Bengali",
  "Biryani",
  "Burger",
  "Pizza",
  "Chinese",
  "BBQ",
  "Cafe",
  "Fast Food",
  "Indian",
  "Thai",
  "Seafood",
  "Desserts",
];

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
type Day = (typeof DAYS)[number];

const DEFAULT_HOURS: Record<Day, { enabled: boolean; open: string; close: string }> = {
  monday:    { enabled: true,  open: "09:00", close: "22:00" },
  tuesday:   { enabled: true,  open: "09:00", close: "22:00" },
  wednesday: { enabled: true,  open: "09:00", close: "22:00" },
  thursday:  { enabled: true,  open: "09:00", close: "22:00" },
  friday:    { enabled: true,  open: "09:00", close: "22:00" },
  saturday:  { enabled: true,  open: "09:00", close: "22:00" },
  sunday:    { enabled: false, open: "09:00", close: "22:00" },
};

type View = "dashboard" | "all-orders" | "restaurant";
type RestaurantTab = "orders" | "menu" | "settings";
type OrderStatus =
  | "confirmed"
  | "preparing"
  | "ready"
  | "on_the_way"
  | "delivered"
  | "rejected";

const CLOSED_STATUSES: OrderStatus[] = ["delivered", "rejected"];

function minutesAgo(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
}

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

// ─── Order lifecycle ─────────────────────────────────────────────────────────

const STATUS_META: Record<
  OrderStatus,
  { label: string; tone: string; dot: string; icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  confirmed: {
    label: "New",
    tone: "text-red-300 bg-red-500/15 border-red-500/30",
    dot: "bg-red-500",
    icon: AlertTriangle,
  },
  preparing: {
    label: "Preparing",
    tone: "text-amber-300 bg-amber-500/15 border-amber-500/30",
    dot: "bg-amber-500",
    icon: Flame,
  },
  ready: {
    label: "Ready",
    tone: "text-emerald-300 bg-emerald-500/15 border-emerald-500/30",
    dot: "bg-emerald-500",
    icon: PackageCheck,
  },
  on_the_way: {
    label: "On the way",
    tone: "text-sky-300 bg-sky-500/15 border-sky-500/30",
    dot: "bg-sky-500",
    icon: Bike,
  },
  delivered: {
    label: "Delivered",
    tone: "text-gray-400 bg-gray-700/40 border-gray-600/40",
    dot: "bg-gray-500",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    tone: "text-gray-500 bg-gray-700/40 border-gray-600/40",
    dot: "bg-gray-600",
    icon: XCircle,
  },
};

// What buttons appear at the bottom of each card based on the current status
function getActions(status: OrderStatus): {
  primary?: { label: string; next: OrderStatus; icon: React.ComponentType<{ size?: number; className?: string }> };
  secondary?: { label: string; next: OrderStatus; danger?: boolean; confirm?: string; icon: React.ComponentType<{ size?: number; className?: string }> };
} {
  switch (status) {
    case "confirmed":
      return {
        primary: { label: "Accept Order", next: "preparing", icon: Flame },
        secondary: {
          label: "Reject",
          next: "rejected",
          danger: true,
          confirm: "Reject this order? The customer will be notified.",
          icon: XCircle,
        },
      };
    case "preparing":
      return {
        primary: { label: "Mark Ready", next: "ready", icon: PackageCheck },
      };
    case "ready":
      return {
        primary: { label: "Send With Rider", next: "on_the_way", icon: Bike },
        secondary: { label: "Mark Delivered", next: "delivered", icon: CheckCircle },
      };
    case "on_the_way":
      return {
        primary: { label: "Mark Delivered", next: "delivered", icon: CheckCircle },
      };
    default:
      return {};
  }
}

// Color the age chip based on how long the order has been waiting
function ageChipClass(status: OrderStatus, mins: number) {
  if (status !== "confirmed" && status !== "preparing") {
    return "bg-gray-800 text-gray-400 border-gray-700";
  }
  if (mins >= 15) return "bg-red-500/20 text-red-300 border-red-500/40";
  if (mins >= 10) return "bg-orange-500/20 text-orange-300 border-orange-500/40";
  if (mins >= 5) return "bg-amber-500/20 text-amber-300 border-amber-500/40";
  return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
}

function ageLabel(mins: number) {
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min waiting`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h waiting` : `${h}h ${m}m waiting`;
}

// ─── Sound + browser notification helpers ────────────────────────────────────

// Browsers block AudioContext output until a user gesture has occurred.
// We keep a singleton context and unlock it on the first interaction so that
// later realtime callbacks (which are NOT user gestures) can play sound.
let sharedAudioCtx: AudioContext | null = null;
let audioUnlocked = false;

function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (sharedAudioCtx) return sharedAudioCtx;
  const win = window as unknown as {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  const Ctx = win.AudioContext ?? win.webkitAudioContext;
  if (!Ctx) return null;
  try {
    sharedAudioCtx = new Ctx();
  } catch {
    sharedAudioCtx = null;
  }
  return sharedAudioCtx;
}

function unlockAudio() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  if (audioUnlocked) return;
  // A 1-sample silent buffer fully unlocks audio on iOS Safari
  try {
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
  } catch {}
  audioUnlocked = true;
}

function playOrderChime() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    // No user gesture yet — try to resume but it will likely stay suspended
    ctx.resume().catch(() => {});
  }
  try {
    const tone = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };
    tone(987.77, 0, 0.35); // B5
    tone(659.25, 0.32, 0.55); // E5
  } catch {}
}

function showOrderNotification(order: Order) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    const n = new Notification(`New order — ${order.customer_name}`, {
      body: `${order.restaurant_name} · $${order.total} · ${order.items
        .map((i) => `${i.quantity}× ${i.name}`)
        .join(", ")}`,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: `order-${order.id}`,
      requireInteraction: true,
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {}
}

// ─── Order Card ──────────────────────────────────────────────────────────────

function printOrder(order: Order) {
  const lines = order.items
    .map(
      (i) =>
        `<tr><td>${i.quantity}×</td><td>${i.name}</td><td style="text-align:right">$${
          i.price * i.quantity
        }</td></tr>`
    )
    .join("");
  const html = `<!doctype html><html><head><title>Order ${order.id.slice(
    0,
    8
  )}</title><style>body{font-family:monospace;padding:24px;max-width:380px;margin:auto;color:#000}h1{margin:0 0 4px;font-size:18px}h2{font-size:14px;margin:18px 0 6px;border-bottom:1px dashed #000;padding-bottom:4px}table{width:100%;border-collapse:collapse;font-size:13px}td{padding:3px 0;vertical-align:top}.row{display:flex;justify-content:space-between;font-size:13px;padding:2px 0}.total{font-size:16px;font-weight:bold;border-top:2px solid #000;padding-top:6px;margin-top:6px}.muted{color:#555;font-size:12px}.notes{margin-top:8px;padding:8px;border:1px dashed #000;font-size:12px}</style></head><body><h1>${order.restaurant_name}</h1><p class="muted">Order #${order.id.slice(
    0,
    8
  )} · ${new Date(order.created_at).toLocaleString()}</p><h2>Customer</h2><p>${
    order.customer_name
  }<br/>${order.phone}<br/>${order.address}</p><h2>Items</h2><table>${lines}</table><div class="row"><span>Subtotal</span><span>$${
    order.subtotal
  }</span></div><div class="row"><span>Delivery</span><span>$${
    order.delivery_fee
  }</span></div><div class="row total"><span>TOTAL</span><span>$${
    order.total
  }</span></div>${
    order.notes
      ? `<div class="notes"><strong>Notes:</strong> ${order.notes}</div>`
      : ""
  }<script>window.onload=()=>{window.print();setTimeout(()=>window.close(),300)}</script></body></html>`;
  const w = window.open("", "_blank", "width=420,height=640");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

function OrderCard({
  order,
  onStatusChange,
  showRestaurantName = false,
  highlightNew = false,
  compact = false,
}: {
  order: Order;
  onStatusChange: (id: string, status: OrderStatus) => void;
  showRestaurantName?: boolean;
  highlightNew?: boolean;
  compact?: boolean;
}) {
  const [updating, setUpdating] = useState(false);
  const status = order.status as OrderStatus;
  const meta = STATUS_META[status];
  const StatusIcon = meta.icon;
  const actions = getActions(status);
  const mins = minutesAgo(order.created_at);
  const isNew = status === "confirmed";
  const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);

  async function changeStatus(next: OrderStatus, confirmMsg?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setUpdating(true);
    await onStatusChange(order.id, next);
    setUpdating(false);
  }

  const shellClasses = isNew && highlightNew
    ? "border-primary/60 bg-gradient-to-br from-primary/10 via-gray-900 to-gray-900 animate-order-pulse"
    : isNew
    ? "border-primary/40 bg-gray-900"
    : "border-gray-800 bg-gray-900";

  return (
    <div
      className={`relative rounded-2xl border ${shellClasses} overflow-hidden animate-order-in`}
    >
      {/* Header strip */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-800/80">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide border ${meta.tone}`}
          >
            <StatusIcon size={11} />
            {meta.label}
          </span>
          <span className="text-xs font-mono text-gray-500">
            #{order.id.slice(0, 8)}
          </span>
        </div>
        <span
          className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${ageChipClass(
            status,
            mins
          )}`}
          title={new Date(order.created_at).toLocaleString()}
        >
          <Clock size={10} />
          {ageLabel(mins)}
        </span>
      </div>

      <div className={`px-4 ${compact ? "py-3 space-y-2.5" : "py-4 space-y-3.5"}`}>
        {showRestaurantName && (
          <div className="flex items-center gap-1.5 text-xs text-primary font-semibold">
            <Store size={12} />
            {order.restaurant_name}
          </div>
        )}

        {/* Customer */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <User size={14} className="text-gray-400 shrink-0" />
              <span className="text-white font-semibold text-sm truncate">
                {order.customer_name}
              </span>
            </div>
            <a
              href={`tel:${order.phone}`}
              className="mt-1 inline-flex items-center gap-1.5 text-primary text-sm font-medium hover:underline"
            >
              <Phone size={12} />
              {order.phone}
            </a>
            <div className="mt-1.5 flex items-start gap-1.5 text-xs text-gray-400">
              <MapPin size={11} className="text-gray-500 mt-0.5 shrink-0" />
              <span className="leading-snug">{order.address}</span>
            </div>
          </div>
          <button
            onClick={() => printOrder(order)}
            className="shrink-0 p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 transition"
            title="Print receipt"
          >
            <Printer size={14} />
          </button>
        </div>

        {/* Items */}
        <div className="rounded-xl bg-gray-950/60 border border-gray-800 divide-y divide-gray-800">
          {order.items.map((item, idx) => (
            <div
              key={`${item.item_id}-${item.size_label ?? ""}-${idx}`}
              className="flex items-center justify-between gap-3 px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-md bg-primary/15 text-primary text-xs font-bold">
                  {item.quantity}×
                </span>
                <span className="text-sm text-gray-200 truncate">
                  {item.name}
                  {item.size_label ? (
                    <span className="text-gray-500"> ({item.size_label})</span>
                  ) : null}
                </span>
              </div>
              <span className="text-xs text-gray-500 shrink-0">
                ${item.price * item.quantity}
              </span>
            </div>
          ))}
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="flex gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
            <span className="italic leading-snug">{order.notes}</span>
          </div>
        )}

        {/* Total */}
        <div className="flex items-end justify-between border-t border-gray-800 pt-3">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">
              {itemCount} {itemCount === 1 ? "item" : "items"} · total
            </p>
            <p className="text-2xl font-extrabold text-white leading-none mt-0.5">
              ${order.total}
            </p>
          </div>
          <p className="text-[11px] text-gray-500">
            ${order.subtotal} + ${order.delivery_fee} delivery
          </p>
        </div>

        {/* Actions */}
        {(actions.primary || actions.secondary) && (
          <div className="flex gap-2 pt-1">
            {actions.secondary && (
              <button
                onClick={() =>
                  changeStatus(actions.secondary!.next, actions.secondary!.confirm)
                }
                disabled={updating}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 text-sm font-semibold py-2.5 rounded-xl transition disabled:opacity-50 ${
                  actions.secondary.danger
                    ? "bg-red-500/10 border border-red-500/40 text-red-300 hover:bg-red-500/20"
                    : "bg-gray-800 border border-gray-700 text-gray-200 hover:bg-gray-700"
                }`}
              >
                <actions.secondary.icon size={14} />
                {actions.secondary.label}
              </button>
            )}
            {actions.primary && (
              <button
                onClick={() => changeStatus(actions.primary!.next)}
                disabled={updating}
                className="flex-[2] inline-flex items-center justify-center gap-1.5 bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-primary-dark transition disabled:opacity-50 shadow-lg shadow-primary/20"
              >
                <actions.primary.icon size={15} />
                {updating ? "Updating..." : actions.primary.label}
              </button>
            )}
          </div>
        )}

        {(status === "delivered" || status === "rejected") && (
          <div
            className={`flex items-center justify-center gap-2 py-2 text-sm font-semibold ${
              status === "delivered" ? "text-emerald-400" : "text-red-400"
            }`}
          >
            <StatusIcon size={15} />
            {status === "delivered" ? "Order Completed" : "Order Rejected"}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Orders Tab (per restaurant) ─────────────────────────────────────────────

function OrdersBoard({
  orders,
  loading,
  onStatusChange,
  showRestaurantName = false,
}: {
  orders: Order[];
  loading: boolean;
  onStatusChange: (id: string, status: OrderStatus) => Promise<void> | void;
  showRestaurantName?: boolean;
}) {
  const [closedOpen, setClosedOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pending = orders.filter((o) => o.status === "confirmed");
  const preparing = orders.filter((o) => o.status === "preparing");
  const ready = orders.filter((o) => o.status === "ready");
  const onTheWay = orders.filter((o) => o.status === "on_the_way");
  const closed = orders.filter((o) =>
    CLOSED_STATUSES.includes(o.status as OrderStatus)
  );

  const activeColumns: {
    key: OrderStatus;
    label: string;
    items: Order[];
    accent: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }[] = [
    {
      key: "preparing",
      label: "Preparing",
      items: preparing,
      accent: "text-amber-400 border-amber-500/40",
      icon: Flame,
    },
    {
      key: "ready",
      label: "Ready for Pickup",
      items: ready,
      accent: "text-emerald-400 border-emerald-500/40",
      icon: PackageCheck,
    },
    {
      key: "on_the_way",
      label: "On the Way",
      items: onTheWay,
      accent: "text-sky-400 border-sky-500/40",
      icon: Bike,
    },
  ];

  const totalActive = preparing.length + ready.length + onTheWay.length;

  return (
    <div className="space-y-8">
      {/* Pending hero strip */}
      <section>
        <header className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {pending.length > 0 && (
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-badge-ping" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  pending.length > 0 ? "bg-primary" : "bg-gray-700"
                }`}
              />
            </span>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Needs Action
            </h3>
            <span className="text-xs text-gray-500">({pending.length})</span>
          </div>
          {pending.length > 0 && (
            <p className="text-xs text-primary font-semibold flex items-center gap-1">
              <BellRing size={12} />
              Review &amp; accept these now
            </p>
          )}
        </header>

        {pending.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-800 py-10 text-center">
            <CheckCircle size={32} className="mx-auto text-gray-700 mb-2" />
            <p className="text-sm text-gray-500">
              All caught up — no new orders waiting.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pending.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={onStatusChange}
                showRestaurantName={showRestaurantName}
                highlightNew
              />
            ))}
          </div>
        )}
      </section>

      {/* Active kanban */}
      <section>
        <header className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ChefHat size={14} className="text-gray-500" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              In Progress
            </h3>
            <span className="text-xs text-gray-500">({totalActive})</span>
          </div>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {activeColumns.map((col) => {
            const Icon = col.icon;
            return (
              <div
                key={col.key}
                className="bg-gray-900/40 border border-gray-800 rounded-2xl p-3"
              >
                <div
                  className={`flex items-center justify-between pb-2.5 mb-3 border-b ${col.accent}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={13} />
                    <span className="text-sm font-bold">{col.label}</span>
                  </div>
                  <span className="text-xs font-mono opacity-80">
                    {col.items.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {col.items.length === 0 ? (
                    <p className="text-center py-8 text-xs text-gray-600">
                      Empty
                    </p>
                  ) : (
                    col.items.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onStatusChange={onStatusChange}
                        showRestaurantName={showRestaurantName}
                        compact
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Completed (collapsed) */}
      <section>
        <button
          onClick={() => setClosedOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-900/40 border border-gray-800 hover:bg-gray-900 transition"
        >
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-gray-500" />
            <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">
              Completed &amp; Rejected
            </span>
            <span className="text-xs text-gray-600">({closed.length})</span>
          </div>
          {closedOpen ? (
            <ChevronUp size={16} className="text-gray-500" />
          ) : (
            <ChevronDown size={16} className="text-gray-500" />
          )}
        </button>
        {closedOpen && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {closed.length === 0 ? (
              <p className="col-span-full text-center py-6 text-sm text-gray-600">
                No completed orders yet.
              </p>
            ) : (
              closed.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={onStatusChange}
                  showRestaurantName={showRestaurantName}
                  compact
                />
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function OrdersTab({ restaurantId }: { restaurantId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })
      .limit(80);
    if (data) setOrders(data as Order[]);
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    fetchOrders();

    if (!supabase) return;
    const channel = supabase
      .channel(`orders-rest-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          setOrders((prev) => [payload.new as Order, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          const updated = payload.new as Order;
          setOrders((prev) =>
            prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
          );
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [restaurantId, fetchOrders]);

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    if (!supabase) return;
    await supabase.from("orders").update({ status }).eq("id", orderId);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
  }

  return (
    <OrdersBoard
      orders={orders}
      loading={loading}
      onStatusChange={handleStatusChange}
    />
  );
}

// ─── All Orders View (across all restaurants) ────────────────────────────────

function AllOrdersView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchAll = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(150);
    if (data) setOrders(data as Order[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    if (!supabase) return;
    const channel = supabase
      .channel("orders-all-admin")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          setOrders((prev) => [payload.new as Order, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const updated = payload.new as Order;
          setOrders((prev) =>
            prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
          );
        }
      )
      .subscribe();
    return () => {
      supabase?.removeChannel(channel);
    };
  }, [fetchAll]);

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    if (!supabase) return;
    await supabase.from("orders").update({ status }).eq("id", orderId);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.customer_name.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        o.restaurant_name.toLowerCase().includes(q) ||
        o.address.toLowerCase().includes(q)
    );
  }, [orders, search]);

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer, phone, restaurant, or order ID..."
          className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary transition"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {search ? (
        loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            <ClipboardList size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">
              No orders match &ldquo;{search}&rdquo;.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-xs text-gray-500 mb-3">
              {filtered.length}{" "}
              {filtered.length === 1 ? "result" : "results"}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={handleStatusChange}
                  showRestaurantName
                />
              ))}
            </div>
          </div>
        )
      ) : (
        <OrdersBoard
          orders={orders}
          loading={loading}
          onStatusChange={handleStatusChange}
          showRestaurantName
        />
      )}
    </div>
  );
}

// ─── Menu Tab ────────────────────────────────────────────────────────────────

function MenuTab({ restaurantId }: { restaurantId: string }) {
  const [items, setItems] = useState<DBMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  type SizeRow = { label: string; price: string };
  const emptyForm = {
    category: "",
    name: "",
    description: "",
    price: "",
    discount_percent: "0",
    image_url: "",
    sizes: [] as SizeRow[],
  };

  const SIZE_PRESETS = ["Sm", "Md", "Lg", "XL"];

  function sizesToDB(rows: SizeRow[]): MenuSize[] {
    return rows
      .map((r) => ({ label: r.label.trim(), price: parseInt(r.price) }))
      .filter((s) => s.label && !isNaN(s.price) && s.price >= 0);
  }

  function dbToSizes(sizes: MenuSize[] | undefined | null): SizeRow[] {
    if (!Array.isArray(sizes)) return [];
    return sizes.map((s) => ({ label: s.label, price: String(s.price) }));
  }

  const [newItem, setNewItem] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);
  const [addError, setAddError] = useState("");

  const fetchItems = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from("menu_items")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("category");
    if (data) setItems(data as DBMenuItem[]);
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function uploadImage(file: File, isEdit = false): Promise<string> {
    if (!supabase) return "";
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${restaurantId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("food-images")
      .upload(path, file);
    setUploading(false);
    if (error) return "";
    const { data } = supabase.storage.from("food-images").getPublicUrl(path);
    const url = data.publicUrl;
    if (isEdit) {
      setEditForm((prev) => ({ ...prev, image_url: url }));
    } else {
      setNewItem((prev) => ({ ...prev, image_url: url }));
    }
    return url;
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    if (!newItem.name.trim() || !newItem.category.trim() || !newItem.price) {
      setAddError("Name, category, and price are required.");
      return;
    }
    setAddError("");
    const cleanedSizes = sizesToDB(newItem.sizes);
    const { data, error } = await supabase
      .from("menu_items")
      .insert({
        restaurant_id: restaurantId,
        category: newItem.category.trim(),
        name: newItem.name.trim(),
        description: newItem.description.trim(),
        price: parseInt(newItem.price),
        discount_percent: parseInt(newItem.discount_percent) || 0,
        image_url: newItem.image_url,
        sizes: cleanedSizes,
      })
      .select()
      .single();
    if (!error && data) {
      setItems((prev) => [...prev, data as DBMenuItem]);
      setNewItem(emptyForm);
    } else if (error) {
      setAddError(error.message);
    }
  }

  async function handleToggleAvailable(item: DBMenuItem) {
    if (!supabase) return;
    await supabase
      .from("menu_items")
      .update({ is_available: !item.is_available })
      .eq("id", item.id);
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, is_available: !item.is_available } : i
      )
    );
  }

  async function handleDelete(id: string) {
    if (!supabase) return;
    if (!confirm("Delete this item?")) return;
    await supabase.from("menu_items").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function startEdit(item: DBMenuItem) {
    setEditingId(item.id);
    setEditForm({
      category: item.category,
      name: item.name,
      description: item.description,
      price: String(item.price),
      discount_percent: String(item.discount_percent),
      image_url: item.image_url,
      sizes: dbToSizes(item.sizes),
    });
  }

  async function handleSaveEdit(id: string) {
    if (!supabase) return;
    const cleanedSizes = sizesToDB(editForm.sizes);
    await supabase
      .from("menu_items")
      .update({
        category: editForm.category.trim(),
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        price: parseInt(editForm.price),
        discount_percent: parseInt(editForm.discount_percent) || 0,
        image_url: editForm.image_url,
        sizes: cleanedSizes,
      })
      .eq("id", id);
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              category: editForm.category.trim(),
              name: editForm.name.trim(),
              description: editForm.description.trim(),
              image_url: editForm.image_url,
              price: parseInt(editForm.price),
              discount_percent: parseInt(editForm.discount_percent) || 0,
              sizes: cleanedSizes,
            }
          : i
      )
    );
    setEditingId(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add New Item */}
      <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <Plus size={18} className="text-primary" />
          Add New Item
        </h3>

        {addError && <p className="text-red-400 text-sm mb-3">{addError}</p>}

        <form onSubmit={handleAdd} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Category (e.g. Biryani)"
              value={newItem.category}
              onChange={(e) =>
                setNewItem((p) => ({ ...p, category: e.target.value }))
              }
              className="px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary transition"
            />
            <input
              type="text"
              placeholder="Item Name *"
              value={newItem.name}
              onChange={(e) =>
                setNewItem((p) => ({ ...p, name: e.target.value }))
              }
              className="px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary transition"
            />
          </div>
          <input
            type="text"
            placeholder="Description (optional)"
            value={newItem.description}
            onChange={(e) =>
              setNewItem((p) => ({ ...p, description: e.target.value }))
            }
            className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary transition"
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                $
              </span>
              <input
                type="number"
                placeholder="Price *"
                value={newItem.price}
                onChange={(e) =>
                  setNewItem((p) => ({ ...p, price: e.target.value }))
                }
                min="0"
                className="w-full pl-8 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary transition"
              />
            </div>
            <div className="relative">
              <input
                type="number"
                placeholder="Discount %"
                value={newItem.discount_percent}
                onChange={(e) =>
                  setNewItem((p) => ({
                    ...p,
                    discount_percent: e.target.value,
                  }))
                }
                min="0"
                max="100"
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary transition"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                %
              </span>
            </div>
          </div>

          {/* Sizes editor */}
          <div className="rounded-xl border border-gray-700 bg-gray-900/40 p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-gray-200">
                  Sizes <span className="text-gray-500 font-normal">(optional)</span>
                </p>
                <p className="text-[11px] text-gray-500">
                  Add size variants like Sm, Md, Lg, XL with their own prices.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SIZE_PRESETS.map((preset) => {
                const exists = newItem.sizes.some(
                  (s) => s.label.toLowerCase() === preset.toLowerCase()
                );
                return (
                  <button
                    key={preset}
                    type="button"
                    disabled={exists}
                    onClick={() =>
                      setNewItem((p) => ({
                        ...p,
                        sizes: [...p.sizes, { label: preset, price: "" }],
                      }))
                    }
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition ${
                      exists
                        ? "bg-gray-800 text-gray-600 border-gray-700 cursor-not-allowed"
                        : "bg-gray-800 text-gray-200 border-gray-600 hover:border-primary"
                    }`}
                  >
                    + {preset}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() =>
                  setNewItem((p) => ({
                    ...p,
                    sizes: [...p.sizes, { label: "", price: "" }],
                  }))
                }
                className="text-xs font-semibold px-2.5 py-1 rounded-full border border-dashed border-gray-600 text-gray-300 hover:border-primary transition"
              >
                + Custom
              </button>
            </div>
            {newItem.sizes.length > 0 && (
              <div className="space-y-2">
                {newItem.sizes.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Label"
                      value={row.label}
                      onChange={(e) =>
                        setNewItem((p) => ({
                          ...p,
                          sizes: p.sizes.map((s, i) =>
                            i === idx ? { ...s, label: e.target.value } : s
                          ),
                        }))
                      }
                      className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary transition"
                    />
                    <div className="relative w-28">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                        $
                      </span>
                      <input
                        type="number"
                        placeholder="Price"
                        value={row.price}
                        onChange={(e) =>
                          setNewItem((p) => ({
                            ...p,
                            sizes: p.sizes.map((s, i) =>
                              i === idx ? { ...s, price: e.target.value } : s
                            ),
                          }))
                        }
                        min="0"
                        className="w-full pl-7 pr-2 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary transition"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setNewItem((p) => ({
                          ...p,
                          sizes: p.sizes.filter((_, i) => i !== idx),
                        }))
                      }
                      className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-800 transition"
                      title="Remove size"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-gray-300 text-sm hover:border-primary transition disabled:opacity-50"
            >
              <Upload size={14} />
              {uploading ? "Uploading..." : "Upload Photo"}
            </button>
            {newItem.image_url && (
              <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-600">
                <Image
                  src={newItem.image_url}
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadImage(file);
              }}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white font-semibold py-2.5 rounded-xl hover:bg-primary-dark transition"
          >
            Add Item
          </button>
        </form>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No menu items yet. Add your first item above.
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="font-bold text-white">Menu ({items.length} items)</h3>
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"
            >
              {editingId === item.id ? (
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={editForm.category}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, category: e.target.value }))
                      }
                      placeholder="Category"
                      className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, name: e.target.value }))
                      }
                      placeholder="Name"
                      className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <input
                    type="text"
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Description"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      value={editForm.price}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, price: e.target.value }))
                      }
                      placeholder="Price ($)"
                      className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary"
                    />
                    <input
                      type="number"
                      value={editForm.discount_percent}
                      onChange={(e) =>
                        setEditForm((p) => ({
                          ...p,
                          discount_percent: e.target.value,
                        }))
                      }
                      placeholder="Discount %"
                      min="0"
                      max="100"
                      className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary"
                    />
                  </div>

                  {/* Sizes editor (edit) */}
                  <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-3 space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-200">
                        Sizes{" "}
                        <span className="text-gray-500 font-normal">(optional)</span>
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Add size variants with their own prices.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {SIZE_PRESETS.map((preset) => {
                        const exists = editForm.sizes.some(
                          (s) => s.label.toLowerCase() === preset.toLowerCase()
                        );
                        return (
                          <button
                            key={preset}
                            type="button"
                            disabled={exists}
                            onClick={() =>
                              setEditForm((p) => ({
                                ...p,
                                sizes: [
                                  ...p.sizes,
                                  { label: preset, price: "" },
                                ],
                              }))
                            }
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition ${
                              exists
                                ? "bg-gray-800 text-gray-600 border-gray-700 cursor-not-allowed"
                                : "bg-gray-800 text-gray-200 border-gray-600 hover:border-primary"
                            }`}
                          >
                            + {preset}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() =>
                          setEditForm((p) => ({
                            ...p,
                            sizes: [...p.sizes, { label: "", price: "" }],
                          }))
                        }
                        className="text-xs font-semibold px-2.5 py-1 rounded-full border border-dashed border-gray-600 text-gray-300 hover:border-primary transition"
                      >
                        + Custom
                      </button>
                    </div>
                    {editForm.sizes.length > 0 && (
                      <div className="space-y-2">
                        {editForm.sizes.map((row, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Label"
                              value={row.label}
                              onChange={(e) =>
                                setEditForm((p) => ({
                                  ...p,
                                  sizes: p.sizes.map((s, i) =>
                                    i === idx
                                      ? { ...s, label: e.target.value }
                                      : s
                                  ),
                                }))
                              }
                              className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary transition"
                            />
                            <div className="relative w-28">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                                $
                              </span>
                              <input
                                type="number"
                                placeholder="Price"
                                value={row.price}
                                onChange={(e) =>
                                  setEditForm((p) => ({
                                    ...p,
                                    sizes: p.sizes.map((s, i) =>
                                      i === idx
                                        ? { ...s, price: e.target.value }
                                        : s
                                    ),
                                  }))
                                }
                                min="0"
                                className="w-full pl-7 pr-2 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary transition"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setEditForm((p) => ({
                                  ...p,
                                  sizes: p.sizes.filter((_, i) => i !== idx),
                                }))
                              }
                              className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-800 transition"
                              title="Remove size"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 text-sm hover:border-primary transition disabled:opacity-50"
                    >
                      <Upload size={13} />
                      {uploading ? "Uploading..." : "Change Photo"}
                    </button>
                    {editForm.image_url && (
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-600">
                        <Image
                          src={editForm.image_url}
                          alt=""
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadImage(file, true);
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(item.id)}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary text-white text-sm font-semibold py-2 rounded-lg hover:bg-primary-dark transition"
                    >
                      <Save size={14} /> Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 bg-gray-700 text-gray-300 text-sm rounded-lg hover:bg-gray-600 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3">
                  {item.image_url ? (
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0">
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 bg-gray-700 rounded-lg flex items-center justify-center shrink-0">
                      <UtensilsCrossed size={20} className="text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {item.category}
                      </span>
                      {item.discount_percent > 0 && (
                        <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                          {item.discount_percent}% off
                        </span>
                      )}
                    </div>
                    <p className="text-white text-sm font-semibold truncate">
                      {item.name}
                    </p>
                    <p className="text-gray-400 text-sm">
                      ${item.price}
                      {item.discount_percent > 0 && (
                        <span className="text-accent-green ml-1 text-xs">
                          → $
                          {Math.round(
                            item.price * (1 - item.discount_percent / 100)
                          )}
                        </span>
                      )}
                    </p>
                    {Array.isArray(item.sizes) && item.sizes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.sizes.map((s) => (
                          <span
                            key={s.label}
                            className="text-[10px] font-semibold text-gray-300 bg-gray-700/60 border border-gray-600 px-1.5 py-0.5 rounded-full"
                          >
                            {s.label} · ${s.price}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleToggleAvailable(item)}
                      className="p-1.5 rounded-lg hover:bg-gray-700 transition"
                      title={
                        item.is_available
                          ? "Mark unavailable"
                          : "Mark available"
                      }
                    >
                      {item.is_available ? (
                        <ToggleRight size={20} className="text-accent-green" />
                      ) : (
                        <ToggleLeft size={20} className="text-gray-500" />
                      )}
                    </button>
                    <button
                      onClick={() => startEdit(item)}
                      className="p-1.5 rounded-lg hover:bg-gray-700 transition text-gray-400 hover:text-white"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-700 transition text-gray-400 hover:text-red-400"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Settings Tab ────────────────────────────────────────────────────────────

function SettingsTab({
  restaurant,
  onUpdate,
  onDelete,
}: {
  restaurant: DBRestaurant;
  onUpdate: (r: DBRestaurant) => void;
  onDelete: () => void;
}) {
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: restaurant.name,
    cuisine_type: restaurant.cuisine_type,
    address: restaurant.address,
    phone: restaurant.phone,
    delivery_fee: String(restaurant.delivery_fee),
    minimum_order: String(restaurant.minimum_order),
    image_url: restaurant.image_url,
    is_open: restaurant.is_open,
  });
  const [hours, setHours] = useState<Record<Day, { enabled: boolean; open: string; close: string }>>(
    restaurant.business_hours ?? DEFAULT_HOURS
  );

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function uploadCover(file: File) {
    if (!supabase) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `covers/${restaurant.id}.${ext}`;
    await supabase.storage
      .from("food-images")
      .upload(path, file, { upsert: true });
    const { data } = supabase.storage.from("food-images").getPublicUrl(path);
    setForm((prev) => ({ ...prev, image_url: data.publicUrl }));
    setUploading(false);
  }

  async function handleSave() {
    if (!supabase) return;
    setSaving(true);
    const updates = {
      name: form.name.trim(),
      cuisine_type: form.cuisine_type.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      delivery_fee: parseInt(form.delivery_fee) || 0,
      minimum_order: parseInt(form.minimum_order) || 0,
      image_url: form.image_url,
      is_open: form.is_open,
      business_hours: hours,
    };
    await supabase.from("restaurants").update(updates).eq("id", restaurant.id);
    onUpdate({ ...restaurant, ...updates });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleDeleteRestaurant() {
    if (!supabase) return;
    if (
      !confirm(
        `Permanently delete "${restaurant.name}"? This will remove all its menu items and order history. This cannot be undone.`
      )
    )
      return;
    await supabase.from("restaurants").delete().eq("id", restaurant.id);
    onDelete();
  }

  return (
    <div className="max-w-xl space-y-5">
      {/* Cover photo */}
      <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700 space-y-3">
        <h3 className="font-bold text-white">Cover Photo</h3>
        <div
          className="relative h-40 rounded-xl overflow-hidden bg-gray-700 cursor-pointer group"
          onClick={() => coverInputRef.current?.click()}
        >
          {form.image_url ? (
            <Image
              src={form.image_url}
              alt="Cover"
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-500">
              <Upload size={24} />
              <span className="text-sm">Click to upload cover photo</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
            <span className="text-white text-sm font-semibold">
              {uploading ? "Uploading..." : "Change Photo"}
            </span>
          </div>
        </div>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadCover(file);
          }}
        />
      </div>

      {/* Restaurant Info */}
      <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700 space-y-4">
        <h3 className="font-bold text-white">Restaurant Info</h3>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Restaurant Name
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-primary transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Cuisine Type
          </label>
          <select
            name="cuisine_type"
            value={form.cuisine_type}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-primary transition"
          >
            {CUISINE_TYPES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {[
          { label: "Address", name: "address", placeholder: "Full address" },
          { label: "Phone", name: "phone", placeholder: "01XXXXXXXXX" },
        ].map(({ label, name, placeholder }) => (
          <div key={name}>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              {label}
            </label>
            <input
              type="text"
              name={name}
              value={form[name as keyof typeof form] as string}
              onChange={handleChange}
              placeholder={placeholder}
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-primary transition"
            />
          </div>
        ))}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Delivery Fee ($)
            </label>
            <input
              type="number"
              name="delivery_fee"
              value={form.delivery_fee}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-primary transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Min. Order ($)
            </label>
            <input
              type="number"
              name="minimum_order"
              value={form.minimum_order}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-primary transition"
            />
          </div>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-white font-medium text-sm">Restaurant Status</p>
            <p className="text-gray-500 text-xs">
              {form.is_open
                ? "Currently accepting orders"
                : "Currently closed"}
            </p>
          </div>
          <button
            onClick={() => setForm((p) => ({ ...p, is_open: !p.is_open }))}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              form.is_open
                ? "bg-accent-green/20 text-accent-green"
                : "bg-gray-700 text-gray-400"
            }`}
          >
            <Power size={15} />
            {form.is_open ? "Open" : "Closed"}
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition disabled:opacity-50"
        >
          <Save size={16} />
          {saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Business Hours */}
      <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700 space-y-4">
        <div>
          <h3 className="font-bold text-white">Business Hours</h3>
          <p className="text-gray-500 text-xs mt-0.5">Set which days and times this restaurant accepts orders</p>
        </div>
        <div className="space-y-2.5">
          {DAYS.map((day) => (
            <div key={day} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setHours((prev) => ({
                    ...prev,
                    [day]: { ...prev[day], enabled: !prev[day].enabled },
                  }))
                }
                className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${
                  hours[day].enabled ? "bg-primary" : "bg-gray-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    hours[day].enabled ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>
              <span
                className={`text-sm w-24 capitalize font-medium ${
                  hours[day].enabled ? "text-white" : "text-gray-600"
                }`}
              >
                {day}
              </span>
              {hours[day].enabled ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={hours[day].open}
                    onChange={(e) =>
                      setHours((prev) => ({
                        ...prev,
                        [day]: { ...prev[day], open: e.target.value },
                      }))
                    }
                    className="flex-1 px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary transition"
                  />
                  <span className="text-gray-500 text-xs shrink-0">to</span>
                  <input
                    type="time"
                    value={hours[day].close}
                    onChange={(e) =>
                      setHours((prev) => ({
                        ...prev,
                        [day]: { ...prev[day], close: e.target.value },
                      }))
                    }
                    className="flex-1 px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary transition"
                  />
                </div>
              ) : (
                <span className="text-gray-600 text-sm">Closed</span>
              )}
            </div>
          ))}
        </div>
        <p className="text-gray-600 text-xs">Hours are saved when you click Save Changes above.</p>
      </div>

      <div className="bg-gray-800 rounded-2xl p-5 border border-red-900/40 space-y-3">
        <h3 className="font-bold text-red-400">Danger Zone</h3>
        <p className="text-gray-400 text-sm">
          Deleting this restaurant will permanently remove its menu and order
          history. There is no undo.
        </p>
        <button
          onClick={handleDeleteRestaurant}
          className="w-full flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 font-semibold py-3 rounded-xl hover:bg-red-500/20 transition"
        >
          <Trash2 size={15} />
          Delete Restaurant
        </button>
      </div>
    </div>
  );
}

// ─── Restaurant View (drill-in to one restaurant) ────────────────────────────

function RestaurantView({
  restaurant,
  onBack,
  onUpdate,
  onDelete,
}: {
  restaurant: DBRestaurant;
  onBack: () => void;
  onUpdate: (r: DBRestaurant) => void;
  onDelete: () => void;
}) {
  const [tab, setTab] = useState<RestaurantTab>("orders");

  const tabs: { id: RestaurantTab; label: string; icon: React.ReactNode }[] = [
    { id: "orders", label: "Orders", icon: <ClipboardList size={16} /> },
    { id: "menu", label: "Menu", icon: <UtensilsCrossed size={16} /> },
    { id: "settings", label: "Settings", icon: <Settings size={16} /> },
  ];

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
      >
        <ArrowLeft size={15} />
        Back to all restaurants
      </button>

      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="relative h-32 bg-gray-800">
          {restaurant.image_url && (
            <Image
              src={restaurant.image_url}
              alt={restaurant.name}
              fill
              className="object-cover opacity-60"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
          <div className="absolute bottom-3 left-5 right-5">
            <h1 className="text-2xl font-bold text-white">{restaurant.name}</h1>
            <div className="flex items-center gap-3 text-xs text-gray-300 mt-1">
              <span className="flex items-center gap-1">
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${
                    restaurant.is_open ? "bg-accent-green" : "bg-gray-500"
                  }`}
                />
                {restaurant.is_open ? "Open" : "Closed"}
              </span>
              <span>·</span>
              <span>{restaurant.cuisine_type}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {restaurant.delivery_time_min}–{restaurant.delivery_time_max} min
              </span>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-800 px-3">
          <div className="flex gap-1">
            {tabs.map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
                  tab === id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {tab === "orders" && <OrdersTab restaurantId={restaurant.id} />}
          {tab === "menu" && <MenuTab restaurantId={restaurant.id} />}
          {tab === "settings" && (
            <SettingsTab
              restaurant={restaurant}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Add Restaurant Modal ────────────────────────────────────────────────────

function AddRestaurantModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (r: DBRestaurant) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    cuisine_type: "Bengali",
    address: "",
    phone: "",
    delivery_fee: "2",
    minimum_order: "10",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    if (!form.name.trim()) return setError("Name is required.");
    if (!form.address.trim()) return setError("Address is required.");
    setSaving(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error: dbError } = await supabase
      .from("restaurants")
      .insert({
        owner_id: user?.id,
        name: form.name.trim(),
        cuisine_type: form.cuisine_type,
        address: form.address.trim(),
        phone: form.phone.trim(),
        delivery_fee: parseInt(form.delivery_fee) || 0,
        minimum_order: parseInt(form.minimum_order) || 0,
      })
      .select()
      .single();

    setSaving(false);
    if (dbError) {
      setError(dbError.message);
      return;
    }
    if (data) onCreated(data as DBRestaurant);
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4 py-8 overflow-y-auto">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-lg my-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus size={18} className="text-primary" />
            Add Restaurant
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Restaurant Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Dhaka Biryani House"
              required
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-primary transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Cuisine Type
            </label>
            <select
              name="cuisine_type"
              value={form.cuisine_type}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-primary transition"
            >
              {CUISINE_TYPES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Address <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Full address"
              required
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-primary transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="(555) 000-0000"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-primary transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Delivery Fee ($)
              </label>
              <input
                type="number"
                name="delivery_fee"
                value={form.delivery_fee}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-primary transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Min. Order ($)
              </label>
              <input
                type="number"
                name="minimum_order"
                value={form.minimum_order}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-primary transition"
              />
            </div>
          </div>

          <p className="text-xs text-gray-500">
            You can upload a cover photo and add menu items after creating the
            restaurant.
          </p>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 text-gray-300 text-sm font-semibold rounded-xl hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-primary-dark transition disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Restaurant"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Dashboard View (restaurant grid + stats) ────────────────────────────────

function DashboardView({
  restaurants,
  orders,
  menuCounts,
  pendingCounts,
  search,
  setSearch,
  onSelectRestaurant,
  onToggle,
  onAdd,
}: {
  restaurants: DBRestaurant[];
  orders: Order[];
  menuCounts: Record<string, number>;
  pendingCounts: Record<string, number>;
  search: string;
  setSearch: (s: string) => void;
  onSelectRestaurant: (r: DBRestaurant) => void;
  onToggle: (id: string, isOpen: boolean) => void;
  onAdd: () => void;
}) {
  const todaysOrders = orders.filter((o) => isToday(o.created_at));
  const totalRevenue = todaysOrders
    .filter((o) => o.status !== "rejected")
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingTotal = orders.filter((o) => o.status === "confirmed").length;
  const openRestaurants = restaurants.filter((r) => r.is_open).length;

  const filtered = restaurants.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.cuisine_type.toLowerCase().includes(q) ||
      r.address.toLowerCase().includes(q)
    );
  });

  const stats = [
    {
      label: "Restaurants",
      value: restaurants.length,
      sub: `${openRestaurants} open`,
      icon: Store,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Pending Orders",
      value: pendingTotal,
      sub: "Need confirmation",
      icon: ClipboardList,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    {
      label: "Orders Today",
      value: todaysOrders.length,
      sub: "All restaurants",
      icon: TrendingUp,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
    },
    {
      label: "Revenue Today",
      value: `$${totalRevenue}`,
      sub: "Excluding rejected",
      icon: TrendingUp,
      color: "text-accent-green",
      bg: "bg-green-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.sub}</p>
                </div>
                <div className={`p-2 rounded-xl ${s.bg}`}>
                  <Icon size={18} className={s.color} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search + Add */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search restaurants by name, cuisine, or address..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary transition"
          />
        </div>
        <button
          onClick={onAdd}
          className="flex items-center justify-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-dark transition"
        >
          <Plus size={16} />
          Add Restaurant
        </button>
      </div>

      {/* Restaurant grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-gray-900 border border-dashed border-gray-800 rounded-2xl">
          <Store size={48} className="mx-auto mb-3 text-gray-700" />
          {restaurants.length === 0 ? (
            <>
              <p className="text-gray-400 mb-1">No restaurants yet</p>
              <p className="text-gray-600 text-sm mb-4">
                Add your first restaurant to get started
              </p>
              <button
                onClick={onAdd}
                className="inline-flex items-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-dark transition"
              >
                <Plus size={15} />
                Add Restaurant
              </button>
            </>
          ) : (
            <p className="text-gray-500">No restaurants match your search.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((r) => {
            const pending = pendingCounts[r.id] ?? 0;
            const menuCount = menuCounts[r.id] ?? 0;
            return (
              <div
                key={r.id}
                className="group text-left bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-primary transition"
              >
                <div
                  className="cursor-pointer"
                  onClick={() => onSelectRestaurant(r)}
                >
                  <div className="relative h-32 bg-gray-800">
                    {r.image_url ? (
                      <Image
                        src={r.image_url}
                        alt={r.name}
                        fill
                        className="object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-700">
                        <Store size={36} />
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold backdrop-blur ${
                          r.is_open
                            ? "bg-accent-green/30 text-accent-green"
                            : "bg-gray-900/70 text-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block w-1.5 h-1.5 rounded-full ${
                            r.is_open ? "bg-accent-green" : "bg-gray-500"
                          }`}
                        />
                        {r.is_open ? "Open" : "Closed"}
                      </span>
                    </div>
                    {pending > 0 && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-lg">
                        {pending} new
                      </div>
                    )}
                  </div>
                  <div className="px-4 pt-4 pb-2">
                    <p className="text-white font-bold truncate">{r.name}</p>
                    <p className="text-gray-500 text-xs">{r.cuisine_type}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                      <span className="flex items-center gap-1">
                        <UtensilsCrossed size={11} />
                        {menuCount} items
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {r.delivery_time_min}–{r.delivery_time_max}m
                      </span>
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <button
                    onClick={() => onToggle(r.id, !r.is_open)}
                    className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                      r.is_open
                        ? "bg-accent-green/15 text-accent-green hover:bg-accent-green/25"
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    <Power size={11} />
                    {r.is_open ? "Open · Tap to close" : "Closed · Tap to open"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Panel ────────────────────────────────────────────────────────

type NotifPermission = "default" | "granted" | "denied" | "unsupported";

export default function AdminPanelPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("dashboard");
  const [restaurants, setRestaurants] = useState<DBRestaurant[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuCounts, setMenuCounts] = useState<Record<string, number>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [notifPerm, setNotifPerm] = useState<NotifPermission>("default");
  const [notifBannerDismissed, setNotifBannerDismissed] = useState(false);

  const selectedRestaurant = useMemo(
    () => restaurants.find((r) => r.id === selectedId) ?? null,
    [restaurants, selectedId]
  );

  const pendingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of orders) {
      if (o.status === "confirmed") {
        counts[o.restaurant_id] = (counts[o.restaurant_id] ?? 0) + 1;
      }
    }
    return counts;
  }, [orders]);

  const totalPending = useMemo(
    () => orders.filter((o) => o.status === "confirmed").length,
    [orders]
  );

  // Read current notification permission once on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) {
      setNotifPerm("unsupported");
      return;
    }
    setNotifPerm(Notification.permission as NotifPermission);
    setNotifBannerDismissed(
      sessionStorage.getItem("wispr-notif-dismissed") === "1"
    );
  }, []);

  // Unlock audio on the very first user interaction so realtime callbacks
  // (which are not user gestures) can play sound later.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      unlockAudio();
      window.removeEventListener("click", handler);
      window.removeEventListener("keydown", handler);
      window.removeEventListener("touchstart", handler);
    };
    window.addEventListener("click", handler);
    window.addEventListener("keydown", handler);
    window.addEventListener("touchstart", handler);
    return () => {
      window.removeEventListener("click", handler);
      window.removeEventListener("keydown", handler);
      window.removeEventListener("touchstart", handler);
    };
  }, []);

  // Live tab title — show pending count when there are unhandled orders
  useEffect(() => {
    if (typeof document === "undefined") return;
    const base = "Wispr Admin";
    document.title = totalPending > 0 ? `(${totalPending}) ${base}` : base;
  }, [totalPending]);

  async function requestNotifPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setNotifPerm(perm as NotifPermission);
  }

  function dismissNotifBanner() {
    setNotifBannerDismissed(true);
    try {
      sessionStorage.setItem("wispr-notif-dismissed", "1");
    } catch {}
  }

  useEffect(() => {
    async function init() {
      if (!isSupabaseConfigured || !supabase) {
        setAuthError("Supabase is not configured.");
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/restaurant-login");
        return;
      }
      if (user.email?.toLowerCase() !== ADMIN_EMAIL) {
        await supabase.auth.signOut();
        router.replace("/restaurant-login");
        return;
      }

      const [restRes, orderRes, menuRes] = await Promise.all([
        supabase
          .from("restaurants")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("orders")
          .select("id,restaurant_id,status,total,created_at")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase.from("menu_items").select("restaurant_id"),
      ]);

      if (restRes.data) setRestaurants(restRes.data as DBRestaurant[]);
      if (orderRes.data) setOrders(orderRes.data as Order[]);
      if (menuRes.data) {
        const counts: Record<string, number> = {};
        for (const row of menuRes.data as { restaurant_id: string }[]) {
          counts[row.restaurant_id] = (counts[row.restaurant_id] ?? 0) + 1;
        }
        setMenuCounts(counts);
      }

      setLoading(false);
    }
    init();
  }, [router]);

  // Realtime: sound + browser notification + stats refresh
  // INSERTs fire the chime/notification globally so the admin gets alerted
  // regardless of which view they're on.
  useEffect(() => {
    if (!supabase) return;

    async function refreshStats() {
      if (!supabase) return;
      const { data } = await supabase
        .from("orders")
        .select("id,restaurant_id,status,total,created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (data) setOrders(data as Order[]);
    }

    const channel = supabase
      .channel("orders-stats-admin")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        async (payload) => {
          // Fetch full row (payload may be the lightweight projection)
          if (!supabase) return;
          const { data } = await supabase
            .from("orders")
            .select("*")
            .eq("id", (payload.new as { id: string }).id)
            .single();
          const full = (data ?? payload.new) as Order;
          if (full.status === "confirmed") {
            playOrderChime();
            showOrderNotification(full);
          }
          await refreshStats();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        () => {
          refreshStats();
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, []);

  async function handleLogout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/restaurant-login");
  }

  function handleSelectRestaurant(r: DBRestaurant) {
    setSelectedId(r.id);
    setView("restaurant");
  }

  function handleBackToDashboard() {
    setSelectedId(null);
    setView("dashboard");
  }

  function handleRestaurantUpdate(updated: DBRestaurant) {
    setRestaurants((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
  }

  function handleRestaurantCreated(r: DBRestaurant) {
    setRestaurants((prev) => [r, ...prev]);
    setShowAddModal(false);
    setSelectedId(r.id);
    setView("restaurant");
  }

  function handleRestaurantDeleted() {
    if (selectedId) {
      setRestaurants((prev) => prev.filter((r) => r.id !== selectedId));
    }
    handleBackToDashboard();
  }

  async function handleQuickToggle(id: string, isOpen: boolean) {
    if (!supabase) return;
    await supabase.from("restaurants").update({ is_open: isOpen }).eq("id", id);
    setRestaurants((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_open: isOpen } : r))
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{authError}</p>
          <button
            onClick={() => router.push("/restaurant-login")}
            className="text-primary hover:underline text-sm"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const navItems: {
    id: View;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
    {
      id: "all-orders",
      label: "All Orders",
      icon: <ClipboardList size={16} />,
      badge: totalPending,
    },
  ];

  const showNotifBanner =
    notifPerm !== "granted" &&
    notifPerm !== "unsupported" &&
    !notifBannerDismissed;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Top header */}
      <div className="bg-gray-900 border-b border-gray-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shrink-0">
              <ChefHat size={18} className="text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-white font-bold text-sm leading-tight">
                Wispr Admin
              </p>
              <p className="text-gray-500 text-xs flex items-center gap-1">
                <ShieldCheck size={10} />
                {ADMIN_EMAIL}
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedId(null);
                  setView(item.id);
                }}
                className={`relative flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-semibold rounded-xl transition ${
                  view === item.id && view !== "restaurant"
                    ? "bg-primary text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                {item.icon}
                <span className="hidden sm:inline">{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="relative flex items-center justify-center min-w-[20px] h-5 px-1.5 ml-0.5">
                    <span className="absolute inset-0 rounded-full bg-primary animate-badge-ping opacity-60" />
                    <span className="relative inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold text-white bg-primary rounded-full shadow-lg">
                      {item.badge}
                    </span>
                  </span>
                ) : null}
              </button>
            ))}
            <button
              onClick={() => {
                // Always unlock audio when the bell is clicked (this counts as a gesture)
                unlockAudio();
                if (notifPerm === "default") {
                  requestNotifPermission();
                  return;
                }
                if (notifPerm === "granted") {
                  // Test the full alert chain
                  playOrderChime();
                  try {
                    const n = new Notification("Wispr Admin — test alert", {
                      body: "Sound + notifications are working.",
                      icon: "/favicon.ico",
                      tag: "wispr-test",
                    });
                    n.onclick = () => {
                      window.focus();
                      n.close();
                    };
                  } catch {}
                }
              }}
              title={
                notifPerm === "granted"
                  ? "Click to test alert (sound + notification)"
                  : notifPerm === "denied"
                  ? "Notifications blocked — enable them in your browser settings"
                  : notifPerm === "unsupported"
                  ? "Notifications not supported in this browser"
                  : "Click to enable notifications"
              }
              className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl transition ${
                notifPerm === "granted"
                  ? "text-emerald-400 hover:bg-gray-800"
                  : notifPerm === "denied" || notifPerm === "unsupported"
                  ? "text-gray-600 cursor-not-allowed"
                  : "text-amber-400 hover:bg-gray-800"
              }`}
            >
              {notifPerm === "granted" ? (
                <BellRing size={16} />
              ) : notifPerm === "denied" || notifPerm === "unsupported" ? (
                <BellOff size={16} />
              ) : (
                <Bell size={16} />
              )}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-semibold text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-xl transition"
              title="Log out"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </nav>
        </div>
      </div>

      {showNotifBanner && (
        <div className="bg-gradient-to-r from-primary/20 to-primary/5 border-b border-primary/30">
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <BellRing size={16} className="text-primary shrink-0" />
              <span className="text-white font-medium">
                Turn on notifications
              </span>
              <span className="text-gray-400 hidden sm:inline">
                — get an alert on this device the moment a new order arrives.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={requestNotifPermission}
                className="bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-primary-dark transition"
              >
                Enable
              </button>
              <button
                onClick={dismissNotifBanner}
                className="p-1.5 text-gray-400 hover:text-white transition"
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        {view === "dashboard" && (
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Manage all restaurants and orders from one place.
            </p>
          </div>
        )}
        {view === "all-orders" && (
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-white">Live Orders</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                Pending orders need action — in-progress and completed below.
              </p>
            </div>
            {totalPending > 0 && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/15 border border-primary/30 text-primary text-sm font-semibold">
                <BellRing size={14} />
                {totalPending} waiting for you
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pb-10">
        {view === "dashboard" && (
          <DashboardView
            restaurants={restaurants}
            orders={orders}
            menuCounts={menuCounts}
            pendingCounts={pendingCounts}
            search={search}
            setSearch={setSearch}
            onSelectRestaurant={handleSelectRestaurant}
            onToggle={handleQuickToggle}
            onAdd={() => setShowAddModal(true)}
          />
        )}

        {view === "all-orders" && <AllOrdersView />}

        {view === "restaurant" && selectedRestaurant && (
          <RestaurantView
            restaurant={selectedRestaurant}
            onBack={handleBackToDashboard}
            onUpdate={handleRestaurantUpdate}
            onDelete={handleRestaurantDeleted}
          />
        )}
      </div>

      {showAddModal && (
        <AddRestaurantModal
          onClose={() => setShowAddModal(false)}
          onCreated={handleRestaurantCreated}
        />
      )}
    </div>
  );
}
