"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Phone, LogOut, ClipboardList } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const name = user.user_metadata?.name ?? "";
  const phone = user.user_metadata?.phone ?? "";

  async function handleLogout() {
    await signOut();
    router.push("/");
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-8 space-y-5">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
          <User size={36} className="text-primary" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">{name || "My Account"}</h1>
          <p className="text-sm text-gray-400">{user.email}</p>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {name && (
          <div className="flex items-center gap-3 px-5 py-4">
            <User size={17} className="text-gray-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Name</p>
              <p className="text-sm font-medium text-gray-800">{name}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 px-5 py-4">
          <Mail size={17} className="text-gray-400 shrink-0" />
          <div>
            <p className="text-xs text-gray-400">Email</p>
            <p className="text-sm font-medium text-gray-800">{user.email}</p>
          </div>
        </div>
        {phone && (
          <div className="flex items-center gap-3 px-5 py-4">
            <Phone size={17} className="text-gray-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Phone</p>
              <p className="text-sm font-medium text-gray-800">{phone}</p>
            </div>
          </div>
        )}
      </div>

      {/* Orders link */}
      <Link
        href="/orders"
        className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 hover:shadow-md transition"
      >
        <ClipboardList size={18} className="text-primary" />
        <span className="font-medium text-gray-800 flex-1">My Orders</span>
        <span className="text-gray-300">→</span>
      </Link>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-500 font-semibold py-3.5 rounded-2xl hover:bg-red-100 transition"
      >
        <LogOut size={18} />
        Log Out
      </button>
    </div>
  );
}
