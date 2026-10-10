-- Migration: Add Role Column & Admin Access RLS Policies
-- Timestamp: 20261010000000

-- ============================================================================
-- 1. Add role column to profiles table
-- ============================================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer'
  CHECK (role IN ('customer', 'admin'));

-- Create index on role for quick lookups
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);

-- ============================================================================
-- 2. Update handle_new_user trigger function to include role
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'customer')
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    role = COALESCE(public.profiles.role, EXCLUDED.role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. Row Level Security Policies for Admin Access
-- ============================================================================

-- Helper function to check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin Read Policies
DROP POLICY IF EXISTS "Allow admins full read access to profiles" ON public.profiles;
CREATE POLICY "Allow admins full read access to profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Allow admins full read access to orders" ON public.orders;
CREATE POLICY "Allow admins full read access to orders" ON public.orders
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Allow admins full read access to order_items" ON public.order_items;
CREATE POLICY "Allow admins full read access to order_items" ON public.order_items
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Allow admins full read access to payments" ON public.payments;
CREATE POLICY "Allow admins full read access to payments" ON public.payments
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Allow admins full read access to scan_events" ON public.scan_events;
CREATE POLICY "Allow admins full read access to scan_events" ON public.scan_events
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Allow admins full read access to exit_verifications" ON public.exit_verifications;
CREATE POLICY "Allow admins full read access to exit_verifications" ON public.exit_verifications
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Allow admins full read access to fraud_detections" ON public.fraud_detections;
CREATE POLICY "Allow admins full read access to fraud_detections" ON public.fraud_detections
  FOR SELECT TO authenticated USING (public.is_admin());
