-- Create featured table to track featured titles
CREATE TABLE public.featured (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_id UUID NOT NULL REFERENCES public.titles(title_id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX idx_featured_created_at ON public.featured(created_at DESC);
CREATE INDEX idx_featured_title_id ON public.featured(title_id);

-- Enable Row Level Security
ALTER TABLE public.featured ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view featured titles
CREATE POLICY "All users can view featured titles"
  ON public.featured
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only authenticated users can manage featured titles (admin-level access)
CREATE POLICY "Admins can manage featured titles"
  ON public.featured
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_featured_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_featured_updated_at
  BEFORE UPDATE ON public.featured
  FOR EACH ROW
  EXECUTE FUNCTION update_featured_updated_at();