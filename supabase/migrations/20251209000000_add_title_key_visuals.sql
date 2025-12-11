-- Migration: Add title_key_visuals table and storage bucket
-- Description: Store key visuals (cover images, character images, scenes) for titles
-- Author: Claude
-- Date: 2025-12-09

-- Create the title_key_visuals table
CREATE TABLE IF NOT EXISTS title_key_visuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id UUID NOT NULL REFERENCES titles(title_id) ON DELETE CASCADE,

  -- Image classification
  image_type TEXT NOT NULL CHECK (image_type IN ('cover', 'character', 'scene', 'promotional', 'other')),

  -- URLs
  original_url TEXT NOT NULL,
  storage_url TEXT NOT NULL,

  -- Metadata
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,

  -- Tracking
  collected_by TEXT NOT NULL,
  collected_at TIMESTAMPTZ DEFAULT now(),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups by title_id
CREATE INDEX IF NOT EXISTS idx_title_key_visuals_title_id ON title_key_visuals(title_id);

-- Create index for display ordering
CREATE INDEX IF NOT EXISTS idx_title_key_visuals_display_order ON title_key_visuals(title_id, display_order);

-- Enable RLS
ALTER TABLE title_key_visuals ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access for authenticated users
CREATE POLICY "Anyone can read key visuals"
  ON title_key_visuals FOR SELECT
  USING (true);

-- Policy: Allow admins to insert key visuals
CREATE POLICY "Admins can insert key visuals"
  ON title_key_visuals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin WHERE id = auth.uid() AND active = true
    )
  );

-- Policy: Allow admins to update key visuals
CREATE POLICY "Admins can update key visuals"
  ON title_key_visuals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin WHERE id = auth.uid() AND active = true
    )
  );

-- Policy: Allow admins to delete key visuals
CREATE POLICY "Admins can delete key visuals"
  ON title_key_visuals FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin WHERE id = auth.uid() AND active = true
    )
  );

-- Create storage bucket for key visuals (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'title-key-visuals',
  'title-key-visuals',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Allow public read access
CREATE POLICY "Anyone can view key visual images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'title-key-visuals');

-- Storage policy: Allow admins to upload images
CREATE POLICY "Admins can upload key visual images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'title-key-visuals' AND
    EXISTS (
      SELECT 1 FROM admin WHERE id = auth.uid() AND active = true
    )
  );

-- Storage policy: Allow admins to delete images
CREATE POLICY "Admins can delete key visual images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'title-key-visuals' AND
    EXISTS (
      SELECT 1 FROM admin WHERE id = auth.uid() AND active = true
    )
  );

-- Add comment to table
COMMENT ON TABLE title_key_visuals IS 'Key visual images collected for titles including covers, character images, scenes, and promotional materials';
