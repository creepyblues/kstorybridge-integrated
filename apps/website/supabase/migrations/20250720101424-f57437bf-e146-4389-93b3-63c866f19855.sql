
-- First, create separate tables for buyers and IP owners
CREATE TABLE public.user_buyers (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  buyer_company TEXT NOT NULL,
  buyer_role buyer_role NOT NULL,
  linkedin_url TEXT,
  invitation_status TEXT CHECK (invitation_status IN ('invited', 'accepted')) DEFAULT 'invited',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE public.user_ipowners (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  pen_name_or_studio TEXT NOT NULL,
  ip_owner_role ip_owner_role NOT NULL,
  ip_owner_company TEXT,
  website_url TEXT,
  invitation_status TEXT CHECK (invitation_status IN ('invited', 'accepted')) DEFAULT 'invited',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ipowners ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_buyers
CREATE POLICY "Buyers can view their own profile" 
  ON public.user_buyers 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Buyers can update their own profile" 
  ON public.user_buyers 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Buyers can insert their own profile" 
  ON public.user_buyers 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Create RLS policies for user_ipowners
CREATE POLICY "IP owners can view their own profile" 
  ON public.user_ipowners 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "IP owners can update their own profile" 
  ON public.user_ipowners 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "IP owners can insert their own profile" 
  ON public.user_ipowners 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Drop the old trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create new functions to handle user creation for each type
CREATE OR REPLACE FUNCTION public.handle_new_buyer()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_buyers (
    id, 
    email, 
    full_name, 
    buyer_company,
    buyer_role,
    linkedin_url
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'buyer_company', ''),
    COALESCE(NEW.raw_user_meta_data->>'buyer_role', 'other')::buyer_role,
    NEW.raw_user_meta_data->>'linkedin_url'
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to create buyer profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_ipowner()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_ipowners (
    id, 
    email, 
    full_name, 
    pen_name_or_studio,
    ip_owner_role,
    ip_owner_company,
    website_url
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'pen_name_or_studio', ''),
    COALESCE(NEW.raw_user_meta_data->>'ip_owner_role', 'author')::ip_owner_role,
    NEW.raw_user_meta_data->>'ip_owner_company',
    NEW.raw_user_meta_data->>'website_url'
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to create IP owner profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Create a unified trigger function that routes to the appropriate handler
CREATE OR REPLACE FUNCTION public.handle_new_user_routing()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'account_type' = 'buyer' THEN
    PERFORM public.handle_new_buyer();
  ELSIF NEW.raw_user_meta_data->>'account_type' = 'ip_owner' THEN
    PERFORM public.handle_new_ipowner();
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to route user creation for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_routing();

-- Create indexes for better performance
CREATE INDEX user_buyers_email_idx ON public.user_buyers(email);
CREATE INDEX user_ipowners_email_idx ON public.user_ipowners(email);
CREATE INDEX user_buyers_invitation_status_idx ON public.user_buyers(invitation_status);
CREATE INDEX user_ipowners_invitation_status_idx ON public.user_ipowners(invitation_status);
