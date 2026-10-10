-- ============================================================
-- SCANOVA — QUICK FIX: is_admin() + RLS Policies
-- Run this in Supabase SQL Editor if you hit:
--   ERROR 42883: function public.is_admin() does not exist
-- This script is SAFE to re-run on an existing database.
-- ============================================================

-- Step 1: Create (or replace) the is_admin() helper function.
-- Must be created BEFORE any RLS policy that calls it.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Ensure RLS is enabled on all tables
ALTER TABLE public.profiles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_detections          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barcode_tampering_detections ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop old policies and re-create them cleanly
-- (DROP IF EXISTS is idempotent — safe to run repeatedly)

-- === PUBLIC CATALOG (no login required) ===
DROP POLICY IF EXISTS "Allow public read brands"      ON public.brands;
CREATE POLICY "Allow public read brands"      ON public.brands      FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public read categories"  ON public.categories;
CREATE POLICY "Allow public read categories"  ON public.categories  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public read products"    ON public.products;
CREATE POLICY "Allow public read products"    ON public.products    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public read inventory"   ON public.inventory;
CREATE POLICY "Allow public read inventory"   ON public.inventory   FOR SELECT TO public USING (true);

-- === PROFILES ===
DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_own_profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_own_profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Allow admins to view all profiles
DROP POLICY IF EXISTS "admin_all_profiles" ON public.profiles;
CREATE POLICY "admin_all_profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (public.is_admin());

-- === CART ITEMS ===
DROP POLICY IF EXISTS "cart_own_items" ON public.cart_items;
CREATE POLICY "cart_own_items" ON public.cart_items
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- === ORDERS ===
DROP POLICY IF EXISTS "orders_own" ON public.orders;
CREATE POLICY "orders_own" ON public.orders
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- === ORDER ITEMS ===
DROP POLICY IF EXISTS "order_items_own" ON public.order_items;
CREATE POLICY "order_items_own" ON public.order_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
    OR public.is_admin()
  );

-- === PAYMENTS ===
DROP POLICY IF EXISTS "payments_own" ON public.payments;
CREATE POLICY "payments_own" ON public.payments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payments.order_id
        AND orders.user_id = auth.uid()
    )
    OR public.is_admin()
  );

-- === FRAUD DETECTIONS (admin-only write, own read) ===
DROP POLICY IF EXISTS "fraud_detections_own" ON public.fraud_detections;
CREATE POLICY "fraud_detections_own" ON public.fraud_detections
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- === BARCODE TAMPERING (admin-only write, own read) ===
DROP POLICY IF EXISTS "tampering_own" ON public.barcode_tampering_detections;
CREATE POLICY "tampering_own" ON public.barcode_tampering_detections
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- ============================================================
-- GRANT ADMIN ROLE TO YOUR ACCOUNT
-- After running this script, set yourself as admin by running:
--
--   UPDATE public.profiles
--   SET role = 'admin'
--   WHERE email = 'your-email@example.com';
--
-- Then sign out and sign back in to the app.
-- ============================================================
