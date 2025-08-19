-- Extend audit_sampling_items table with review/control fields
ALTER TABLE public.audit_sampling_items ADD COLUMN IF NOT EXISTS is_reviewed boolean DEFAULT false;
ALTER TABLE public.audit_sampling_items ADD COLUMN IF NOT EXISTS reviewer_id uuid REFERENCES auth.users(id);
ALTER TABLE public.audit_sampling_items ADD COLUMN IF NOT EXISTS review_date timestamp with time zone;
ALTER TABLE public.audit_sampling_items ADD COLUMN IF NOT EXISTS deviation_amount numeric(15,2) DEFAULT 0;
ALTER TABLE public.audit_sampling_items ADD COLUMN IF NOT EXISTS deviation_notes text;

-- Create enum for review status if it doesn't exist
DO $$ BEGIN
    CREATE TYPE review_status_type AS ENUM ('pending', 'ok', 'deviation');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.audit_sampling_items ADD COLUMN IF NOT EXISTS review_status review_status_type DEFAULT 'pending';