"use client";

import { cuisineTypes } from "@/lib/data";

interface CategoryFilterProps {
  selected: string;
  onSelect: (cuisine: string) => void;
}

export default function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar py-1">
      {cuisineTypes.map((cuisine) => (
        <button
          key={cuisine}
          onClick={() => onSelect(cuisine)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            selected === cuisine
              ? "bg-primary text-white shadow-md"
              : "bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary"
          }`}
        >
          {cuisine}
        </button>
      ))}
    </div>
  );
}
