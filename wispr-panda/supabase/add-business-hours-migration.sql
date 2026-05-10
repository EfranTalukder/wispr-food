-- Add business_hours JSONB column to restaurants table
-- Stores per-day open/close times: { monday: { enabled, open, close }, ... }

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS business_hours JSONB;
