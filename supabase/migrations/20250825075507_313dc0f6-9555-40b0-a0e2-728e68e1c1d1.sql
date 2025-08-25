-- Add sb@bhl.no as superadmin
INSERT INTO public.app_super_admins (user_id, note)
SELECT id, 'Initial superadmin - sb@bhl.no'
FROM public.profiles 
WHERE email = 'sb@bhl.no'
ON CONFLICT (user_id) DO NOTHING;

-- Make user_id nullable in shareholders tables to support global data
ALTER TABLE public.share_companies ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.share_entities ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.share_holdings ALTER COLUMN user_id DROP NOT NULL;

-- Update RLS policies for hybrid model (global + private data)

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own share companies" ON public.share_companies;
DROP POLICY IF EXISTS "Users can manage their own share entities" ON public.share_entities;
DROP POLICY IF EXISTS "Users can manage their own share holdings" ON public.share_holdings;

-- Create new hybrid policies for share_companies
CREATE POLICY "Users can view global and own companies" ON public.share_companies
FOR SELECT USING (
  user_id IS NULL OR user_id = auth.uid()
);

CREATE POLICY "Users can manage own companies" ON public.share_companies
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own companies" ON public.share_companies
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own companies" ON public.share_companies
FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Superadmins can manage global companies" ON public.share_companies
FOR ALL USING (
  is_super_admin(auth.uid()) AND user_id IS NULL
) WITH CHECK (
  is_super_admin(auth.uid()) AND user_id IS NULL
);

-- Create new hybrid policies for share_entities
CREATE POLICY "Users can view global and own entities" ON public.share_entities
FOR SELECT USING (
  user_id IS NULL OR user_id = auth.uid()
);

CREATE POLICY "Users can manage own entities" ON public.share_entities
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own entities" ON public.share_entities
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own entities" ON public.share_entities
FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Superadmins can manage global entities" ON public.share_entities
FOR ALL USING (
  is_super_admin(auth.uid()) AND user_id IS NULL
) WITH CHECK (
  is_super_admin(auth.uid()) AND user_id IS NULL
);

-- Create new hybrid policies for share_holdings
CREATE POLICY "Users can view global and own holdings" ON public.share_holdings
FOR SELECT USING (
  user_id IS NULL OR user_id = auth.uid()
);

CREATE POLICY "Users can manage own holdings" ON public.share_holdings
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own holdings" ON public.share_holdings
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own holdings" ON public.share_holdings
FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Superadmins can manage global holdings" ON public.share_holdings
FOR ALL USING (
  is_super_admin(auth.uid()) AND user_id IS NULL
) WITH CHECK (
  is_super_admin(auth.uid()) AND user_id IS NULL
);

-- Update unique constraints to handle NULL user_id for global data
-- Drop existing constraints
ALTER TABLE public.share_companies DROP CONSTRAINT IF EXISTS share_companies_orgnr_year_user_id_key;
ALTER TABLE public.share_entities DROP CONSTRAINT IF EXISTS share_entities_name_user_id_key;

-- Add new constraints that treat NULL as distinct
CREATE UNIQUE INDEX share_companies_orgnr_year_user_idx ON public.share_companies (orgnr, year, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid));
CREATE UNIQUE INDEX share_entities_name_user_idx ON public.share_entities (name, entity_type, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Update storage policies for global access
DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;

-- Allow users to manage their own files
CREATE POLICY "Users can manage own files" ON storage.objects
FOR ALL USING (
  bucket_id = 'shareholders' AND 
  auth.uid()::text = (storage.foldername(name))[1]
) WITH CHECK (
  bucket_id = 'shareholders' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow superadmins to manage global files
CREATE POLICY "Superadmins can manage global files" ON storage.objects
FOR ALL USING (
  bucket_id = 'shareholders' AND 
  is_super_admin(auth.uid()) AND
  (storage.foldername(name))[1] = 'global'
) WITH CHECK (
  bucket_id = 'shareholders' AND 
  is_super_admin(auth.uid()) AND
  (storage.foldername(name))[1] = 'global'
);