"use client";

import { cuisineTypes } from "@/lib/data";

const CUISINE_ICONS: Record<string, string> = {
  All: "🍽️",
  Bengali: "🍛",
  Biryani: "🍚",
  Burger: "🍔",
  Pizza: "🍕",
  Chinese: "🥡",
  BBQ: "🍖",
  Cafe: "☕",
  "Fast Food": "🌮",
  Indian: "🥘",
  Thai: "🍜",
  Seafood: "🦐",
  Desserts: "🍰",
};

interface CategoryFilterProps {
  selected: string;
  onSelect: (cuisine: string) => void;
}

export default function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex gap-3 overflow-x-auto hide-scrollbar py-2 -mx-4 px-4">
      {cuisineTypes.map((cuisine) => {
        const isSelected = selected === cuisine;
        const emoji = CUISINE_ICONS[cuisine] ?? "🍴";
        return (
          <button
            key={cuisine}
            onClick={() => onSelect(cuisine)}
            className="flex flex-col items-center gap-1.5 shrink-0"
          >
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all shadow-sm ${
                isSelected
                  ? "bg-primary shadow-primary/30 scale-105"
                  : "bg-white border border-gray-100"
              }`}
            >
              {emoji}
            </div>
            <span
              className={`text-[11px] font-medium whitespace-nowrap ${
                isSelected ? "text-primary" : "text-gray-500"
              }`}
            >
              {cuisine}
            </span>
          </button>
        );
      })}
    </div>
  );
}
