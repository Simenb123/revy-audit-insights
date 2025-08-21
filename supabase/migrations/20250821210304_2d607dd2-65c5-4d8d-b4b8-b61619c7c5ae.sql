-- Fix RLS policies to allow proper CRUD operations for legal data
-- The previous migration was too restrictive for normal operations

-- 1. Fix legal_provisions table policies
DROP POLICY IF EXISTS "Legal provisions require authentication" ON public.legal_provisions;

-- Allow full CRUD for authenticated users with proper roles
CREATE POLICY "Authenticated users can manage legal provisions" 
ON public.legal_provisions 
FOR ALL
USING (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_role IN ('admin', 'partner', 'manager', 'employee')
  )
)
WITH CHECK (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_role IN ('admin', 'partner', 'manager', 'employee')
  )
);

-- 2. Fix legal_documents table policies  
DROP POLICY IF EXISTS "Legal documents require authentication" ON public.legal_documents;

CREATE POLICY "Authenticated users can manage legal documents" 
ON public.legal_documents 
FOR ALL
USING (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_role IN ('admin', 'partner', 'manager', 'employee')
  )
)
WITH CHECK (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_role IN ('admin', 'partner', 'manager', 'employee')
  )
);

-- 3. Fix legal_citations table policies
DROP POLICY IF EXISTS "Legal citations require authentication" ON public.legal_citations;

CREATE POLICY "Authenticated users can manage legal citations" 
ON public.legal_citations 
FOR ALL
USING (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_role IN ('admin', 'partner', 'manager', 'employee')
  )
)
WITH CHECK (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_role IN ('admin', 'partner', 'manager', 'employee')
  )
);

-- 4. Fix knowledge_article_tags table policies
DROP POLICY IF EXISTS "Knowledge article tags require authentication" ON public.knowledge_article_tags;

CREATE POLICY "Authenticated users can manage knowledge article tags" 
ON public.knowledge_article_tags 
FOR ALL
USING (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_role IN ('admin', 'partner', 'manager', 'employee')
  )
)
WITH CHECK (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_role IN ('admin', 'partner', 'manager', 'employee')
  )
);