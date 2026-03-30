"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { ChefHat, Mail, Lock, Eye, EyeOff } from "lucide-react";

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

export default function RestaurantSignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    restaurant_name: "",
    cuisine_type: "Bengali",
    address: "",
    phone: "",
    delivery_fee: "49",
    minimum_order: "150",
    email: "",
    password: "",
    confirm_password: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured || !supabase) {
      setError("Supabase is not configured.");
      return;
    }

    // Validate
    if (!form.restaurant_name.trim()) return setError("Restaurant name is required.");
    if (!form.address.trim()) return setError("Address is required.");
    if (!form.phone.trim()) return setError("Phone number is required.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    if (form.password !== form.confirm_password) return setError("Passwords do not match.");

    setLoading(true);
    setError("");

    // 1. Create auth account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
    });

    if (authError || !authData.user) {
      setError(authError?.message ?? "Failed to create account.");
      setLoading(false);
      return;
    }

    // 2. Insert restaurant row
    const { error: dbError } = await supabase.from("restaurants").insert({
      owner_id: authData.user.id,
      name: form.restaurant_name.trim(),
      cuisine_type: form.cuisine_type,
      address: form.address.trim(),
      phone: form.phone.trim(),
      delivery_fee: parseInt(form.delivery_fee) || 49,
      minimum_order: parseInt(form.minimum_order) || 150,
    });

    if (dbError) {
      setError(dbError.message);
      setLoading(false);
      return;
    }

    router.push("/restaurant-panel");
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <ChefHat size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Register Your Restaurant</h1>
          <p className="text-gray-400 text-sm mt-1">
            Join Wispr Food and start receiving orders
          </p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          {!isSupabaseConfigured && (
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-400 text-sm">
              Supabase is not configured.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Restaurant Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Restaurant Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="restaurant_name"
                value={form.restaurant_name}
                onChange={handleChange}
                placeholder="e.g. Dhaka Biryani House"
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary transition"
              />
            </div>

            {/* Cuisine Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Cuisine Type <span className="text-red-400">*</span>
              </label>
              <select
                name="cuisine_type"
                value={form.cuisine_type}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-primary transition"
              >
                {CUISINE_TYPES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Restaurant Address <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Full address, area, city"
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary transition"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Phone Number <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="01XXXXXXXXX"
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary transition"
              />
            </div>

            {/* Delivery Fee + Min Order */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Delivery Fee (৳)
                </label>
                <input
                  type="number"
                  name="delivery_fee"
                  value={form.delivery_fee}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-primary transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Min. Order (৳)
                </label>
                <input
                  type="number"
                  name="minimum_order"
                  value={form.minimum_order}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-primary transition"
                />
              </div>
            </div>

            <hr className="border-gray-800" />

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Email Address <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="restaurant@email.com"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  required
                  className="w-full pl-10 pr-10 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Confirm Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirm_password"
                  value={form.confirm_password}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isSupabaseConfigured}
              className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Creating account..." : "Create Restaurant Account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{" "}
            <Link href="/restaurant-login" className="text-primary font-semibold hover:underline">
              Log in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          <Link href="/" className="hover:text-gray-400 transition">
            ← Back to Wispr Food
          </Link>
        </p>
      </div>
    </div>
  );
}
