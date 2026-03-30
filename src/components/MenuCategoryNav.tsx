"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  categories: { id: string; name: string }[];
}

export default function MenuCategoryNav({ categories }: Props) {
  const [active, setActive] = useState(categories[0]?.id ?? "");
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    categories.forEach(({ id }) => {
      const el = document.getElementById(`cat-${id}`);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id);
        },
        { rootMargin: "-40% 0px -55% 0px" }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [categories]);

  function scrollTo(id: string) {
    const el = document.getElementById(`cat-${id}`);
    if (el) {
      const offset = 120;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
    setActive(id);
  }

  useEffect(() => {
    const activeBtn = navRef.current?.querySelector(`[data-id="${active}"]`) as HTMLElement;
    activeBtn?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [active]);

  if (categories.length <= 1) return null;

  return (
    <div className="sticky top-16 z-30 bg-white border-b border-gray-100 shadow-sm">
      <div
        ref={navRef}
        className="flex gap-1 overflow-x-auto hide-scrollbar px-4 py-2"
      >
        {categories.map(({ id, name }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              data-id={id}
              onClick={() => scrollTo(id)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
