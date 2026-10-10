-- ========================================================
-- SCANOVA COMPLETE DATABASE RESTORATION & SCHEMAS MIGRATION
-- (Restores schema + data from db_cluster-18-09-2026 backup)
-- ========================================================

-- STEP 1: Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- STEP 2: Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure role column exists if table pre-existed
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer';
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);

-- Automatic Profile Creation Trigger
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function: check if the current user is an admin
-- Defined here (before any RLS policies) so all policies can safely reference it.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 3: Brands Table
CREATE TABLE IF NOT EXISTS public.brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  glow TEXT NOT NULL,
  gradient TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- STEP 4: Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- STEP 5: Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  barcode TEXT,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  brand_id TEXT REFERENCES public.brands(id) ON DELETE SET NULL,
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  size TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- STEP 6: Inventory Table
CREATE TABLE IF NOT EXISTS public.inventory (
  product_id TEXT PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  stock INTEGER NOT NULL DEFAULT 20 CHECK (stock >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- STEP 7: Cart Items Table
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

-- STEP 8: Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  gst DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'completed',
  qr_token TEXT UNIQUE,
  qr_scan_count INTEGER NOT NULL DEFAULT 0,
  first_scanned_at TIMESTAMPTZ,
  last_scanned_at TIMESTAMPTZ,
  exit_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- STEP 9: Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL,
  size TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- STEP 10: Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  transaction_id TEXT UNIQUE NOT NULL,
  receipt_number TEXT UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- STEP 11: Fraud Detections Table
CREATE TABLE IF NOT EXISTS public.fraud_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  risk_score FLOAT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  risk_factors JSONB NOT NULL DEFAULT '{}'::jsonb,
  action_taken TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- STEP 12: Barcode Tampering Detections Table
CREATE TABLE IF NOT EXISTS public.barcode_tampering_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  username TEXT,
  order_id TEXT,
  barcode TEXT,
  tampering_score NUMERIC,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  tampering_detected BOOLEAN NOT NULL,
  tampering_type TEXT,
  model_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================================
-- SEED RECOVERED DATA
-- ========================================================

-- Seed Brands
INSERT INTO public.brands (id, name, color, glow, gradient) VALUES
('nike', 'Nike', '#8B5CF6', 'rgba(139, 92, 246, 0.5)', 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.03))'),
('adidas', 'Adidas', '#00D4FF', 'rgba(0, 212, 255, 0.5)', 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,212,255,0.03))'),
('puma', 'Puma', '#EC4899', 'rgba(236, 72, 153, 0.5)', 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(236,72,153,0.03))'),
('zara', 'Zara', '#6B7280', 'rgba(107, 114, 128, 0.5)', 'linear-gradient(135deg, rgba(107,114,128,0.15), rgba(107,114,128,0.03))'),
('hm', 'H&M', '#EF4444', 'rgba(239, 68, 68, 0.5)', 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.03))'),
('levis', 'Levi''s', '#F97316', 'rgba(249, 115, 22, 0.5)', 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.03))'),
('gucci', 'Gucci', '#10B981', 'rgba(16, 185, 129, 0.5)', 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.03))'),
('louisvuitton', 'Louis Vuitton', '#EAB308', 'rgba(234, 179, 8, 0.5)', 'linear-gradient(135deg, rgba(234,179,8,0.15), rgba(234,179,8,0.03))'),
('uniqlo', 'Uniqlo', '#D946EF', 'rgba(217, 70, 239, 0.5)', 'linear-gradient(135deg, rgba(217,70,239,0.15), rgba(217,70,239,0.03))'),
('tommy', 'Tommy Hilfiger', '#4F46E5', 'rgba(79, 70, 229, 0.5)', 'linear-gradient(135deg, rgba(79,70,229,0.15), rgba(79,70,229,0.03))'),
('calvinklein', 'Calvin Klein', '#94A3B8', 'rgba(148, 163, 184, 0.5)', 'linear-gradient(135deg, rgba(148,163,184,0.15), rgba(148,163,184,0.03))'),
('mango', 'Mango', '#FB923C', 'rgba(251, 146, 60, 0.5)', 'linear-gradient(135deg, rgba(251,146,60,0.15), rgba(251,146,60,0.03))'),
('underarmour', 'Under Armour', '#3B82F6', 'rgba(59, 130, 246, 0.5)', 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.03))'),
('reebok', 'Reebok', '#F97316', 'rgba(249, 115, 22, 0.5)', 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.03))')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Seed Categories
INSERT INTO public.categories (id, name, description) VALUES
('footwear', 'Footwear', 'Sneakers, loafers, and athletic shoes'),
('outerwear', 'Outerwear', 'Hoodies, jackets, blazers, and coats'),
('tops', 'Tops & Shirts', 'T-shirts, polo shirts, and casual shirts'),
('bottoms', 'Bottoms & Pants', 'Jeans, joggers, trousers, and shorts'),
('accessories', 'Accessories', 'Belts, bags, dresses, and essentials')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Seed All 40 Recovered Products
INSERT INTO public.products (id, barcode, name, brand, brand_id, category_id, size, price, image) VALUES
('1001', '1001', 'Air Max 90', 'Nike', 'nike', 'footwear', 'US 8', 12999.00, 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1002', '1002', 'Dunk Low Retro', 'Nike', 'nike', 'footwear', 'US 9', 10999.00, 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1003', '1003', 'Tech Fleece Hoodie', 'Nike', 'nike', 'outerwear', 'M', 8999.00, 'https://images.pexels.com/photos/1021295/pexels-photo-1021295.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1004', '1004', 'Ultraboost 22', 'Adidas', 'adidas', 'footwear', 'US 10', 18999.00, 'https://images.pexels.com/photos/1598508/pexels-photo-1598508.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1005', '1005', 'Trefoil Hoodie', 'Adidas', 'adidas', 'outerwear', 'L', 6499.00, 'https://images.pexels.com/photos/1021295/pexels-photo-1021295.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1006', '1006', '3-Stripe Joggers', 'Adidas', 'adidas', 'bottoms', 'M', 5499.00, 'https://images.pexels.com/photos/4211250/pexels-photo-4211250.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1007', '1007', 'RS-X Reinvention', 'Puma', 'puma', 'footwear', 'US 9', 11999.00, 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1008', '1008', 'Suede Classic XXI', 'Puma', 'puma', 'footwear', 'US 8', 7499.00, 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1009', '1009', 'Cropped Logo Tee', 'Puma', 'puma', 'tops', 'S', 3499.00, 'https://images.pexels.com/photos/5698851/pexels-photo-5698851.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1010', '1010', 'Oversized Blazer', 'Zara', 'zara', 'outerwear', 'L', 14999.00, 'https://images.pexels.com/photos/7691105/pexels-photo-7691105.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1011', '1011', 'Wide Leg Trousers', 'Zara', 'zara', 'bottoms', 'M', 5999.00, 'https://images.pexels.com/photos/4211250/pexels-photo-4211250.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1012', '1012', 'Ribbed Knit Dress', 'Zara', 'zara', 'accessories', 'S', 7999.00, 'https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1013', '1013', 'Oversized Hoodie', 'H&M', 'hm', 'outerwear', 'XL', 4999.00, 'https://images.pexels.com/photos/1021295/pexels-photo-1021295.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1014', '1014', 'Slim Fit Jeans', 'H&M', 'hm', 'bottoms', '32', 3999.00, 'https://images.pexels.com/photos/4211250/pexels-photo-4211250.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1015', '1015', 'Linen Shirt', 'H&M', 'hm', 'tops', 'M', 2999.00, 'https://images.pexels.com/photos/7691105/pexels-photo-7691105.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1016', '1016', '501 Original Fit', 'Levi''s', 'levis', 'bottoms', '30x32', 6999.00, 'https://images.pexels.com/photos/4211250/pexels-photo-4211250.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1017', '1017', '511 Slim Fit', 'Levi''s', 'levis', 'bottoms', '32x34', 7999.00, 'https://images.pexels.com/photos/4211250/pexels-photo-4211250.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1018', '1018', 'Trucker Jacket', 'Levi''s', 'levis', 'outerwear', 'M', 8999.00, 'https://images.pexels.com/photos/7691105/pexels-photo-7691105.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1019', '1019', 'Ace Sneakers', 'Gucci', 'gucci', 'footwear', 'US 10', 73000.00, 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1020', '1020', 'GG Marmont Belt', 'Gucci', 'gucci', 'accessories', '85', 49000.00, 'https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1021', '1021', 'Horsebit Loafers', 'Gucci', 'gucci', 'footwear', 'US 9', 92000.00, 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1022', '1022', 'LV Trainer Sneaker', 'Louis Vuitton', 'louisvuitton', 'footwear', 'US 11', 115000.00, 'https://images.pexels.com/photos/1598508/pexels-photo-1598508.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1023', '1023', 'Monogram Keepall', 'Louis Vuitton', 'louisvuitton', 'accessories', '50', 205000.00, 'https://images.pexels.com/photos/2905238/pexels-photo-2905238.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1024', '1024', 'LV x NMEA Hoodie', 'Louis Vuitton', 'louisvuitton', 'outerwear', 'L', 89000.00, 'https://images.pexels.com/photos/1021295/pexels-photo-1021295.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1025', '1025', 'Ultra Light Down Jacket', 'Uniqlo', 'uniqlo', 'outerwear', 'M', 7999.00, 'https://images.pexels.com/photos/7691105/pexels-photo-7691105.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1026', '1026', 'Supima Cotton Tee', 'Uniqlo', 'uniqlo', 'tops', 'L', 1999.00, 'https://images.pexels.com/photos/5698851/pexels-photo-5698851.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1027', '1027', 'Selvedge Slim Jeans', 'Uniqlo', 'uniqlo', 'bottoms', '32', 4999.00, 'https://images.pexels.com/photos/4211250/pexels-photo-4211250.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1028', '1028', 'Hilfiger Club Sweater', 'Tommy Hilfiger', 'tommy', 'outerwear', 'M', 8999.00, 'https://images.pexels.com/photos/1021295/pexels-photo-1021295.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1029', '1029', 'Essential Polo', 'Tommy Hilfiger', 'tommy', 'tops', 'L', 6999.00, 'https://images.pexels.com/photos/5698851/pexels-photo-5698851.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1030', '1030', 'Logo Chino Shorts', 'Tommy Hilfiger', 'tommy', 'bottoms', '34', 5499.00, 'https://images.pexels.com/photos/4211250/pexels-photo-4211250.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1031', '1031', 'Modern Slim Shirt', 'Calvin Klein', 'calvinklein', 'tops', 'M', 5999.00, 'https://images.pexels.com/photos/7691105/pexels-photo-7691105.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1032', '1032', 'Logo Waistband Boxer 3-Pack', 'Calvin Klein', 'calvinklein', 'accessories', 'M', 2999.00, 'https://images.pexels.com/photos/5698851/pexels-photo-5698851.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1033', '1033', 'Denim Trucker Jacket', 'Calvin Klein', 'calvinklein', 'outerwear', 'L', 9999.00, 'https://images.pexels.com/photos/7691105/pexels-photo-7691105.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1034', '1034', 'Wrap Midi Dress', 'Mango', 'mango', 'accessories', 'S', 6999.00, 'https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1035', '1035', 'Linen Blend Trousers', 'Mango', 'mango', 'bottoms', 'M', 4999.00, 'https://images.pexels.com/photos/4211250/pexels-photo-4211250.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1036', '1036', 'Cropped Blazer', 'Mango', 'mango', 'outerwear', '38', 8999.00, 'https://images.pexels.com/photos/7691105/pexels-photo-7691105.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1037', '1037', 'HOVR Phantom 2', 'Under Armour', 'underarmour', 'footwear', 'US 10', 15999.00, 'https://images.pexels.com/photos/1598508/pexels-photo-1598508.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1038', '1038', 'Tech 2.0 Tee', 'Under Armour', 'underarmour', 'tops', 'L', 2499.00, 'https://images.pexels.com/photos/5698851/pexels-photo-5698851.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1039', '1039', 'Storm Insulated Jacket', 'Under Armour', 'underarmour', 'outerwear', 'XL', 12999.00, 'https://images.pexels.com/photos/7691105/pexels-photo-7691105.jpeg?auto=compress&cs=tinysrgb&w=600'),
('1040', '1040', 'Classic Leather', 'Reebok', 'reebok', 'footwear', 'US 9', 7999.00, 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=600')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  image = EXCLUDED.image;

-- Seed Inventory Stock
INSERT INTO public.inventory (product_id, stock) VALUES
('1001', 20), ('1002', 20), ('1003', 20), ('1004', 20), ('1005', 20),
('1006', 20), ('1007', 20), ('1008', 20), ('1009', 20), ('1010', 20),
('1011', 20), ('1012', 20), ('1013', 20), ('1014', 20), ('1015', 20),
('1016', 20), ('1017', 20), ('1018', 20), ('1019', 20), ('1020', 20),
('1021', 20), ('1022', 20), ('1023', 20), ('1024', 20), ('1025', 20),
('1026', 20), ('1027', 20), ('1028', 20), ('1029', 20), ('1030', 20),
('1031', 20), ('1032', 20), ('1033', 20), ('1034', 20), ('1035', 20),
('1036', 20), ('1037', 20), ('1038', 20), ('1039', 20), ('1040', 20)
ON CONFLICT (product_id) DO NOTHING;

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barcode_tampering_detections ENABLE ROW LEVEL SECURITY;

-- Public Read Catalog Policies
DROP POLICY IF EXISTS "Allow public read brands" ON public.brands;
CREATE POLICY "Allow public read brands" ON public.brands FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public read categories" ON public.categories;
CREATE POLICY "Allow public read categories" ON public.categories FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public read products" ON public.products;
CREATE POLICY "Allow public read products" ON public.products FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public read inventory" ON public.inventory;
CREATE POLICY "Allow public read inventory" ON public.inventory FOR SELECT TO public USING (true);

-- Customer Own Data Policies
DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_own_profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_own_profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "cart_own_items" ON public.cart_items;
CREATE POLICY "cart_own_items" ON public.cart_items FOR ALL TO authenticated USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "orders_own" ON public.orders;
CREATE POLICY "orders_own" ON public.orders FOR ALL TO authenticated USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "order_items_own" ON public.order_items;
CREATE POLICY "order_items_own" ON public.order_items FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()) OR public.is_admin()
);

DROP POLICY IF EXISTS "payments_own" ON public.payments;
CREATE POLICY "payments_own" ON public.payments FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = payments.order_id AND orders.user_id = auth.uid()) OR public.is_admin()
);
