"use client";

import { useState, useEffect } from "react";
import HeroBanner from "@/components/HeroBanner";
import CategoryFilter from "@/components/CategoryFilter";
import RestaurantCard from "@/components/RestaurantCard";
import { restaurants as localRestaurants, getRestaurantsFromDB } from "@/lib/data";
import { Restaurant, DBRestaurant } from "@/types";

function dbToRestaurant(r: DBRestaurant): Restaurant {
  return {
    id: r.id,
    name: r.name,
    image_url: r.image_url || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
    cuisine_type: r.cuisine_type,
    rating: 4.0,
    review_count: 0,
    delivery_time_min: r.delivery_time_min,
    delivery_time_max: r.delivery_time_max,
    delivery_fee: r.delivery_fee,
    minimum_order: r.minimum_order,
    address: r.address,
    is_open: r.is_open,
    featured: false,
  };
}

export default function HomePage() {
  const [selectedCuisine, setSelectedCuisine] = useState("All");
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>(localRestaurants);

  useEffect(() => {
    getRestaurantsFromDB().then((dbRests) => {
      if (dbRests.length > 0) {
        const converted = dbRests.map(dbToRestaurant);
        // DB restaurants at the top, then local ones
        setAllRestaurants([...converted, ...localRestaurants]);
      }
    });
  }, []);

  const filtered =
    selectedCuisine === "All"
      ? allRestaurants
      : allRestaurants.filter((r) => r.cuisine_type === selectedCuisine);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Hero */}
      <HeroBanner />

      {/* Filters */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          Restaurants near you
        </h2>
        <CategoryFilter
          selected={selectedCuisine}
          onSelect={setSelectedCuisine}
        />
      </div>

      {/* Restaurant Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">
            No restaurants found for this cuisine.
          </p>
          <button
            onClick={() => setSelectedCuisine("All")}
            className="mt-3 text-primary font-medium hover:underline"
          >
            Show all restaurants
          </button>
        </div>
      )}
    </div>
  );
}
