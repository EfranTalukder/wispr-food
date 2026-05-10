"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, Clock, X, ChevronRight, Loader2 } from "lucide-react";
import { useLocation, getLocationHistory } from "@/contexts/LocationContext";

export default function LocationModal() {
  const { modalOpen, closeModal, location, setLocation, detecting, detectLocation } =
    useLocation();
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (modalOpen) {
      setInput("");
      setHistory(getLocationHistory());
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [modalOpen]);

  function handleSave() {
    if (input.trim()) {
      setLocation(input.trim());
    }
    closeModal();
  }

  function handleSelect(addr: string) {
    setLocation(addr);
    closeModal();
  }

  async function handleDetect() {
    await detectLocation();
    closeModal();
  }

  if (!modalOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={closeModal}
      />

      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col sm:rounded-3xl sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md sm:w-full sm:max-h-[90vh]">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">Deliver to</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[220px]">
              Currently: {location}
            </p>
          </div>
          <button
            onClick={closeModal}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Use my location button */}
          <button
            onClick={handleDetect}
            disabled={detecting}
            className="w-full flex items-center gap-3 p-4 border-2 border-primary/20 bg-primary/5 rounded-2xl active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
              {detecting ? (
                <Loader2 size={18} className="text-white animate-spin" />
              ) : (
                <Navigation size={18} className="text-white" />
              )}
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900 text-sm">
                {detecting ? "Detecting your location…" : "Use my current location"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Allow location access for best results
              </p>
            </div>
          </button>

          {/* Manual address input */}
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">
              Or enter address
            </p>
            <div className="relative">
              <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                placeholder="e.g. 123 Main St, Georgetown"
                className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary transition"
              />
            </div>
            {input.trim() && (
              <button
                onClick={handleSave}
                className="w-full mt-3 bg-primary text-white font-semibold py-3.5 rounded-2xl active:scale-[0.98] transition-transform shadow-md shadow-primary/20"
              >
                Set Delivery Address
              </button>
            )}
          </div>

          {/* Recent addresses */}
          {history.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">
                Recent
              </p>
              <div className="space-y-1">
                {history.map((addr) => (
                  <button
                    key={addr}
                    onClick={() => handleSelect(addr)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition text-left"
                  >
                    <Clock size={16} className="text-gray-400 shrink-0" />
                    <span className="flex-1 text-sm text-gray-700 truncate">{addr}</span>
                    <ChevronRight size={15} className="text-gray-300 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
