CREATE TABLE IF NOT EXISTS public.mails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL DEFAULT 'MT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.update_mails_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_mails_updated_at ON public.mails;

CREATE TRIGGER update_mails_updated_at
BEFORE UPDATE ON public.mails
FOR EACH ROW
EXECUTE FUNCTION public.update_mails_updated_at();

ALTER TABLE public.mails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read mails"
ON public.mails;

CREATE POLICY "Authenticated users can read mails"
ON public.mails
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage mails"
ON public.mails;

CREATE POLICY "Authenticated users can manage mails"
ON public.mails
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

INSERT INTO public.mails
(id, email, password)
VALUES
(
    'e1c2d3e4-0001-4000-8000-000000000001',
    'helpswz.team@gmail.com',
    'SecureWorldz#108'
),
(
    'e1c2d3e4-0002-4000-8000-000000000002',
    'hiring.swz@gmail.com',
    'SecureWorldz&0123.s'
),
(
    'e1c2d3e4-0003-4000-8000-000000000003',
    'management.swz@gmail.com',
    'secureworldz.J@Ngu.b@ba'
),
(
    'e1c2d3e4-0004-4000-8000-000000000004',
    'secureworld628@gmail.com',
    'secureworldz#worldz-2026'
),
(
    'e1c2d3e4-0005-4000-8000-000000000005',
    'proworldzacademy@gmail.com',
    'Proworldz@#$2030'
),
(
    'e1c2d3e4-0006-4000-8000-000000000006',
    'secureworldz.hiring@gmail.com',
    'RishimaSD@0123'
),
(
    'e1c2d3e4-0007-4000-8000-000000000007',
    'drago.official.in@gmail.com',
    'JGlife20#26'
),
(
    'e1c2d3e4-0008-4000-8000-000000000008',
    'dragotool.shop@gmail.com',
    'JGlife20#26'
),
(
    'e1c2d3e4-0009-4000-8000-000000000009',
    'secureworldz.official@gmail.com',
    'SecureWorldz#198'
)
ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    updated_at = NOW();

NOTIFY pgrst, 'reload schema';