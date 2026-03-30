"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import RestaurantCard from "@/components/RestaurantCard";
import MenuItemCard from "@/components/MenuItem";
import { searchRestaurants, searchMenuItems } from "@/lib/data";
import Link from "next/link";

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const restaurantResults = debouncedQuery
    ? searchRestaurants(debouncedQuery)
    : [];
  const menuResults = debouncedQuery ? searchMenuItems(debouncedQuery) : [];
  const hasResults = restaurantResults.length > 0 || menuResults.length > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Search Input */}
      <div className="relative">
        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for restaurants, dishes, or cuisines..."
          className="w-full pl-12 pr-4 py-3.5 text-base bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition shadow-sm"
          autoFocus
        />
      </div>

      {/* Empty state */}
      {!debouncedQuery && (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">
            Search for your favorite food or restaurant
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {["Biryani", "Burger", "Pizza", "Chinese", "Coffee"].map((tag) => (
              <button
                key={tag}
                onClick={() => setQuery(tag)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-primary hover:text-primary transition"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {debouncedQuery && !hasResults && (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">
            No results found for &quot;{debouncedQuery}&quot;
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Try a different search term
          </p>
        </div>
      )}

      {/* Restaurant Results */}
      {restaurantResults.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Restaurants</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {restaurantResults.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        </div>
      )}

      {/* Menu Item Results */}
      {menuResults.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Dishes</h2>
          <div className="space-y-3">
            {menuResults.map((item) => (
              <Link key={item.id} href={`/restaurant/${item.restaurant_id}`}>
                <div className="mb-1">
                  <span className="text-xs text-primary font-medium">
                    {item.restaurant_name}
                  </span>
                </div>
                <MenuItemCard
                  item={item}
                  restaurantId={item.restaurant_id}
                  restaurantName={item.restaurant_name}
                />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="w-full h-14 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
