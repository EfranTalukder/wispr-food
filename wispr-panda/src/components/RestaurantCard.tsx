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
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 active:scale-[0.98] transition-all duration-200">
        {/* Image */}
        <div className="relative h-44 sm:h-48 overflow-hidden">
          <Image
            src={image_url}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {/* Gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {!is_open && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="bg-white text-gray-800 text-sm font-bold px-4 py-2 rounded-full shadow">
                Closed
              </span>
            </div>
          )}

          {restaurant.featured && is_open && (
            <div className="absolute top-3 left-3 bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
              ⭐ Featured
            </div>
          )}

          {/* Delivery time badge on image */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
            <Clock size={11} />
            <span>{delivery_time_min}–{delivery_time_max} min</span>
          </div>
        </div>

        {/* Info */}
        <div className="p-3.5">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <h3 className="font-bold text-gray-900 text-base leading-tight group-hover:text-primary transition-colors line-clamp-1">
              {name}
            </h3>
            <div className="flex items-center gap-0.5 bg-green-50 px-2 py-0.5 rounded-lg shrink-0">
              <Star size={12} className="text-accent-green fill-accent-green" />
              <span className="text-sm font-bold text-accent-green">{rating}</span>
            </div>
          </div>

          <p className="text-xs text-gray-500 mb-2.5">{cuisine_type} · {review_count}+ ratings</p>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-2.5 py-1">
              <Bike size={12} className="text-primary" />
              <span className="text-xs font-medium text-gray-600">
                {delivery_fee === 0 ? "Free delivery" : `$${delivery_fee} delivery`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
