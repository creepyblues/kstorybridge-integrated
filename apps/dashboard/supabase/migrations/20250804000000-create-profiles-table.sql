-- Create unified profiles table for dashboard compatibility
-- This migration creates a profiles table that consolidates data from user_buyers and user_ipowners

-- Create enum types if they don't exist
DO $$ BEGIN
    CREATE TYPE public.account_type AS ENUM ('ip_owner', 'buyer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.ip_owner_role AS ENUM ('author', 'agent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.buyer_role AS ENUM ('producer', 'executive', 'agent', 'content_scout', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the unified profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  account_type account_type NOT NULL,
  
  -- IP Owner specific fields (renamed from pen_name_or_studio to pen_name)
  pen_name TEXT,
  ip_owner_role ip_owner_role,
  ip_owner_company TEXT,
  website_url TEXT,
  
  -- Buyer specific fields
  buyer_company TEXT,
  buyer_role buyer_role,
  linkedin_url TEXT,
  
  -- Additional field for invitation status
  invitation_status TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Create function to sync existing user data into profiles table
CREATE OR REPLACE FUNCTION public.sync_user_profiles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert buyers into profiles table
  INSERT INTO public.profiles (
    id, email, full_name, account_type, buyer_company, buyer_role, linkedin_url, created_at, updated_at
  )
  SELECT 
    ub.id, ub.email, ub.full_name, 'buyer'::account_type, 
    ub.buyer_company, ub.buyer_role, ub.linkedin_url, 
    ub.created_at, ub.updated_at
  FROM public.user_buyers ub
  WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = ub.id);

  -- Insert IP owners into profiles table  
  INSERT INTO public.profiles (
    id, email, full_name, account_type, pen_name, ip_owner_role, ip_owner_company, 
    website_url, created_at, updated_at
  )
  SELECT 
    ui.id, ui.email, ui.full_name, 'ip_owner'::account_type,
    ui.pen_name_or_studio, ui.ip_owner_role, ui.ip_owner_company,
    ui.website_url, ui.created_at, ui.updated_at
  FROM public.user_ipowners ui
  WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = ui.id);
  
  RAISE NOTICE 'Successfully synced existing user data to profiles table';
END;
$$;

-- Run the sync function to populate existing data
SELECT public.sync_user_profiles();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    account_type,
    pen_name,
    ip_owner_role,
    ip_owner_company,
    website_url,
    buyer_company,
    buyer_role,
    linkedin_url
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'ip_owner')::account_type,
    NEW.raw_user_meta_data->>'pen_name_or_studio',
    CASE 
      WHEN NEW.raw_user_meta_data->>'ip_owner_role' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'ip_owner_role')::ip_owner_role 
      ELSE NULL 
    END,
    NEW.raw_user_meta_data->>'ip_owner_company',
    NEW.raw_user_meta_data->>'website_url',
    NEW.raw_user_meta_data->>'buyer_company',
    CASE 
      WHEN NEW.raw_user_meta_data->>'buyer_role' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'buyer_role')::buyer_role 
      ELSE NULL 
    END,
    NEW.raw_user_meta_data->>'linkedin_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    account_type = EXCLUDED.account_type,
    pen_name = EXCLUDED.pen_name,
    ip_owner_role = EXCLUDED.ip_owner_role,
    ip_owner_company = EXCLUDED.ip_owner_company,
    website_url = EXCLUDED.website_url,
    buyer_company = EXCLUDED.buyer_company,
    buyer_role = EXCLUDED.buyer_role,
    linkedin_url = EXCLUDED.linkedin_url,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create/update profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_account_type_idx ON public.profiles(account_type);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON public.profiles(created_at);