-- ============================================================================
-- Wispr Panda — Menu Item Sizes
-- ============================================================================
-- Adds an optional `sizes` JSONB column to `menu_items` so a single menu item
-- can offer multiple size variants (e.g. Sm / Md / Lg / XL) each with their
-- own price.
--
-- Run this in your Supabase project: SQL Editor → New query → paste → Run.
-- Safe to re-run (idempotent).
--
-- Shape of the JSONB value:
--   [
--     { "label": "Sm", "price": 10 },
--     { "label": "Md", "price": 15 },
--     { "label": "Lg", "price": 20 }
--   ]
-- An empty array `[]` means "no size variants — use the base price".
-- ============================================================================

ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS sizes jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Backfill: ensure existing rows where the column is somehow NULL become [].
UPDATE public.menu_items
   SET sizes = '[]'::jsonb
 WHERE sizes IS NULL;

-- Optional sanity check (uncomment to inspect):
--   SELECT id, name, sizes FROM public.menu_items LIMIT 5;
