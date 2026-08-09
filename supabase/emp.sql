CREATE TABLE IF NOT EXISTS public.emp (
    avatar TEXT NOT NULL DEFAULT 'MT',
    name TEXT NOT NULL,
    mail TEXT NOT NULL,
    phone_number TEXT NOT NULL DEFAULT 'MT',
    offer_letter TEXT NOT NULL DEFAULT 'MT',
    role TEXT NOT NULL DEFAULT 'MT'
);

CREATE INDEX IF NOT EXISTS idx_emp_name
ON public.emp(name);

CREATE INDEX IF NOT EXISTS idx_emp_mail
ON public.emp(mail);

ALTER TABLE public.emp ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read employees"
ON public.emp;

CREATE POLICY "Authenticated users can read employees"
ON public.emp
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage employees"
ON public.emp;

CREATE POLICY "Authenticated users can manage employees"
ON public.emp
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

NOTIFY pgrst, 'reload schema';