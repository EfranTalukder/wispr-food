"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface LocationContextType {
  location: string;
  setLocation: (loc: string) => void;
  detecting: boolean;
  detectLocation: () => Promise<void>;
  modalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const LocationContext = createContext<LocationContextType>({
  location: "Washington, DC",
  setLocation: () => {},
  detecting: false,
  detectLocation: async () => {},
  modalOpen: false,
  openModal: () => {},
  closeModal: () => {},
});

export function useLocation() {
  return useContext(LocationContext);
}

const STORAGE_KEY = "wispr_location";
const HISTORY_KEY = "wispr_location_history";
const DEFAULT = "Washington, DC";

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocationState] = useState(DEFAULT);
  const [detecting, setDetecting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setLocationState(saved);
  }, []);

  function setLocation(loc: string) {
    const trimmed = loc.trim() || DEFAULT;
    setLocationState(trimmed);
    localStorage.setItem(STORAGE_KEY, trimmed);

    // Keep last 5 unique addresses in history
    const raw = localStorage.getItem(HISTORY_KEY);
    const history: string[] = raw ? JSON.parse(raw) : [];
    const updated = [trimmed, ...history.filter((h) => h !== trimmed)].slice(0, 5);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  }

  async function detectLocation() {
    if (!navigator.geolocation) return;
    setDetecting(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
      );
      const { latitude, longitude } = pos.coords;

      // Reverse geocode using OpenStreetMap Nominatim (free, no API key)
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      const addr = data.address;

      // Build a short readable label
      const label =
        [
          addr.neighbourhood || addr.suburb || addr.quarter,
          addr.city || addr.town || addr.village || addr.county,
          addr.state,
        ]
          .filter(Boolean)
          .slice(0, 2)
          .join(", ") || DEFAULT;

      setLocation(label);
    } catch {
      // Silently fail — user can type manually
    } finally {
      setDetecting(false);
    }
  }

  return (
    <LocationContext.Provider
      value={{
        location,
        setLocation,
        detecting,
        detectLocation,
        modalOpen,
        openModal: () => setModalOpen(true),
        closeModal: () => setModalOpen(false),
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function getLocationHistory(): string[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}
