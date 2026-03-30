import { MenuCategory, MenuItem } from "@/types";
import MenuItemCard from "./MenuItem";

interface MenuSectionProps {
  category: MenuCategory & { items: MenuItem[] };
  restaurantId: string;
  restaurantName: string;
}

export default function MenuSection({ category, restaurantId, restaurantName }: MenuSectionProps) {
  if (category.items.length === 0) return null;

  return (
    <section>
      <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
        {category.name}
        <span className="text-sm font-normal text-gray-400">
          ({category.items.length})
        </span>
      </h3>
      <div className="space-y-3">
        {category.items.map((item) => (
          <MenuItemCard
            key={item.id}
            item={item}
            restaurantId={restaurantId}
            restaurantName={restaurantName}
          />
        ))}
      </div>
    </section>
  );
}
