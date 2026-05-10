import { Restaurant, MenuCategory, MenuItem, DBRestaurant, DBMenuItem } from "@/types";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const restaurants: Restaurant[] = [];

export const menuCategories: MenuCategory[] = [];

export const menuItems: MenuItem[] = [];

export const cuisineTypes = [
  "All",
  "Biryani",
  "Burger",
  "Pizza",
  "Chinese",
  "BBQ",
  "Cafe",
  "Fast Food",
];

export function getRestaurantById(id: string): Restaurant | undefined {
  return restaurants.find((r) => r.id === id);
}

export function getMenuByRestaurant(restaurantId: string) {
  const categories = menuCategories
    .filter((c) => c.restaurant_id === restaurantId)
    .sort((a, b) => a.sort_order - b.sort_order);

  return categories.map((category) => ({
    ...category,
    items: menuItems.filter(
      (item) => item.category_id === category.id && item.is_available
    ),
  }));
}

export function searchRestaurants(query: string): Restaurant[] {
  const q = query.toLowerCase();
  return restaurants.filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      r.cuisine_type.toLowerCase().includes(q) ||
      r.address.toLowerCase().includes(q)
  );
}

export function searchMenuItems(query: string): (MenuItem & { restaurant_name: string })[] {
  const q = query.toLowerCase();
  return menuItems
    .filter(
      (item) =>
        item.is_available &&
        (item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q))
    )
    .map((item) => ({
      ...item,
      restaurant_name:
        restaurants.find((r) => r.id === item.restaurant_id)?.name ?? "",
    }));
}

// ─── Supabase DB fetch functions ─────────────────────────────────────────────

/** Fetch all open restaurants from Supabase. Returns [] if not configured. */
export async function getRestaurantsFromDB(): Promise<DBRestaurant[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("is_open", true)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as DBRestaurant[];
}

/** Fetch menu items for a DB restaurant, grouped by category. */
export async function getMenuFromDB(
  restaurantId: string
): Promise<{ category: string; items: MenuItem[] }[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("is_available", true)
    .order("category");
  if (error || !data) return [];

  const grouped: Record<string, MenuItem[]> = {};
  for (const raw of data as DBMenuItem[]) {
    const item: MenuItem = {
      id: raw.id,
      category_id: raw.category,
      restaurant_id: raw.restaurant_id,
      name: raw.name,
      description: raw.description,
      price: raw.price,
      image_url: raw.image_url,
      is_available: raw.is_available,
      is_popular: false,
      discount_percent: raw.discount_percent,
      sizes: Array.isArray(raw.sizes) ? raw.sizes : [],
    };
    if (!grouped[raw.category]) grouped[raw.category] = [];
    grouped[raw.category].push(item);
  }

  return Object.entries(grouped).map(([category, items]) => ({
    category,
    items,
  }));
}

/** Fetch a single DB restaurant by ID. Returns null if not found. */
export async function getDBRestaurantById(
  id: string
): Promise<DBRestaurant | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data as DBRestaurant;
}
