-- Create featured table
CREATE TABLE IF NOT EXISTS public.featured (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title_id UUID NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT featured_title_id_fkey FOREIGN KEY (title_id) REFERENCES public.titles(title_id) ON DELETE CASCADE
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_featured_title_id ON public.featured(title_id);

-- Add RLS policies
ALTER TABLE public.featured ENABLE ROW LEVEL SECURITY;

-- Allow read access to all users
CREATE POLICY "Allow read access to featured titles" ON public.featured
    FOR SELECT USING (true);

-- Allow insert/update/delete for authenticated users (adjust as needed)
CREATE POLICY "Allow full access to authenticated users" ON public.featured
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert the featured titles
INSERT INTO public.featured (title_id, note) VALUES
    ('b8f1367c-94a7-41a2-baf6-a8ac974584ef', 'Featured title 1'),
    ('ea2167ba-3d89-4c09-979c-1d5114bfcb19', 'Featured title 2'),
    ('e388e37f-7a11-4ca4-8164-15339c6bfda4', 'Featured title 3'),
    ('e87ca7b0-976c-44c8-84be-898611bd62ff', 'Featured title 4'),
    ('38198638-610d-4eaa-a7f0-941cdd8b3d77', 'Featured title 5'),
    ('234b05fd-1624-4fe6-9318-4baea38688e3', 'Featured title 6');