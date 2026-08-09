-- =============================================================
-- SWZ Pass Manager — Supabase Schema & Complete Data Seed
-- Run this entire file in: Supabase Dashboard → SQL Editor
-- =============================================================

-- Enable pgcrypto for user creation hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- --------------------------------------------------------
-- SECTION 1: Clean up (idempotent re-run safety)
-- --------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_password_entries_updated_at ON public.password_entries;
DROP TRIGGER IF EXISTS update_employees_updated_at ON public.employees;
DROP TRIGGER IF EXISTS update_sites_updated_at ON public.sites;
DROP TRIGGER IF EXISTS update_site_credentials_updated_at ON public.site_credentials;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

DROP TABLE IF EXISTS public.site_credentials CASCADE;
DROP TABLE IF EXISTS public.sites CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.password_entries CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.password_strength CASCADE;

-- --------------------------------------------------------
-- SECTION 2: Types / Enums
-- --------------------------------------------------------

CREATE TYPE public.user_role AS ENUM ('root', 'admin', 'viewer');
CREATE TYPE public.password_strength AS ENUM ('weak', 'medium', 'strong');

-- --------------------------------------------------------
-- SECTION 3: Helper Functions
-- --------------------------------------------------------

-- Auto-update updated_at column
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check if current user has admin/root role (used in RLS policies)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'root')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- --------------------------------------------------------
-- SECTION 4: Tables
-- --------------------------------------------------------

-- ---- 4.1 profiles ----
-- Linked 1:1 to auth.users. Stores role and display info.

CREATE TABLE public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username     TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar       TEXT NOT NULL DEFAULT 'U',
  role         public.user_role NOT NULL DEFAULT 'viewer',
  email        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- ---- 4.2 password_entries ----
-- Company password vault — all credential entries.

CREATE TABLE public.password_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website     TEXT NOT NULL,
  url         TEXT NOT NULL DEFAULT '',
  username    TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL DEFAULT '',
  password    TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'Other',
  favorite    BOOLEAN NOT NULL DEFAULT FALSE,
  notes       TEXT NOT NULL DEFAULT '',
  strength    public.password_strength NOT NULL DEFAULT 'weak',
  tags        TEXT[] NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_password_entries_category ON public.password_entries(category);
CREATE INDEX idx_password_entries_favorite ON public.password_entries(favorite);
CREATE INDEX idx_password_entries_strength ON public.password_entries(strength);
CREATE INDEX idx_password_entries_website  ON public.password_entries(website);

-- ---- 4.3 employees ----

CREATE TABLE public.employees (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL,
  dob                DATE,
  image_path         TEXT NOT NULL DEFAULT '',   -- Supabase Storage path
  offer_letter_path  TEXT NOT NULL DEFAULT '',   -- Supabase Storage path
  notes              TEXT NOT NULL DEFAULT '',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_employees_name ON public.employees(name);

-- ---- 4.4 sites ----

CREATE TABLE public.sites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  url         TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sites_name ON public.sites(name);

-- ---- 4.5 site_credentials ----

CREATE TABLE public.site_credentials (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id        UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  cred_type      TEXT NOT NULL DEFAULT 'normal' CHECK (cred_type IN ('normal', 'admin')),
  username       TEXT NOT NULL DEFAULT '',
  email          TEXT NOT NULL DEFAULT '',
  password       TEXT NOT NULL,
  admin_page_url TEXT NOT NULL DEFAULT '',  -- Only relevant for admin cred_type
  notes          TEXT NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_site_credentials_site_id   ON public.site_credentials(site_id);
CREATE INDEX idx_site_credentials_cred_type ON public.site_credentials(cred_type);

-- --------------------------------------------------------
-- SECTION 5: updated_at Triggers
-- --------------------------------------------------------

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER update_password_entries_updated_at
  BEFORE UPDATE ON public.password_entries
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER update_sites_updated_at
  BEFORE UPDATE ON public.sites
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER update_site_credentials_updated_at
  BEFORE UPDATE ON public.site_credentials
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- --------------------------------------------------------
-- SECTION 6: Auto-create profile on new auth user
-- --------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role      public.user_role := 'viewer';
  v_name      TEXT;
  v_avatar    TEXT;
BEGIN
  -- Auto-assign root role to known admin emails
  IF NEW.email IN ('management.swz@gmail.com', 'secureworldz.official@gmail.com') THEN
    v_role := 'root';
  END IF;

  -- Sensible display name from email prefix or raw_user_meta_data
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    CASE
      WHEN NEW.email = 'management.swz@gmail.com'        THEN 'Mohamed'
      WHEN NEW.email = 'secureworldz.official@gmail.com' THEN 'Jaiganesh'
      ELSE initcap(split_part(NEW.email, '@', 1))
    END
  );

  v_avatar := upper(left(v_name, 1));

  INSERT INTO public.profiles (id, username, display_name, avatar, role, email)
  VALUES (
    NEW.id,
    split_part(NEW.email, '@', 1),
    v_name,
    v_avatar,
    v_role,
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- --------------------------------------------------------
-- SECTION 7: Row Level Security
-- --------------------------------------------------------

ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_entries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_credentials  ENABLE ROW LEVEL SECURITY;

-- ---- profiles RLS ----

CREATE POLICY "Authenticated users can read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- ---- password_entries RLS ----

CREATE POLICY "Authenticated users can read password entries"
  ON public.password_entries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert password entries"
  ON public.password_entries FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update password entries"
  ON public.password_entries FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete password entries"
  ON public.password_entries FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ---- employees RLS ----

CREATE POLICY "Authenticated users can read employees"
  ON public.employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert employees"
  ON public.employees FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update employees"
  ON public.employees FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete employees"
  ON public.employees FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ---- sites RLS ----

CREATE POLICY "Authenticated users can read sites"
  ON public.sites FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert sites"
  ON public.sites FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update sites"
  ON public.sites FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete sites"
  ON public.sites FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ---- site_credentials RLS ----

CREATE POLICY "Authenticated users can read site credentials"
  ON public.site_credentials FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert site credentials"
  ON public.site_credentials FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update site credentials"
  ON public.site_credentials FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete site credentials"
  ON public.site_credentials FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- --------------------------------------------------------
-- SECTION 8: Supabase Storage Buckets & Policies
-- --------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('employee-images',        'employee-images',        false, 5242880,  ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('employee-offer-letters', 'employee-offer-letters', false, 10485760, ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: employee-images
CREATE POLICY "Authenticated users can view employee images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'employee-images');

CREATE POLICY "Admins can upload employee images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'employee-images' AND public.is_admin());

CREATE POLICY "Admins can update employee images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'employee-images' AND public.is_admin());

CREATE POLICY "Admins can delete employee images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'employee-images' AND public.is_admin());

-- Storage RLS: employee-offer-letters
CREATE POLICY "Authenticated users can view offer letters"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'employee-offer-letters');

CREATE POLICY "Admins can upload offer letters"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'employee-offer-letters' AND public.is_admin());

CREATE POLICY "Admins can update offer letters"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'employee-offer-letters' AND public.is_admin());

CREATE POLICY "Admins can delete offer letters"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'employee-offer-letters' AND public.is_admin());

-- --------------------------------------------------------
-- SECTION 9: Seed Auth Users (Migrated from auth.json)
-- --------------------------------------------------------

-- User 1: Mohamed (management.swz@gmail.com / _mohamed@jangu)
-- User 2: Jaiganesh (secureworldz.official@gmail.com / JG@jangu)

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES
(
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'management.swz@gmail.com',
  crypt('_mohamed@jangu', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"Mohamed"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
),
(
  '00000000-0000-0000-0000-000000000000',
  '22222222-2222-2222-2222-222222222222',
  'authenticated',
  'authenticated',
  'secureworldz.official@gmail.com',
  crypt('JG@jangu', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"Jaiganesh"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

-- Explicitly ensure profiles are assigned 'root' role
INSERT INTO public.profiles (id, username, display_name, avatar, role, email)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'mohamed',   'Mohamed',   'M', 'root', 'management.swz@gmail.com'),
  ('22222222-2222-2222-2222-222222222222', 'jaiganesh', 'Jaiganesh', 'J', 'root', 'secureworldz.official@gmail.com')
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  display_name = EXCLUDED.display_name,
  username = EXCLUDED.username;

-- --------------------------------------------------------
-- SECTION 10: Seed Data — Password Entries (Migrated from passwords.json)
-- --------------------------------------------------------

INSERT INTO public.password_entries (website, url, username, email, password, category, favorite, notes, strength, tags, created_at, updated_at) VALUES

-- Gmail Accounts (9 entries)
('Gmail', 'https://mail.google.com', '', 'helpswz.team@gmail.com', 'SecureWorldz#108', 'Gmail Accounts', false, 'SWZ Team help email', 'strong', ARRAY['gmail','team'], '2025-01-15T10:00:00Z', '2026-03-10T08:30:00Z'),
('Gmail', 'https://mail.google.com', '', 'hiring.swz@gmail.com', 'SecureWorldz&0123.s', 'Gmail Accounts', false, 'SWZ Hiring email', 'strong', ARRAY['gmail','hiring'], '2025-02-01T09:00:00Z', '2026-04-15T11:00:00Z'),
('Gmail', 'https://mail.google.com', '', 'management.swz@gmail.com', 'secureworldz.J@Ngu.b@ba', 'Gmail Accounts', true, 'SWZ Management email', 'strong', ARRAY['gmail','management'], '2024-12-01T08:00:00Z', '2026-05-20T09:15:00Z'),
('Gmail', 'https://mail.google.com', '', 'secureworld628@gmail.com', 'secureworldz#worldz-2026', 'Gmail Accounts', false, 'Secure Worldz general account', 'strong', ARRAY['gmail'], '2025-03-10T12:00:00Z', '2026-01-05T10:00:00Z'),
('Gmail', 'https://mail.google.com', '', 'proworldzacademy@gmail.com', 'Proworldz@#$2030', 'Gmail Accounts', false, 'ProWorldz Academy email', 'strong', ARRAY['gmail','proworldz'], '2025-04-05T14:00:00Z', '2026-02-18T13:00:00Z'),
('Gmail', 'https://mail.google.com', '', 'secureworldz.hiring@gmail.com', 'RishimaSD@0123', 'Gmail Accounts', false, 'SWZ Hiring alternate', 'strong', ARRAY['gmail','hiring'], '2025-05-20T10:00:00Z', '2026-06-01T08:00:00Z'),
('Gmail — Drago', 'https://mail.google.com', '', 'drago.official.in@gmail.com', 'JGlife20#26', 'Gmail Accounts', false, 'Drago official email', 'strong', ARRAY['gmail','drago'], '2025-06-01T11:00:00Z', '2026-07-10T09:00:00Z'),
('Gmail — Drago Shop', 'https://mail.google.com', '', 'dragotool.shop@gmail.com', 'JGlife20#26', 'Gmail Accounts', false, 'Drago tool shop email', 'strong', ARRAY['gmail','drago','shop'], '2025-06-15T10:30:00Z', '2026-07-10T09:00:00Z'),
('Gmail — SWZ Official', 'https://mail.google.com', '', 'secureworldz.official@gmail.com', 'SecureWorldz#198', 'Gmail Accounts', true, 'Secure Worldz official email', 'strong', ARRAY['gmail','official'], '2024-11-01T08:00:00Z', '2026-07-20T10:00:00Z'),

-- Admin Credentials (3 entries)
('ProWorldz Admin Panel', 'https://proworldz.com/admin', 'rishima', 'secureworldz.hiring@gmail.com', 'J@5#m8P!zQ3x', 'Admin Credentials', true, 'Rishima admin account — ProWorldz', 'strong', ARRAY['admin','proworldz'], '2025-01-10T09:00:00Z', '2026-04-01T11:00:00Z'),
('ProWorldz Admin Panel', 'https://proworldz.com/admin', 'mohamed', 'management.swz@gmail.com', 'Blu3$ky@R4in!', 'Admin Credentials', true, 'Mohamed root account — ProWorldz', 'strong', ARRAY['root','proworldz'], '2024-12-05T10:00:00Z', '2026-05-15T08:30:00Z'),
('ProWorldz Admin Panel', 'https://proworldz.com/admin', 'jaiganesh', 'secureworldz.official@gmail.com', 'K9@fT#7mX!2p', 'Admin Credentials', true, 'Jaiganesh root account — ProWorldz', 'strong', ARRAY['root','proworldz'], '2024-12-05T10:00:00Z', '2026-05-15T09:00:00Z'),

-- API Keys (2 entries)
('Zeroupi API', 'https://zeroupi.com', 'swz_admin', 'management.swz@gmail.com', 'zpk_live_49bbf3c06f3c0d9731a65f6128a6e911a50c77bbb804dd7f', 'API Keys', false, 'Zeroupi live API key', 'strong', ARRAY['api','zeroupi'], '2025-07-01T10:00:00Z', '2026-07-01T10:00:00Z'),
('ProWorldz AI API', 'https://console.groq.com', 'swz_admin', 'management.swz@gmail.com', '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', 'API Keys', false, 'ProWorldz App AI API key (Groq)', 'strong', ARRAY['api','ai','groq'], '2025-07-15T11:00:00Z', '2026-07-15T11:00:00Z'),

-- CTF Credentials (14 entries)
('CTF Platform', 'https://ctf.proworldz.com', 'smilin_jena',    '', 'Sjena@2026',   'CTF Credentials', false, 'CTF student credential', 'medium', ARRAY['ctf','student'], '2026-01-10T09:00:00Z', '2026-01-10T09:00:00Z'),
('CTF Platform', 'https://ctf.proworldz.com', 'banupriya_b',    '', 'Banu#CTF26',   'CTF Credentials', false, 'CTF student credential', 'medium', ARRAY['ctf','student'], '2026-01-10T09:00:00Z', '2026-01-10T09:00:00Z'),
('CTF Platform', 'https://ctf.proworldz.com', 'sarvesh_b',      '', 'Sarv@!2026',   'CTF Credentials', false, 'CTF student credential', 'medium', ARRAY['ctf','student'], '2026-01-10T09:00:00Z', '2026-01-10T09:00:00Z'),
('CTF Platform', 'https://ctf.proworldz.com', 'harish_p',       '', 'Hari$h2026',   'CTF Credentials', false, 'CTF student credential', 'medium', ARRAY['ctf','student'], '2026-01-10T09:00:00Z', '2026-01-10T09:00:00Z'),
('CTF Platform', 'https://ctf.proworldz.com', 'sudharshiini',   '', 'Sudha!2026',   'CTF Credentials', false, 'CTF student credential', 'medium', ARRAY['ctf','student'], '2026-01-10T09:00:00Z', '2026-01-10T09:00:00Z'),
('CTF Platform', 'https://ctf.proworldz.com', 'manthravar',     '', 'Manthra!26',   'CTF Credentials', false, 'CTF student credential', 'medium', ARRAY['ctf','student'], '2026-01-10T09:00:00Z', '2026-01-10T09:00:00Z'),
('CTF Platform', 'https://ctf.proworldz.com', 'v_ramesh',       '', 'Ramesh@123',   'CTF Credentials', false, 'CTF student credential', 'medium', ARRAY['ctf','student'], '2026-01-10T09:00:00Z', '2026-01-10T09:00:00Z'),
('CTF Platform', 'https://ctf.proworldz.com', 'gokul_nath',     '', 'Gokul#2026',   'CTF Credentials', false, 'CTF student credential', 'medium', ARRAY['ctf','student'], '2026-01-10T09:00:00Z', '2026-01-10T09:00:00Z'),
('CTF Platform', 'https://ctf.proworldz.com', 'p_sharani',      '', 'Sharani!26',   'CTF Credentials', false, 'CTF student credential', 'medium', ARRAY['ctf','student'], '2026-01-10T09:00:00Z', '2026-01-10T09:00:00Z'),
('CTF Platform', 'https://ctf.proworldz.com', 'sahana',         '', 'Sahana@123',   'CTF Credentials', false, 'CTF student credential', 'medium', ARRAY['ctf','student'], '2026-01-10T09:00:00Z', '2026-01-10T09:00:00Z'),
('CTF Platform', 'https://ctf.proworldz.com', 'dhanan_j',       '', 'Dhanan#CTF',   'CTF Credentials', false, 'CTF student credential', 'medium', ARRAY['ctf','student'], '2026-01-10T09:00:00Z', '2026-01-10T09:00:00Z'),
('CTF Platform', 'https://ctf.proworldz.com', 'suriya_p',       '', 'Suriya!123',   'CTF Credentials', false, 'CTF student credential', 'medium', ARRAY['ctf','student'], '2026-01-10T09:00:00Z', '2026-01-10T09:00:00Z'),
('CTF Platform', 'https://ctf.proworldz.com', 'jai',            '', 'jangu',        'CTF Credentials', false, 'CTF student credential', 'weak',   ARRAY['ctf','student'], '2026-01-10T09:00:00Z', '2026-01-10T09:00:00Z'),
('CTF Platform', 'https://ctf.proworldz.com', 'mohamed',        '', 'jangu',        'CTF Credentials', false, 'CTF student credential', 'weak',   ARRAY['ctf','student'], '2026-01-10T09:00:00Z', '2026-01-10T09:00:00Z');

-- --------------------------------------------------------
-- SECTION 11: Seed Data — Sites & Site Credentials
-- --------------------------------------------------------

-- Sites
WITH inserted_sites AS (
  INSERT INTO public.sites (id, name, url, description) VALUES
    ('a1b2c3d4-0001-0000-0000-000000000001', 'ProWorldz',    'https://proworldz.com',     'ProWorldz Academy — main platform'),
    ('a1b2c3d4-0002-0000-0000-000000000002', 'CTF Platform', 'https://ctf.proworldz.com', 'ProWorldz Capture The Flag training platform'),
    ('a1b2c3d4-0003-0000-0000-000000000003', 'Zeroupi',      'https://zeroupi.com',       'Zeroupi API service'),
    ('a1b2c3d4-0004-0000-0000-000000000004', 'Groq Console', 'https://console.groq.com',  'Groq AI API — ProWorldz AI integration')
  RETURNING id, name
)
SELECT * FROM inserted_sites;

-- Site credentials
INSERT INTO public.site_credentials (site_id, cred_type, username, email, password, admin_page_url, notes) VALUES

-- ProWorldz — Admin credentials (3)
('a1b2c3d4-0001-0000-0000-000000000001', 'admin', 'rishima',   'secureworldz.hiring@gmail.com',  'J@5#m8P!zQ3x',  'https://proworldz.com/admin', 'Rishima admin account'),
('a1b2c3d4-0001-0000-0000-000000000001', 'admin', 'mohamed',   'management.swz@gmail.com',       'Blu3$ky@R4in!', 'https://proworldz.com/admin', 'Mohamed root account'),
('a1b2c3d4-0001-0000-0000-000000000001', 'admin', 'jaiganesh', 'secureworldz.official@gmail.com', 'K9@fT#7mX!2p',  'https://proworldz.com/admin', 'Jaiganesh root account'),

-- CTF Platform — Normal (student) credentials (14)
('a1b2c3d4-0002-0000-0000-000000000002', 'normal', 'smilin_jena',  '', 'Sjena@2026',  '', 'CTF student'),
('a1b2c3d4-0002-0000-0000-000000000002', 'normal', 'banupriya_b',  '', 'Banu#CTF26',  '', 'CTF student'),
('a1b2c3d4-0002-0000-0000-000000000002', 'normal', 'sarvesh_b',    '', 'Sarv@!2026',  '', 'CTF student'),
('a1b2c3d4-0002-0000-0000-000000000002', 'normal', 'harish_p',     '', 'Hari$h2026',  '', 'CTF student'),
('a1b2c3d4-0002-0000-0000-000000000002', 'normal', 'sudharshiini', '', 'Sudha!2026',  '', 'CTF student'),
('a1b2c3d4-0002-0000-0000-000000000002', 'normal', 'manthravar',   '', 'Manthra!26',  '', 'CTF student'),
('a1b2c3d4-0002-0000-0000-000000000002', 'normal', 'v_ramesh',     '', 'Ramesh@123',  '', 'CTF student'),
('a1b2c3d4-0002-0000-0000-000000000002', 'normal', 'gokul_nath',   '', 'Gokul#2026',  '', 'CTF student'),
('a1b2c3d4-0002-0000-0000-000000000002', 'normal', 'p_sharani',    '', 'Sharani!26',  '', 'CTF student'),
('a1b2c3d4-0002-0000-0000-000000000002', 'normal', 'sahana',       '', 'Sahana@123',  '', 'CTF student'),
('a1b2c3d4-0002-0000-0000-000000000002', 'normal', 'dhanan_j',     '', 'Dhanan#CTF',  '', 'CTF student'),
('a1b2c3d4-0002-0000-0000-000000000002', 'normal', 'suriya_p',     '', 'Suriya!123',  '', 'CTF student'),
('a1b2c3d4-0002-0000-0000-000000000002', 'normal', 'jai',          '', 'jangu',       '', 'CTF student'),
('a1b2c3d4-0002-0000-0000-000000000002', 'normal', 'mohamed',      '', 'jangu',       '', 'CTF student'),

-- Zeroupi — Admin/API
('a1b2c3d4-0003-0000-0000-000000000003', 'admin', 'swz_admin', 'management.swz@gmail.com', 'zpk_live_49bbf3c06f3c0d9731a65f6128a6e911a50c77bbb804dd7f', '', 'Zeroupi live API key'),

-- Groq Console — Admin/API
('a1b2c3d4-0004-0000-0000-000000000004', 'admin', 'swz_admin', 'management.swz@gmail.com', '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', '', 'ProWorldz App AI API key');

-- ============================================================
-- DONE!
-- Running this script in Supabase SQL Editor populates:
-- 1. auth.users (Mohamed & Jaiganesh)
-- 2. public.profiles (Mohamed & Jaiganesh with 'root' role)
-- 3. public.password_entries (all 28 entries from passwords.json)
-- 4. public.sites & public.site_credentials (all company sites)
-- ============================================================

NOTIFY pgrst, 'reload schema';
