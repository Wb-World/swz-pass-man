CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    api_key TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.update_api_keys_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_api_keys_updated_at ON public.api_keys;

CREATE TRIGGER update_api_keys_updated_at
BEFORE UPDATE ON public.api_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_api_keys_updated_at();

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read api_keys" ON public.api_keys;

CREATE POLICY "Authenticated users can read api_keys"
ON public.api_keys
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage api_keys" ON public.api_keys;

CREATE POLICY "Authenticated users can manage api_keys"
ON public.api_keys
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

INSERT INTO public.api_keys
(name, api_key)
VALUES
(
    'Zeroupi',
    'zpk_live_49bbf3c06f3c0d9731a65f6128a6e911a50c77bbb804dd7f'
),
(
    'Proworldz App AI',
    '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'
)
ON CONFLICT (name) DO UPDATE SET
    api_key = EXCLUDED.api_key,
    updated_at = NOW();

NOTIFY pgrst, 'reload schema';