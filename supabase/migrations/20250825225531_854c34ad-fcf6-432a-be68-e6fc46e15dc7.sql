-- Allow NULL values for share_class column to handle cases where class is not specified
ALTER TABLE public.share_holdings ALTER COLUMN share_class DROP NOT NULL;

-- Set default value for share_class when NULL
UPDATE public.share_holdings SET share_class = 'ORDINÆR' WHERE share_class IS NULL;