"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tag, ImageOff } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface OfferItem {
  id: string;
  name: string;
  description: string;
  original_price: number;
  discounted_price: number;
  discount_percent: number;
  image_url: string;
  restaurant_id: string;
  restaurant_name: string;
}

export default function OffersPage() {
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOffers() {
      if (!isSupabaseConfigured || !supabase) { setLoading(false); return; }

      const { data } = await supabase
        .from("menu_items")
        .select("id, name, description, price, discount_percent, image_url, restaurant_id, restaurants(name)")
        .gt("discount_percent", 0)
        .eq("is_available", true)
        .order("discount_percent", { ascending: false });

      if (data) {
        const items: OfferItem[] = data.map((row: any) => ({
          id: row.id,
          name: row.name,
          description: row.description,
          original_price: row.price,
          discounted_price: Math.round(row.price * (1 - row.discount_percent / 100)),
          discount_percent: row.discount_percent,
          image_url: row.image_url,
          restaurant_id: row.restaurant_id,
          restaurant_name: row.restaurants?.name ?? "Unknown",
        }));
        setOffers(items);
      }
      setLoading(false);
    }
    loadOffers();
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-5">
        <Tag size={20} className="text-primary" />
        <h1 className="text-xl font-bold text-gray-900">Offers & Deals</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : offers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Tag size={28} className="text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No offers right now</p>
          <p className="text-gray-400 text-sm mt-1">Check back later for deals from restaurants</p>
          <Link
            href="/"
            className="mt-5 bg-primary text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-primary-dark transition"
          >
            Browse Restaurants
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map((item) => (
            <Link
              key={item.id}
              href={`/restaurant/${item.restaurant_id}`}
              className="flex gap-4 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition active:scale-[0.99]"
            >
              {/* Image */}
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <ImageOff size={20} className="text-gray-300" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-gray-900 leading-snug">{item.name}</p>
                  <span className="shrink-0 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {item.discount_percent}% OFF
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{item.restaurant_name}</p>
                {item.description && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">{item.description}</p>
                )}
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-primary font-bold">${item.discounted_price}</span>
                  <span className="text-gray-400 text-sm line-through">${item.original_price}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
