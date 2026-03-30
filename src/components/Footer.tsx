import Link from "next/link";
import { Home, Search, Clock, User } from "lucide-react";

export default function Footer() {
  return (
    <>
      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 sm:hidden">
        <div className="flex items-center justify-around h-14">
          <Link href="/" className="flex flex-col items-center gap-0.5 text-primary">
            <Home size={20} />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          <Link href="/search" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-primary transition">
            <Search size={20} />
            <span className="text-[10px] font-medium">Search</span>
          </Link>
          <Link href="/" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-primary transition">
            <Clock size={20} />
            <span className="text-[10px] font-medium">Orders</span>
          </Link>
          <Link href="/" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-primary transition">
            <User size={20} />
            <span className="text-[10px] font-medium">Profile</span>
          </Link>
        </div>
      </nav>

      {/* Desktop footer */}
      <footer className="hidden sm:block border-t border-gray-100 mt-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between text-xs text-gray-400">
          <span>© {new Date().getFullYear()} Wispr Food</span>
          <Link
            href="/restaurant-login"
            className="hover:text-primary transition font-medium"
          >
            Restaurant Login →
          </Link>
        </div>
      </footer>
    </>
  );
}
