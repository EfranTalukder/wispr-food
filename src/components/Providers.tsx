"use client";

import { ReactNode } from "react";
import { CartProvider } from "@/contexts/CartContext";
import { LocationProvider } from "@/contexts/LocationContext";
import LocationModal from "@/components/LocationModal";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <LocationProvider>
      <CartProvider>
        {children}
        <LocationModal />
      </CartProvider>
    </LocationProvider>
  );
}
