
-- Create a table to store metadata for media uploaded for knowledge articles
CREATE TABLE public.article_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  alt_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comments for clarity
COMMENT ON TABLE public.article_media IS 'Stores metadata for media files uploaded for knowledge base articles.';
COMMENT ON COLUMN public.article_media.alt_text IS 'Alternative text for accessibility.';

-- Enable Row Level Security
ALTER TABLE public.article_media ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for the article_media table
CREATE POLICY "Users can view their own media" ON public.article_media FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own media" ON public.article_media FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own media" ON public.article_media FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own media" ON public.article_media FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for article media if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('article-media', 'article-media', true, 26214400, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']) -- 25MB limit
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access to article media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload article media" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own article media" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own article media" ON storage.objects;

-- RLS policies for storage bucket
CREATE POLICY "Allow public read access to article media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'article-media');

-- This policy is more secure, it restricts uploads to a user-specific folder.
CREATE POLICY "Allow authenticated users to upload article media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'article-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Allow users to update their own article media"
  ON storage.objects FOR UPDATE
  USING (auth.uid() = owner)
  WITH CHECK (bucket_id = 'article-media');

CREATE POLICY "Allow users to delete their own article media"
  ON storage.objects FOR DELETE
  USING (auth.uid() = owner);
