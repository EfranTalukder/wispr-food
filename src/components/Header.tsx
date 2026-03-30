"use client";

import Link from "next/link";
import { MapPin, Search, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Header() {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery("");
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">W</span>
          </div>
          <span className="text-xl font-bold text-gray-900 hidden sm:block">
            Wispr <span className="text-primary">Food</span>
          </span>
        </Link>

        {/* Location */}
        <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary transition mx-4 shrink-0">
          <MapPin size={16} className="text-primary" />
          <span className="hidden sm:inline">Washington, DC</span>
          <span className="sm:hidden">Washington</span>
        </button>

        {/* Search & Profile */}
        <div className="flex items-center gap-3">
          {searchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search restaurants or food..."
                className="w-40 sm:w-64 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                autoFocus
              />
            </form>
          ) : null}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 rounded-full hover:bg-gray-100 transition"
            aria-label="Search"
          >
            <Search size={20} className="text-gray-600" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 transition" aria-label="Profile">
            <User size={20} className="text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  );
}
