CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS public.site_credentials CASCADE;
DROP TABLE IF EXISTS public.sites CASCADE;

CREATE TABLE public.sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    url TEXT NOT NULL DEFAULT 'MT',
    description TEXT NOT NULL DEFAULT 'MT',
    cred_type TEXT NOT NULL CHECK (cred_type IN ('admin', 'normal')),
    username TEXT NOT NULL DEFAULT 'MT',
    email TEXT NOT NULL DEFAULT 'MT',
    password TEXT NOT NULL DEFAULT 'MT',
    admin_page_url TEXT NOT NULL DEFAULT 'MT',
    notes TEXT NOT NULL DEFAULT 'MT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sites_name
ON public.sites(name);

CREATE INDEX idx_sites_url
ON public.sites(url);

CREATE INDEX idx_sites_cred_type
ON public.sites(cred_type);

CREATE INDEX idx_sites_created_at
ON public.sites(created_at);

ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read sites"
ON public.sites
FOR SELECT
TO authenticated
USING (true);

CREATE OR REPLACE FUNCTION public.update_sites_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_sites_updated_at
BEFORE UPDATE ON public.sites
FOR EACH ROW
EXECUTE FUNCTION public.update_sites_updated_at();

INSERT INTO public.sites
(id, name, url, description, cred_type, username, email, password, admin_page_url, notes, created_at, updated_at)
VALUES
(
    'b1c2d3e4-0001-4000-8000-000000000001',
    'SecureWorldz Courses',
    'https://secureworldz-courses.vercel.app/',
    'SecureWorldz courses platform',
    'normal',
    'MT',
    'MT',
    'MT',
    'MT',
    'MT',
    '2026-08-08 10:17:00.676742+00',
    '2026-08-08 10:17:00.676742+00'
),
(
    'b1c2d3e4-0002-4000-8000-000000000002',
    'CyberJai',
    'https://cyberjai.vercel.app/',
    'CyberJai platform with an admin portal',
    'admin',
    'NULL',
    'admin@cyberjai.local',
    'Admin@jangu.baba',
    'https://cyberjai.vercel.app/admin',
    'CyberJai administrator',
    '2026-08-08 10:17:00.676742+00',
    '2026-08-08 10:17:00.676742+00'
),
(
    'b1c2d3e4-0003-4000-8000-000000000003',
    'CTF Page',
    'https://ctf-page.vercel.app/',
    'Capture The Flag platform',
    'normal',
    'smilin_jena',
    'MT',
    'Sjena@2026',
    'MT',
    'CTF user login',
    '2026-08-08 10:17:00.676742+00',
    '2026-08-08 10:17:00.676742+00'
),
(
    'b1c2d3e4-0004-4000-8000-000000000004',
    'CTF Page',
    'https://ctf-page.vercel.app/',
    'Capture The Flag platform',
    'normal',
    'banupriya_b',
    'MT',
    'Banu#CTF26',
    'MT',
    'CTF user login',
    '2026-08-08 10:17:00.676742+00',
    '2026-08-08 10:17:00.676742+00'
),
(
    'b1c2d3e4-0005-4000-8000-000000000005',
    'CTF Page',
    'https://ctf-page.vercel.app/',
    'Capture The Flag platform',
    'normal',
    'sarvesh_b',
    'MT',
    'Sarv@!2026',
    'MT',
    'CTF user login',
    '2026-08-08 10:17:00.676742+00',
    '2026-08-08 10:17:00.676742+00'
),
(
    'b1c2d3e4-0006-4000-8000-000000000006',
    'CTF Page',
    'https://ctf-page.vercel.app/',
    'Capture The Flag platform',
    'normal',
    'harish_p',
    'MT',
    'Hari$h2026',
    'MT',
    'CTF user login',
    '2026-08-08 10:17:00.676742+00',
    '2026-08-08 10:17:00.676742+00'
),
(
    'b1c2d3e4-0007-4000-8000-000000000007',
    'CTF Page',
    'https://ctf-page.vercel.app/',
    'Capture The Flag platform',
    'normal',
    'sudharshiini',
    'MT',
    'Sudha!2026',
    'MT',
    'CTF user login',
    '2026-08-08 10:17:00.676742+00',
    '2026-08-08 10:17:00.676742+00'
),
(
    'b1c2d3e4-0008-4000-8000-000000000008',
    'CTF Page',
    'https://ctf-page.vercel.app/',
    'Capture The Flag platform',
    'normal',
    'manthravar',
    'MT',
    'Manthra!26',
    'MT',
    'CTF user login',
    '2026-08-08 10:17:00.676742+00',
    '2026-08-08 10:17:00.676742+00'
),
(
    'b1c2d3e4-0009-4000-8000-000000000009',
    'CTF Page',
    'https://ctf-page.vercel.app/',
    'Capture The Flag platform',
    'normal',
    'v_ramesh',
    'MT',
    'Ramesh@123',
    'MT',
    'CTF user login',
    '2026-08-08 10:17:00.676742+00',
    '2026-08-08 10:17:00.676742+00'
),
(
    'b1c2d3e4-0010-4000-8000-000000000010',
    'CTF Page',
    'https://ctf-page.vercel.app/',
    'Capture The Flag platform',
    'normal',
    'gokul_nath',
    'MT',
    'Gokul#2026',
    'MT',
    'CTF user login',
    '2026-08-08 10:17:00.676742+00',
    '2026-08-08 10:17:00.676742+00'
),
(
    'b1c2d3e4-0011-4000-8000-000000000011',
    'CTF Page',
    'https://ctf-page.vercel.app/',
    'Capture The Flag platform',
    'normal',
    'p_sharani',
    'MT',
    'Sharani!26',
    'MT',
    'CTF user login',
    '2026-08-08 10:17:00.676742+00',
    '2026-08-08 10:17:00.676742+00'
),
(
    'b1c2d3e4-0012-4000-8000-000000000012',
    'CTF Page',
    'https://ctf-page.vercel.app/',
    'Capture The Flag platform',
    'normal',
    'sahana',
    'MT',
    'Sahana@123',
    'MT',
    'CTF user login',
    '2026-08-08 10:17:00.676742+00',
    '2026-08-08 10:17:00.676742+00'
),
(
    'b1c2d3e4-0013-4000-8000-000000000013',
    'CTF Page',
    'https://ctf-page.vercel.app/',
    'Capture The Flag platform',
    'normal',
    'dhanan_j',
    'MT',
    'Dhanan#CTF',
    'MT',
    'CTF user login',
    '2026-08-08 10:17:00.676742+00',
    '2026-08-08 10:17:00.676742+00'
),
(
    'b1c2d3e4-0014-4000-8000-000000000014',
    'CTF Page',
    'https://ctf-page.vercel.app/',
    'Capture The Flag platform',
    'normal',
    'suriya_p',
    'MT',
    'Suriya!123',
    'MT',
    'CTF user login',
    '2026-08-08 10:17:00.676742+00',
    '2026-08-08 10:17:00.676742+00'
),
(
    'b1c2d3e4-0015-4000-8000-000000000015',
    'CTF Page',
    'https://ctf-page.vercel.app/',
    'Capture The Flag platform',
    'normal',
    'jai',
    'MT',
    'jangu',
    'MT',
    'CTF user login',
    '2026-08-08 10:17:00.676742+00',
    '2026-08-08 10:17:00.676742+00'
),
(
    'b1c2d3e4-0016-4000-8000-000000000016',
    'CTF Page',
    'https://ctf-page.vercel.app/',
    'Capture The Flag platform',
    'normal',
    'mohamed',
    'MT',
    'jangu',
    'MT',
    'CTF user login',
    '2026-08-08 10:17:00.676742+00',
    '2026-08-08 10:17:00.676742+00'
),
(
    'b1c2d3e4-0017-4000-8000-000000000017',
    'CTF Page',
    'https://ctf-page.vercel.app/',
    'Capture The Flag platform',
    'admin',
    'jaiganesh',
    'MT',
    'jangubaba',
    'https://ctf-page.vercel.app/admin',
    'CTF administrator',
    '2026-08-08 10:17:00.676742+00',
    '2026-08-08 10:17:00.676742+00'
),
(
    'b1c2d3e4-0018-4000-8000-000000000018',
    'CTF Page',
    'https://ctf-page.vercel.app/',
    'Capture The Flag platform',
    'admin',
    'mohamed',
    'MT',
    'jangubaba',
    'https://ctf-page.vercel.app/admin',
    'CTF administrator',
    '2026-08-08 10:17:00.676742+00',
    '2026-08-08 10:17:00.676742+00'
),
(
    'b1c2d3e4-0019-4000-8000-000000000019',
    'BAC Project',
    'https://bac-project.vercel.app/',
    'Vulnerable bank application',
    'normal',
    'MT',
    'MT',
    'MT',
    'MT',
    'MT',
    '2026-08-08 10:17:00.676742+00',
    '2026-08-08 10:17:00.676742+00'
),
(
    'b1c2d3e4-0020-4000-8000-000000000020',
    'Drago Event',
    'https://dragoevent.vercel.app/',
    'Drago Event platform',
    'normal',
    'Imran1',
    'MT',
    '123',
    'MT',
    'Drago Event user login',
    '2026-08-08 10:17:00.676742+00',
    '2026-08-08 10:17:00.676742+00'
),
(
    'b1c2d3e4-0021-4000-8000-000000000021',
    'Drago Event',
    'https://dragoevent.vercel.app/',
    'Drago Event platform',
    'normal',
    'Abi',
    'MT',
    'abi@123',
    'MT',
    'Drago Event user login',
    '2026-08-08 10:17:00.676742+00',
    '2026-08-08 10:17:00.676742+00'
),
(
    'b1c2d3e4-0022-4000-8000-000000000022',
    'Dragoz',
    'MT',
    'MT',
    'normal',
    'MT',
    'MT',
    'MT',
    'MT',
    'MT',
    '2026-08-08 10:17:00.676742+00',
    '2026-08-08 10:17:00.676742+00'
),
(
    'b1c2d3e4-0023-4000-8000-000000000023',
    'Drago Tool Shop',
    'https://dragotool.shop/',
    'MT',
    'normal',
    'MT',
    'MT',
    'MT',
    'MT',
    'MT',
    '2026-08-08 10:17:00.676742+00',
    '2026-08-08 10:17:00.676742+00'
),
(
    'f1c2d3e4-0001-4000-8000-000000000001',
    'Proworldz',
    'https://proworldz.page.gd/',
    'Proworldz platform',
    'normal',
    'MT',
    'mohamedhathim628@gmail.com',
    'mohamed@123',
    'MT',
    'User login',
    '2026-08-08 10:28:39.648298+00',
    '2026-08-08 10:28:39.648298+00'
),
(
    'f1c2d3e4-0002-4000-8000-000000000002',
    'Proworldz',
    'https://proworldz.page.gd/',
    'Proworldz platform',
    'admin',
    'mohamed',
    'MT',
    'Blu3$ky@R4in!',
    'https://proworldz.page.gd/_admin',
    'Role: root',
    '2026-08-08 10:28:39.648298+00',
    '2026-08-08 10:28:39.648298+00'
),
(
    'f1c2d3e4-0003-4000-8000-000000000003',
    'Proworldz',
    'https://proworldz.page.gd/',
    'Proworldz platform',
    'admin',
    'jaiganesh',
    'MT',
    'K9@fT#7mX!2p',
    'https://proworldz.page.gd/_admin',
    'Role: root',
    '2026-08-08 10:28:39.648298+00',
    '2026-08-08 10:28:39.648298+00'
);

NOTIFY pgrst, 'reload schema';