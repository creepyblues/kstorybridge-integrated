
-- Add invitation status column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN invitation_status TEXT CHECK (invitation_status IN ('invited', 'accepted')) DEFAULT 'invited';

-- Create an index for better performance on invitation status queries
CREATE INDEX profiles_invitation_status_idx ON public.profiles(invitation_status);
