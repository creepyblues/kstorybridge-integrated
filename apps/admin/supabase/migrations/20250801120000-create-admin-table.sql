-- Create admin table for managing admin access
CREATE TABLE public.admin (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true
);

-- Add Row Level Security (RLS)
ALTER TABLE public.admin ENABLE ROW LEVEL SECURITY;

-- Create policy - only authenticated admins can view admin records
CREATE POLICY "Admins can view admin records" 
  ON public.admin 
  FOR SELECT 
  TO authenticated
  USING (email = auth.jwt() ->> 'email');

-- Create indexes for better performance
CREATE INDEX idx_admin_email ON public.admin(email);
CREATE INDEX idx_admin_active ON public.admin(active);
CREATE INDEX idx_admin_created_at ON public.admin(created_at DESC);

-- Create a trigger to update the updated_at timestamp
CREATE TRIGGER update_admin_updated_at
  BEFORE UPDATE ON public.admin
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert a default admin (replace with actual admin email)
INSERT INTO public.admin (email, full_name) VALUES 
('admin@kstorybridge.com', 'KStoryBridge Admin');