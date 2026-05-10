-- ============================================================================
-- Wispr Panda — RLS Policies (slim version)
-- ============================================================================
-- Admin user + restaurant reassignment were already done via API.
-- This file ONLY sets up Row Level Security so admin can write and customers
-- can still read. Paste this into Supabase → SQL Editor → New query → Run.
--
-- Safe to re-run: drops existing policies before creating new ones.
-- ============================================================================

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders      ENABLE ROW LEVEL SECURITY;

-- Drop every existing policy on these three tables so we start clean.
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename IN ('restaurants', 'menu_items', 'orders')
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      pol.policyname, pol.schemaname, pol.tablename
    );
  END LOOP;
END
$$;

-- ── restaurants ───────────────────────────────────────────────────────────
CREATE POLICY "restaurants_public_read"
  ON public.restaurants
  FOR SELECT
  USING (
    is_open = true
    OR (auth.jwt() ->> 'email') = 'ifran8413@gmail.com'
  );

CREATE POLICY "restaurants_admin_all"
  ON public.restaurants
  FOR ALL
  USING ((auth.jwt() ->> 'email') = 'ifran8413@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'ifran8413@gmail.com');

-- ── menu_items ────────────────────────────────────────────────────────────
CREATE POLICY "menu_items_public_read"
  ON public.menu_items
  FOR SELECT
  USING (
    is_available = true
    OR (auth.jwt() ->> 'email') = 'ifran8413@gmail.com'
  );

CREATE POLICY "menu_items_admin_all"
  ON public.menu_items
  FOR ALL
  USING ((auth.jwt() ->> 'email') = 'ifran8413@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'ifran8413@gmail.com');

-- ── orders ────────────────────────────────────────────────────────────────
CREATE POLICY "orders_anyone_can_insert"
  ON public.orders
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "orders_public_read"
  ON public.orders
  FOR SELECT
  USING (true);

CREATE POLICY "orders_admin_update"
  ON public.orders
  FOR UPDATE
  USING ((auth.jwt() ->> 'email') = 'ifran8413@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'ifran8413@gmail.com');

CREATE POLICY "orders_admin_delete"
  ON public.orders
  FOR DELETE
  USING ((auth.jwt() ->> 'email') = 'ifran8413@gmail.com');


-- ── storage.objects (food-images bucket) ──────────────────────────────────
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
      FROM pg_policies
     WHERE schemaname = 'storage'
       AND tablename  = 'objects'
       AND policyname IN (
         'food_images_public_read',
         'food_images_admin_write',
         'food_images_admin_update',
         'food_images_admin_delete'
       )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END
$$;

CREATE POLICY "food_images_public_read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'food-images');

CREATE POLICY "food_images_admin_write"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'food-images'
    AND (auth.jwt() ->> 'email') = 'ifran8413@gmail.com'
  );

CREATE POLICY "food_images_admin_update"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'food-images'
    AND (auth.jwt() ->> 'email') = 'ifran8413@gmail.com'
  );

CREATE POLICY "food_images_admin_delete"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'food-images'
    AND (auth.jwt() ->> 'email') = 'ifran8413@gmail.com'
  );
