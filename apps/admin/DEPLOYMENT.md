# Admin Portal Deployment Guide

## Prerequisites

1. **Database Migration**: Apply the admin table migration to your production Supabase database
2. **Admin Users**: Add authorized admin users to the admin table
3. **Domain Setup**: Configure admin.kstorybridge.com subdomain

## Step 1: Apply Database Migration

Run this SQL in your Supabase SQL editor:

```sql
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
```

## Step 2: Add Admin Users

Add your admin users to the admin table:

```sql
-- Replace with actual admin emails
INSERT INTO public.admin (email, full_name) VALUES 
('admin@kstorybridge.com', 'KStoryBridge Admin'),
('your-email@kstorybridge.com', 'Your Name');
```

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel CLI

1. Install Vercel CLI: `npm i -g vercel`
2. From the admin directory: `cd apps/admin`
3. Deploy: `vercel --prod`
4. Configure domain: `vercel domains add admin.kstorybridge.com`

### Option B: Deploy via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Import the admin app from your repository
3. Set build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Add custom domain: `admin.kstorybridge.com`

## Step 4: Environment Variables

The admin app uses the same Supabase configuration as dashboard/website, so no additional environment variables are needed.

## Step 5: DNS Configuration

Add a CNAME record for your domain:
- **Name**: `admin`
- **Value**: `cname.vercel-dns.com`

## Step 6: SSL Certificate

Vercel will automatically provision an SSL certificate for admin.kstorybridge.com.

## Testing Deployment

1. Visit https://admin.kstorybridge.com
2. You should see the admin login page
3. Login with an email that exists in the admin table
4. Verify access to the titles management interface

## Security Notes

- Only emails in the `admin` table can access the portal
- Admin users must have `active = true` in the database
- The portal uses the same Supabase authentication as other apps
- Row-level security ensures admins can only see admin records

## Troubleshooting

### "Deployment not found" error
- The admin app hasn't been deployed yet
- Follow the deployment steps above

### "Invalid email or password" error
- User credentials are incorrect, OR
- User email is not in the admin table, OR  
- User's admin record has `active = false`

### Access denied after login
- User authenticated successfully but no admin record exists
- Add user to admin table with INSERT statement above

## Maintenance

To deactivate an admin user without deleting their record:
```sql
UPDATE public.admin 
SET active = false 
WHERE email = 'user@example.com';
```

To reactivate:
```sql
UPDATE public.admin 
SET active = true 
WHERE email = 'user@example.com';
```