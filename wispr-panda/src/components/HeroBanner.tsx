"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, ChevronDown } from "lucide-react";
import { useLocation } from "@/contexts/LocationContext";

export default function HeroBanner() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { location, openModal } = useLocation();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary via-pink-500 to-rose-400">
      {/* Decorative blobs */}
      <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
      <div className="absolute -bottom-10 -left-6 w-32 h-32 bg-white/10 rounded-full" />
      <div className="absolute top-4 right-16 w-16 h-16 bg-white/10 rounded-full" />

      <div className="relative z-10 px-5 pt-7 pb-6 sm:px-10 sm:pt-10 sm:pb-8">
        {/* Tappable location pill */}
        <button
          onClick={openModal}
          className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 active:bg-white/40 transition rounded-full px-3 py-1.5 mb-3"
        >
          <MapPin size={12} className="text-white shrink-0" />
          <span className="text-white text-xs font-semibold truncate max-w-[200px]">
            {location}
          </span>
          <ChevronDown size={12} className="text-white/70 shrink-0" />
        </button>

        <h1 className="text-2xl sm:text-3xl font-bold text-white leading-snug mb-1">
          Hungry? We&apos;ve got you
        </h1>
        <p className="text-white/80 text-sm mb-5">
          Order from 100+ restaurants near you
        </p>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for food or restaurants..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-gray-800 text-sm placeholder-gray-400 focus:outline-none shadow-md"
            />
          </div>
          <button
            type="submit"
            className="bg-white text-primary font-bold px-4 py-3 rounded-xl shadow-md hover:bg-pink-50 transition text-sm shrink-0"
          >
            Search
          </button>
        </form>
      </div>
    </div>
  );
}
