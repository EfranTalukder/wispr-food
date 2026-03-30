import { Restaurant, MenuCategory, MenuItem, DBRestaurant, DBMenuItem } from "@/types";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const restaurants: Restaurant[] = [
  {
    id: "1",
    name: "Kacchi Bhai",
    image_url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80",
    cuisine_type: "Biryani",
    rating: 4.5,
    review_count: 1240,
    delivery_time_min: 30,
    delivery_time_max: 45,
    delivery_fee: 49,
    minimum_order: 200,
    address: "Capitol Hill, DC",
    is_open: true,
    featured: true,
  },
  {
    id: "2",
    name: "Chillox",
    image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
    cuisine_type: "Burger",
    rating: 4.3,
    review_count: 980,
    delivery_time_min: 20,
    delivery_time_max: 35,
    delivery_fee: 39,
    minimum_order: 150,
    address: "Georgetown, DC",
    is_open: true,
    featured: true,
  },
  {
    id: "3",
    name: "Sultan's Dine",
    image_url: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80",
    cuisine_type: "Bengali",
    rating: 4.7,
    review_count: 2100,
    delivery_time_min: 35,
    delivery_time_max: 50,
    delivery_fee: 59,
    minimum_order: 300,
    address: "Adams Morgan, DC",
    is_open: true,
    featured: true,
  },
  {
    id: "4",
    name: "Pizza Inn",
    image_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80",
    cuisine_type: "Pizza",
    rating: 4.1,
    review_count: 750,
    delivery_time_min: 25,
    delivery_time_max: 40,
    delivery_fee: 49,
    minimum_order: 250,
    address: "Dupont Circle, DC",
    is_open: true,
    featured: false,
  },
  {
    id: "5",
    name: "Star Kabab",
    image_url: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&q=80",
    cuisine_type: "BBQ",
    rating: 4.4,
    review_count: 890,
    delivery_time_min: 30,
    delivery_time_max: 45,
    delivery_fee: 39,
    minimum_order: 200,
    address: "Columbia Heights, DC",
    is_open: true,
    featured: false,
  },
  {
    id: "6",
    name: "Cafe Crimson",
    image_url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80",
    cuisine_type: "Cafe",
    rating: 4.2,
    review_count: 620,
    delivery_time_min: 20,
    delivery_time_max: 30,
    delivery_fee: 29,
    minimum_order: 150,
    address: "Georgetown, DC",
    is_open: true,
    featured: false,
  },
  {
    id: "7",
    name: "Madchef",
    image_url: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&q=80",
    cuisine_type: "Fast Food",
    rating: 4.0,
    review_count: 540,
    delivery_time_min: 15,
    delivery_time_max: 25,
    delivery_fee: 29,
    minimum_order: 100,
    address: "Capitol Hill, DC",
    is_open: true,
    featured: false,
  },
  {
    id: "8",
    name: "Khana's Kitchen",
    image_url: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&q=80",
    cuisine_type: "Bengali",
    rating: 4.6,
    review_count: 1560,
    delivery_time_min: 35,
    delivery_time_max: 50,
    delivery_fee: 49,
    minimum_order: 250,
    address: "U Street, DC",
    is_open: true,
    featured: true,
  },
  {
    id: "9",
    name: "Dragon Palace",
    image_url: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800&q=80",
    cuisine_type: "Chinese",
    rating: 4.3,
    review_count: 870,
    delivery_time_min: 25,
    delivery_time_max: 40,
    delivery_fee: 49,
    minimum_order: 200,
    address: "Adams Morgan, DC",
    is_open: true,
    featured: false,
  },
  {
    id: "10",
    name: "The Burger Factory",
    image_url: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80",
    cuisine_type: "Burger",
    rating: 4.2,
    review_count: 430,
    delivery_time_min: 20,
    delivery_time_max: 30,
    delivery_fee: 35,
    minimum_order: 150,
    address: "Dupont Circle, DC",
    is_open: false,
    featured: false,
  },
];

export const menuCategories: MenuCategory[] = [
  // Kacchi Bhai
  { id: "c1", restaurant_id: "1", name: "Biryani", sort_order: 1 },
  { id: "c2", restaurant_id: "1", name: "Appetizers", sort_order: 2 },
  { id: "c3", restaurant_id: "1", name: "Drinks", sort_order: 3 },
  // Chillox
  { id: "c4", restaurant_id: "2", name: "Burgers", sort_order: 1 },
  { id: "c5", restaurant_id: "2", name: "Sides", sort_order: 2 },
  { id: "c6", restaurant_id: "2", name: "Drinks", sort_order: 3 },
  // Sultan's Dine
  { id: "c7", restaurant_id: "3", name: "Rice Dishes", sort_order: 1 },
  { id: "c8", restaurant_id: "3", name: "Curries", sort_order: 2 },
  { id: "c9", restaurant_id: "3", name: "Desserts", sort_order: 3 },
  // Pizza Inn
  { id: "c10", restaurant_id: "4", name: "Pizzas", sort_order: 1 },
  { id: "c11", restaurant_id: "4", name: "Pasta", sort_order: 2 },
  { id: "c12", restaurant_id: "4", name: "Drinks", sort_order: 3 },
  // Star Kabab
  { id: "c13", restaurant_id: "5", name: "Kababs", sort_order: 1 },
  { id: "c14", restaurant_id: "5", name: "Platters", sort_order: 2 },
  { id: "c15", restaurant_id: "5", name: "Naan & Bread", sort_order: 3 },
  // Cafe Crimson
  { id: "c16", restaurant_id: "6", name: "Coffee", sort_order: 1 },
  { id: "c17", restaurant_id: "6", name: "Snacks", sort_order: 2 },
  { id: "c18", restaurant_id: "6", name: "Desserts", sort_order: 3 },
  // Madchef
  { id: "c19", restaurant_id: "7", name: "Fried Chicken", sort_order: 1 },
  { id: "c20", restaurant_id: "7", name: "Wraps", sort_order: 2 },
  { id: "c21", restaurant_id: "7", name: "Combo Meals", sort_order: 3 },
  // Khana's Kitchen
  { id: "c22", restaurant_id: "8", name: "Traditional Bengali", sort_order: 1 },
  { id: "c23", restaurant_id: "8", name: "Fish Dishes", sort_order: 2 },
  { id: "c24", restaurant_id: "8", name: "Rice & Bread", sort_order: 3 },
  // Dragon Palace
  { id: "c25", restaurant_id: "9", name: "Noodles", sort_order: 1 },
  { id: "c26", restaurant_id: "9", name: "Rice Dishes", sort_order: 2 },
  { id: "c27", restaurant_id: "9", name: "Soups", sort_order: 3 },
  // The Burger Factory
  { id: "c28", restaurant_id: "10", name: "Signature Burgers", sort_order: 1 },
  { id: "c29", restaurant_id: "10", name: "Fries & Sides", sort_order: 2 },
  { id: "c30", restaurant_id: "10", name: "Shakes", sort_order: 3 },
];

export const menuItems: MenuItem[] = [
  // === Kacchi Bhai ===
  { id: "m1", category_id: "c1", restaurant_id: "1", name: "Kacchi Biryani (Half)", description: "Traditional Dhaka-style kacchi biryani with tender goat meat, aromatic rice, and boiled egg", price: 280, image_url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80", is_available: true, is_popular: true },
  { id: "m2", category_id: "c1", restaurant_id: "1", name: "Kacchi Biryani (Full)", description: "Full plate of our signature kacchi with extra meat and special spices", price: 450, image_url: "https://images.unsplash.com/photo-1642821373181-696a54913e93?w=400&q=80", is_available: true, is_popular: true },
  { id: "m3", category_id: "c1", restaurant_id: "1", name: "Tehari", description: "Fragrant beef tehari cooked with premium basmati rice", price: 220, image_url: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=400&q=80", is_available: true, is_popular: false },
  { id: "m4", category_id: "c2", restaurant_id: "1", name: "Chicken Tikka", description: "Marinated chicken pieces grilled to perfection", price: 180, image_url: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80", is_available: true, is_popular: false },
  { id: "m5", category_id: "c2", restaurant_id: "1", name: "Sheek Kabab", description: "Minced beef kabab with herbs and spices", price: 150, image_url: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&q=80", is_available: true, is_popular: true },
  { id: "m6", category_id: "c3", restaurant_id: "1", name: "Borhani", description: "Traditional spiced yogurt drink, perfect with biryani", price: 60, image_url: "https://images.unsplash.com/photo-1497534446932-c925b458314e?w=400&q=80", is_available: true, is_popular: true },
  { id: "m7", category_id: "c3", restaurant_id: "1", name: "Mango Lassi", description: "Creamy mango yogurt smoothie", price: 80, image_url: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400&q=80", is_available: true, is_popular: false },

  // === Chillox ===
  { id: "m8", category_id: "c4", restaurant_id: "2", name: "Classic Smash Burger", description: "Double smashed beef patties with cheese, lettuce, and special sauce", price: 320, image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80", is_available: true, is_popular: true },
  { id: "m9", category_id: "c4", restaurant_id: "2", name: "Chicken Zinger", description: "Crispy fried chicken fillet with mayo and fresh veggies", price: 280, image_url: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&q=80", is_available: true, is_popular: true },
  { id: "m10", category_id: "c4", restaurant_id: "2", name: "BBQ Bacon Burger", description: "Beef patty with crispy bacon, BBQ sauce, and cheddar", price: 380, image_url: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&q=80", is_available: true, is_popular: false },
  { id: "m11", category_id: "c5", restaurant_id: "2", name: "Loaded Fries", description: "Crispy fries topped with cheese sauce and jalapeños", price: 180, image_url: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80", is_available: true, is_popular: true },
  { id: "m12", category_id: "c5", restaurant_id: "2", name: "Onion Rings", description: "Golden crispy onion rings with dipping sauce", price: 120, image_url: "https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&q=80", is_available: true, is_popular: false },
  { id: "m13", category_id: "c6", restaurant_id: "2", name: "Coca Cola", description: "Chilled 500ml can", price: 60, image_url: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&q=80", is_available: true, is_popular: false },

  // === Sultan's Dine ===
  { id: "m14", category_id: "c7", restaurant_id: "3", name: "Kacchi Biryani Special", description: "Award-winning kacchi biryani with premium goat meat", price: 350, image_url: "https://images.unsplash.com/photo-1642821373181-696a54913e93?w=400&q=80", is_available: true, is_popular: true },
  { id: "m15", category_id: "c7", restaurant_id: "3", name: "Morog Polao", description: "Fragrant chicken pulao with whole spices", price: 300, image_url: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&q=80", is_available: true, is_popular: true },
  { id: "m16", category_id: "c8", restaurant_id: "3", name: "Bhuna Khichuri", description: "Rich and spiced khichuri with egg and meat", price: 250, image_url: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80", is_available: true, is_popular: false },
  { id: "m17", category_id: "c8", restaurant_id: "3", name: "Beef Rezala", description: "Creamy white curry with tender beef chunks", price: 320, image_url: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80", is_available: true, is_popular: true },
  { id: "m18", category_id: "c9", restaurant_id: "3", name: "Firni", description: "Traditional rice pudding with cardamom and pistachios", price: 100, image_url: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80", is_available: true, is_popular: false },

  // === Pizza Inn ===
  { id: "m19", category_id: "c10", restaurant_id: "4", name: "Pepperoni Pizza (Medium)", description: "Classic pepperoni with mozzarella on hand-tossed dough", price: 450, image_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80", is_available: true, is_popular: true },
  { id: "m20", category_id: "c10", restaurant_id: "4", name: "BBQ Chicken Pizza", description: "Grilled chicken, BBQ sauce, onions, and bell peppers", price: 500, image_url: "https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=400&q=80", is_available: true, is_popular: true },
  { id: "m21", category_id: "c10", restaurant_id: "4", name: "Margherita", description: "Fresh tomato, basil, and mozzarella", price: 380, image_url: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80", is_available: true, is_popular: false },
  { id: "m22", category_id: "c11", restaurant_id: "4", name: "Chicken Alfredo Pasta", description: "Creamy alfredo sauce with grilled chicken and penne", price: 320, image_url: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=400&q=80", is_available: true, is_popular: false },
  { id: "m23", category_id: "c12", restaurant_id: "4", name: "Lemonade", description: "Fresh squeezed lemonade with mint", price: 80, image_url: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&q=80", is_available: true, is_popular: false },

  // === Star Kabab ===
  { id: "m24", category_id: "c13", restaurant_id: "5", name: "Boti Kabab", description: "Tender marinated beef cubes grilled on skewers", price: 250, image_url: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80", is_available: true, is_popular: true },
  { id: "m25", category_id: "c13", restaurant_id: "5", name: "Reshmi Kabab", description: "Soft and juicy minced chicken kabab", price: 200, image_url: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&q=80", is_available: true, is_popular: true },
  { id: "m26", category_id: "c14", restaurant_id: "5", name: "Mixed Grill Platter", description: "Assortment of chicken tikka, boti, and seekh kabab with naan", price: 550, image_url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80", is_available: true, is_popular: true },
  { id: "m27", category_id: "c15", restaurant_id: "5", name: "Garlic Naan", description: "Soft tandoori naan with garlic butter", price: 60, image_url: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80", is_available: true, is_popular: false },

  // === Cafe Crimson ===
  { id: "m28", category_id: "c16", restaurant_id: "6", name: "Cappuccino", description: "Rich espresso with steamed milk foam", price: 180, image_url: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&q=80", is_available: true, is_popular: true },
  { id: "m29", category_id: "c16", restaurant_id: "6", name: "Iced Latte", description: "Smooth cold espresso with milk over ice", price: 200, image_url: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80", is_available: true, is_popular: true },
  { id: "m30", category_id: "c17", restaurant_id: "6", name: "Club Sandwich", description: "Triple-decker with chicken, egg, lettuce, and mayo", price: 250, image_url: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80", is_available: true, is_popular: false },
  { id: "m31", category_id: "c18", restaurant_id: "6", name: "Chocolate Brownie", description: "Warm fudgy brownie with vanilla ice cream", price: 220, image_url: "https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400&q=80", is_available: true, is_popular: true },

  // === Madchef ===
  { id: "m32", category_id: "c19", restaurant_id: "7", name: "Crispy Chicken (3pc)", description: "Golden fried chicken pieces with coleslaw", price: 250, image_url: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&q=80", is_available: true, is_popular: true },
  { id: "m33", category_id: "c19", restaurant_id: "7", name: "Spicy Wings (6pc)", description: "Hot and spicy buffalo wings with ranch dip", price: 220, image_url: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&q=80", is_available: true, is_popular: true },
  { id: "m34", category_id: "c20", restaurant_id: "7", name: "Chicken Shawarma Wrap", description: "Grilled chicken with garlic sauce in fresh tortilla", price: 180, image_url: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=400&q=80", is_available: true, is_popular: false },
  { id: "m35", category_id: "c21", restaurant_id: "7", name: "Chicken Meal Box", description: "2pc chicken, fries, coleslaw, and a drink", price: 350, image_url: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&q=80", is_available: true, is_popular: true },

  // === Khana's Kitchen ===
  { id: "m36", category_id: "c22", restaurant_id: "8", name: "Chicken Roast", description: "Whole roasted chicken in rich Bengali spice gravy", price: 350, image_url: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&q=80", is_available: true, is_popular: true },
  { id: "m37", category_id: "c22", restaurant_id: "8", name: "Mutton Curry", description: "Slow-cooked goat meat curry with traditional spices", price: 400, image_url: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80", is_available: true, is_popular: true },
  { id: "m38", category_id: "c23", restaurant_id: "8", name: "Hilsha Fish Curry", description: "National fish of Bangladesh in mustard sauce", price: 500, image_url: "https://images.unsplash.com/photo-1626776876729-bab4369a5a5a?w=400&q=80", is_available: true, is_popular: true },
  { id: "m39", category_id: "c23", restaurant_id: "8", name: "Rui Fish Fry", description: "Crispy fried Rohu fish with spices", price: 280, image_url: "https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=400&q=80", is_available: true, is_popular: false },
  { id: "m40", category_id: "c24", restaurant_id: "8", name: "Plain Rice", description: "Steamed basmati rice", price: 50, image_url: "https://images.unsplash.com/photo-1516684732162-798a0062be99?w=400&q=80", is_available: true, is_popular: false },
  { id: "m41", category_id: "c24", restaurant_id: "8", name: "Paratha (2pc)", description: "Flaky layered flatbread", price: 40, image_url: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80", is_available: true, is_popular: false },

  // === Dragon Palace ===
  { id: "m42", category_id: "c25", restaurant_id: "9", name: "Chow Mein", description: "Stir-fried egg noodles with chicken and vegetables", price: 250, image_url: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&q=80", is_available: true, is_popular: true },
  { id: "m43", category_id: "c25", restaurant_id: "9", name: "Pad Thai", description: "Thai-style rice noodles with shrimp and peanuts", price: 300, image_url: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&q=80", is_available: true, is_popular: false },
  { id: "m44", category_id: "c26", restaurant_id: "9", name: "Chicken Fried Rice", description: "Wok-fried rice with chicken, egg, and scallions", price: 220, image_url: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80", is_available: true, is_popular: true },
  { id: "m45", category_id: "c27", restaurant_id: "9", name: "Hot & Sour Soup", description: "Spicy and tangy soup with tofu and mushrooms", price: 150, image_url: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80", is_available: true, is_popular: false },

  // === The Burger Factory ===
  { id: "m46", category_id: "c28", restaurant_id: "10", name: "The Beast Burger", description: "Triple patty with triple cheese, bacon, and secret sauce", price: 480, image_url: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&q=80", is_available: true, is_popular: true },
  { id: "m47", category_id: "c28", restaurant_id: "10", name: "Mushroom Swiss Burger", description: "Beef patty with sautéed mushrooms and Swiss cheese", price: 350, image_url: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&q=80", is_available: true, is_popular: false },
  { id: "m48", category_id: "c29", restaurant_id: "10", name: "Truffle Fries", description: "Crispy fries with truffle oil and parmesan", price: 200, image_url: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80", is_available: true, is_popular: true },
  { id: "m49", category_id: "c30", restaurant_id: "10", name: "Oreo Milkshake", description: "Thick creamy shake blended with Oreo cookies", price: 180, image_url: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&q=80", is_available: true, is_popular: true },
];

export const cuisineTypes = [
  "All",
  "Bengali",
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
    const discountedPrice =
      raw.discount_percent > 0
        ? Math.round(raw.price * (1 - raw.discount_percent / 100))
        : raw.price;

    const item: MenuItem = {
      id: raw.id,
      category_id: raw.category,
      restaurant_id: raw.restaurant_id,
      name: raw.name,
      description: raw.description,
      price: discountedPrice,
      image_url: raw.image_url,
      is_available: raw.is_available,
      is_popular: false,
      discount_percent: raw.discount_percent,
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
