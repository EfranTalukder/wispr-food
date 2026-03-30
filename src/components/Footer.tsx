"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ClipboardList, Tag } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/offers", icon: Tag, label: "Offers" },
  { href: "/orders", icon: ClipboardList, label: "Orders" },
];

export default function Footer() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] sm:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center justify-center gap-1 flex-1 py-2 relative"
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
                )}
                <Icon
                  size={22}
                  className={isActive ? "text-primary" : "text-gray-400"}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                <span
                  className={`text-[11px] font-semibold ${
                    isActive ? "text-primary" : "text-gray-400"
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop footer */}
      <footer className="hidden sm:block border-t border-gray-100 mt-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between text-xs text-gray-400">
          <span>© {new Date().getFullYear()} Wispr Food</span>
          <div className="flex items-center gap-5">
            <Link href="/orders" className="hover:text-primary transition font-medium">
              My Orders
            </Link>
            <Link href="/restaurant-login" className="hover:text-primary transition font-medium">
              Restaurant Login →
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
