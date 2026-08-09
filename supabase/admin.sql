CREATE TABLE IF NOT EXISTS public._admins (
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);

ALTER TABLE public._admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read admins"
ON public._admins;

CREATE POLICY "Authenticated users can read admins"
ON public._admins
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage admins"
ON public._admins;

CREATE POLICY "Authenticated users can manage admins"
ON public._admins
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

NOTIFY pgrst, 'reload schema';