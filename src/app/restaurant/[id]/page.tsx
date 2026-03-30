import Image from "next/image";
import Link from "next/link";
import { Star, Clock, Bike, ArrowLeft, MapPin } from "lucide-react";
import {
  getRestaurantById,
  getMenuByRestaurant,
  getDBRestaurantById,
  getMenuFromDB,
} from "@/lib/data";
import MenuSection from "@/components/MenuSection";
import MenuCategoryNav from "@/components/MenuCategoryNav";
import { notFound } from "next/navigation";
import { MenuCategory, MenuItem } from "@/types";

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const localRestaurant = getRestaurantById(id);

  if (localRestaurant) {
    const menu = getMenuByRestaurant(id);
    return (
      <RestaurantLayout
        id={localRestaurant.id}
        name={localRestaurant.name}
        image_url={localRestaurant.image_url}
        cuisine_type={localRestaurant.cuisine_type}
        rating={localRestaurant.rating}
        review_count={localRestaurant.review_count}
        delivery_time_min={localRestaurant.delivery_time_min}
        delivery_time_max={localRestaurant.delivery_time_max}
        delivery_fee={localRestaurant.delivery_fee}
        minimum_order={localRestaurant.minimum_order}
        address={localRestaurant.address}
        menu={menu}
      />
    );
  }

  const dbRestaurant = await getDBRestaurantById(id);
  if (!dbRestaurant) notFound();

  const dbMenu = await getMenuFromDB(id);
  const menu: (MenuCategory & { items: MenuItem[] })[] = dbMenu.map(
    ({ category, items }, idx) => ({
      id: `cat-${idx}`,
      restaurant_id: id,
      name: category,
      sort_order: idx,
      items,
    })
  );

  return (
    <RestaurantLayout
      id={dbRestaurant.id}
      name={dbRestaurant.name}
      image_url={
        dbRestaurant.image_url ||
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80"
      }
      cuisine_type={dbRestaurant.cuisine_type}
      rating={null}
      review_count={null}
      delivery_time_min={dbRestaurant.delivery_time_min}
      delivery_time_max={dbRestaurant.delivery_time_max}
      delivery_fee={dbRestaurant.delivery_fee}
      minimum_order={dbRestaurant.minimum_order}
      address={dbRestaurant.address}
      menu={menu}
    />
  );
}

function RestaurantLayout({
  id,
  name,
  image_url,
  cuisine_type,
  rating,
  review_count,
  delivery_time_min,
  delivery_time_max,
  delivery_fee,
  minimum_order,
  address,
  menu,
}: {
  id: string;
  name: string;
  image_url: string;
  cuisine_type: string;
  rating: number | null;
  review_count: number | null;
  delivery_time_min: number;
  delivery_time_max: number;
  delivery_fee: number;
  minimum_order: number;
  address: string;
  menu: (MenuCategory & { items: MenuItem[] })[];
}) {
  const categoryList = menu.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="max-w-3xl mx-auto">
      {/* Cover Image */}
      <div className="relative h-52 sm:h-64">
        <Image
          src={image_url}
          alt={name}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <Link
          href="/"
          className="absolute top-4 left-4 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md active:scale-95 transition"
        >
          <ArrowLeft size={18} className="text-gray-800" />
        </Link>
        {/* Restaurant name overlay on image */}
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-white text-2xl font-bold drop-shadow-lg">{name}</h1>
          <p className="text-white/80 text-sm mt-0.5">{cuisine_type}</p>
        </div>
      </div>

      {/* Info strip */}
      <div className="bg-white px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3 flex-wrap">
          {rating !== null && (
            <div className="flex items-center gap-1 bg-green-50 px-2.5 py-1 rounded-lg">
              <Star size={14} className="text-accent-green fill-accent-green" />
              <span className="font-bold text-accent-green text-sm">{rating}</span>
              {review_count !== null && (
                <span className="text-xs text-gray-400">({review_count}+)</span>
              )}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Clock size={14} className="text-primary" />
            <span>{delivery_time_min}–{delivery_time_max} min</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Bike size={14} className="text-primary" />
            <span>{delivery_fee === 0 ? "Free delivery" : `$${delivery_fee} delivery`}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <MapPin size={13} className="text-gray-400" />
            <span className="truncate max-w-[180px]">{address}</span>
          </div>
        </div>
        {minimum_order > 0 && (
          <p className="text-xs text-gray-400 mt-2">
            Min. order: ${minimum_order}
          </p>
        )}
      </div>

      {/* Sticky category nav */}
      <MenuCategoryNav categories={categoryList} />

      {/* Menu */}
      <div className="px-4 py-5 space-y-8 pb-32">
        {menu.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-10">
            No menu items available yet.
          </p>
        ) : (
          menu.map((category) => (
            <section key={category.id} id={`cat-${category.id}`}>
              <MenuSection
                category={category}
                restaurantId={id}
                restaurantName={name}
              />
            </section>
          ))
        )}
      </div>
    </div>
  );
}
