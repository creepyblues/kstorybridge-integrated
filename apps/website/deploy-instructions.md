# Edge Function Deployment Instructions

## Option 1: Manual Deployment via Supabase Dashboard

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd

2. **Navigate to Edge Functions**:
   - Click "Edge Functions" in the left sidebar
   - Click "Create a new function"

3. **Create the function**:
   - Function name: `secure-pdf-access`
   - Copy the entire content from `supabase/functions/secure-pdf-access/index.ts`

## Option 2: CLI Deployment

1. **Get Access Token**:
   - Go to https://supabase.com/dashboard/account/tokens
   - Create a new access token
   - Copy the token

2. **Set Environment Variable**:
   ```bash
   export SUPABASE_ACCESS_TOKEN="your_token_here"
   ```

3. **Deploy Function**:
   ```bash
   supabase functions deploy secure-pdf-access --project-ref dlrnrgcoguxlkkcitlpd
   ```

## Option 3: Direct CLI Login (Alternative)

1. **Login to Supabase**:
   ```bash
   supabase login --token your_access_token_here
   ```

2. **Deploy Function**:
   ```bash
   supabase functions deploy secure-pdf-access --project-ref dlrnrgcoguxlkkcitlpd
   ```

## Current Security Status

The PDF viewer has been updated with enhanced security:
- ✅ User authentication validation
- ✅ File path format validation (UUID/pitch.pdf only)
- ✅ Database title verification
- ✅ Short-expiry signed URLs (30 minutes)
- ✅ Multiple security layers

**Note**: The bucket should be private, but there might be CDN caching. The new security layers in the PDF viewer will provide protection even if direct URLs are temporarily cached.