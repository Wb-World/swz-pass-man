-- =============================================================
-- SWZ Pass Manager: login user setup
-- Run this complete file in the Supabase SQL Editor.
-- It is compatible with a login_user table containing only email/password_hash.
-- =============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.login_user (
  email TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL
);

-- Keep the credential table private: the browser only calls the function below.
ALTER TABLE public.login_user ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.login_user FROM anon, authenticated;

INSERT INTO public.login_user (email, password_hash)
VALUES (
  'mohamedhathim@gmail.com',
  crypt('mb@1205', gen_salt('bf'))
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash;

-- Recreate this function so it also upgrades an earlier version of this schema.
DROP FUNCTION IF EXISTS public.authenticate_login_user(TEXT, TEXT);
CREATE FUNCTION public.authenticate_login_user(p_email TEXT, p_password TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.login_user
    WHERE email = lower(trim(p_email))
      AND password_hash = crypt(p_password, password_hash)
  );
$$;

REVOKE ALL ON FUNCTION public.authenticate_login_user(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.authenticate_login_user(TEXT, TEXT) TO anon, authenticated;

-- Supabase Auth establishes the authenticated session used by the app after
-- login_user has verified the password above.
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '33333333-3333-3333-3333-333333333333',
  'authenticated', 'authenticated', 'mohamedhathim@gmail.com', crypt('mb@1205', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}', '{"display_name":"Mohamed"}',
  NOW(), NOW(), '', '', '', ''
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = NOW(),
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = NOW();

NOTIFY pgrst, 'reload schema';
