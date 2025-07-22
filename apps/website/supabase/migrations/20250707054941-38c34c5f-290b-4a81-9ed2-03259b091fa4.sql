
-- Create enum types for account types and roles (only if they don't exist)
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

-- Drop table if exists and recreate to ensure clean state
DROP TABLE IF EXISTS public.profiles;

-- Create profiles table to store user information
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  account_type account_type NOT NULL,
  
  -- IP Owner specific fields
  pen_name_or_studio TEXT,
  ip_owner_role ip_owner_role,
  ip_owner_company TEXT,
  website_url TEXT,
  
  -- Buyer specific fields
  buyer_company TEXT,
  buyer_role buyer_role,
  linkedin_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Drop existing function and trigger if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    account_type,
    pen_name_or_studio,
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
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
DROP INDEX IF EXISTS profiles_email_idx;
DROP INDEX IF EXISTS profiles_account_type_idx;
CREATE INDEX profiles_email_idx ON public.profiles(email);
CREATE INDEX profiles_account_type_idx ON public.profiles(account_type);
