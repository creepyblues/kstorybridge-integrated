-- Migration: Create title_documents table and Supabase Storage bucket
-- Date: 2025-10-24
-- Status: IN_PROGRESS
-- Description: Store uploaded creative documents (PDFs, scripts, etc.) with Supabase Storage integration
--
-- This migration creates:
-- 1. title_documents table for document metadata
-- 2. Supabase Storage bucket 'title-documents' for file storage
-- 3. RLS policies for secure file access

BEGIN;

-- Create title_documents table
CREATE TABLE IF NOT EXISTS public.title_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id UUID NOT NULL REFERENCES public.titles(title_id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'source_pdf',          -- Source material PDF (can share with NDA)
    'story_bible',         -- Story bible document
    'outline',             -- Story outline
    'script',              -- Script/screenplay
    'press_release',       -- Press release
    'interview',           -- Creator interview (external link)
    'review',              -- Review with story content (external link)
    'wiki',                -- Fan wiki (external link)
    'other'                -- Other creative documents
  )),
  file_url TEXT NOT NULL,              -- Supabase Storage URL or external URL
  file_name TEXT NOT NULL,
  file_size BIGINT,                    -- File size in bytes (NULL for external links)
  shareable_with_nda BOOLEAN DEFAULT FALSE,  -- Can share with buyers who sign NDA
  external_url TEXT,                   -- Alternative: external link (Google Drive, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_title_documents_title_id ON public.title_documents(title_id);
CREATE INDEX idx_title_documents_type ON public.title_documents(document_type);
CREATE INDEX idx_title_documents_shareable ON public.title_documents(shareable_with_nda) WHERE shareable_with_nda = true;

-- Enable Row Level Security
ALTER TABLE public.title_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Creators can manage documents for their titles
CREATE POLICY "Creators manage documents for their titles"
ON public.title_documents FOR ALL
TO authenticated
USING (
  title_id IN (SELECT title_id FROM public.titles WHERE creator_id = auth.uid())
)
WITH CHECK (
  title_id IN (SELECT title_id FROM public.titles WHERE creator_id = auth.uid())
);

-- RLS Policy: All authenticated users can view shareable documents
CREATE POLICY "Users can view shareable documents"
ON public.title_documents FOR SELECT
TO authenticated
USING (shareable_with_nda = true OR title_id IN (
  SELECT title_id FROM public.titles WHERE creator_id = auth.uid()
));

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_title_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_title_documents_updated_at
    BEFORE UPDATE ON public.title_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_title_documents_updated_at();

-- Create Supabase Storage bucket for title documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'title-documents',
  'title-documents',
  false,  -- Not publicly accessible
  10485760,  -- 10MB file size limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Add table comments
COMMENT ON TABLE public.title_documents IS 'Uploaded creative documents and external links (questionnaire Step 4)';
COMMENT ON COLUMN public.title_documents.shareable_with_nda IS 'Whether this document can be shared with buyers who sign NDA';
COMMENT ON COLUMN public.title_documents.external_url IS 'External link (Google Drive, Dropbox, etc.) as alternative to file upload';

COMMIT;

-- Note: Storage bucket RLS policies must be created separately via Supabase Dashboard or API
-- See documentation: /docs/CREATOR_V2_QUESTIONNAIRE_IMPLEMENTATION_PLAN.md
-- Storage policies to add:
-- 1. Creators can INSERT objects to folders matching their title_ids
-- 2. Creators can SELECT objects from their title folders
-- 3. Creators can DELETE objects from their title folders
