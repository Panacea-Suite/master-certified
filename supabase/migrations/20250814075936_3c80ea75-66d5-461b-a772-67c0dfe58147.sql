-- Add approved_stores column to brands table if it doesn't exist
ALTER TABLE public.brands 
ADD COLUMN IF NOT EXISTS approved_stores TEXT[] DEFAULT '{}';

-- Add index for better performance on approved_stores queries
CREATE INDEX IF NOT EXISTS idx_brands_approved_stores ON public.brands USING GIN(approved_stores);