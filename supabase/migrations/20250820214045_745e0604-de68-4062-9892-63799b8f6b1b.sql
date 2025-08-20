-- CRITICAL SECURITY FIX: Remove public access to client test data
-- This policy was allowing unauthenticated users to view sensitive client information

-- Drop the dangerous policy that allows public access to test data
DROP POLICY IF EXISTS "Everyone can view test data" ON public.clients;

-- The remaining policies properly restrict access to:
-- 1. Users can view their own clients (user_id = auth.uid())
-- 2. Users can manage their own clients (user_id = auth.uid())
-- This ensures sensitive client information is only accessible to authorized users

-- Verify no other overly permissive policies exist by listing remaining policies
-- The following policies should remain (they're secure):
-- - "Users can view their own clients" - requires authentication and ownership
-- - "Users can insert their own clients" - requires authentication and ownership  
-- - "Users can update their own clients" - requires authentication and ownership
-- - "Users can delete their own clients" - requires authentication and ownership
-- - "own clients only" - requires authentication and ownership