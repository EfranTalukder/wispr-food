"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { DBRestaurant, DBMenuItem, Order } from "@/types";
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
  Package,
  Plus,
  Trash2,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Upload,
  Save,
  Power,
} from "lucide-react";

type Tab = "orders" | "menu" | "settings";
type OrderStatus = "confirmed" | "preparing" | "ready" | "rejected";

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

// ─── Orders Tab ─────────────────────────────────────────────────────────────

function OrderCard({
  order,
  onStatusChange,
}: {
  order: Order;
  onStatusChange: (id: string, status: OrderStatus) => void;
}) {
  const [updating, setUpdating] = useState(false);

  async function changeStatus(status: OrderStatus) {
    setUpdating(true);
    await onStatusChange(order.id, status);
    setUpdating(false);
  }

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-gray-400">{order.id}</span>
        <span className="text-xs text-gray-500">{timeAgo(order.created_at)}</span>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Phone size={13} className="text-primary shrink-0" />
          <span className="font-semibold">{order.customer_name}</span>
          <span className="text-gray-500">·</span>
          <a href={`tel:${order.phone}`} className="text-primary hover:underline">
            {order.phone}
          </a>
        </div>
        <div className="flex items-start gap-2 text-xs text-gray-400">
          <MapPin size={12} className="text-gray-500 mt-0.5 shrink-0" />
          <span>{order.address}</span>
        </div>
      </div>

      <div className="space-y-1">
        {order.items.map((item) => (
          <div key={item.item_id} className="flex justify-between text-sm">
            <span className="text-gray-300">
              {item.name} <span className="text-gray-500">× {item.quantity}</span>
            </span>
            <span className="text-gray-400">৳{item.price * item.quantity}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between font-bold text-white text-base border-t border-gray-700 pt-2">
        <span>Total</span>
        <span>৳{order.total}</span>
      </div>

      {order.notes && (
        <p className="text-xs text-gray-500 italic bg-gray-900 px-3 py-2 rounded-lg">
          &ldquo;{order.notes}&rdquo;
        </p>
      )}

      {/* Action buttons */}
      {(order.status as string) === "confirmed" && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => changeStatus("preparing")}
            disabled={updating}
            className="flex-1 bg-accent-green text-white text-sm font-semibold py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            Accept
          </button>
          <button
            onClick={() => changeStatus("rejected")}
            disabled={updating}
            className="flex-1 bg-red-500 text-white text-sm font-semibold py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      )}

      {(order.status as string) === "preparing" && (
        <button
          onClick={() => changeStatus("ready")}
          disabled={updating}
          className="w-full bg-primary text-white text-sm font-semibold py-2 rounded-lg hover:bg-primary-dark transition disabled:opacity-50"
        >
          Mark as Ready
        </button>
      )}

      {(order.status as string) === "ready" && (
        <div className="flex items-center justify-center gap-2 py-2 text-accent-green text-sm font-semibold">
          <CheckCircle size={16} />
          Ready for Pickup
        </div>
      )}

      {(order.status as string) === "rejected" && (
        <div className="flex items-center justify-center gap-2 py-2 text-red-400 text-sm font-semibold">
          <XCircle size={16} />
          Rejected
        </div>
      )}
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
      .limit(50);
    if (data) setOrders(data as Order[]);
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    fetchOrders();

    if (!supabase) return;
    const channel = supabase
      .channel("orders-realtime")
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

  const byStatus = (status: string) =>
    orders.filter((o) => (o.status as string) === status);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const columns: { label: string; status: string; color: string }[] = [
    { label: "New Orders", status: "confirmed", color: "text-red-400" },
    { label: "Preparing", status: "preparing", color: "text-yellow-400" },
    { label: "Ready", status: "ready", color: "text-accent-green" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {columns.map(({ label, status, color }) => (
        <div key={status}>
          <h3 className={`font-bold text-sm mb-3 ${color}`}>
            {label} ({byStatus(status).length})
          </h3>
          <div className="space-y-3">
            {byStatus(status).length === 0 ? (
              <div className="text-center py-10 text-gray-600 text-sm">
                No orders here
              </div>
            ) : (
              byStatus(status).map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={handleStatusChange}
                />
              ))
            )}
          </div>
        </div>
      ))}
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

  const emptyForm = {
    category: "",
    name: "",
    description: "",
    price: "",
    discount_percent: "0",
    image_url: "",
  };

  const [newItem, setNewItem] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);
  const [addError, setAddError] = useState("");

  useEffect(() => {
    fetchItems();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  async function fetchItems() {
    if (!supabase) return;
    const { data } = await supabase
      .from("menu_items")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("category");
    if (data) setItems(data as DBMenuItem[]);
    setLoading(false);
  }

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
      })
      .select()
      .single();
    if (!error && data) {
      setItems((prev) => [...prev, data as DBMenuItem]);
      setNewItem(emptyForm);
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
    });
  }

  async function handleSaveEdit(id: string) {
    if (!supabase) return;
    await supabase
      .from("menu_items")
      .update({
        category: editForm.category.trim(),
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        price: parseInt(editForm.price),
        discount_percent: parseInt(editForm.discount_percent) || 0,
        image_url: editForm.image_url,
      })
      .eq("id", id);
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              ...editForm,
              price: parseInt(editForm.price),
              discount_percent: parseInt(editForm.discount_percent) || 0,
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

        {addError && (
          <p className="text-red-400 text-sm mb-3">{addError}</p>
        )}

        <form onSubmit={handleAdd} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Category (e.g. Biryani)"
              value={newItem.category}
              onChange={(e) => setNewItem((p) => ({ ...p, category: e.target.value }))}
              className="px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary transition"
            />
            <input
              type="text"
              placeholder="Item Name *"
              value={newItem.name}
              onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))}
              className="px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary transition"
            />
          </div>
          <input
            type="text"
            placeholder="Description (optional)"
            value={newItem.description}
            onChange={(e) => setNewItem((p) => ({ ...p, description: e.target.value }))}
            className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary transition"
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">৳</span>
              <input
                type="number"
                placeholder="Price *"
                value={newItem.price}
                onChange={(e) => setNewItem((p) => ({ ...p, price: e.target.value }))}
                min="0"
                className="w-full pl-8 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary transition"
              />
            </div>
            <div className="relative">
              <input
                type="number"
                placeholder="Discount %"
                value={newItem.discount_percent}
                onChange={(e) => setNewItem((p) => ({ ...p, discount_percent: e.target.value }))}
                min="0"
                max="100"
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary transition"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
            </div>
          </div>

          {/* Photo Upload */}
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
                <Image src={newItem.image_url} alt="" fill className="object-cover" />
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

      {/* Items List */}
      {items.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No menu items yet. Add your first item above.
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="font-bold text-white">Your Menu ({items.length} items)</h3>
          {items.map((item) => (
            <div key={item.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              {editingId === item.id ? (
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={editForm.category}
                      onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}
                      placeholder="Category"
                      className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Name"
                      className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <input
                    type="text"
                    value={editForm.description}
                    onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Description"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      value={editForm.price}
                      onChange={(e) => setEditForm((p) => ({ ...p, price: e.target.value }))}
                      placeholder="Price (৳)"
                      className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary"
                    />
                    <input
                      type="number"
                      value={editForm.discount_percent}
                      onChange={(e) => setEditForm((p) => ({ ...p, discount_percent: e.target.value }))}
                      placeholder="Discount %"
                      min="0"
                      max="100"
                      className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary"
                    />
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
                        <Image src={editForm.image_url} alt="" fill className="object-cover" />
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
                      <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 bg-gray-700 rounded-lg flex items-center justify-center shrink-0">
                      <UtensilsCrossed size={20} className="text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{item.category}</span>
                      {item.discount_percent > 0 && (
                        <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                          {item.discount_percent}% off
                        </span>
                      )}
                    </div>
                    <p className="text-white text-sm font-semibold truncate">{item.name}</p>
                    <p className="text-gray-400 text-sm">
                      ৳{item.price}
                      {item.discount_percent > 0 && (
                        <span className="text-accent-green ml-1 text-xs">
                          → ৳{Math.round(item.price * (1 - item.discount_percent / 100))}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleToggleAvailable(item)}
                      className="p-1.5 rounded-lg hover:bg-gray-700 transition"
                      title={item.is_available ? "Mark unavailable" : "Mark available"}
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

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab({
  restaurant,
  onUpdate,
  onLogout,
}: {
  restaurant: DBRestaurant;
  onUpdate: (r: DBRestaurant) => void;
  onLogout: () => void;
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

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function uploadCover(file: File) {
    if (!supabase) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `covers/${restaurant.id}.${ext}`;
    await supabase.storage.from("food-images").upload(path, file, { upsert: true });
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
    };
    await supabase.from("restaurants").update(updates).eq("id", restaurant.id);
    onUpdate({ ...restaurant, ...updates });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-xl space-y-5">
      {/* Cover photo */}
      <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700 space-y-3">
        <h3 className="font-bold text-white">Cover Photo</h3>
        <div
          className="relative h-40 rounded-xl overflow-hidden bg-gray-700 cursor-pointer"
          onClick={() => coverInputRef.current?.click()}
        >
          {form.image_url ? (
            <Image src={form.image_url} alt="Cover" fill className="object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-500">
              <Upload size={24} />
              <span className="text-sm">Click to upload cover photo</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition">
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

        {[
          { label: "Restaurant Name", name: "name", placeholder: "Your restaurant name" },
          { label: "Cuisine Type", name: "cuisine_type", placeholder: "e.g. Bengali, Pizza" },
          { label: "Address", name: "address", placeholder: "Full address" },
          { label: "Phone", name: "phone", placeholder: "01XXXXXXXXX" },
        ].map(({ label, name, placeholder }) => (
          <div key={name}>
            <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
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
            <label className="block text-sm font-medium text-gray-400 mb-1">Delivery Fee (৳)</label>
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
            <label className="block text-sm font-medium text-gray-400 mb-1">Min. Order (৳)</label>
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

        {/* Open/Closed toggle */}
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-white font-medium text-sm">Restaurant Status</p>
            <p className="text-gray-500 text-xs">
              {form.is_open ? "Currently accepting orders" : "Currently closed"}
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

      {/* Logout */}
      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 bg-gray-800 border border-gray-700 text-red-400 font-semibold py-3 rounded-xl hover:bg-red-500/10 transition"
      >
        <LogOut size={16} />
        Log Out
      </button>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function RestaurantPanelPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("orders");
  const [restaurant, setRestaurant] = useState<DBRestaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    async function init() {
      if (!isSupabaseConfigured || !supabase) {
        setAuthError("Supabase is not configured.");
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/restaurant-login");
        return;
      }

      const { data: rest } = await supabase
        .from("restaurants")
        .select("*")
        .eq("owner_id", user.id)
        .single();

      if (!rest) {
        setAuthError("No restaurant found for this account.");
        setLoading(false);
        return;
      }

      setRestaurant(rest as DBRestaurant);
      setLoading(false);
    }
    init();
  }, [router]);

  async function handleLogout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/restaurant-login");
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

  if (!restaurant) return null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "orders", label: "Orders", icon: <ClipboardList size={18} /> },
    { id: "menu", label: "Menu", icon: <UtensilsCrossed size={18} /> },
    { id: "settings", label: "Settings", icon: <Settings size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shrink-0">
            <ChefHat size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">{restaurant.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${
                  restaurant.is_open ? "bg-accent-green" : "bg-gray-500"
                }`}
              />
              <span className="text-xs text-gray-400">
                {restaurant.is_open ? "Open" : "Closed"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock size={12} />
          <span>
            {restaurant.delivery_time_min}–{restaurant.delivery_time_max} min
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-900 border-b border-gray-800 px-4">
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

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {tab === "orders" && <OrdersTab restaurantId={restaurant.id} />}
        {tab === "menu" && <MenuTab restaurantId={restaurant.id} />}
        {tab === "settings" && (
          <SettingsTab
            restaurant={restaurant}
            onUpdate={setRestaurant}
            onLogout={handleLogout}
          />
        )}
      </div>
    </div>
  );
}
