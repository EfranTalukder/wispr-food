"use client";

import Link from "next/link";
import { MapPin, Search, ChevronDown, ClipboardList, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocation } from "@/contexts/LocationContext";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/Logo";

export default function Header() {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { location, openModal } = useLocation();
  const { user } = useAuth();

  // Shorten label for header (first part before comma)
  const shortLocation = location.split(",")[0].trim();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery("");
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <span className="sm:hidden">
            <Logo size={36} showText={false} />
          </span>
          <span className="hidden sm:block">
            <Logo size={36} showText={true} />
          </span>
        </Link>

        {/* Location button — tappable, opens modal */}
        <button
          onClick={openModal}
          className="flex items-center gap-1.5 min-w-0 flex-1 sm:flex-none bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition rounded-xl px-3 py-2 max-w-[200px]"
        >
          <MapPin size={15} className="text-primary shrink-0" />
          <span className="text-sm font-semibold text-gray-800 truncate">
            {shortLocation}
          </span>
          <ChevronDown size={14} className="text-gray-400 shrink-0" />
        </button>

        {/* Desktop links */}
        <div className="hidden sm:flex items-center gap-1 shrink-0">
          <Link href="/orders" className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-primary transition px-3 py-2 rounded-xl hover:bg-gray-50">
            <ClipboardList size={17} />
            My Orders
          </Link>
          <Link href={user ? "/profile" : "/login"} className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-primary transition px-3 py-2 rounded-xl hover:bg-gray-50">
            <UserCircle size={19} />
            {user ? (user.user_metadata?.name?.split(" ")[0] || "Profile") : "Sign In"}
          </Link>
        </div>

        {/* Search & icons */}
        <div className="flex items-center gap-1 shrink-0">
          {searchOpen && (
            <form onSubmit={handleSearch} className="flex items-center">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search restaurants or food..."
                className="w-36 sm:w-64 px-3 py-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                autoFocus
              />
            </form>
          )}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2.5 rounded-xl hover:bg-gray-100 transition"
            aria-label="Search"
          >
            <Search size={20} className="text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  );
}
