import Image from "next/image";
import Link from "next/link";
import { Star, Clock, Bike } from "lucide-react";
import { Restaurant } from "@/types";

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const {
    id,
    name,
    image_url,
    cuisine_type,
    rating,
    review_count,
    delivery_time_min,
    delivery_time_max,
    delivery_fee,
    is_open,
  } = restaurant;

  return (
    <Link href={`/restaurant/${id}`} className="block group">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300">
        {/* Image */}
        <div className="relative h-40 sm:h-48 overflow-hidden">
          <Image
            src={image_url}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {!is_open && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white text-gray-800 text-sm font-semibold px-4 py-1.5 rounded-full">
                Currently Closed
              </span>
            </div>
          )}
          {restaurant.featured && is_open && (
            <div className="absolute top-3 left-3 bg-primary text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              Featured
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 text-base group-hover:text-primary transition-colors">
              {name}
            </h3>
            <div className="flex items-center gap-1 bg-accent-green/10 px-2 py-0.5 rounded-md shrink-0">
              <Star size={13} className="text-accent-green fill-accent-green" />
              <span className="text-sm font-semibold text-accent-green">{rating}</span>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-3">{cuisine_type}</p>

          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Clock size={13} />
              <span>{delivery_time_min}-{delivery_time_max} min</span>
            </div>
            <div className="flex items-center gap-1">
              <Bike size={13} />
              <span>৳{delivery_fee}</span>
            </div>
            <span className="text-gray-400">{review_count}+ ratings</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
