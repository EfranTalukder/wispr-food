-- ============================================================================
-- Wispr Panda — Single Admin Migration
-- ============================================================================
-- Run this in your Supabase project: SQL Editor → New query → paste → Run.
--
-- What it does:
--   1. Creates ONE admin user (ifran8413@gmail.com / ifran8413)
--   2. Reassigns all existing restaurants to that admin
--   3. Replaces per-owner RLS with admin-only write policies
--   4. Keeps public read access for customers
--
-- Safe to re-run: every step is idempotent.
-- ============================================================================

-- Required extension for bcrypt password hashing (Supabase has it by default,
-- but creating IF NOT EXISTS is safe).
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ───────────────────────────────────────────────────────────────────────────
-- STEP 1: Create the admin auth user (only if it doesn't already exist).
-- ───────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_admin_id uuid;
BEGIN
  SELECT id INTO v_admin_id
  FROM auth.users
  WHERE email = 'ifran8413@gmail.com';

  IF v_admin_id IS NULL THEN
    v_admin_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_admin_id,
      'authenticated',
      'authenticated',
      'ifran8413@gmail.com',
      crypt('ifran8413', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"role":"admin"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    -- Identity row required for email/password sign-in
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_admin_id,
      jsonb_build_object('sub', v_admin_id::text, 'email', 'ifran8413@gmail.com'),
      'email',
      'ifran8413@gmail.com',
      now(),
      now(),
      now()
    );

    RAISE NOTICE 'Created admin user: %', v_admin_id;
  ELSE
    -- Reset the password every run, so you always know what it is.
    UPDATE auth.users
       SET encrypted_password = crypt('ifran8413', gen_salt('bf')),
           email_confirmed_at = COALESCE(email_confirmed_at, now()),
           updated_at = now()
     WHERE id = v_admin_id;
    RAISE NOTICE 'Admin user already exists, password refreshed: %', v_admin_id;
  END IF;
END
$$;


-- ───────────────────────────────────────────────────────────────────────────
-- STEP 2: Reassign every existing restaurant to the admin.
-- ───────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_admin_id uuid;
BEGIN
  SELECT id INTO v_admin_id
  FROM auth.users
  WHERE email = 'ifran8413@gmail.com';

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Admin user not found — Step 1 must have failed.';
  END IF;

  UPDATE public.restaurants
     SET owner_id = v_admin_id
   WHERE owner_id IS DISTINCT FROM v_admin_id;
END
$$;


-- ───────────────────────────────────────────────────────────────────────────
-- STEP 3: Replace RLS policies — admin-only write, public read.
-- ───────────────────────────────────────────────────────────────────────────

-- Make sure RLS is enabled (no-op if already enabled).
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders      ENABLE ROW LEVEL SECURITY;

-- Drop any policies that may exist with the names we'll create or that match
-- the old per-owner model. Unknown old names are caught by the dynamic block.
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
-- Customers (anon or authenticated) can place orders.
CREATE POLICY "orders_anyone_can_insert"
  ON public.orders
  FOR INSERT
  WITH CHECK (true);

-- Admin (and signed-in customers / guests) can read orders. Read access is
-- left open so:
--   • guests can poll order status from the order-confirmation / orders page
--   • signed-in customers see their full order list
--   • admin sees everything
-- IDs are random and not enumerable in the UI, so this matches the previous
-- behavior of the app.
CREATE POLICY "orders_public_read"
  ON public.orders
  FOR SELECT
  USING (true);

-- Only admin can update orders (status changes).
CREATE POLICY "orders_admin_update"
  ON public.orders
  FOR UPDATE
  USING ((auth.jwt() ->> 'email') = 'ifran8413@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'ifran8413@gmail.com');

CREATE POLICY "orders_admin_delete"
  ON public.orders
  FOR DELETE
  USING ((auth.jwt() ->> 'email') = 'ifran8413@gmail.com');


-- ───────────────────────────────────────────────────────────────────────────
-- STEP 4: Storage policies for `food-images` bucket
-- ───────────────────────────────────────────────────────────────────────────
-- Public can read, only admin can upload / change / delete.
-- The bucket must already exist (create it in Supabase → Storage → New bucket
-- named `food-images`, set to Public).

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


-- ───────────────────────────────────────────────────────────────────────────
-- DONE. Verify with:
--   SELECT email FROM auth.users WHERE email = 'ifran8413@gmail.com';
--   SELECT count(*) FROM public.restaurants WHERE owner_id = (
--     SELECT id FROM auth.users WHERE email = 'ifran8413@gmail.com'
--   );
-- ───────────────────────────────────────────────────────────────────────────
