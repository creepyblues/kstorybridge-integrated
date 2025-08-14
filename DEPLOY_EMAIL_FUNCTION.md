# Deploy Email Function to Supabase

## Steps to Enable Real Email Sending:

### 1. Install Supabase CLI (if not already installed)
```bash
npm install -g supabase
```

### 2. Login to Supabase
```bash
supabase login
```

### 3. Link to your project
```bash
supabase link --project-ref dlrnrgcoguxlkkcitlpd
```

### 4. Set the Resend API Key
```bash
supabase secrets set RESEND_API_KEY=re_your_api_key_here
```

### 5. Deploy the function
```bash
supabase functions deploy send-approval-email
```

### 6. Test the function
```bash
supabase functions invoke send-approval-email --data '{"email":"test@example.com"}'
```

## Alternative: Set via Supabase Dashboard
1. Go to your Supabase Dashboard
2. Navigate to Edge Functions > Environment Variables
3. Add: `RESEND_API_KEY` with your Resend API key
4. Deploy the function via the dashboard

## Get Resend API Key:
1. Sign up at https://resend.com
2. Go to API Keys section
3. Create a new API key
4. Copy the key (starts with `re_`)

## Verify Domain (Important):
1. In Resend dashboard, add and verify your domain
2. Update the `from` field in the function to use your verified domain
3. Example: `from: 'KStoryBridge <noreply@yourdomain.com>'`