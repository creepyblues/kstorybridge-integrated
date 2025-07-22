
-- Create enum types for content format and genre
CREATE TYPE public.content_format AS ENUM ('webtoon', 'web_novel', 'book', 'script', 'game', 'animation', 'other');

CREATE TYPE public.genre AS ENUM ('romance', 'fantasy', 'action', 'drama', 'comedy', 'thriller', 'horror', 'sci_fi', 'slice_of_life', 'historical', 'mystery', 'sports', 'other');

-- Create the titles table
CREATE TABLE public.titles (
  title_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_name_kr TEXT NOT NULL,
  title_name_en TEXT,
  title_url TEXT,
  title_image TEXT,
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  rating_count INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  genre genre,
  author TEXT,
  illustrator TEXT,
  writer TEXT,
  content_format content_format,
  synopsis TEXT,
  pitch TEXT,
  creator_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.titles ENABLE ROW LEVEL SECURITY;

-- Creators can view, insert, update their own titles
CREATE POLICY "Creators can manage their own titles" 
  ON public.titles 
  FOR ALL
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- All authenticated users (including buyers) can view published titles
CREATE POLICY "All users can view titles" 
  ON public.titles 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_titles_creator_id ON public.titles(creator_id);
CREATE INDEX idx_titles_genre ON public.titles(genre);
CREATE INDEX idx_titles_content_format ON public.titles(content_format);
CREATE INDEX idx_titles_views ON public.titles(views DESC);
CREATE INDEX idx_titles_rating ON public.titles(rating DESC);
CREATE INDEX idx_titles_created_at ON public.titles(created_at DESC);

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_titles_updated_at 
    BEFORE UPDATE ON public.titles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
