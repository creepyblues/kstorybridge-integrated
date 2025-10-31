-- Add actual admin users to admin table
-- Status: COMPLETED 2025-10-21
--
-- Purpose: Insert Sungho and Kevin as admin users
-- Safety: Uses ON CONFLICT to avoid duplicate errors if already exists

INSERT INTO public.admin (email, full_name, active) VALUES
  ('sungho@dadble.com', 'Sungho Lee', true),
  ('kevin@sandstoneartists.com', 'Kevin', true)
ON CONFLICT (email) DO UPDATE
  SET active = EXCLUDED.active,
      full_name = EXCLUDED.full_name,
      updated_at = now();
