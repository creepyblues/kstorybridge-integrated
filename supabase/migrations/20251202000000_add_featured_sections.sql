-- Migration: Add featured_sections table for organizing featured titles
-- Purpose: Allow admins to create sections/categories for featured titles
-- Date: 2025-12-02

-- Create featured_sections table
CREATE TABLE IF NOT EXISTS public.featured_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add section_id foreign key to existing featured table
ALTER TABLE public.featured
ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.featured_sections(id) ON DELETE SET NULL;

-- Add display_order to featured table for ordering titles within sections
ALTER TABLE public.featured
ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_featured_sections_display_order ON public.featured_sections(display_order);
CREATE INDEX IF NOT EXISTS idx_featured_sections_is_active ON public.featured_sections(is_active);
CREATE INDEX IF NOT EXISTS idx_featured_section_id ON public.featured(section_id);
CREATE INDEX IF NOT EXISTS idx_featured_display_order ON public.featured(display_order);

-- Enable RLS on featured_sections
ALTER TABLE public.featured_sections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for featured_sections
-- Read: Anyone authenticated can read active sections
CREATE POLICY "Anyone can view featured sections"
  ON public.featured_sections
  FOR SELECT
  TO authenticated
  USING (true);

-- Write: Authenticated users can manage sections (admin check at app level)
CREATE POLICY "Authenticated users can insert featured sections"
  ON public.featured_sections
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update featured sections"
  ON public.featured_sections
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete featured sections"
  ON public.featured_sections
  FOR DELETE
  TO authenticated
  USING (true);

-- Create or replace trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for auto-updating updated_at on featured_sections
DROP TRIGGER IF EXISTS update_featured_sections_updated_at ON public.featured_sections;
CREATE TRIGGER update_featured_sections_updated_at
  BEFORE UPDATE ON public.featured_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.featured_sections IS 'Sections for organizing featured titles on the Featured page';
COMMENT ON COLUMN public.featured_sections.name IS 'Display name of the section (e.g., "Action Thrillers", "Romance")';
COMMENT ON COLUMN public.featured_sections.description IS 'Optional description shown below section header';
COMMENT ON COLUMN public.featured_sections.display_order IS 'Order in which sections appear (lower = first)';
COMMENT ON COLUMN public.featured_sections.is_active IS 'Whether section is visible on buyer page';
COMMENT ON COLUMN public.featured.section_id IS 'Section this featured title belongs to (null = uncategorized)';
COMMENT ON COLUMN public.featured.display_order IS 'Order within the section (lower = first)';
