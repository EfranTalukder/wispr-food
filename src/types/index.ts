export interface Restaurant {
  id: string;
  name: string;
  image_url: string;
  cuisine_type: string;
  rating: number;
  review_count: number;
  delivery_time_min: number;
  delivery_time_max: number;
  delivery_fee: number;
  minimum_order: number;
  address: string;
  is_open: boolean;
  featured: boolean;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
}

export interface MenuItem {
  id: string;
  category_id: string;
  restaurant_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
  is_popular: boolean;
  discount_percent?: number;
}

// DB restaurant from Supabase (owner-registered)
export interface DBRestaurant {
  id: string; // uuid
  owner_id: string;
  name: string;
  cuisine_type: string;
  address: string;
  phone: string;
  delivery_fee: number;
  minimum_order: number;
  delivery_time_min: number;
  delivery_time_max: number;
  image_url: string;
  is_open: boolean;
  created_at: string;
}

// DB menu item from Supabase
export interface DBMenuItem {
  id: string;
  restaurant_id: string;
  category: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
  discount_percent: number;
  created_at: string;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
  restaurant_id: string;
  restaurant_name: string;
}

export interface OrderLineItem {
  item_id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  items: OrderLineItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: "confirmed" | "preparing" | "ready" | "on_the_way" | "delivered" | "rejected";
  customer_name: string;
  phone: string;
  address: string;
  notes: string;
  created_at: string;
  delivery_time_min: number;
  delivery_time_max: number;
}

export interface CheckoutFormData {
  customer_name: string;
  phone: string;
  address: string;
  notes: string;
}
