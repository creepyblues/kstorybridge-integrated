-- Add description field to titles table
ALTER TABLE public.titles ADD COLUMN description TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.titles.description IS 'Detailed description of the title content';