-- Migration: Add admin policy for titles table
-- Purpose: Allow admins to update any title (for admin panel)
-- Date: 2025-11-30

-- Create policy for admins to update titles
CREATE POLICY "Admins can update all titles"
  ON public.titles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin
      WHERE admin.email = (auth.jwt() ->> 'email')
      AND admin.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin
      WHERE admin.email = (auth.jwt() ->> 'email')
      AND admin.active = true
    )
  );

-- Create policy for admins to delete titles (optional, for future use)
CREATE POLICY "Admins can delete all titles"
  ON public.titles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin
      WHERE admin.email = (auth.jwt() ->> 'email')
      AND admin.active = true
    )
  );

-- Create policy for admins to insert titles (optional, for future use)
CREATE POLICY "Admins can insert titles"
  ON public.titles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin
      WHERE admin.email = (auth.jwt() ->> 'email')
      AND admin.active = true
    )
  );
